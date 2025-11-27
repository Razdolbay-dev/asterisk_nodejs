const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const sipService = require('../../services/sip.service');

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/sip - список всех SIP аккаунтов
router.get('/', async (req, res) => {
    try {
        const accounts = await sipService.findAll();
        const stats = await sipService.getStats();

        res.json({
            success: true,
            data: accounts,
            meta: {
                total: stats.total,
                active: stats.active,
                offline: stats.offline
            }
        });
    } catch (error) {
        console.error('Get SIP accounts error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch SIP accounts'
        });
    }
});

// GET /api/sip/stats - статистика SIP аккаунтов
router.get('/stats', async (req, res) => {
    try {
        const stats = await sipService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get SIP stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch SIP statistics'
        });
    }
});

// POST /api/sip - создание нового SIP аккаунта
router.post('/', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id, password, context = 'internal', codecs = 'ulaw,alaw', description, callerid, status = 'active' } = req.body;

        if (!id || !password) {
            return res.status(400).json({
                success: false,
                error: 'ID and password are required'
            });
        }

        // Валидация ID (только буквы, цифры, дефисы и подчеркивания)
        if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
            return res.status(400).json({
                success: false,
                error: 'ID can only contain letters, numbers, hyphens and underscores'
            });
        }

        const account = await sipService.create({
            id,
            password,
            context,
            codecs,
            description,
            callerid,
            status
        }, req.user.id);

        res.status(201).json({
            success: true,
            data: account,
            message: 'SIP account created successfully'
        });
    } catch (error) {
        console.error('Create SIP account error:', error);
        if (error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create SIP account'
        });
    }
});

// GET /api/sip/:id - получение конкретного SIP аккаунта
router.get('/:id', async (req, res) => {
    try {
        const account = await sipService.findById(req.params.id);

        if (!account) {
            return res.status(404).json({
                success: false,
                error: 'SIP account not found'
            });
        }

        res.json({
            success: true,
            data: account
        });
    } catch (error) {
        console.error('Get SIP account error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch SIP account'
        });
    }
});

// PUT /api/sip/:id - обновление SIP аккаунта
router.put('/:id', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { password, context, codecs, status, description, callerid } = req.body;

        const updates = {};
        if (password !== undefined) updates.password = password;
        if (context !== undefined) updates.context = context;
        if (codecs !== undefined) updates.codecs = codecs;
        if (status !== undefined) updates.status = status;
        if (description !== undefined) updates.description = description;
        if (callerid !== undefined) updates.callerid = callerid;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid fields to update'
            });
        }

        const updatedAccount = await sipService.update(
            req.params.id,
            updates,
            req.user.id
        );

        res.json({
            success: true,
            data: updatedAccount,
            message: 'SIP account updated successfully'
        });

    } catch (error) {
        console.error('Update SIP account error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update SIP account'
        });
    }
});

// DELETE /api/sip/:id - удаление SIP аккаунта
router.delete('/:id', requireRole(['admin']), async (req, res) => {
    try {
        const deletedAccount = await sipService.delete(req.params.id, req.user.id);

        res.json({
            success: true,
            data: deletedAccount,
            message: 'SIP account deleted successfully'
        });

    } catch (error) {
        console.error('Delete SIP account error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to delete SIP account'
        });
    }
});

// Экспортируем функцию для получения аккаунтов
router.getSIPAccounts = () => sipService.getSIPAccounts();

module.exports = router;