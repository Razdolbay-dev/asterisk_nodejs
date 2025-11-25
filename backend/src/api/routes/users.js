const express = require('express');
const { authenticateToken, requireRole, requirePermission } = require('../../middleware/auth');
const userService = require('../../services/user.service');
const auditService = require('../../services/audit.service');

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/users - список всех пользователей
router.get('/', requirePermission('users:read'), async (req, res) => {
    try {
        const users = await userService.findAll();
        res.json({
            success: true,
            data: users,
            total: users.length
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});

// GET /api/users/stats - статистика пользователей
router.get('/stats', requirePermission('users:read'), async (req, res) => {
    try {
        const stats = await userService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user stats'
        });
    }
});

// GET /api/users/:id - получение пользователя по ID
router.get('/:id', requirePermission('users:read'), async (req, res) => {
    try {
        const user = await userService.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user'
        });
    }
});

// POST /api/users - создание нового пользователя
router.post('/', requirePermission('users:write'), async (req, res) => {
    try {
        const { username, password, role, email } = req.body;

        if (!username || !password || !role || !email) {
            return res.status(400).json({
                success: false,
                error: 'Username, password, role and email are required'
            });
        }

        // Валидация роли
        const validRoles = ['admin', 'operator', 'viewer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be one of: admin, operator, viewer'
            });
        }

        const user = await userService.create({
            username,
            password,
            role,
            email
        }, req.user.id);

        res.status(201).json({
            success: true,
            data: user,
            message: 'User created successfully'
        });
    } catch (error) {
        console.error('Create user error:', error);
        if (error.message === 'Username already exists') {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create user'
        });
    }
});

// PUT /api/users/:id - обновление пользователя
router.put('/:id', requirePermission('users:write'), async (req, res) => {
    try {
        const { email, role, isActive } = req.body;

        const updates = {};
        if (email !== undefined) updates.email = email;
        if (role !== undefined) updates.role = role;
        if (isActive !== undefined) updates.isActive = isActive;

        // Валидация роли если предоставлена
        if (role) {
            const validRoles = ['admin', 'operator', 'viewer'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid role. Must be one of: admin, operator, viewer'
                });
            }
        }

        const user = await userService.update(req.params.id, updates, req.user.id);

        res.json({
            success: true,
            data: user,
            message: 'User updated successfully'
        });
    } catch (error) {
        console.error('Update user error:', error);
        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update user'
        });
    }
});

// POST /api/users/:id/change-password - смена собственного пароля
router.post('/:id/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current password and new password are required'
            });
        }

        // Пользователь может менять только свой пароль
        if (req.params.id !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'You can only change your own password'
            });
        }

        const user = await userService.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Проверка текущего пароля
        const isValidPassword = await user.checkPassword(currentPassword);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current password is incorrect'
            });
        }

        await userService.changePassword(req.user.id, newPassword, req.user.id);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password'
        });
    }
});

// POST /api/users/:id/reset-password - сброс пароля (администратором)
router.post('/:id/reset-password', requirePermission('users:write'), async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                error: 'New password is required'
            });
        }

        const user = await userService.resetPassword(req.params.id, newPassword, req.user.id);

        res.json({
            success: true,
            data: user,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to reset password'
        });
    }
});

// DELETE /api/users/:id - удаление пользователя
router.delete('/:id', requirePermission('users:delete'), async (req, res) => {
    try {
        const user = await userService.delete(req.params.id, req.user.id);

        res.json({
            success: true,
            data: user,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        if (error.message === 'Cannot delete your own account') {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to delete user'
        });
    }
});

// POST /api/users/:id/deactivate - деактивация пользователя
router.post('/:id/deactivate', requirePermission('users:write'), async (req, res) => {
    try {
        const user = await userService.deactivate(req.params.id, req.user.id);

        res.json({
            success: true,
            data: user,
            message: 'User deactivated successfully'
        });
    } catch (error) {
        console.error('Deactivate user error:', error);
        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        if (error.message === 'Cannot deactivate your own account') {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to deactivate user'
        });
    }
});

module.exports = router;