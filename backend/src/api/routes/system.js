const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const storageService = require('../../services/storage.service');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole(['admin']));

// GET /api/system/config - получение системных настроек
router.get('/config', async (req, res) => {
    try {
        const config = await storageService.getSystemConfig();
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Get system config error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch system configuration'
        });
    }
});

// PUT /api/system/config - обновление системных настроек
router.put('/config', async (req, res) => {
    try {
        const { asterisk, security, paths } = req.body;

        const currentConfig = await storageService.getSystemConfig();
        const updatedConfig = {
            ...currentConfig,
            asterisk: { ...currentConfig.asterisk, ...asterisk },
            security: { ...currentConfig.security, ...security },
            paths: { ...currentConfig.paths, ...paths },
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.id
        };

        await storageService.saveSystemConfig(updatedConfig);

        res.json({
            success: true,
            data: updatedConfig,
            message: 'System configuration updated successfully'
        });
    } catch (error) {
        console.error('Update system config error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update system configuration'
        });
    }
});

// POST /api/system/backup - создание бэкапа
router.post('/backup', async (req, res) => {
    try {
        const backupPath = await storageService.backup();

        res.json({
            success: true,
            data: { backupPath },
            message: 'Backup created successfully'
        });
    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create backup'
        });
    }
});

// POST /api/system/restore - восстановление из бэкапа
router.post('/restore', async (req, res) => {
    try {
        const { backupPath } = req.body;

        await storageService.restore(backupPath);

        res.json({
            success: true,
            message: 'Backup restored successfully'
        });
    } catch (error) {
        console.error('Restore error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to restore backup'
        });
    }
});

module.exports = router;