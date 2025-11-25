const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { swaggerSpec, swaggerUi } = require('./src/config/swagger'); // Добавляем эту строку


const app = express();

// Добавляем после инициализации Express app
const http = require('http');
const WebSocketService = require('./src/services/websocket/websocket.service');

// Создаем HTTP сервер вместо прямого listen
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

// Инициализируем WebSocket сервер
WebSocketService.initialize(server);

// Middleware
app.use(helmet());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://192.168.88.182:5173',
        'http://10.80.80.253:5173',
        'http://127.0.0.1:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы для generated конфигов
app.use('/generated', express.static(path.join(__dirname, '../generated')));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Basic health check route
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'Asterisk GUI Backend'
    });
});

// API routes
app.use('/api/auth', require('./src/api/routes/auth'));
app.use('/api/sip', require('./src/api/routes/sip'));
app.use('/api/config', require('./src/api/routes/config'));
app.use('/api/asterisk', require('./src/api/routes/asterisk'));
app.use('/api/queues', require('./src/api/routes/queues'));
app.use('/api/trunks', require('./src/api/routes/trunks'));
app.use('/api/users', require('./src/api/routes/users'));
app.use('/api/audit', require('./src/api/routes/audit'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Запуск сервера с инициализацией AMI
const startServer = async () => {
    try {
        server.listen(PORT, HOST, () => {
            console.log(`🚀 Asterisk GUI Backend running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📍 Health check: http://localhost:${PORT}/health`);
            console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/auth/login`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
            console.log(`🔗 WebSocket endpoint: ws://localhost:${PORT}/ws`);
        });

        // Инициализируем AMI соединение после запуска сервера
        await initializeAMI();

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Обновляем initializeAMI для подключения WebSocket
const initializeAMI = async () => {
    try {
        const asteriskAMIService = require('./src/services/asterisk/ami.service');

        // Устанавливаем WebSocket сервис в AMI сервис
        asteriskAMIService.setWebSocketService(WebSocketService);

        await asteriskAMIService.connect();

        // Обработчики событий AMI
        asteriskAMIService.on('connected', () => {
            console.log('🎯 AMI Event: Connected to Asterisk');
            WebSocketService.sendSystemEvent('ami_connected', { status: 'connected' });
        });

        asteriskAMIService.on('disconnected', () => {
            console.log('🎯 AMI Event: Disconnected from Asterisk');
            WebSocketService.sendSystemEvent('ami_disconnected', { status: 'disconnected' });
        });

    } catch (error) {
        console.warn('⚠️ Failed to initialize AMI connection:', error.message);
        console.log('🔄 AMI will attempt to reconnect automatically...');
    }
};

// Запускаем сервер
startServer();

module.exports = app;