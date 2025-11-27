const fs = require('fs').promises;
const path = require('path');

class StorageService {
    constructor() {
        this.dataPath = path.join(__dirname, '../../data');
        this.statsFile = path.join(this.dataPath, 'system_stats.json');
        this.ensureDataDirectory();
    }

    async ensureDataDirectory() {
        try {
            await fs.access(this.dataPath);
        } catch (error) {
            await fs.mkdir(this.dataPath, { recursive: true });
            console.log('✅ Created data directory');
        }
    }

    async readFile(filename) {
        try {
            const filePath = path.join(this.dataPath, filename);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return this.getDefaultData(filename);
            }
            throw error;
        }
    }

    async writeFile(filename, data) {
        const filePath = path.join(this.dataPath, filename);
        const tempPath = filePath + '.tmp';

        try {
            await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8');
            await fs.rename(tempPath, filePath);
        } catch (error) {
            try {
                await fs.unlink(tempPath);
            } catch (unlinkError) {}
            throw error;
        }
    }

    getDefaultData(filename) {
        const defaults = {
            'users.json': [
                {
                    id: '1',
                    username: 'admin',
                    password: '$2a$12$LQv3c1yqBWVHxkd0L6kZrOuScOLMjZLvIyMWVh5RINOhSgBM3qQ0a',
                    role: 'admin',
                    email: 'admin@asterisk.local',
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    lastLogin: null,
                    failedLoginAttempts: 0,
                    lockedUntil: null
                }
            ],
            'sip_accounts.json': [],
            'queues.json': [],
            'trunks.json': [],
            'system.json': {
                version: '1.0.0',
                asterisk: {
                    host: 'localhost',
                    port: 5038,
                    username: 'admin',
                    password: 'password'
                },
                security: {
                    jwtSecret: 'your-super-secret-jwt-key-change-in-production',
                    jwtExpiresIn: '24h',
                    maxLoginAttempts: 5,
                    lockoutDuration: 15
                },
                paths: {
                    generated: '../../generated',
                    snapshots: '../../snapshots'
                }
            }
        };

        return defaults[filename] || (filename.endsWith('.json') ? [] : {});
    }

    // Инициализация всей структуры данных при запуске
    async initializeSystem() {
        console.log('🚀 Initializing system structure...');

        const filesToInitialize = [
            'users.json',
            'sip_accounts.json',
            'queues.json',
            'trunks.json',
            'system.json'
        ];

        let createdCount = 0;

        for (const filename of filesToInitialize) {
            try {
                const filePath = path.join(this.dataPath, filename);
                await fs.access(filePath);
                console.log(`✅ ${filename} already exists`);
            } catch (error) {
                // Файл не существует, создаем с данными по умолчанию
                const defaultData = this.getDefaultData(filename);
                await this.writeFile(filename, defaultData);
                console.log(`📄 Created ${filename} with default data`);
                createdCount++;
            }
        }

        // Создаем статистику системы
        await this.updateSystemStats();

        console.log(`🎉 System initialization complete! Created ${createdCount} new files.`);
        return await this.getSystemStats();
    }

    // Обновление статистики системы
    async updateSystemStats() {
        try {
            const stats = {
                timestamp: new Date().toISOString(),
                users: await this.getCollectionCount('users'),
                sip_accounts: await this.getCollectionCount('sip_accounts'),
                queues: await this.getCollectionCount('queues'),
                trunks: await this.getCollectionCount('trunks'),
                system: {
                    version: (await this.getSystemConfig()).version,
                    lastUpdate: new Date().toISOString()
                }
            };

            await this.writeFile('system_stats.json', stats);
            return stats;
        } catch (error) {
            console.error('Error updating system stats:', error);
            throw error;
        }
    }

    // Получение количества элементов в коллекции
    async getCollectionCount(collectionName) {
        try {
            const data = await this.getCollection(collectionName);
            return Array.isArray(data) ? data.length : Object.keys(data).length;
        } catch (error) {
            console.error(`Error getting count for ${collectionName}:`, error);
            return 0;
        }
    }

    // Получение статистики системы
    async getSystemStats() {
        try {
            const stats = await this.readFile('system_stats.json');
            return stats;
        } catch (error) {
            // Если файла статистики нет, создаем его
            return await this.updateSystemStats();
        }
    }

    // Красивый вывод статистики в консоль
    async displaySystemStats() {
        const stats = await this.getSystemStats();

        console.log('\n📊 ===== SYSTEM STATISTICS =====');
        console.log(`🕐 Last Updated: ${new Date(stats.timestamp).toLocaleString()}`);
        console.log('-----------------------------------');
        console.log(`👥 Users: ${stats.users}`);
        console.log(`📞 SIP Accounts: ${stats.sip_accounts}`);
        console.log(`⏳ Queues: ${stats.queues}`);
        console.log(`🔌 Trunks: ${stats.trunks}`);
        console.log(`🔧 Version: ${stats.system.version}`);
        console.log('===================================\n');

        return stats;
    }

    // Методы для работы с конкретными коллекциями
    async getCollection(collectionName) {
        return await this.readFile(`${collectionName}.json`);
    }

    async saveCollection(collectionName, data) {
        await this.writeFile(`${collectionName}.json`, data);
        // Обновляем статистику после сохранения
        await this.updateSystemStats();
    }

    async getSystemConfig() {
        return await this.readFile('system.json');
    }

    async saveSystemConfig(config) {
        await this.writeFile('system.json', config);
        await this.updateSystemStats();
    }

    // Резервное копирование
    async backup() {
        const backupDir = path.join(this.dataPath, 'backups');
        await fs.mkdir(backupDir, { recursive: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `backup-${timestamp}`);

        await fs.mkdir(backupPath);

        const files = await fs.readdir(this.dataPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        for (const file of jsonFiles) {
            const sourcePath = path.join(this.dataPath, file);
            const destPath = path.join(backupPath, file);
            await fs.copyFile(sourcePath, destPath);
        }

        console.log(`💾 Backup created: ${backupPath}`);
        return backupPath;
    }

    async restore(backupPath) {
        const files = await fs.readdir(backupPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        for (const file of jsonFiles) {
            const sourcePath = path.join(backupPath, file);
            const destPath = path.join(this.dataPath, file);
            await fs.copyFile(sourcePath, destPath);
        }

        await this.updateSystemStats();
        console.log('🔄 System restored from backup');
    }
}

module.exports = new StorageService();