// backend/src/api/routes/auth.js

const express = require('express');
const JWTUtils = require('../../utils/jwt');
const userService = require('../../services/user.service');
const auditService = require('../../services/audit.service');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('Login attempt for user:', username);

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required'
            });
        }

        // Находим пользователя
        const user = await userService.findByUsername(username);
        if (!user) {
            console.log('User not found:', username);
            await auditService.log({
                action: 'LOGIN_FAILED',
                userId: null,
                details: {
                    username: username,
                    reason: 'User not found',
                    ip: req.ip
                },
                timestamp: new Date().toISOString()
            });

            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        console.log('User found:', user.username, 'ID:', user.id);

        // Проверяем блокировку
        if (user.isLocked()) {
            console.log('Account locked for user:', username);
            await auditService.log({
                action: 'LOGIN_FAILED',
                userId: user.id,
                details: {
                    username: username,
                    reason: 'Account locked',
                    lockedUntil: user.lockedUntil,
                    ip: req.ip
                },
                timestamp: new Date().toISOString()
            });

            return res.status(401).json({
                success: false,
                error: 'Account is temporarily locked due to failed login attempts'
            });
        }

        // Проверяем пароль
        console.log('Checking password for user:', username);
        const isValidPassword = await user.checkPassword(password);
        console.log('Password valid:', isValidPassword);

        if (!isValidPassword) {
            console.log('Invalid password for user:', username);
            // Записываем неудачную попытку
            user.recordFailedLogin();
            await userService.updateUser(user);

            await auditService.log({
                action: 'LOGIN_FAILED',
                userId: user.id,
                details: {
                    username: username,
                    reason: 'Invalid password',
                    failedAttempts: user.failedLoginAttempts,
                    ip: req.ip
                },
                timestamp: new Date().toISOString()
            });

            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Сбрасываем счетчик неудачных попыток при успешном входе
        user.recordSuccessfulLogin();
        await userService.updateUser(user);

        // Генерируем токен
        const token = JWTUtils.generateToken(user);

        await auditService.log({
            action: 'LOGIN_SUCCESS',
            userId: user.id,
            details: {
                username: username,
                ip: req.ip
            },
            timestamp: new Date().toISOString()
        });

        console.log('Login successful for user:', username);

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    email: user.email,
                    permissions: JWTUtils.getUserPermissions(user.role)
                }
            },
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed: ' + error.message
        });
    }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    try {
        const token = JWTUtils.extractToken(req.headers.authorization);

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Refresh token required'
            });
        }

        const newToken = await JWTUtils.refreshToken(token);

        res.json({
            success: true,
            data: {
                token: newToken
            },
            message: 'Token refreshed successfully'
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await userService.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                permissions: JWTUtils.getUserPermissions(user.role)
            }
        });

    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user profile'
        });
    }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        await auditService.log({
            action: 'LOGOUT',
            userId: req.user.id,
            details: {
                username: req.user.username,
                ip: req.ip
            },
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Logout successful'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Logout failed'
        });
    }
});

module.exports = router;