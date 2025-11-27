const storageService = require('./storage.service');
const auditService = require('./audit.service');

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
            createdBy: createdBy
        };

        this.trunks.push(newTrunk);
        await this.saveToStorage();

        await auditService.log({
            action: 'TRUNK_CREATED',
            userId: createdBy,
            details: { trunkId: newTrunk.id, name: newTrunk.name },
            timestamp: new Date().toISOString()
        });

        return newTrunk;
    }

    async update(id, updates, updatedBy) {
        const trunkIndex = this.trunks.findIndex(trunk => trunk.id === id);
        if (trunkIndex === -1) {
            throw new Error('Trunk not found');
        }

        const oldTrunk = { ...this.trunks[trunkIndex] };

        // Обновляем разрешенные поля
        const allowedFields = ['name', 'host', 'port', 'username', 'password', 'fromuser', 'fromdomain', 'context', 'qualify', 'qualify_frequency', 'insecure', 'protocol', 'register', 'status'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                this.trunks[trunkIndex][field] = updates[field];
            }
        });

        this.trunks[trunkIndex].updatedAt = new Date().toISOString();
        this.trunks[trunkIndex].updatedBy = updatedBy;

        await this.saveToStorage();

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

        await auditService.log({
            action: 'TRUNK_DELETED',
            userId: deletedBy,
            details: { trunkId: id, name: deletedTrunk.name },
            timestamp: new Date().toISOString()
        });

        return deletedTrunk;
    }

    async getStats() {
        return {
            total: this.trunks.length,
            active: this.trunks.filter(trunk => trunk.status === 'active').length,
            registered: this.trunks.filter(trunk => trunk.register === 'yes').length
        };
    }
}

module.exports = new TrunkService();