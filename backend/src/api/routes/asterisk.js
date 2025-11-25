const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const asteriskAMIService = require('../../services/asterisk/ami.service');

const router = express.Router();

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/asterisk/status - статус AMI соединения
router.get('/status', (req, res) => {
    try {
        const status = asteriskAMIService.getStatus();
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Get Asterisk status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get Asterisk status'
        });
    }
});

// GET /api/asterisk/system-info - информация о системе
router.get('/system-info', async (req, res) => {
    try {
        const systemInfo = await asteriskAMIService.getSystemInfo();
        res.json({
            success: true,
            data: systemInfo
        });
    } catch (error) {
        console.error('Get system info error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get system info'
        });
    }
});

// GET /api/asterisk/sip-peers - список SIP пиров
router.get('/sip-peers', async (req, res) => {
    try {
        const peers = await asteriskAMIService.getSIPPeers();
        res.json({
            success: true,
            data: peers
        });
    } catch (error) {
        console.error('Get SIP peers error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get SIP peers'
        });
    }
});

// GET /api/asterisk/queues - статус очередей
router.get('/queues', async (req, res) => {
    try {
        const queues = await asteriskAMIService.getQueuesStatus();
        res.json({
            success: true,
            data: queues
        });
    } catch (error) {
        console.error('Get queues status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get queues status'
        });
    }
});

// POST /api/asterisk/reload/pjsip - релоад PJSIP
router.post('/reload/pjsip', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        await asteriskAMIService.reloadPJSIP();
        res.json({
            success: true,
            message: 'PJSIP reloaded successfully'
        });
    } catch (error) {
        console.error('Reload PJSIP error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reload PJSIP'
        });
    }
});

// POST /api/asterisk/reload/queues - релоад очередей
router.post('/reload/queues', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        await asteriskAMIService.reloadQueues();
        res.json({
            success: true,
            message: 'Queues reloaded successfully'
        });
    } catch (error) {
        console.error('Reload queues error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reload queues'
        });
    }
});

// POST /api/asterisk/reload/all - релоад всех модулей
router.post('/reload/all', requireRole(['admin']), async (req, res) => {
    try {
        await asteriskAMIService.reloadAll();
        res.json({
            success: true,
            message: 'All modules reloaded successfully'
        });
    } catch (error) {
        console.error('Reload all error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reload all modules'
        });
    }
});

// POST /api/asterisk/connect - принудительное подключение к AMI
router.post('/connect', requireRole(['admin']), async (req, res) => {
    try {
        await asteriskAMIService.connect();
        res.json({
            success: true,
            message: 'AMI connection initiated'
        });
    } catch (error) {
        console.error('AMI connect error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to connect to AMI'
        });
    }
});

module.exports = router;