class WebSocketService {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.eventCallbacks = new Map();
        this.isConnected = false;
    }

    connect(token) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        try {
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('✅ WebSocket connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.emit('connected');

                // Автоматическая подписка на события после подключения
                this.subscribeToEvents();
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('❌ WebSocket message parse error:', error);
                }
            };

            this.ws.onclose = (event) => {
                console.log('🔌 WebSocket disconnected:', event.code, event.reason);
                this.isConnected = false;
                this.emit('disconnected', { code: event.code, reason: event.reason });

                // Автоматическое переподключение
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    setTimeout(() => {
                        this.reconnectAttempts++;
                        console.log(`🔄 WebSocket reconnecting... (attempt ${this.reconnectAttempts})`);
                        this.connect(token);
                    }, this.reconnectDelay);
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.emit('error', error);
            };

        } catch (error) {
            console.error('❌ WebSocket connection failed:', error);
        }
    }

    handleMessage(message) {
        const { type, event, data, timestamp } = message;

        switch (type) {
            case 'connection_established':
                this.emit('connection_established', data);
                break;
            case 'ami_event':
                this.emit('ami_event', { event, data, timestamp });
                this.emit(event, data); // Также эмитим конкретное событие
                break;
            case 'system_event':
                this.emit('system_event', { event, data, timestamp });
                break;
            case 'subscription_confirmed':
                this.emit('subscription_confirmed', data);
                break;
            case 'pong':
                this.emit('pong', data);
                break;
            default:
                console.log('Unknown WebSocket message type:', type);
        }
    }

    // Подписка на события Asterisk
    subscribeToEvents(events = null) {
        const eventTypes = events || [
            'PeerStatus',
            'Registry',
            'Newchannel',
            'Hangup',
            'Newstate',
            'QueueMemberStatus',
            'QueueCallerJoin',
            'QueueCallerLeave',
            'Dial'
        ];

        this.send({
            type: 'subscribe_events',
            data: eventTypes
        });
    }

    unsubscribeFromEvents(events) {
        this.send({
            type: 'unsubscribe_events',
            data: events
        });
    }

    // Отправка ping для поддержания соединения
    ping() {
        this.send({
            type: 'ping',
            timestamp: Date.now()
        });
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected, cannot send message');
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close(1000, 'Client disconnected');
        }
    }

    // Event emitter methods
    on(event, callback) {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventCallbacks.has(event)) {
            const callbacks = this.eventCallbacks.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventCallbacks.has(event)) {
            this.eventCallbacks.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event callback for ${event}:`, error);
                }
            });
        }
    }
}

export default new WebSocketService();