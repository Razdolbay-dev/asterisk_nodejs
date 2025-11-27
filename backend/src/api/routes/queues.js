const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const queueService = require('../../services/queue.service');

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/queues - список всех очередей
router.get('/', async (req, res) => {
    try {
        const queues = await queueService.findAll();
        const stats = await queueService.getStats();

        res.json({
            success: true,
            data: queues,
            meta: {
                total: stats.total,
                totalMembers: stats.totalMembers,
                averageMembers: stats.averageMembers
            }
        });
    } catch (error) {
        console.error('Get queues error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch queues'
        });
    }
});

// GET /api/queues/stats - статистика очередей
router.get('/stats', async (req, res) => {
    try {
        const stats = await queueService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get queue stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch queue statistics'
        });
    }
});

// GET /api/queues/:id - получение конкретной очереди
router.get('/:id', async (req, res) => {
    try {
        const queue = await queueService.findById(req.params.id);

        if (!queue) {
            return res.status(404).json({
                success: false,
                error: 'Queue not found'
            });
        }

        res.json({
            success: true,
            data: queue
        });
    } catch (error) {
        console.error('Get queue error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch queue'
        });
    }
});

// POST /api/queues - создание новой очереди
router.post('/', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const {
            id,
            name,
            strategy = 'ringall',
            timeout = 30,
            wrapuptime = 10,
            maxlen = 0,
            servicelevel = 60,
            musicclass = 'default',
            announce = 'queue-thankyou',
            members = []
        } = req.body;

        if (!id || !name) {
            return res.status(400).json({
                success: false,
                error: 'ID and name are required'
            });
        }

        // Валидация ID
        if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
            return res.status(400).json({
                success: false,
                error: 'ID can only contain letters, numbers, hyphens and underscores'
            });
        }

        const queue = await queueService.create({
            id,
            name,
            strategy,
            timeout,
            wrapuptime,
            maxlen,
            servicelevel,
            musicclass,
            announce,
            members
        }, req.user.id);

        res.status(201).json({
            success: true,
            data: queue,
            message: 'Queue created successfully'
        });

    } catch (error) {
        console.error('Create queue error:', error);
        if (error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create queue'
        });
    }
});

// PUT /api/queues/:id - обновление очереди
router.put('/:id', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const {
            name,
            strategy,
            timeout,
            wrapuptime,
            maxlen,
            servicelevel,
            musicclass,
            announce,
            members
        } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (strategy !== undefined) updates.strategy = strategy;
        if (timeout !== undefined) updates.timeout = timeout;
        if (wrapuptime !== undefined) updates.wrapuptime = wrapuptime;
        if (maxlen !== undefined) updates.maxlen = maxlen;
        if (servicelevel !== undefined) updates.servicelevel = servicelevel;
        if (musicclass !== undefined) updates.musicclass = musicclass;
        if (announce !== undefined) updates.announce = announce;
        if (members !== undefined) updates.members = members;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid fields to update'
            });
        }

        const updatedQueue = await queueService.update(
            req.params.id,
            updates,
            req.user.id
        );

        res.json({
            success: true,
            data: updatedQueue,
            message: 'Queue updated successfully'
        });

    } catch (error) {
        console.error('Update queue error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update queue'
        });
    }
});

// DELETE /api/queues/:id - удаление очереди
router.delete('/:id', requireRole(['admin']), async (req, res) => {
    try {
        const deletedQueue = await queueService.delete(req.params.id, req.user.id);

        res.json({
            success: true,
            data: deletedQueue,
            message: 'Queue deleted successfully'
        });

    } catch (error) {
        console.error('Delete queue error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to delete queue'
        });
    }
});

// POST /api/queues/:id/members - добавление участника в очередь
router.post('/:id/members', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { interface, penalty = 0, membername } = req.body;

        if (!interface) {
            return res.status(400).json({
                success: false,
                error: 'Interface is required'
            });
        }

        const updatedQueue = await queueService.addMember(
            req.params.id,
            { interface, penalty, membername },
            req.user.id
        );

        res.status(201).json({
            success: true,
            data: updatedQueue,
            message: 'Member added to queue successfully'
        });

    } catch (error) {
        console.error('Add queue member error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        if (error.message.includes('already exists')) {
            return res.status(409).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to add member to queue'
        });
    }
});

// DELETE /api/queues/:id/members/:memberInterface - удаление участника из очереди
router.delete('/:id/members/:memberInterface', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const deletedMember = await queueService.removeMember(
            req.params.id,
            req.params.memberInterface,
            req.user.id
        );

        res.json({
            success: true,
            data: deletedMember,
            message: 'Member removed from queue successfully'
        });

    } catch (error) {
        console.error('Remove queue member error:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to remove member from queue'
        });
    }
});

// Экспортируем функцию для получения очередей
router.getQueues = () => queueService.getQueues();

module.exports = router;