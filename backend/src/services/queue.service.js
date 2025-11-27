const storageService = require('./storage.service');
const auditService = require('./audit.service');

class QueueService {
    constructor() {
        this.queues = [];
        this.initializeFromStorage();
    }

    async initializeFromStorage() {
        try {
            this.queues = await storageService.getCollection('queues');
            console.log(`✅ Loaded ${this.queues.length} queues from storage`);
        } catch (error) {
            console.error('❌ Failed to load queues from storage:', error);
            await this.initializeDefaultQueues();
        }
    }

    async saveToStorage() {
        try {
            await storageService.saveCollection('queues', this.queues);
        } catch (error) {
            console.error('❌ Failed to save queues to storage:', error);
            throw error;
        }
    }

    async initializeDefaultQueues() {
        this.queues = await storageService.readFile('queues.json');
        await this.saveToStorage();
    }

    async findAll() {
        return this.queues;
    }

    async findById(id) {
        return this.queues.find(queue => queue.id === id);
    }

    async create(queueData, createdBy) {
        const existingQueue = this.queues.find(queue => queue.id === queueData.id);
        if (existingQueue) {
            throw new Error(`Queue with ID ${queueData.id} already exists`);
        }

        const newQueue = {
            ...queueData,
            createdAt: new Date().toISOString(),
            createdBy: createdBy
        };

        this.queues.push(newQueue);
        await this.saveToStorage();

        await auditService.log({
            action: 'QUEUE_CREATED',
            userId: createdBy,
            details: { queueId: newQueue.id, name: newQueue.name },
            timestamp: new Date().toISOString()
        });

        return newQueue;
    }

    async update(id, updates, updatedBy) {
        const queueIndex = this.queues.findIndex(queue => queue.id === id);
        if (queueIndex === -1) {
            throw new Error('Queue not found');
        }

        const oldQueue = { ...this.queues[queueIndex] };

        // Обновляем разрешенные поля
        const allowedFields = ['name', 'strategy', 'timeout', 'wrapuptime', 'maxlen', 'servicelevel', 'musicclass', 'announce', 'members'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                this.queues[queueIndex][field] = updates[field];
            }
        });

        this.queues[queueIndex].updatedAt = new Date().toISOString();
        this.queues[queueIndex].updatedBy = updatedBy;

        await this.saveToStorage();

        await auditService.log({
            action: 'QUEUE_UPDATED',
            userId: updatedBy,
            details: {
                queueId: id,
                name: this.queues[queueIndex].name,
                changes: updates
            },
            timestamp: new Date().toISOString()
        });

        return this.queues[queueIndex];
    }

    async delete(id, deletedBy) {
        const queueIndex = this.queues.findIndex(queue => queue.id === id);
        if (queueIndex === -1) {
            throw new Error('Queue not found');
        }

        const deletedQueue = this.queues.splice(queueIndex, 1)[0];
        await this.saveToStorage();

        await auditService.log({
            action: 'QUEUE_DELETED',
            userId: deletedBy,
            details: { queueId: id, name: deletedQueue.name },
            timestamp: new Date().toISOString()
        });

        return deletedQueue;
    }

    async addMember(queueId, memberData, addedBy) {
        const queue = await this.findById(queueId);
        if (!queue) {
            throw new Error('Queue not found');
        }

        const existingMember = queue.members.find(m => m.interface === memberData.interface);
        if (existingMember) {
            throw new Error('Member already exists in this queue');
        }

        queue.members.push({
            interface: memberData.interface,
            penalty: memberData.penalty || 0,
            membername: memberData.membername || memberData.interface
        });

        queue.updatedAt = new Date().toISOString();
        queue.updatedBy = addedBy;

        await this.saveToStorage();

        await auditService.log({
            action: 'QUEUE_MEMBER_ADDED',
            userId: addedBy,
            details: {
                queueId: queueId,
                member: memberData.interface
            },
            timestamp: new Date().toISOString()
        });

        return queue;
    }

    async removeMember(queueId, memberInterface, removedBy) {
        const queue = await this.findById(queueId);
        if (!queue) {
            throw new Error('Queue not found');
        }

        const memberIndex = queue.members.findIndex(m => m.interface === memberInterface);
        if (memberIndex === -1) {
            throw new Error('Member not found in this queue');
        }

        queue.members.splice(memberIndex, 1);
        queue.updatedAt = new Date().toISOString();
        queue.updatedBy = removedBy;

        await this.saveToStorage();

        await auditService.log({
            action: 'QUEUE_MEMBER_REMOVED',
            userId: removedBy,
            details: {
                queueId: queueId,
                member: memberInterface
            },
            timestamp: new Date().toISOString()
        });

        return queue;
    }

    async getStats() {
        return {
            total: this.queues.length,
            totalMembers: this.queues.reduce((sum, queue) => sum + queue.members.length, 0)
        };
    }
}

module.exports = new QueueService();