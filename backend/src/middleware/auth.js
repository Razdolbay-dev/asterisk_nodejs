const JWTUtils = require('../utils/jwt');
const userService = require('../services/user.service');
const auditService = require('../services/audit.service');

// Временное хранилище пользователей (заменим на БД позже)
const users = [
    {
        id: 1,
        username: 'admin',
        // Пароль: "password123" захешированный bcrypt
        password: '$2a$10$8K1p/a0dRTlB0ZQ1KXa0Ee0QZJkXxXxXxXxXxXxXxXxXxXxXxXxXx',
        role: 'admin',
        email: 'admin@asterisk.local'
    },
    {
        id: 2,
        username: 'operator',
        password: '$2a$10$8K1p/a0dRTlB0ZQ1KXa0Ee0QZJkXxXxXxXxXxXxXxXxXxXxXxXxXx',
        role: 'operator',
        email: 'operator@asterisk.local'
    }
];

const authenticateToken = (req, res, next) => {
    const token = JWTUtils.extractToken(req.headers.authorization);

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required'
        });
    }

    try {
        const decoded = JWTUtils.verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: 'Invalid or expired token'
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
            // Получаем полную информацию о пользователе
            const user = await userService.findById(req.user.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found'
                });
            }

            if (!user.hasPermission(permission)) {
                // Логируем попытку несанкционированного доступа
                await auditService.log({
                    action: 'UNAUTHORIZED_ACCESS',
                    userId: req.user.id,
                    details: {
                        attemptedPermission: permission,
                        path: req.path,
                        method: req.method
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
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient role permissions'
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    requireRole,
    requirePermission, // Добавляем новый middleware
    users
};