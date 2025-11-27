// backend/src/services/user.service.js

const User = require('../models/User');
const storageService = require('./storage.service');
const auditService = require('./audit.service');

class UserService {
    constructor() {
        this.users = [];
        this.initializeFromStorage();
    }

    // Инициализация из JSON хранилища
    async initializeFromStorage() {
        try {
            const usersData = await storageService.getCollection('users');
            this.users = usersData.map(userData => new User(userData));
            console.log(`✅ Loaded ${this.users.length} users from storage`);
        } catch (error) {
            console.error('❌ Failed to load users from storage:', error);
            await this.initializeDefaultUsers();
        }
    }

    // Сохранение пользователей в JSON
    async saveToStorage() {
        try {
            const usersData = this.users.map(user => user.toJSON());
            await storageService.saveCollection('users', usersData);
            console.log(`💾 Saved ${this.users.length} users to storage`);
        } catch (error) {
            console.error('❌ Failed to save users to storage:', error);
            throw error;
        }
    }

    async initializeDefaultUsers() {
        try {
            const defaultUsersData = await storageService.readFile('users.json');
            this.users = defaultUsersData.map(userData => new User(userData));
            await this.saveToStorage();
            console.log('✅ Default users initialized and saved to storage');
        } catch (error) {
            console.error('❌ Failed to initialize default users:', error);
            // Создаем базового администратора если файла нет
            await this.createDefaultAdmin();
        }
    }

    async createDefaultAdmin() {
        const adminUser = new User({
            username: 'admin',
            role: 'admin',
            email: 'admin@asterisk.local',
            isActive: true
        });

        await adminUser.setPassword('password123');
        this.users = [adminUser];
        await this.saveToStorage();
        console.log('✅ Default admin user created');
    }

    async findByUsername(username) {
        return this.users.find(user =>
            user.username === username && user.isActive
        ) || null;
    }

    async findById(id) {
        return this.users.find(user => user.id === id) || null;
    }

    async findAll() {
        return this.users.map(user => user.toJSON());
    }

    async create(userData, createdBy) {
        const existingUser = this.users.find(user => user.username === userData.username);
        if (existingUser) {
            throw new Error('Username already exists');
        }

        const user = await User.create(userData);
        this.users.push(user);
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
        const userIndex = this.users.findIndex(user => user.id === id);
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        const oldData = { ...this.users[userIndex].toJSON() };

        if (updates.email !== undefined) this.users[userIndex].email = updates.email;
        if (updates.role !== undefined) this.users[userIndex].role = updates.role;
        if (updates.isActive !== undefined) this.users[userIndex].isActive = updates.isActive;

        this.users[userIndex].updatedAt = new Date().toISOString();
        await this.saveToStorage();

        await auditService.log({
            action: 'USER_UPDATED',
            userId: updatedBy,
            targetUserId: id,
            details: {
                old: oldData,
                new: this.users[userIndex].toJSON(),
                changes: updates
            },
            timestamp: new Date().toISOString()
        });

        return this.users[userIndex].toJSON();
    }

    async changePassword(id, newPassword, changedBy) {
        const userIndex = this.users.findIndex(user => user.id === id);
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        await this.users[userIndex].setPassword(newPassword);
        await this.saveToStorage();

        await auditService.log({
            action: 'PASSWORD_CHANGED',
            userId: changedBy,
            targetUserId: id,
            details: { username: this.users[userIndex].username },
            timestamp: new Date().toISOString()
        });

        return this.users[userIndex].toJSON();
    }

    async resetPassword(id, newPassword, resetBy) {
        const userIndex = this.users.findIndex(user => user.id === id);
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        await this.users[userIndex].setPassword(newPassword);
        await this.saveToStorage();

        await auditService.log({
            action: 'PASSWORD_RESET',
            userId: resetBy,
            targetUserId: id,
            details: { username: this.users[userIndex].username, resetBy },
            timestamp: new Date().toISOString()
        });

        return this.users[userIndex].toJSON();
    }

    async delete(id, deletedBy) {
        const userIndex = this.users.findIndex(user => user.id === id);
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        if (id === deletedBy) {
            throw new Error('Cannot delete your own account');
        }

        const userData = this.users[userIndex].toJSON();
        this.users.splice(userIndex, 1);
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
        const userIndex = this.users.findIndex(user => user.id === id);
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        if (id === deactivatedBy) {
            throw new Error('Cannot deactivate your own account');
        }

        this.users[userIndex].isActive = false;
        this.users[userIndex].updatedAt = new Date().toISOString();
        await this.saveToStorage();

        await auditService.log({
            action: 'USER_DEACTIVATED',
            userId: deactivatedBy,
            targetUserId: id,
            details: { username: this.users[userIndex].username },
            timestamp: new Date().toISOString()
        });

        return this.users[userIndex].toJSON();
    }

    async getStats() {
        return {
            total: this.users.length,
            active: this.users.filter(u => u.isActive).length,
            inactive: this.users.filter(u => !u.isActive).length,
            byRole: {
                admin: this.users.filter(u => u.role === 'admin').length,
                operator: this.users.filter(u => u.role === 'operator').length,
                viewer: this.users.filter(u => u.role === 'viewer').length
            },
            locked: this.users.filter(u => u.isLocked()).length
        };
    }

    // Получение пользователей для других модулей
    getUsers() {
        return this.users.map(user => user.toJSON());
    }

    // Метод для обновления пользователя (используется в auth)
    async updateUser(user) {
        const userIndex = this.users.findIndex(u => u.id === user.id);
        if (userIndex === -1) {
            throw new Error('User not found');
        }

        this.users[userIndex] = user;
        await this.saveToStorage();
    }
}

module.exports = new UserService();