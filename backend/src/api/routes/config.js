const express = require('express');
const fs = require('fs').promises;
const path = require('path');
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

// GET /api/config/raw - список всех конфиг файлов
router.get('/raw', authenticateToken, async (req, res) => {
    try {
        const configPath = path.join(__dirname, '../../../generated');
        const files = await fs.readdir(configPath);

        const configFiles = files.filter(file =>
            file.endsWith('.conf') && !file.endsWith('.tmp')
        ).map(file => ({
            name: file,
            path: path.join(configPath, file),
            size: 0, // будет заполнено ниже
            modified: null
        }));

        // Добавляем информацию о размере и дате изменения
        for (const file of configFiles) {
            try {
                const stats = await fs.stat(file.path);
                file.size = stats.size;
                file.modified = stats.mtime;
            } catch (error) {
                console.warn(`Could not stat file ${file.name}:`, error.message);
            }
        }

        res.json({
            success: true,
            data: configFiles
        });
    } catch (error) {
        console.error('List config files error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list config files'
        });
    }
});

// GET /api/config/raw/:filename - чтение конфиг файла
router.get('/raw/:filename', authenticateToken, async (req, res) => {
    try {
        const { filename } = req.params;

        // Защита от path traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid filename'
            });
        }

        const configPath = path.join(__dirname, '../../../generated', filename);

        // Проверяем что файл существует и это .conf файл
        if (!filename.endsWith('.conf')) {
            return res.status(400).json({
                success: false,
                error: 'Only .conf files are allowed'
            });
        }

        const content = await fs.readFile(configPath, 'utf8');
        const stats = await fs.stat(configPath);

        res.json({
            success: true,
            data: {
                name: filename,
                content: content,
                size: stats.size,
                modified: stats.mtime,
                path: configPath
            }
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({
                success: false,
                error: 'Config file not found'
            });
        }
        console.error('Read config file error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to read config file'
        });
    }
});

// PUT /api/config/raw/:filename - обновление конфиг файла (только admin)
router.put('/raw/:filename', requireRole(['admin']), async (req, res) => {
    try {
        const { filename } = req.params;
        const { content, comment = '' } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'Content is required'
            });
        }

        // Защита от path traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid filename'
            });
        }

        if (!filename.endsWith('.conf')) {
            return res.status(400).json({
                success: false,
                error: 'Only .conf files are allowed'
            });
        }

        const configPath = path.join(__dirname, '../../../generated', filename);

        // Создаем снапшот перед изменениями
        const snapshotService = require('../../services/config/snapshot.service');
        await snapshotService.createSnapshot(
            `Raw edit: ${filename} - ${comment}`,
            req.user.username
        );

        // Безопасная запись файла
        const tempPath = configPath + '.tmp';
        await fs.writeFile(tempPath, content, 'utf8');
        await fs.rename(tempPath, configPath);

        // Релоад соответствующих модулей в Asterisk
        const asteriskAMIService = require('../../services/asterisk/ami.service');
        try {
            if (filename === 'pjsip.conf') {
                await asteriskAMIService.reloadPJSIP();
            } else if (filename === 'queues.conf') {
                await asteriskAMIService.reloadQueues();
            }
        } catch (amiError) {
            console.warn('AMI reload failed after config edit:', amiError.message);
        }

        const stats = await fs.stat(configPath);

        res.json({
            success: true,
            data: {
                name: filename,
                size: stats.size,
                modified: stats.mtime
            },
            message: 'Config file updated successfully'
        });
    } catch (error) {
        console.error('Update config file error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update config file'
        });
    }
});

// DELETE /api/config/raw/:filename - удаление конфиг файла (только admin)
router.delete('/raw/:filename', requireRole(['admin']), async (req, res) => {
    try {
        const { filename } = req.params;

        // Защита от path traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid filename'
            });
        }

        if (!filename.endsWith('.conf')) {
            return res.status(400).json({
                success: false,
                error: 'Only .conf files are allowed'
            });
        }

        const configPath = path.join(__dirname, '../../../generated', filename);

        // Создаем снапшот перед удалением
        const snapshotService = require('../../services/config/snapshot.service');
        await snapshotService.createSnapshot(
            `Delete config: ${filename}`,
            req.user.username
        );

        await fs.unlink(configPath);

        res.json({
            success: true,
            message: 'Config file deleted successfully'
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({
                success: false,
                error: 'Config file not found'
            });
        }
        console.error('Delete config file error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete config file'
        });
    }
});

module.exports = router;