const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const auditService = require('./audit.service');

class UserService {
    constructor() {
        this.users = new Map();
        this.initializeDefaultUsers();
    }

    // Инициализация пользователей по умолчанию
    async initializeDefaultUsers() {
        const defaultUsers = [
            {
                username: 'admin',
                password: 'password123',
                role: 'admin',
                email: 'admin@asterisk.local'
            },
            {
                username: 'operator',
                password: 'operator123',
                role: 'operator',
                email: 'operator@asterisk.local'
            },
            {
                username: 'viewer',
                password: 'viewer123',
                role: 'viewer',
                email: 'viewer@asterisk.local'
            }
        ];

        for (const userData of defaultUsers) {
            const user = new User(userData);
            await user.setPassword(userData.password);
            this.users.set(user.id, user);
        }

        console.log('✅ Default users initialized');
    }

    // Поиск пользователя по username
    async findByUsername(username) {
        for (const user of this.users.values()) {
            if (user.username === username && user.isActive) {
                return user;
            }
        }
        return null;
    }

    // Поиск пользователя по ID
    async findById(id) {
        return this.users.get(id) || null;
    }

    // Получение всех пользователей
    async findAll() {
        return Array.from(this.users.values()).map(user => user.toJSON());
    }

    // Создание нового пользователя
    async create(userData, createdBy) {
        // Проверка на дубликат username
        const existingUser = await this.findByUsername(userData.username);
        if (existingUser) {
            throw new Error('Username already exists');
        }

        const user = new User(userData);
        await user.setPassword(userData.password);

        this.users.set(user.id, user);

        // Логируем действие
        await auditService.log({
            action: 'USER_CREATED',
            userId: createdBy,
            targetUserId: user.id,
            details: { username: user.username, role: user.role },
            timestamp: new Date().toISOString()
        });

        return user.toJSON();
    }

    // Обновление пользователя
    async update(id, updates, updatedBy) {
        const user = this.users.get(id);
        if (!user) {
            throw new Error('User not found');
        }

        const oldData = { ...user.toJSON() };

        // Обновляем разрешенные поля
        if (updates.email !== undefined) user.email = updates.email;
        if (updates.role !== undefined) user.role = updates.role;
        if (updates.isActive !== undefined) user.isActive = updates.isActive;

        user.updatedAt = new Date().toISOString();

        // Логируем действие
        await auditService.log({
            action: 'USER_UPDATED',
            userId: updatedBy,
            targetUserId: id,
            details: {
                old: oldData,
                new: user.toJSON(),
                changes: updates
            },
            timestamp: new Date().toISOString()
        });

        return user.toJSON();
    }

    // Смена пароля
    async changePassword(id, newPassword, changedBy) {
        const user = this.users.get(id);
        if (!user) {
            throw new Error('User not found');
        }

        await user.setPassword(newPassword);

        // Логируем действие
        await auditService.log({
            action: 'PASSWORD_CHANGED',
            userId: changedBy,
            targetUserId: id,
            details: { username: user.username },
            timestamp: new Date().toISOString()
        });

        return user.toJSON();
    }

    // Сброс пароля (администратором)
    async resetPassword(id, newPassword, resetBy) {
        const user = this.users.get(id);
        if (!user) {
            throw new Error('User not found');
        }

        await user.setPassword(newPassword);

        // Логируем действие
        await auditService.log({
            action: 'PASSWORD_RESET',
            userId: resetBy,
            targetUserId: id,
            details: { username: user.username, resetBy },
            timestamp: new Date().toISOString()
        });

        return user.toJSON();
    }

    // Удаление пользователя
    async delete(id, deletedBy) {
        const user = this.users.get(id);
        if (!user) {
            throw new Error('User not found');
        }

        // Не позволяем удалить самого себя
        if (id === deletedBy) {
            throw new Error('Cannot delete your own account');
        }

        const userData = user.toJSON();
        this.users.delete(id);

        // Логируем действие
        await auditService.log({
            action: 'USER_DELETED',
            userId: deletedBy,
            targetUserId: id,
            details: { username: userData.username },
            timestamp: new Date().toISOString()
        });

        return userData;
    }

    // Деактивация пользователя
    async deactivate(id, deactivatedBy) {
        const user = this.users.get(id);
        if (!user) {
            throw new Error('User not found');
        }

        if (id === deactivatedBy) {
            throw new Error('Cannot deactivate your own account');
        }

        user.isActive = false;
        user.updatedAt = new Date().toISOString();

        // Логируем действие
        await auditService.log({
            action: 'USER_DEACTIVATED',
            userId: deactivatedBy,
            targetUserId: id,
            details: { username: user.username },
            timestamp: new Date().toISOString()
        });

        return user.toJSON();
    }

    // Получение статистики пользователей
    async getStats() {
        const users = Array.from(this.users.values());
        return {
            total: users.length,
            active: users.filter(u => u.isActive).length,
            byRole: {
                admin: users.filter(u => u.role === 'admin').length,
                operator: users.filter(u => u.role === 'operator').length,
                viewer: users.filter(u => u.role === 'viewer').length
            }
        };
    }
}

module.exports = new UserService();