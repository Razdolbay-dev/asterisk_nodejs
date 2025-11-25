const ami = require('asterisk-manager');
const { EventEmitter } = require('events');
const config = require('../../config/app');

class AsteriskAMIService extends EventEmitter {
    constructor() {
        super();
        this.connection = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            try {
                console.log(`🔌 Connecting to Asterisk AMI at ${config.asterisk.host}:${config.asterisk.port}`);

                this.connection = ami(
                    config.asterisk.port,
                    config.asterisk.host,
                    config.asterisk.username,
                    config.asterisk.password,
                    true // auto-reconnect
                );

                this.connection.on('connect', () => {
                    console.log('✅ AMI Connected to Asterisk');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.emit('connected');
                    resolve();
                });

                this.connection.on('error', (error) => {
                    console.error('❌ AMI Error:', error.message);
                    this.isConnected = false;
                    this.emit('error', error);

                    if (!this.isConnected) {
                        reject(error);
                    }
                });

                this.connection.on('disconnect', () => {
                    console.log('🔌 AMI Disconnected');
                    this.isConnected = false;
                    this.emit('disconnected');

                    // Автоматическое переподключение
                    this.handleReconnect();
                });

                // Обработка событий Asterisk
                this.setupEventHandlers();

            } catch (error) {
                console.error('❌ Failed to initialize AMI:', error);
                reject(error);
            }
        });
    }

    setupEventHandlers() {
        if (!this.connection) return;

        // Важные события для мониторинга
        const importantEvents = [
            'PeerStatus',        // Статус SIP пиров
            'Registry',          // Регистрация транков
            'Newchannel',        // Новый канал
            'Hangup',            // Завершение вызова
            'Newstate',          // Изменение состояния канала
            'QueueMemberStatus', // Статус участников очереди
            'QueueCallerJoin',   // Вход в очередь
            'QueueCallerLeave',  // Выход из очереди
            'Dial',              // Набор номера
            'VarSet',            // Установка переменной
        ];

        importantEvents.forEach(event => {
            this.connection.on(event, (evt) => {
                console.log(`📞 AMI Event [${event}]:`, evt.peer || evt.channel || evt.queue);
                this.emit('event', { type: event, data: evt });
                this.emit(event, evt);
            });
        });
    }

    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);

            setTimeout(() => {
                this.connect().catch(error => {
                    console.error('❌ Reconnection failed:', error.message);
                });
            }, this.reconnectDelay);
        } else {
            console.error('❌ Max reconnection attempts reached');
            this.emit('reconnect_failed');
        }
    }

    // Отправка команды в Asterisk
    sendCommand(command) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                return reject(new Error('AMI not connected'));
            }

            console.log(`📨 Sending AMI command: ${command}`);

            this.connection.action({
                'action': 'command',
                'command': command
            }, (error, response) => {
                if (error) {
                    console.error(`❌ AMI command failed: ${command}`, error);
                    reject(error);
                } else {
                    console.log(`✅ AMI command successful: ${command}`);
                    resolve(response);
                }
            });
        });
    }

    // Релоад PJSIP
    async reloadPJSIP() {
        try {
            const result = await this.sendCommand('pjsip reload');
            console.log('✅ PJSIP reloaded successfully');
            this.emit('pjsip_reloaded');
            return result;
        } catch (error) {
            console.error('❌ Failed to reload PJSIP:', error);
            this.emit('pjsip_reload_failed', error);
            throw error;
        }
    }

    // Релоад очередей
    async reloadQueues() {
        try {
            const result = await this.sendCommand('queue reload all');
            console.log('✅ Queues reloaded successfully');
            this.emit('queues_reloaded');
            return result;
        } catch (error) {
            console.error('❌ Failed to reload queues:', error);
            this.emit('queues_reload_failed', error);
            throw error;
        }
    }

    // Релоад всех модулей
    async reloadAll() {
        try {
            await this.reloadPJSIP();
            await this.reloadQueues();
            console.log('✅ All modules reloaded successfully');
            this.emit('all_reloaded');
        } catch (error) {
            console.error('❌ Failed to reload all modules:', error);
            throw error;
        }
    }

    // Получение статуса SIP пиров
    async getSIPPeers() {
        try {
            const result = await this.sendCommand('pjsip show endpoints');
            return this.parseSIPPeers(result);
        } catch (error) {
            console.error('❌ Failed to get SIP peers:', error);
            throw error;
        }
    }

    // Парсинг вывода SIP пиров
    parseSIPPeers(output) {
        if (!output || typeof output !== 'string') return [];

        const lines = output.split('\n');
        const peers = [];

        for (const line of lines) {
            // Простой парсинг вывода pjsip show endpoints
            if (line.includes('/') && !line.includes('Endpoint') && !line.includes('===')) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 3) {
                    peers.push({
                        endpoint: parts[0],
                        transport: parts[1],
                        state: parts[2],
                        contact: parts.slice(3).join(' ') || 'N/A'
                    });
                }
            }
        }

        return peers;
    }

    // Получение статуса очередей
    async getQueuesStatus() {
        try {
            const result = await this.sendCommand('queue show');
            return this.parseQueuesStatus(result);
        } catch (error) {
            console.error('❌ Failed to get queues status:', error);
            throw error;
        }
    }

    // Парсинг вывода статуса очередей
    parseQueuesStatus(output) {
        if (!output || typeof output !== 'string') return [];

        const queues = [];
        const lines = output.split('\n');
        let currentQueue = null;

        for (const line of lines) {
            if (line.includes('has') && (line.includes('callers') || line.includes('members'))) {
                // Это строка с информацией об очереди
                const match = line.match(/(\S+)\s+has\s+(\d+)\s+callers.*?\((\d+)\s+max\)/);
                if (match) {
                    if (currentQueue) {
                        queues.push(currentQueue);
                    }
                    currentQueue = {
                        name: match[1],
                        callers: parseInt(match[2]),
                        max: parseInt(match[3]),
                        members: []
                    };
                }
            } else if (currentQueue && line.includes('SIP/')) {
                // Это строка с участником очереди
                const memberMatch = line.match(/(SIP\/\S+)\s+\((\S+)\)/);
                if (memberMatch) {
                    currentQueue.members.push({
                        interface: memberMatch[1],
                        status: memberMatch[2]
                    });
                }
            }
        }

        if (currentQueue) {
            queues.push(currentQueue);
        }

        return queues;
    }

    // Проверка соединения
    async ping() {
        try {
            await this.sendCommand('core show version');
            return true;
        } catch (error) {
            return false;
        }
    }

    // Получение общей информации о системе
    async getSystemInfo() {
        try {
            const version = await this.sendCommand('core show version');
            const uptime = await this.sendCommand('core show uptime');
            const channels = await this.sendCommand('core show channels');

            return {
                version: version ? version.split('\n')[0] : 'Unknown',
                uptime: uptime ? uptime.split('\n')[0] : 'Unknown',
                activeChannels: channels ? this.parseChannelCount(channels) : 0,
                connected: this.isConnected
            };
        } catch (error) {
            console.error('❌ Failed to get system info:', error);
            return {
                version: 'Unknown',
                uptime: 'Unknown',
                activeChannels: 0,
                connected: false
            };
        }
    }

    parseChannelCount(output) {
        const match = output.match(/(\d+)\s+active channel/);
        return match ? parseInt(match[1]) : 0;
    }

    // Получение статуса соединения
    getStatus() {
        return {
            connected: this.isConnected,
            host: config.asterisk.host,
            port: config.asterisk.port,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    // Закрытие соединения
    disconnect() {
        if (this.connection) {
            this.connection.disconnect();
            this.isConnected = false;
            console.log('🔌 AMI connection closed');
        }
    }
}

module.exports = new AsteriskAMIService();