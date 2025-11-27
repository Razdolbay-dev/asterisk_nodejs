// backend/src/models/User.js

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

class User {
    constructor({
                    id,
                    username,
                    password,
                    role,
                    email,
                    createdAt,
                    updatedAt,
                    isActive = true,
                    lastLogin = null,
                    failedLoginAttempts = 0,
                    lockedUntil = null
                }) {
        this.id = id || uuidv4();
        this.username = username;
        this.password = password; // Хешированный пароль
        this.role = role || 'viewer';
        this.email = email;
        this.isActive = isActive;
        this.createdAt = createdAt || new Date().toISOString();
        this.updatedAt = updatedAt || new Date().toISOString();
        this.lastLogin = lastLogin;
        this.failedLoginAttempts = failedLoginAttempts;
        this.lockedUntil = lockedUntil;
    }

    // Проверка пароля
    async checkPassword(password) {
        if (!password || !this.password) {
            return false;
        }

        try {
            return await bcrypt.compare(password, this.password);
        } catch (error) {
            console.error('Password comparison error:', error);
            return false;
        }
    }

    // Хеширование пароля
    async setPassword(password) {
        if (!password) {
            throw new Error('Password is required');
        }

        const saltRounds = 12;
        this.password = await bcrypt.hash(password, saltRounds);
        this.updatedAt = new Date().toISOString();
    }

    // Проверка прав доступа
    hasPermission(requiredPermission) {
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

        return permissions[this.role]?.includes(requiredPermission) || false;
    }

    // Проверка, заблокирован ли пользователь
    isLocked() {
        if (this.lockedUntil && new Date() < new Date(this.lockedUntil)) {
            return true;
        }

        // Сбрасываем блокировку если время истекло
        if (this.lockedUntil && new Date() >= new Date(this.lockedUntil)) {
            this.lockedUntil = null;
            this.failedLoginAttempts = 0;
        }

        return false;
    }

    // Блокировка пользователя после нескольких неудачных попыток
    recordFailedLogin() {
        this.failedLoginAttempts++;

        if (this.failedLoginAttempts >= 5) {
            // Блокируем на 15 минут
            this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        }

        this.updatedAt = new Date().toISOString();
    }

    // Сброс счетчика неудачных попыток при успешном входе
    recordSuccessfulLogin() {
        this.failedLoginAttempts = 0;
        this.lockedUntil = null;
        this.lastLogin = new Date().toISOString();
        this.updatedAt = new Date().toISOString();
    }

    toJSON() {
        return {
            id: this.id,
            username: this.username,
            password: this.password, // ← ВАЖНО: включаем пароль!
            role: this.role,
            email: this.email,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastLogin: this.lastLogin,
            failedLoginAttempts: this.failedLoginAttempts,
            lockedUntil: this.lockedUntil
        };
    }

    // Статический метод для создания пользователя с хешированным паролем
    static async create(userData) {
        const user = new User(userData);
        if (userData.password) {
            await user.setPassword(userData.password);
        }
        return user;
    }
}

module.exports = User;