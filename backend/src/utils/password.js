const bcrypt = require('bcryptjs');

class PasswordUtils {
    // Хеширование пароля
    static async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    // Проверка пароля
    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
}

module.exports = PasswordUtils;