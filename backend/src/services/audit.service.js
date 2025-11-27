const fs = require('fs').promises;
const path = require('path');

class AuditService {
    constructor() {
        this.logFile = path.join(__dirname, '../../logs/audit.log');
        this.initializeLogFile();
    }

    async initializeLogFile() {
        try {
            await fs.access(this.logFile);
        } catch (error) {
            // Создаем директорию logs если не существует
            await fs.mkdir(path.dirname(this.logFile), { recursive: true });
            // Создаем пустой файл лога
            await fs.writeFile(this.logFile, '');
            console.log('✅ Audit log file initialized');
        }
    }

    async log(entry) {
        const logEntry = {
            ...entry,
            id: require('uuid').v4(),
            timestamp: entry.timestamp || new Date().toISOString()
        };

        const logLine = JSON.stringify(logEntry) + '\n';

        try {
            await fs.appendFile(this.logFile, logLine, 'utf8');
        } catch (error) {
            console.error('❌ Failed to write audit log:', error);
        }

        // Также выводим в консоль для разработки
        console.log(`📝 AUDIT [${logEntry.action}]: ${logEntry.userId} -> ${logEntry.targetUserId || 'system'}`);
    }

    async getLogs(options = {}) {
        const {
            limit = 100,
            offset = 0,
            action = null,
            userId = null,
            startDate = null,
            endDate = null
        } = options;

        try {
            const content = await fs.readFile(this.logFile, 'utf8');
            let logs = content
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (error) {
                        return null;
                    }
                })
                .filter(entry => entry !== null);

            // Фильтрация
            if (action) {
                logs = logs.filter(entry => entry.action === action);
            }
            if (userId) {
                logs = logs.filter(entry => entry.userId === userId);
            }
            if (startDate) {
                logs = logs.filter(entry => new Date(entry.timestamp) >= new Date(startDate));
            }
            if (endDate) {
                logs = logs.filter(entry => new Date(entry.timestamp) <= new Date(endDate));
            }

            // Сортировка по времени (новые сначала)
            logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Пагинация
            const paginatedLogs = logs.slice(offset, offset + limit);

            return {
                logs: paginatedLogs,
                total: logs.length,
                hasMore: offset + limit < logs.length
            };
        } catch (error) {
            console.error('❌ Failed to read audit logs:', error);
            return { logs: [], total: 0, hasMore: false };
        }
    }

    async clearLogs(clearedBy) {
        try {
            await fs.writeFile(this.logFile, '');

            await this.log({
                action: 'AUDIT_LOG_CLEARED',
                userId: clearedBy,
                details: { clearedBy },
                timestamp: new Date().toISOString()
            });

            return true;
        } catch (error) {
            console.error('❌ Failed to clear audit logs:', error);
            throw error;
        }
    }

    async getStats() {
        try {
            const content = await fs.readFile(this.logFile, 'utf8');
            const logs = content
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (error) {
                        return null;
                    }
                })
                .filter(entry => entry !== null);

            const actions = {};
            const users = {};
            const today = new Date();
            const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            logs.forEach(entry => {
                // Статистика по действиям
                actions[entry.action] = (actions[entry.action] || 0) + 1;

                // Статистика по пользователям
                users[entry.userId] = (users[entry.userId] || 0) + 1;
            });

            const recentLogs = logs.filter(entry =>
                new Date(entry.timestamp) >= last7Days
            );

            return {
                totalEntries: logs.length,
                actions,
                users: Object.keys(users).length,
                recentActivity: recentLogs.length,
                mostActiveUser: Object.keys(users).reduce((a, b) => users[a] > users[b] ? a : b)
            };
        } catch (error) {
            console.error('❌ Failed to get audit stats:', error);
            return { totalEntries: 0, actions: {}, users: 0, recentActivity: 0 };
        }
    }
}

module.exports = new AuditService();