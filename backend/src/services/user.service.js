const User = require('../models/User');
const storageService = require('./storage.service');
const auditService = require('./audit.service');

class UserService {
    constructor() {
        this.users = new Map();
        this.initializeFromStorage();
    }

    // Инициализация из JSON хранилища
    async initializeFromStorage() {
        try {
            const usersData = await storageService.getCollection('users');

            for (const userData of usersData) {
                const user = new User(userData);
                this.users.set(user.id, user);
            }

            console.log(`✅ Loaded ${this.users.size} users from storage`);
        } catch (error) {
            console.error('❌ Failed to load users from storage:', error);
            // Инициализируем default пользователей
            await this.initializeDefaultUsers();
        }
    }

    // Сохранение пользователей в JSON
    async saveToStorage() {
        try {
            const usersData = Array.from(this.users.values()).map(user => user.toJSON());
            await storageService.saveCollection('users', usersData);
        } catch (error) {
            console.error('❌ Failed to save users to storage:', error);
            throw error;
        }
    }

    async initializeDefaultUsers() {
        const defaultUsers = await storageService.readFile('users.json');

        for (const userData of defaultUsers) {
            const user = new User(userData);
            this.users.set(user.id, user);
        }

        await this.saveToStorage();
        console.log('✅ Default users initialized and saved to storage');
    }

    async findByUsername(username) {
        for (const user of this.users.values()) {
            if (user.username === username && user.isActive) {
                return user;
            }
        }
        return null;
    }

    async findById(id) {
        return this.users.get(id) || null;
    }

    async findAll() {
        return Array.from(this.users.values()).map(user => user.toJSON());
    }

    async create(userData, createdBy) {
        const existingUser = await this.findByUsername(userData.username);
        if (existingUser) {
            throw new Error('Username already exists');
        }

        const user = new User(userData);
        await user.setPassword(userData.password);

        this.users.set(user.id, user);
        await this.saveToStorage();

        await auditService.log({
            action: 'USER_CREATED',
            userId: createdBy,
            targetUserId: user.id,
            details: { username: user.username, role: user.role },
            timestamp: new Date().toISOString()
        });

        return user.toJSON();
    }

    async update(id, updates, updatedBy) {
        const user = this.users.get(id);
        if (!user) {
            throw new Error('User not found');
        }

        const oldData = { ...user.toJSON() };

        if (updates.email !== undefined) user.email = updates.email;
        if (updates.role !== undefined) user.role = updates.role;
        if (updates.isActive !== undefined) user.isActive = updates.isActive;

        user.updatedAt = new Date().toISOString();

        await this.saveToStorage();

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

    async changePassword(id, newPassword, changedBy) {
        const user = this.users.get(id);
        if (!user) {
            throw new Error('User not found');
        }

        await user.setPassword(newPassword);
        await this.saveToStorage();

        await auditService.log({
            action: 'PASSWORD_CHANGED',
            userId: changedBy,
            targetUserId: id,
            details: { username: user.username },
            timestamp: new Date().toISOString()
        });

        return user.toJSON();
    }

    async resetPassword(id, newPassword, resetBy) {
        const user = this.users.get(id);
        if (!user) {
            throw new Error('User not found');
        }

        await user.setPassword(newPassword);
        await this.saveToStorage();

        await auditService.log({
            action: 'PASSWORD_RESET',
            userId: resetBy,
            targetUserId: id,
            details: { username: user.username, resetBy },
            timestamp: new Date().toISOString()
        });

        return user.toJSON();
    }

    async delete(id, deletedBy) {
        const user = this.users.get(id);
        if (!user) {
            throw new Error('User not found');
        }

        if (id === deletedBy) {
            throw new Error('Cannot delete your own account');
        }

        const userData = user.toJSON();
        this.users.delete(id);
        await this.saveToStorage();

        await auditService.log({
            action: 'USER_DELETED',
            userId: deletedBy,
            targetUserId: id,
            details: { username: userData.username },
            timestamp: new Date().toISOString()
        });

        return userData;
    }

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
        await this.saveToStorage();

        await auditService.log({
            action: 'USER_DEACTIVATED',
            userId: deactivatedBy,
            targetUserId: id,
            details: { username: user.username },
            timestamp: new Date().toISOString()
        });

        return user.toJSON();
    }

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