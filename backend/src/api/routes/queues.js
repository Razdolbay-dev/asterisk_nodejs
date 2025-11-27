const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const queuesGenerator = require('../../services/config/queues.generator');
const snapshotService = require('../../services/config/snapshot.service');
const asteriskAMIService = require('../../services/asterisk/ami.service');

const router = express.Router();

// Временное хранилище в памяти для очередей
let queues = [];

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/queues - список всех очередей
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: queues,
        total: queues.length
    });
});

// GET /api/queues/:id - получение конкретной очереди
router.get('/:id', (req, res) => {
    const queue = queues.find(q => q.id === req.params.id);

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

        // Проверка на дубликат
        const existingQueue = queues.find(queue => queue.id === id);
        if (existingQueue) {
            return res.status(409).json({
                success: false,
                error: `Queue with ID ${id} already exists`
            });
        }

        const newQueue = {
            id,
            name,
            strategy,
            timeout,
            wrapuptime,
            maxlen,
            servicelevel,
            musicclass,
            announce,
            members: members.map(member => ({
                interface: member.interface,
                penalty: member.penalty || 0,
                membername: member.membername || member.interface
            })),
            createdAt: new Date(),
            createdBy: req.user.username
        };

        // Создаем снапшот перед изменениями
        await snapshotService.createSnapshot(
            `Create queue: ${name} (${id})`,
            req.user.username
        );

        // Добавляем очередь
        queues.push(newQueue);

        // Генерируем и сохраняем конфиг
        await queuesGenerator.saveQueuesConfig(queues);

        // Релоад очередей в Asterisk
        try {
            await asteriskAMIService.reloadQueues();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        res.status(201).json({
            success: true,
            data: newQueue,
            message: 'Queue created successfully'
        });

    } catch (error) {
        console.error('Create queue error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create queue'
        });
    }
});

// PUT /api/queues/:id - обновление очереди
router.put('/:id', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const queueIndex = queues.findIndex(q => q.id === req.params.id);

        if (queueIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Queue not found'
            });
        }

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

        // Создаем снапшот перед изменениями
        await snapshotService.createSnapshot(
            `Update queue: ${queues[queueIndex].name} (${req.params.id})`,
            req.user.username
        );

        // Обновляем поля
        if (name) queues[queueIndex].name = name;
        if (strategy) queues[queueIndex].strategy = strategy;
        if (timeout !== undefined) queues[queueIndex].timeout = timeout;
        if (wrapuptime !== undefined) queues[queueIndex].wrapuptime = wrapuptime;
        if (maxlen !== undefined) queues[queueIndex].maxlen = maxlen;
        if (servicelevel !== undefined) queues[queueIndex].servicelevel = servicelevel;
        if (musicclass) queues[queueIndex].musicclass = musicclass;
        if (announce) queues[queueIndex].announce = announce;
        if (members) {
            queues[queueIndex].members = members.map(member => ({
                interface: member.interface,
                penalty: member.penalty || 0,
                membername: member.membername || member.interface
            }));
        }

        queues[queueIndex].updatedAt = new Date();
        queues[queueIndex].updatedBy = req.user.username;

        // Генерируем и сохраняем обновленный конфиг
        await queuesGenerator.saveQueuesConfig(queues);

        // Релоад очередей в Asterisk
        try {
            await asteriskAMIService.reloadQueues();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        res.json({
            success: true,
            data: queues[queueIndex],
            message: 'Queue updated successfully'
        });

    } catch (error) {
        console.error('Update queue error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update queue'
        });
    }
});

// DELETE /api/queues/:id - удаление очереди
router.delete('/:id', requireRole(['admin']), async (req, res) => {
    try {
        const queueIndex = queues.findIndex(q => q.id === req.params.id);

        if (queueIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Queue not found'
            });
        }

        const queueName = queues[queueIndex].name;

        // Создаем снапшот перед удалением
        await snapshotService.createSnapshot(
            `Delete queue: ${queueName} (${req.params.id})`,
            req.user.username
        );

        const deletedQueue = queues.splice(queueIndex, 1)[0];

        // Генерируем и сохраняем обновленный конфиг
        await queuesGenerator.saveQueuesConfig(queues);

        // Релоад очередей в Asterisk
        try {
            await asteriskAMIService.reloadQueues();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        res.json({
            success: true,
            data: deletedQueue,
            message: 'Queue deleted successfully'
        });

    } catch (error) {
        console.error('Delete queue error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete queue'
        });
    }
});

// POST /api/queues/:id/members - добавление участника в очередь
router.post('/:id/members', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const queueIndex = queues.findIndex(q => q.id === req.params.id);

        if (queueIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Queue not found'
            });
        }

        const { interface, penalty = 0, membername } = req.body;

        if (!interface) {
            return res.status(400).json({
                success: false,
                error: 'Interface is required'
            });
        }

        // Проверяем, не добавлен ли уже этот участник
        const existingMember = queues[queueIndex].members.find(
            m => m.interface === interface
        );

        if (existingMember) {
            return res.status(409).json({
                success: false,
                error: 'Member already exists in this queue'
            });
        }

        // Создаем снапшот перед изменениями
        await snapshotService.createSnapshot(
            `Add member to queue: ${queues[queueIndex].name}`,
            req.user.username
        );

        // Добавляем участника
        queues[queueIndex].members.push({
            interface,
            penalty,
            membername: membername || interface
        });

        queues[queueIndex].updatedAt = new Date();
        queues[queueIndex].updatedBy = req.user.username;

        // Генерируем и сохраняем обновленный конфиг
        await queuesGenerator.saveQueuesConfig(queues);

        // Релоад очередей в Asterisk
        try {
            await asteriskAMIService.reloadQueues();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        res.status(201).json({
            success: true,
            data: queues[queueIndex],
            message: 'Member added to queue successfully'
        });

    } catch (error) {
        console.error('Add queue member error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add member to queue'
        });
    }
});

// DELETE /api/queues/:id/members/:memberInterface - удаление участника из очереди
router.delete('/:id/members/:memberInterface', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const queueIndex = queues.findIndex(q => q.id === req.params.id);

        if (queueIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Queue not found'
            });
        }

        const memberIndex = queues[queueIndex].members.findIndex(
            m => m.interface === req.params.memberInterface
        );

        if (memberIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Member not found in this queue'
            });
        }

        // Создаем снапшот перед изменениями
        await snapshotService.createSnapshot(
            `Remove member from queue: ${queues[queueIndex].name}`,
            req.user.username
        );

        // Удаляем участника
        const deletedMember = queues[queueIndex].members.splice(memberIndex, 1)[0];

        queues[queueIndex].updatedAt = new Date();
        queues[queueIndex].updatedBy = req.user.username;

        // Генерируем и сохраняем обновленный конфиг
        await queuesGenerator.saveQueuesConfig(queues);

        // Релоад очередей в Asterisk
        try {
            await asteriskAMIService.reloadQueues();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        res.json({
            success: true,
            data: deletedMember,
            message: 'Member removed from queue successfully'
        });

    } catch (error) {
        console.error('Remove queue member error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove member from queue'
        });
    }
});

module.exports = router;