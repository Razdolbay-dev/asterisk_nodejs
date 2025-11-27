const storageService = require('./storage.service');
const auditService = require('./audit.service');
const trunksGenerator = require('./config/trunks.generator');
const snapshotService = require('./config/snapshot.service');
const asteriskAMIService = require('./asterisk/ami.service');
const sipService = require('./sip.service');

class TrunkService {
    constructor() {
        this.trunks = [];
        this.initializeFromStorage();
    }

    async initializeFromStorage() {
        try {
            this.trunks = await storageService.getCollection('trunks');
            console.log(`✅ Loaded ${this.trunks.length} trunks from storage`);
        } catch (error) {
            console.error('❌ Failed to load trunks from storage:', error);
            await this.initializeDefaultTrunks();
        }
    }

    async saveToStorage() {
        try {
            await storageService.saveCollection('trunks', this.trunks);
            console.log(`💾 Saved ${this.trunks.length} trunks to storage`);
        } catch (error) {
            console.error('❌ Failed to save trunks to storage:', error);
            throw error;
        }
    }

    async initializeDefaultTrunks() {
        this.trunks = await storageService.readFile('trunks.json');
        await this.saveToStorage();
    }

    async findAll() {
        return this.trunks;
    }

    async findById(id) {
        return this.trunks.find(trunk => trunk.id === id);
    }

    async create(trunkData, createdBy) {
        const existingTrunk = this.trunks.find(trunk => trunk.id === trunkData.id);
        if (existingTrunk) {
            throw new Error(`Trunk with ID ${trunkData.id} already exists`);
        }

        const newTrunk = {
            ...trunkData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: createdBy,
            updatedBy: createdBy
        };

        this.trunks.push(newTrunk);
        await this.saveToStorage();

        // Создаем снапшот после создания
        await snapshotService.createSnapshot(
            `Create trunk: ${newTrunk.name} (${newTrunk.id})`,
            createdBy
        );

        // Генерируем и сохраняем конфиг
        await this.generateAndSaveConfig();

        // Релоад PJSIP в Asterisk
        try {
            await asteriskAMIService.reloadPJSIP();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        await auditService.log({
            action: 'TRUNK_CREATED',
            userId: createdBy,
            details: {
                trunkId: newTrunk.id,
                name: newTrunk.name,
                host: newTrunk.host
            },
            timestamp: new Date().toISOString()
        });

        return newTrunk;
    }

    async update(id, updates, updatedBy) {
        const trunkIndex = this.trunks.findIndex(trunk => trunk.id === id);
        if (trunkIndex === -1) {
            throw new Error('Trunk not found');
        }

        // Обновляем разрешенные поля
        const allowedFields = [
            'name', 'host', 'port', 'username', 'password', 'fromuser',
            'fromdomain', 'context', 'qualify', 'qualify_frequency',
            'insecure', 'protocol', 'register', 'status'
        ];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                this.trunks[trunkIndex][field] = updates[field];
            }
        });

        this.trunks[trunkIndex].updatedAt = new Date().toISOString();
        this.trunks[trunkIndex].updatedBy = updatedBy;

        await this.saveToStorage();

        // Создаем снапшот после обновления
        await snapshotService.createSnapshot(
            `Update trunk: ${this.trunks[trunkIndex].name} (${id})`,
            updatedBy
        );

        // Генерируем и сохраняем конфиг
        await this.generateAndSaveConfig();

        // Релоад PJSIP в Asterisk
        try {
            await asteriskAMIService.reloadPJSIP();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        await auditService.log({
            action: 'TRUNK_UPDATED',
            userId: updatedBy,
            details: {
                trunkId: id,
                name: this.trunks[trunkIndex].name,
                changes: updates
            },
            timestamp: new Date().toISOString()
        });

        return this.trunks[trunkIndex];
    }

    async delete(id, deletedBy) {
        const trunkIndex = this.trunks.findIndex(trunk => trunk.id === id);
        if (trunkIndex === -1) {
            throw new Error('Trunk not found');
        }

        const deletedTrunk = this.trunks.splice(trunkIndex, 1)[0];
        await this.saveToStorage();

        // Создаем снапшот после удаления
        await snapshotService.createSnapshot(
            `Delete trunk: ${deletedTrunk.name} (${id})`,
            deletedBy
        );

        // Генерируем и сохраняем конфиг
        await this.generateAndSaveConfig();

        // Релоад PJSIP в Asterisk
        try {
            await asteriskAMIService.reloadPJSIP();
        } catch (amiError) {
            console.warn('⚠️ AMI reload failed, but config was saved:', amiError.message);
        }

        await auditService.log({
            action: 'TRUNK_DELETED',
            userId: deletedBy,
            details: {
                trunkId: id,
                name: deletedTrunk.name
            },
            timestamp: new Date().toISOString()
        });

        return deletedTrunk;
    }

    async generateAndSaveConfig() {
        try {
            // Получаем SIP аккаунты из SIP service
            const sipAccounts = sipService.getSIPAccounts();

            // Генерируем полный конфиг с SIP аккаунтами и транками
            await trunksGenerator.saveFullPJSIPConfig(sipAccounts, this.trunks);
        } catch (error) {
            console.error('❌ Failed to generate trunk config:', error);
            throw error;
        }
    }

    async getStats() {
        const activeTrunks = this.trunks.filter(trunk => trunk.status === 'active');
        const registeredTrunks = this.trunks.filter(trunk => trunk.register === 'yes');

        return {
            total: this.trunks.length,
            active: activeTrunks.length,
            registered: registeredTrunks.length,
            registrationRate: this.trunks.length > 0 ?
                ((registeredTrunks.length / this.trunks.length) * 100).toFixed(1) + '%' : '0%'
        };
    }

    // Получение транков для других модулей
    getTrunks() {
        return this.trunks;
    }
}

module.exports = new TrunkService();