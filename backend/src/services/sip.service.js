const storageService = require('./storage.service');
const auditService = require('./audit.service');
const pjsipGenerator = require('./config/pjsip.generator');
const snapshotService = require('./config/snapshot.service');
const asteriskAMIService = require('./asterisk/ami.service');

class SIPService {
    constructor() {
        this.accounts = [];
        this.initializeFromStorage();
    }

    async initializeFromStorage() {
        try {
            this.accounts = await storageService.getCollection('sip_accounts');
            console.log(`✅ Loaded ${this.accounts.length} SIP accounts from storage`);
        } catch (error) {
            console.error('❌ Failed to load SIP accounts from storage:', error);
            await this.initializeDefaultAccounts();
        }
    }

    async saveToStorage() {
        try {
            await storageService.saveCollection('sip_accounts', this.accounts);
            console.log(`💾 Saved ${this.accounts.length} SIP accounts to storage`);
        } catch (error) {
            console.error('❌ Failed to save SIP accounts to storage:', error);
            throw error;
        }
    }

    async initializeDefaultAccounts() {
        this.accounts = await storageService.readFile('sip_accounts.json');
        await this.saveToStorage();
    }

    async findAll() {
        return this.accounts;
    }

    async findById(id) {
        return this.accounts.find(account => account.id === id);
    }

    async create(accountData, createdBy) {
        const existingAccount = this.accounts.find(acc => acc.id === accountData.id);
        if (existingAccount) {
            throw new Error(`SIP account with ID ${accountData.id} already exists`);
        }

        const newAccount = {
            ...accountData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: createdBy,
            updatedBy: createdBy
        };

        this.accounts.push(newAccount);
        await this.saveToStorage();

        // Создаем снапшот после создания
        await snapshotService.createSnapshot(
            `Create SIP account: ${newAccount.id}`,
            createdBy
        );

        // Генерируем и сохраняем конфиг
        await pjsipGenerator.savePJSIPConfig(this.accounts);

        // Релоад PJSIP в Asterisk
        try {
            await asteriskAMIService.reloadPJSIP();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        await auditService.log({
            action: 'SIP_ACCOUNT_CREATED',
            userId: createdBy,
            details: { accountId: newAccount.id },
            timestamp: new Date().toISOString()
        });

        return newAccount;
    }

    async update(id, updates, updatedBy) {
        const accountIndex = this.accounts.findIndex(acc => acc.id === id);
        if (accountIndex === -1) {
            throw new Error('SIP account not found');
        }

        const oldAccount = { ...this.accounts[accountIndex] };

        // Обновляем разрешенные поля
        const allowedFields = ['password', 'context', 'codecs', 'status', 'description', 'callerid'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                this.accounts[accountIndex][field] = updates[field];
            }
        });

        this.accounts[accountIndex].updatedAt = new Date().toISOString();
        this.accounts[accountIndex].updatedBy = updatedBy;

        await this.saveToStorage();

        // Создаем снапшот после обновления
        await snapshotService.createSnapshot(
            `Update SIP account: ${id}`,
            updatedBy
        );

        // Генерируем и сохраняем конфиг
        await pjsipGenerator.savePJSIPConfig(this.accounts);

        // Релоад PJSIP в Asterisk
        try {
            await asteriskAMIService.reloadPJSIP();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        await auditService.log({
            action: 'SIP_ACCOUNT_UPDATED',
            userId: updatedBy,
            details: {
                accountId: id,
                changes: updates
            },
            timestamp: new Date().toISOString()
        });

        return this.accounts[accountIndex];
    }

    async delete(id, deletedBy) {
        const accountIndex = this.accounts.findIndex(acc => acc.id === id);
        if (accountIndex === -1) {
            throw new Error('SIP account not found');
        }

        const deletedAccount = this.accounts.splice(accountIndex, 1)[0];
        await this.saveToStorage();

        // Создаем снапшот после удаления
        await snapshotService.createSnapshot(
            `Delete SIP account: ${id}`,
            deletedBy
        );

        // Генерируем и сохраняем конфиг
        await pjsipGenerator.savePJSIPConfig(this.accounts);

        // Релоад PJSIP в Asterisk
        try {
            await asteriskAMIService.reloadPJSIP();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        await auditService.log({
            action: 'SIP_ACCOUNT_DELETED',
            userId: deletedBy,
            details: { accountId: id },
            timestamp: new Date().toISOString()
        });

        return deletedAccount;
    }

    async getStats() {
        return {
            total: this.accounts.length,
            active: this.accounts.filter(acc => acc.status === 'active').length,
            offline: this.accounts.filter(acc => acc.status === 'offline').length
        };
    }

    // Получение аккаунтов для других модулей
    getSIPAccounts() {
        return this.accounts;
    }
}

module.exports = new SIPService();