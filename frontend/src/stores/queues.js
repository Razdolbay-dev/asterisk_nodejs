import { defineStore } from 'pinia'
import { queuesAPI } from '@/services/api'

export const useQueuesStore = defineStore('queues', {
    state: () => ({
        queues: [],
        stats: {
            total: 0,
            totalMembers: 0,
            averageMembers: 0
        },
        loading: false,
        error: null
    }),

    getters: {
        totalQueues: (state) => state.queues.length,
        queueById: (state) => (id) => state.queues.find(queue => queue.id === id)
    },

    actions: {
        async fetchQueues() {
            this.loading = true
            this.error = null

            try {
                const response = await queuesAPI.getQueues()
                if (response.data.success) {
                    this.queues = response.data.data
                }
            } catch (error) {
                this.error = error.response?.data?.error || 'Failed to fetch queues'
                console.error('Fetch queues error:', error)
            } finally {
                this.loading = false
            }
        },

        async fetchStats() {
            try {
                const response = await queuesAPI.getQueuesStats()
                if (response.data.success) {
                    this.stats = response.data.data
                }
            } catch (error) {
                console.error('Fetch queue stats error:', error)
            }
        },

        async createQueue(queueData) {
            try {
                const response = await queuesAPI.createQueue(queueData)
                if (response.data.success) {
                    this.queues.push(response.data.data)
                    await this.fetchStats() // Обновляем статистику
                    return { success: true, data: response.data.data }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to create queue'
                }
            }
        },

        async updateQueue(id, queueData) {
            try {
                const response = await queuesAPI.updateQueue(id, queueData)
                if (response.data.success) {
                    const index = this.queues.findIndex(queue => queue.id === id)
                    if (index !== -1) {
                        this.queues[index] = response.data.data
                    }
                    await this.fetchStats() // Обновляем статистику
                    return { success: true, data: response.data.data }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to update queue'
                }
            }
        },

        async deleteQueue(id) {
            try {
                const response = await queuesAPI.deleteQueue(id)
                if (response.data.success) {
                    this.queues = this.queues.filter(queue => queue.id !== id)
                    await this.fetchStats() // Обновляем статистику
                    return { success: true }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to delete queue'
                }
            }
        },

        async addMember(queueId, memberData) {
            try {
                const response = await queuesAPI.addMember(queueId, memberData)
                if (response.data.success) {
                    // Обновляем локальные данные
                    const queue = this.queues.find(q => q.id === queueId)
                    if (queue) {
                        queue.members = response.data.data.members
                        queue.updatedAt = new Date().toISOString()
                    }
                    await this.fetchStats() // Обновляем статистику
                    return { success: true }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to add member'
                }
            }
        },

        async removeMember(queueId, memberInterface) {
            try {
                const response = await queuesAPI.removeMember(queueId, memberInterface)
                if (response.data.success) {
                    // Обновляем локальные данные
                    const queue = this.queues.find(q => q.id === queueId)
                    if (queue) {
                        queue.members = queue.members.filter(m => m.interface !== memberInterface)
                        queue.updatedAt = new Date().toISOString()
                    }
                    await this.fetchStats() // Обновляем статистику
                    return { success: true }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to remove member'
                }
            }
        }
    }
})