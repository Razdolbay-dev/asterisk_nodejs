const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { swaggerSpec, swaggerUi } = require('./src/config/swagger'); // Добавляем эту строку


const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec)); // Добавляем эту строку

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

// Инициализация AMI соединения при запуске
const initializeAMI = async () => {
    try {
        const asteriskAMIService = require('./src/services/asterisk/ami.service');
        await asteriskAMIService.connect();

        // Обработчики событий AMI
        asteriskAMIService.on('connected', () => {
            console.log('🎯 AMI Event: Connected to Asterisk');
        });

        asteriskAMIService.on('disconnected', () => {
            console.log('🎯 AMI Event: Disconnected from Asterisk');
        });

        asteriskAMIService.on('event', (event) => {
            console.log(`🎯 AMI Event [${event.type}]:`, event.data);
        });

    } catch (error) {
        console.warn('⚠️ Failed to initialize AMI connection:', error.message);
        console.log('🔄 AMI will attempt to reconnect automatically...');
    }
};

// Запуск сервера с инициализацией AMI
const startServer = async () => {
    try {
        app.listen(PORT, HOST, () => {
            console.log(`🚀 Asterisk GUI Backend running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📍 Health check: http://${HOST}:${PORT}/health`);
            console.log(`🔐 Auth endpoint: http://${HOST}:${PORT}/api/auth/login`);
        });

        // Инициализируем AMI соединение после запуска сервера
        await initializeAMI();

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Запускаем сервер
startServer();

module.exports = app;