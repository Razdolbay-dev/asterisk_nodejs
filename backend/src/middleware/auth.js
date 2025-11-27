const JWTUtils = require('../utils/jwt');
const userService = require('../services/user.service');
const auditService = require('../services/audit.service');

const authenticateToken = async (req, res, next) => {
    const token = JWTUtils.extractToken(req.headers.authorization);

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required'
        });
    }

    try {
        const decoded = JWTUtils.verifyToken(token);

        // Получаем актуальные данные пользователя из сервиса
        const user = await userService.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found'
            });
        }

        // Проверяем, активен ли пользователь
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Account is deactivated'
            });
        }

        // Проверяем, не заблокирован ли пользователь
        if (user.isLocked()) {
            return res.status(401).json({
                success: false,
                error: 'Account is temporarily locked due to failed login attempts'
            });
        }

        // Обновляем данные пользователя в req.user
        req.user = {
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email,
            isActive: user.isActive,
            permissions: JWTUtils.getUserPermissions(user.role)
        };

        next();
    } catch (error) {
        console.error('Token verification error:', error);

        if (error.message === 'Token expired') {
            return res.status(403).json({
                success: false,
                error: 'Token expired'
            });
        }

        if (error.message === 'Invalid token') {
            return res.status(403).json({
                success: false,
                error: 'Invalid token'
            });
        }

        return res.status(403).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};

// Middleware для проверки конкретных прав
const requirePermission = (permission) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        try {
            // Получаем полную информацию о пользователе для дополнительной проверки
            const user = await userService.findById(req.user.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Проверяем активность аккаунта
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    error: 'Account is deactivated'
                });
            }

            // Проверяем блокировку
            if (user.isLocked()) {
                return res.status(401).json({
                    success: false,
                    error: 'Account is temporarily locked'
                });
            }

            // Проверяем права доступа
            if (!user.hasPermission(permission)) {
                // Логируем попытку несанкционированного доступа
                await auditService.log({
                    action: 'UNAUTHORIZED_ACCESS',
                    userId: req.user.id,
                    details: {
                        attemptedPermission: permission,
                        path: req.path,
                        method: req.method,
                        userAgent: req.get('User-Agent'),
                        ip: req.ip
                    },
                    timestamp: new Date().toISOString()
                });

                return res.status(403).json({
                    success: false,
                    error: 'Insufficient permissions'
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };
};

// Middleware для проверки ролей
const requireRole = (roles) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        try {
            // Получаем актуальные данные пользователя
            const user = await userService.findById(req.user.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Проверяем активность аккаунта
            if (!user.isActive) {
                return res.status(401).json({
                    success: false,
                    error: 'Account is deactivated'
                });
            }

            // Проверяем блокировку
            if (user.isLocked()) {
                return res.status(401).json({
                    success: false,
                    error: 'Account is temporarily locked'
                });
            }

            if (!roles.includes(user.role)) {
                // Логируем попытку доступа с недостаточной ролью
                await auditService.log({
                    action: 'INSUFFICIENT_ROLE_ACCESS',
                    userId: req.user.id,
                    details: {
                        userRole: user.role,
                        requiredRoles: roles,
                        path: req.path,
                        method: req.method
                    },
                    timestamp: new Date().toISOString()
                });

                return res.status(403).json({
                    success: false,
                    error: 'Insufficient role permissions'
                });
            }

            next();
        } catch (error) {
            console.error('Role check error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    };
};

// Middleware для проверки, что пользователь работает со своим собственным ресурсом
const requireOwnership = (paramName = 'id') => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        // Админы могут работать с любыми ресурсами
        if (req.user.role === 'admin') {
            return next();
        }

        // Проверяем, что пользователь работает со своим ID
        if (req.params[paramName] !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'You can only access your own resources'
            });
        }

        next();
    };
};

// Middleware для логирования запросов (опционально)
const auditLogger = async (req, res, next) => {
    const start = Date.now();

    // Пропускаем логирование для некоторых путей
    const excludedPaths = ['/api/auth/login', '/api/auth/refresh', '/api/auth/me'];
    if (excludedPaths.includes(req.path)) {
        return next();
    }

    res.on('finish', async () => {
        try {
            const duration = Date.now() - start;

            await auditService.log({
                action: 'API_REQUEST',
                userId: req.user?.id || null,
                details: {
                    method: req.method,
                    path: req.path,
                    statusCode: res.statusCode,
                    duration: `${duration}ms`,
                    userAgent: req.get('User-Agent'),
                    ip: req.ip,
                    query: Object.keys(req.query).length > 0 ? req.query : undefined
                },
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Audit logging error:', error);
        }
    });

    next();
};

module.exports = {
    authenticateToken,
    requireRole,
    requirePermission,
    requireOwnership,
    auditLogger
};