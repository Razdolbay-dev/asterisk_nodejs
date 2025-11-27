const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const auditService = require('../../services/audit.service');

const router = express.Router();

// Все маршруты требуют аутентификации и роли admin
router.use(authenticateToken);
router.use(requireRole(['admin']));

// GET /api/audit/logs - получение логов аудита
router.get('/logs', async (req, res) => {
    try {
        const {
            limit = 50,
            offset = 0,
            action,
            userId,
            startDate,
            endDate
        } = req.query;

        const logs = await auditService.getLogs({
            limit: parseInt(limit),
            offset: parseInt(offset),
            action,
            userId,
            startDate,
            endDate
        });

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit logs'
        });
    }
});

// GET /api/audit/stats - статистика аудита
router.get('/stats', async (req, res) => {
    try {
        const stats = await auditService.getStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get audit stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit stats'
        });
    }
});

// DELETE /api/audit/logs - очистка логов аудита
router.delete('/logs', async (req, res) => {
    try {
        await auditService.clearLogs(req.user.id);
        res.json({
            success: true,
            message: 'Audit logs cleared successfully'
        });
    } catch (error) {
        console.error('Clear audit logs error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear audit logs'
        });
    }
});

module.exports = router;