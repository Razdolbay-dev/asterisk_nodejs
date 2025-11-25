const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const trunksGenerator = require('../../services/config/trunks.generator');
const pjsipGenerator = require('../../services/config/pjsip.generator');
const snapshotService = require('../../services/config/snapshot.service');
const asteriskAMIService = require('../../services/asterisk/ami.service');

const router = express.Router();

// Временное хранилище в памяти для транков
let trunks = [
    {
        id: 'provider1',
        name: 'Main VoIP Provider',
        type: 'peer',
        host: 'voip.provider.com',
        port: 5060,
        username: 'myusername',
        password: 'mypassword',
        fromuser: 'myusername',
        fromdomain: 'voip.provider.com',
        context: 'from-trunk',
        qualify: 'yes',
        qualify_frequency: 60,
        insecure: 'invite,port',
        protocol: 'udp',
        register: 'yes',
        status: 'active',
        createdAt: new Date(),
        createdBy: 'system'
    }
];

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/trunks - список всех транков
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: trunks,
        total: trunks.length
    });
});

// GET /api/trunks/:id - получение конкретного транка
router.get('/:id', (req, res) => {
    const trunk = trunks.find(t => t.id === req.params.id);

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
            register = 'no'
        } = req.body;

        if (!id || !name || !host || !username || !password) {
            return res.status(400).json({
                success: false,
                error: 'ID, name, host, username and password are required'
            });
        }

        // Проверка на дубликат
        const existingTrunk = trunks.find(trunk => trunk.id === id);
        if (existingTrunk) {
            return res.status(409).json({
                success: false,
                error: `Trunk with ID ${id} already exists`
            });
        }

        const newTrunk = {
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
            status: 'active',
            createdAt: new Date(),
            createdBy: req.user.username
        };

        // Создаем снапшот перед изменениями
        await snapshotService.createSnapshot(
            `Create trunk: ${name} (${id})`,
            req.user.username
        );

        // Добавляем транк
        trunks.push(newTrunk);

        // Получаем текущие SIP аккаунты (нужно для генерации полного конфига)
        const sipAccounts = require('./sip').getSIPAccounts(); // Временное решение

        // Генерируем и сохраняем полный конфиг с SIP аккаунтами и транками
        await trunksGenerator.saveFullPJSIPConfig(sipAccounts, trunks);

        // Релоад PJSIP в Asterisk
        try {
            await asteriskAMIService.reloadPJSIP();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        res.status(201).json({
            success: true,
            data: newTrunk,
            message: 'Trunk created successfully'
        });

    } catch (error) {
        console.error('Create trunk error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create trunk'
        });
    }
});

// PUT /api/trunks/:id - обновление транка
router.put('/:id', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const trunkIndex = trunks.findIndex(t => t.id === req.params.id);

        if (trunkIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Trunk not found'
            });
        }

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

        // Создаем снапшот перед изменениями
        await snapshotService.createSnapshot(
            `Update trunk: ${trunks[trunkIndex].name} (${req.params.id})`,
            req.user.username
        );

        // Обновляем поля
        if (name) trunks[trunkIndex].name = name;
        if (host) trunks[trunkIndex].host = host;
        if (port) trunks[trunkIndex].port = port;
        if (username) trunks[trunkIndex].username = username;
        if (password) trunks[trunkIndex].password = password;
        if (fromuser) trunks[trunkIndex].fromuser = fromuser;
        if (fromdomain) trunks[trunkIndex].fromdomain = fromdomain;
        if (context) trunks[trunkIndex].context = context;
        if (qualify !== undefined) trunks[trunkIndex].qualify = qualify;
        if (qualify_frequency !== undefined) trunks[trunkIndex].qualify_frequency = qualify_frequency;
        if (insecure) trunks[trunkIndex].insecure = insecure;
        if (protocol) trunks[trunkIndex].protocol = protocol;
        if (register !== undefined) trunks[trunkIndex].register = register;
        if (status) trunks[trunkIndex].status = status;

        trunks[trunkIndex].updatedAt = new Date();
        trunks[trunkIndex].updatedBy = req.user.username;

        // Получаем текущие SIP аккаунты
        const sipAccounts = require('./sip').getSIPAccounts();

        // Генерируем и сохраняем обновленный конфиг
        await trunksGenerator.saveFullPJSIPConfig(sipAccounts, trunks);

        // Релоад PJSIP в Asterisk
        try {
            await asteriskAMIService.reloadPJSIP();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        res.json({
            success: true,
            data: trunks[trunkIndex],
            message: 'Trunk updated successfully'
        });

    } catch (error) {
        console.error('Update trunk error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update trunk'
        });
    }
});

// DELETE /api/trunks/:id - удаление транка
router.delete('/:id', requireRole(['admin']), async (req, res) => {
    try {
        const trunkIndex = trunks.findIndex(t => t.id === req.params.id);

        if (trunkIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Trunk not found'
            });
        }

        const trunkName = trunks[trunkIndex].name;

        // Создаем снапшот перед удалением
        await snapshotService.createSnapshot(
            `Delete trunk: ${trunkName} (${req.params.id})`,
            req.user.username
        );

        const deletedTrunk = trunks.splice(trunkIndex, 1)[0];

        // Получаем текущие SIP аккаунты
        const sipAccounts = require('./sip').getSIPAccounts();

        // Генерируем и сохраняем обновленный конфиг
        await trunksGenerator.saveFullPJSIPConfig(sipAccounts, trunks);

        // Релоад PJSIP в Asterisk
        try {
            await asteriskAMIService.reloadPJSIP();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        res.json({
            success: true,
            data: deletedTrunk,
            message: 'Trunk deleted successfully'
        });

    } catch (error) {
        console.error('Delete trunk error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete trunk'
        });
    }
});

// Вспомогательная функция для получения SIP аккаунтов
function getSIPAccounts() {
    // Временное решение - нужно рефакторить структуру данных
    const sipRoutes = require('./sip');
    return sipRoutes.getSIPAccounts ? sipRoutes.getSIPAccounts() : [];
}

// Экспортируем функцию для использования в других модулях
router.getSIPAccounts = getSIPAccounts;

module.exports = router;