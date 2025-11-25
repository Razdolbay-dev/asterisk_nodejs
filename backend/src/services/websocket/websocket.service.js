const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Map(); // clientId -> WebSocket
        this.asteriskAMIService = null;
    }

    initialize(server) {
        this.wss = new WebSocket.Server({
            server,
            path: '/ws'
        });

        this.setupWebSocket();
        console.log('✅ WebSocket server initialized');
    }

    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            const clientId = uuidv4();
            this.clients.set(clientId, ws);

            console.log(`🔗 WebSocket client connected: ${clientId}`);

            // Отправляем приветственное сообщение
            this.sendToClient(clientId, {
                type: 'connection_established',
                clientId,
                timestamp: new Date().toISOString()
            });

            // Обработка сообщений от клиента
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleClientMessage(clientId, message);
                } catch (error) {
                    console.error('❌ WebSocket message parse error:', error);
                }
            });

            // Обработка отключения клиента
            ws.on('close', () => {
                console.log(`🔌 WebSocket client disconnected: ${clientId}`);
                this.clients.delete(clientId);
            });

            // Обработка ошибок
            ws.on('error', (error) => {
                console.error(`❌ WebSocket error for client ${clientId}:`, error);
                this.clients.delete(clientId);
            });
        });
    }

    handleClientMessage(clientId, message) {
        const { type, data } = message;

        switch (type) {
            case 'subscribe_events':
                this.handleSubscribeEvents(clientId, data);
                break;
            case 'unsubscribe_events':
                this.handleUnsubscribeEvents(clientId, data);
                break;
            case 'ping':
                this.sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() });
                break;
            default:
                console.log('Unknown message type:', type);
        }
    }

    handleSubscribeEvents(clientId, eventTypes) {
        if (!this.asteriskAMIService) {
            this.asteriskAMIService = require('../asterisk/ami.service');
        }

        // Подписываемся на события Asterisk
        eventTypes.forEach(eventType => {
            this.asteriskAMIService.on(eventType, (eventData) => {
                this.sendToClient(clientId, {
                    type: 'ami_event',
                    event: eventType,
                    data: eventData,
                    timestamp: new Date().toISOString()
                });
            });
        });

        this.sendToClient(clientId, {
            type: 'subscription_confirmed',
            events: eventTypes,
            timestamp: new Date().toISOString()
        });
    }

    handleUnsubscribeEvents(clientId, eventTypes) {
        if (!this.asteriskAMIService) return;

        // TODO: Реализовать отписку от конкретных событий
        this.sendToClient(clientId, {
            type: 'unsubscription_confirmed',
            events: eventTypes,
            timestamp: new Date().toISOString()
        });
    }

    // Отправка сообщения конкретному клиенту
    sendToClient(clientId, message) {
        const client = this.clients.get(clientId);
        if (client && client.readyState === WebSocket.OPEN) {
            try {
                client.send(JSON.stringify(message));
            } catch (error) {
                console.error(`❌ Failed to send message to client ${clientId}:`, error);
            }
        }
    }

    // Широковещательная рассылка всем клиентам
    broadcast(message) {
        this.clients.forEach((client, clientId) => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(JSON.stringify(message));
                } catch (error) {
                    console.error(`❌ Broadcast failed for client ${clientId}:`, error);
                }
            }
        });
    }

    // Отправка системных событий
    sendSystemEvent(eventType, data) {
        this.broadcast({
            type: 'system_event',
            event: eventType,
            data,
            timestamp: new Date().toISOString()
        });
    }

    // Получение статистики подключений
    getStats() {
        return {
            totalClients: this.clients.size,
            connectedClients: Array.from(this.clients.entries())
                .filter(([_, client]) => client.readyState === WebSocket.OPEN)
                .length
        };
    }
}

module.exports = new WebSocketService();