module.exports = {
    // Настройки Asterisk AMI
    asterisk: {
        host: process.env.ASTERISK_HOST || 'localhost',
        port: process.env.ASTERISK_AMI_PORT || 5038,
        username: process.env.ASTERISK_AMI_USERNAME || 'admin',
        password: process.env.ASTERISK_AMI_PASSWORD || 'password',
        reconnect: true,
        reconnectDelay: 5000
    },

    // JWT настройки
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },

    // Пути к конфигам
    paths: {
        generated: process.env.GENERATED_CONFIG_PATH || '../generated',
        snapshots: process.env.SNAPSHOTS_PATH || '../snapshots',
        asteriskConfig: process.env.ASTERISK_CONFIG_PATH || '/etc/asterisk'
    },

    // Роли пользователей
    roles: {
        ADMIN: 'admin',
        OPERATOR: 'operator',
        VIEWER: 'viewer'
    }
};