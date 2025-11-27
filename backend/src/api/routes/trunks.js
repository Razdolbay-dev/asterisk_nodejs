const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const trunkService = require('../../services/trunk.service');

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/trunks - список всех транков
router.get('/', async (req, res) => {
    try {
        const trunks = await trunkService.findAll();
        const stats = await trunkService.getStats();

        res.json({
            success: true,
            data: trunks,
            meta: {
                total: stats.total,
                active: stats.active,
                registered: stats.registered,
                registrationRate: stats.registrationRate
            }
        });
    } catch (error) {
        console.error('Get trunks error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trunks'
        });
    }
});

// GET /api/trunks/stats - статистика транков
router.get('/stats', async (req, res) => {
    try {
        const stats = await trunkService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get trunk stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trunk statistics'
        });
    }
});

// GET /api/trunks/:id - получение конкретного транка
router.get('/:id', async (req, res) => {
    try {
        const trunk = await trunkService.findById(req.params.id);

        if (!trunk) {
            return res.status(404).json({
                success: false,
                error: 'Trunk not found'
            });
        }

        res.json({
            success: true,
            data: trunk
        });
    } catch (error) {
        console.error('Get trunk error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trunk'
        });
    }
});

// POST /api/trunks - создание нового транка
router.post('/', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const {
            id,
            name,
            type = 'peer',
            host,
            port = 5060,
            username,
            password,
            fromuser,
            fromdomain,
            context = 'from-trunk',
            qualify = 'yes',
            qualify_frequency = 60,
            insecure = 'invite,port',
            protocol = 'udp',
            register = 'no',
            status = 'active'
        } = req.body;

        if (!id || !name || !host || !username || !password) {
            return res.status(400).json({
                success: false,
                error: 'ID, name, host, username and password are required'
            });
        }

        // Валидация ID
        if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
            return res.status(400).json({
                success: false,
                error: 'ID can only contain letters, numbers, hyphens and underscores'
            });
        }

        const trunk = await trunkService.create({
            id,
            name,
            type,
            host,
            port,
            username,
            password,
            fromuser: fromuser || username,
            fromdomain: fromdomain || host,
            context,
            qualify,
            qualify_frequency,
            insecure,
            protocol,
            register,
            status
        }, req.user.id);

        res.status(201).json({
            success: true,
            data: trunk,
            message: 'Trunk created successfully'
        });

    } catch (error) {
        console.error('Create trunk error:', error);
        if (error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create trunk'
        });
    }
});

// PUT /api/trunks/:id - обновление транка
router.put('/:id', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const {
            name,
            host,
            port,
            username,
            password,
            fromuser,
            fromdomain,
            context,
            qualify,
            qualify_frequency,
            insecure,
            protocol,
            register,
            status
        } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (host !== undefined) updates.host = host;
        if (port !== undefined) updates.port = port;
        if (username !== undefined) updates.username = username;
        if (password !== undefined) updates.password = password;
        if (fromuser !== undefined) updates.fromuser = fromuser;
        if (fromdomain !== undefined) updates.fromdomain = fromdomain;
        if (context !== undefined) updates.context = context;
        if (qualify !== undefined) updates.qualify = qualify;
        if (qualify_frequency !== undefined) updates.qualify_frequency = qualify_frequency;
        if (insecure !== undefined) updates.insecure = insecure;
        if (protocol !== undefined) updates.protocol = protocol;
        if (register !== undefined) updates.register = register;
        if (status !== undefined) updates.status = status;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid fields to update'
            });
        }

        const updatedTrunk = await trunkService.update(
            req.params.id,
            updates,
            req.user.id
        );

        res.json({
            success: true,
            data: updatedTrunk,
            message: 'Trunk updated successfully'
        });

    } catch (error) {
        console.error('Update trunk error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update trunk'
        });
    }
});

// DELETE /api/trunks/:id - удаление транка
router.delete('/:id', requireRole(['admin']), async (req, res) => {
    try {
        const deletedTrunk = await trunkService.delete(req.params.id, req.user.id);

        res.json({
            success: true,
            data: deletedTrunk,
            message: 'Trunk deleted successfully'
        });

    } catch (error) {
        console.error('Delete trunk error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to delete trunk'
        });
    }
});

// Экспортируем функцию для получения транков
router.getTrunks = () => trunkService.getTrunks();

module.exports = router;