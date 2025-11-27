import { defineStore } from 'pinia'
import WebSocketService from '@/services/websocket'

export const useRealtimeStore = defineStore('realtime', {
    state: () => ({
        isConnected: false,
        activeCalls: [],
        sipPeers: [],
        queueStatus: [],
        recentEvents: [],
        systemStatus: {
            asteriskConnected: false,
            activeChannels: 0,
            uptime: '0:00:00'
        }
    }),

    getters: {
        activeCallsCount: (state) => state.activeCalls.length,
        onlineSipPeers: (state) => state.sipPeers.filter(peer => peer.status === 'OK'),
        recentEventsCount: (state) => state.recentEvents.length
    },

    actions: {
        initializeWebSocket() {
            // Подписываемся на события WebSocket
            WebSocketService.on('connected', () => {
                this.isConnected = true;
                console.log('✅ WebSocket connected');
            });

            WebSocketService.on('disconnected', () => {
                this.isConnected = false;
                console.log('🔌 WebSocket disconnected');
            });

            WebSocketService.on('ami_event', (eventData) => {
                this.handleAMIEvent(eventData);
            });

            WebSocketService.on('system_event', (eventData) => {
                this.handleSystemEvent(eventData);
            });

            // Подключаемся к WebSocket
            WebSocketService.connect();
        },

        handleAMIEvent({ event, data, timestamp }) {
            // Добавляем событие в историю
            this.addRecentEvent({
                id: Date.now() + Math.random(),
                type: event,
                data,
                timestamp
            });

            // Обрабатываем конкретные события
            switch (event) {
                case 'Newchannel':
                    this.handleNewChannel(data);
                    break;
                case 'Hangup':
                    this.handleHangup(data);
                    break;
                case 'Newstate':
                    this.handleChannelState(data);
                    break;
                case 'PeerStatus':
                    this.handlePeerStatus(data);
                    break;
                case 'QueueMemberStatus':
                    this.handleQueueMemberStatus(data);
                    break;
                case 'QueueCallerJoin':
                    this.handleQueueCallerJoin(data);
                    break;
                case 'QueueCallerLeave':
                    this.handleQueueCallerLeave(data);
                    break;
            }
        },

        handleSystemEvent({ event, data }) {
            switch (event) {
                case 'ami_connected':
                    this.systemStatus.asteriskConnected = true;
                    break;
                case 'ami_disconnected':
                    this.systemStatus.asteriskConnected = false;
                    break;
            }
        },

        handleNewChannel(channelData) {
            const call = {
                id: channelData.channel,
                channel: channelData.channel,
                callerId: channelData.calleridnum || 'Unknown',
                destination: channelData.exten || 'Unknown',
                state: 'Ringing',
                startTime: new Date().toISOString(),
                uniqueId: channelData.uniqueid
            };

            this.activeCalls.push(call);
        },

        handleHangup(hangupData) {
            this.activeCalls = this.activeCalls.filter(
                call => call.uniqueId !== hangupData.uniqueid
            );
        },

        handleChannelState(stateData) {
            const call = this.activeCalls.find(
                call => call.uniqueId === stateData.uniqueid
            );

            if (call) {
                call.state = stateData.channelstate;
            }
        },

        handlePeerStatus(peerData) {
            const peerIndex = this.sipPeers.findIndex(
                peer => peer.endpoint === peerData.peer
            );

            const peer = {
                endpoint: peerData.peer,
                status: peerData.peerstatus,
                lastUpdate: new Date().toISOString()
            };

            if (peerIndex === -1) {
                this.sipPeers.push(peer);
            } else {
                this.sipPeers[peerIndex] = peer;
            }
        },

        handleQueueMemberStatus(memberData) {
            // Обработка статуса участника очереди
            console.log('Queue member status:', memberData);
        },

        handleQueueCallerJoin(joinData) {
            // Обработка входа в очередь
            console.log('Queue caller join:', joinData);
        },

        handleQueueCallerLeave(leaveData) {
            // Обработка выхода из очереди
            console.log('Queue caller leave:', leaveData);
        },

        addRecentEvent(event) {
            this.recentEvents.unshift(event);

            // Держим только последние 50 событий
            if (this.recentEvents.length > 50) {
                this.recentEvents = this.recentEvents.slice(0, 50);
            }
        },

        clearRecentEvents() {
            this.recentEvents = [];
        },

        disconnect() {
            WebSocketService.disconnect();
            this.isConnected = false;
        }
    }
})