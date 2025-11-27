// backend/src/scripts/create-admin.js
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

async function createAdminUser() {
    try {
        const dataDir = path.join(__dirname, '../../data');
        const usersFile = path.join(dataDir, 'users.json');

        // Создаем директорию если не существует
        try {
            await fs.access(dataDir);
        } catch {
            await fs.mkdir(dataDir, { recursive: true });
        }

        // Хешируем пароль
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 12);

        const adminUser = {
            id: '1',
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
            email: 'admin@asterisk.local',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: null,
            failedLoginAttempts: 0,
            lockedUntil: null
        };

        // Сохраняем в файл
        await fs.writeFile(usersFile, JSON.stringify([adminUser], null, 2));

        console.log('✅ Admin user created successfully!');
        console.log('📋 Login credentials:');
        console.log('   Username: admin');
        console.log('   Password: password123');

    } catch (error) {
        console.error('❌ Failed to create admin user:', error);
    }
}

createAdminUser();