const jwt = require('jsonwebtoken');
const config = require('../config/app');

class JWTUtils {
    // Генерация JWT токена
    static generateToken(payload) {
        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.expiresIn
        });
    }

    // Верификация JWT токена
    static verifyToken(token) {
        try {
            return jwt.verify(token, config.jwt.secret);
        } catch (error) {
            throw new Error('Invalid token');
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
}

module.exports = JWTUtils;