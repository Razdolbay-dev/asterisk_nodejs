const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const snapshotService = require('../../services/config/snapshot.service');
const asteriskAMIService = require('../../services/asterisk/ami.service');

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/config/snapshots - список снапшотов
router.get('/snapshots', async (req, res) => {
    try {
        const snapshots = await snapshotService.listSnapshots();
        res.json({
            success: true,
            data: snapshots,
            total: snapshots.length
        });
    } catch (error) {
        console.error('List snapshots error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list snapshots'
        });
    }
});

// POST /api/config/snapshots - создание снапшота
router.post('/snapshots', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { comment = '' } = req.body;

        const snapshot = await snapshotService.createSnapshot(
            comment,
            req.user.username
        );

        res.json({
            success: true,
            data: snapshot,
            message: 'Snapshot created successfully'
        });
    } catch (error) {
        console.error('Create snapshot error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create snapshot'
        });
    }
});

// POST /api/config/snapshots/:id/restore - восстановление снапшота
router.post('/snapshots/:id/restore', requireRole(['admin']), async (req, res) => {
    try {
        const snapshotId = req.params.id;

        const snapshot = await snapshotService.restoreSnapshot(snapshotId);

        // Релоад конфигов в Asterisk
        try {
            await asteriskAMIService.reloadPJSIP();
            await asteriskAMIService.reloadQueues();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was restored:', amiError.message);
        }

        res.json({
            success: true,
            data: snapshot,
            message: 'Snapshot restored successfully'
        });
    } catch (error) {
        console.error('Restore snapshot error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to restore snapshot'
        });
    }
});

// DELETE /api/config/snapshots/:id - удаление снапшота
router.delete('/snapshots/:id', requireRole(['admin']), async (req, res) => {
    try {
        const snapshotId = req.params.id;

        await snapshotService.deleteSnapshot(snapshotId);

        res.json({
            success: true,
            message: 'Snapshot deleted successfully'
        });
    } catch (error) {
        console.error('Delete snapshot error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete snapshot'
        });
    }
});

module.exports = router;