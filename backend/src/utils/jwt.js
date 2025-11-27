const jwt = require('jsonwebtoken');
const config = require('../config/app');
const userService = require('../services/user.service');

class JWTUtils {
    // Генерация JWT токена
    static generateToken(user) {
        const payload = {
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email,
            permissions: this.getUserPermissions(user.role)
        };

        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn,
            issuer: 'asterisk-management-system',
            subject: user.id,
            audience: 'asterisk-web-interface'
        });
    }

    // Верификация JWT токена
    static verifyToken(token) {
        try {
            return jwt.verify(token, config.jwt.secret, {
                issuer: 'asterisk-management-system',
                audience: 'asterisk-web-interface'
            });
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expired');
            }
            if (error.name === 'JsonWebTokenError') {
                throw new Error('Invalid token');
            }
            throw new Error('Token verification failed');
        }
    }

    // Извлечение токена из заголовка
    static extractToken(authHeader) {
        if (!authHeader) {
            return null;
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }

        return parts[1];
    }

    // Обновление токена
    static async refreshToken(oldToken) {
        try {
            const decoded = this.verifyToken(oldToken);
            const user = await userService.findById(decoded.id);

            if (!user) {
                throw new Error('User not found');
            }

            if (!user.isActive) {
                throw new Error('User account is deactivated');
            }

            if (user.isLocked()) {
                throw new Error('User account is locked');
            }

            return this.generateToken(user);
        } catch (error) {
            throw new Error('Token refresh failed: ' + error.message);
        }
    }

    // Декодирование токена без проверки (для информации)
    static decodeToken(token) {
        return jwt.decode(token);
    }

    // Получение прав доступа по роли
    static getUserPermissions(role) {
        const permissions = {
            admin: [
                'users:read', 'users:write', 'users:delete',
                'sip:read', 'sip:write', 'sip:delete',
                'queues:read', 'queues:write', 'queues:delete',
                'trunks:read', 'trunks:write', 'trunks:delete',
                'config:read', 'config:write', 'config:delete',
                'system:reload', 'system:restart',
                'audit:read', 'audit:delete'
            ],
            operator: [
                'users:read',
                'sip:read', 'sip:write',
                'queues:read', 'queues:write',
                'trunks:read', 'trunks:write',
                'config:read',
                'system:reload'
            ],
            viewer: [
                'users:read',
                'sip:read',
                'queues:read',
                'trunks:read',
                'config:read'
            ]
        };

        return permissions[role] || [];
    }

    // Проверка срока действия токена
    static isTokenExpired(token) {
        try {
            const decoded = jwt.decode(token);
            if (!decoded || !decoded.exp) {
                return true;
            }

            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        } catch (error) {
            return true;
        }
    }
}

module.exports = JWTUtils;