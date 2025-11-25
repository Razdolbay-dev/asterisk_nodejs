const express = require('express');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const pjsipGenerator = require('../../services/config/pjsip.generator');
const snapshotService = require('../../services/config/snapshot.service');
const asteriskAMIService = require('../../services/asterisk/ami.service');

const router = express.Router();

// Временное хранилище в памяти
let sipAccounts = [
    {
        id: '1001',
        username: '1001',
        password: 'secret123',
        context: 'internal',
        codecs: 'ulaw,alaw',
        status: 'active',
        createdAt: new Date()
    }
];

// Все маршруты требуют аутентификации
router.use(authenticateToken);

// GET /api/sip - список всех SIP аккаунтов
/**
 * @swagger
 * /api/sip:
 *   get:
 *     summary: Get all SIP accounts
 *     tags: [SIP Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of SIP accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SIPAccount'
 *                 total:
 *                   type: integer
 *                   example: 2
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', (req, res) => {
    res.json({
        success: true,
        data: sipAccounts,
        total: sipAccounts.length
    });
});

// POST /api/sip - создание нового SIP аккаунта
/**
 * @swagger
 * /api/sip:
 *   post:
 *     summary: Create a new SIP account
 *     tags: [SIP Accounts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SIPAccount'
 *     responses:
 *       201:
 *         description: SIP account created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SIPAccount'
 *                 message:
 *                   type: string
 *                   example: SIP account created successfully
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: SIP account already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const { id, password, context = 'internal', codecs = 'ulaw,alaw' } = req.body;

        if (!id || !password) {
            return res.status(400).json({
                success: false,
                error: 'ID and password are required'
            });
        }

        // Проверка на дубликат
        const existingAccount = sipAccounts.find(account => account.id === id);
        if (existingAccount) {
            return res.status(409).json({
                success: false,
                error: `SIP account with ID ${id} already exists`
            });
        }

        const newAccount = {
            id,
            username: id,
            password,
            context,
            codecs,
            status: 'active',
            createdAt: new Date(),
            createdBy: req.user.username
        };

        // Создаем снапшот перед изменениями
        await snapshotService.createSnapshot(
            `Create SIP account: ${id}`,
            req.user.username
        );

        // Добавляем аккаунт
        sipAccounts.push(newAccount);

        // Генерируем и сохраняем конфиг
        await pjsipGenerator.savePJSIPConfig(sipAccounts);

        // Релоад PJSIP в Asterisk
        try {
            await asteriskAMIService.reloadPJSIP();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        res.status(201).json({
            success: true,
            data: newAccount,
            message: 'SIP account created successfully'
        });

    } catch (error) {
        console.error('Create SIP account error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create SIP account'
        });
    }
});

// GET /api/sip/:id - получение конкретного SIP аккаунта
/**
 * @swagger
 * /api/sip/{id}:
 *   get:
 *     summary: Get SIP account by ID
 *     tags: [SIP Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SIP account ID
 *     responses:
 *       200:
 *         description: SIP account details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SIPAccount'
 *       404:
 *         description: SIP account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', (req, res) => {
    const account = sipAccounts.find(acc => acc.id === req.params.id);

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
});

// PUT /api/sip/:id - обновление SIP аккаунта
/**
 * @swagger
 * /api/sip/{id}:
 *   put:
 *     summary: Update SIP account
 *     tags: [SIP Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SIP account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SIPAccount'
 *     responses:
 *       200:
 *         description: SIP account updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SIPAccount'
 *                 message:
 *                   type: string
 *                   example: SIP account updated successfully
 *       404:
 *         description: SIP account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', requireRole(['admin', 'operator']), async (req, res) => {
    try {
        const accountIndex = sipAccounts.findIndex(acc => acc.id === req.params.id);

        if (accountIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'SIP account not found'
            });
        }

        const { password, context, codecs, status } = req.body;

        // Создаем снапшот перед изменениями
        await snapshotService.createSnapshot(
            `Update SIP account: ${req.params.id}`,
            req.user.username
        );

        // Обновляем только разрешенные поля
        if (password) sipAccounts[accountIndex].password = password;
        if (context) sipAccounts[accountIndex].context = context;
        if (codecs) sipAccounts[accountIndex].codecs = codecs;
        if (status) sipAccounts[accountIndex].status = status;

        sipAccounts[accountIndex].updatedAt = new Date();
        sipAccounts[accountIndex].updatedBy = req.user.username;

        // Генерируем и сохраняем обновленный конфиг
        await pjsipGenerator.savePJSIPConfig(sipAccounts);

        // Релоад PJSIP в Asterisk
        try {
            await asteriskAMIService.reloadPJSIP();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        res.json({
            success: true,
            data: sipAccounts[accountIndex],
            message: 'SIP account updated successfully'
        });

    } catch (error) {
        console.error('Update SIP account error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update SIP account'
        });
    }
});

// DELETE /api/sip/:id - удаление SIP аккаунта
/**
 * @swagger
 * /api/sip/{id}:
 *   delete:
 *     summary: Delete SIP account
 *     tags: [SIP Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: SIP account ID
 *     responses:
 *       200:
 *         description: SIP account deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SIPAccount'
 *                 message:
 *                   type: string
 *                   example: SIP account deleted successfully
 *       404:
 *         description: SIP account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', requireRole(['admin']), async (req, res) => {
    try {
        const accountIndex = sipAccounts.findIndex(acc => acc.id === req.params.id);

        if (accountIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'SIP account not found'
            });
        }

        // Создаем снапшот перед удалением
        await snapshotService.createSnapshot(
            `Delete SIP account: ${req.params.id}`,
            req.user.username
        );

        const deletedAccount = sipAccounts.splice(accountIndex, 1)[0];

        // Генерируем и сохраняем обновленный конфиг
        await pjsipGenerator.savePJSIPConfig(sipAccounts);

        // Релоад PJSIP в Asterisk
        try {
            await asteriskAMIService.reloadPJSIP();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        res.json({
            success: true,
            data: deletedAccount,
            message: 'SIP account deleted successfully'
        });

    } catch (error) {
        console.error('Delete SIP account error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete SIP account'
        });
    }
});

// Вспомогательная функция для получения SIP аккаунтов из других модулей
function getSIPAccounts() {
    return sipAccounts;
}

// Экспортируем функцию
router.getSIPAccounts = getSIPAccounts;

module.exports = router;