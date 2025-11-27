// backend/src/scripts/restore-passwords.js
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

async function restorePasswords() {
    try {
        const dataDir = path.join(__dirname, '../../data');
        const usersFile = path.join(dataDir, 'users.json');

        // Читаем текущий файл
        const usersData = JSON.parse(await fs.readFile(usersFile, 'utf8'));

        // Восстанавливаем пароли
        const updatedUsers = usersData.map(user => {
            if (user.username === 'admin') {
                return {
                    ...user,
                    password: '$2a$12$LQv3c1yqBWVHxkd0L6kZrOuScOLMjZLvIyMWVh5RINOhSgBM3qQ0a' // password123
                };
            } else if (user.username === 'paul') {
                // Создаем новый хеш для пользователя paul
                const hashedPassword = bcrypt.hashSync('password123', 12);
                return {
                    ...user,
                    password: hashedPassword
                };
            }
            return user;
        });

        // Сохраняем обновленный файл
        await fs.writeFile(usersFile, JSON.stringify(updatedUsers, null, 2));

        console.log('✅ Passwords restored successfully!');
        console.log('📋 Default passwords:');
        console.log('   admin / password123');
        console.log('   paul / password123');

    } catch (error) {
        console.error('❌ Failed to restore passwords:', error);
    }
}

restorePasswords();