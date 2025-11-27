import { defineStore } from 'pinia'
import { trunksAPI } from '@/services/api'

export const useTrunksStore = defineStore('trunks', {
    state: () => ({
        trunks: [],
        stats: {
            total: 0,
            active: 0,
            registered: 0,
            registrationRate: '0%'
        },
        loading: false,
        error: null
    }),

    getters: {
        totalTrunks: (state) => state.trunks.length,
        activeTrunks: (state) => state.trunks.filter(trunk => trunk.status === 'active'),
        trunkById: (state) => (id) => state.trunks.find(trunk => trunk.id === id)
    },

    actions: {
        async fetchTrunks() {
            this.loading = true
            this.error = null

            try {
                const response = await trunksAPI.getTrunks()
                if (response.data.success) {
                    this.trunks = response.data.data
                    // Обновляем статистику из meta данных
                    if (response.data.meta) {
                        this.stats = {
                            total: response.data.meta.total,
                            active: response.data.meta.active,
                            registered: response.data.meta.registered,
                            registrationRate: response.data.meta.registrationRate
                        }
                    }
                }
            } catch (error) {
                this.error = error.response?.data?.error || 'Failed to fetch trunks'
                console.error('Fetch trunks error:', error)
            } finally {
                this.loading = false
            }
        },

        async fetchStats() {
            try {
                const response = await trunksAPI.getTrunksStats()
                if (response.data.success) {
                    this.stats = response.data.data
                }
            } catch (error) {
                console.error('Fetch trunk stats error:', error)
            }
        },

        async createTrunk(trunkData) {
            try {
                const response = await trunksAPI.createTrunk(trunkData)
                if (response.data.success) {
                    this.trunks.push(response.data.data)
                    await this.fetchStats() // Обновляем статистику
                    return { success: true, data: response.data.data }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to create trunk'
                }
            }
        },

        async updateTrunk(id, trunkData) {
            try {
                const response = await trunksAPI.updateTrunk(id, trunkData)
                if (response.data.success) {
                    const index = this.trunks.findIndex(trunk => trunk.id === id)
                    if (index !== -1) {
                        this.trunks[index] = response.data.data
                    }
                    await this.fetchStats() // Обновляем статистику
                    return { success: true, data: response.data.data }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to update trunk'
                }
            }
        },

        async deleteTrunk(id) {
            try {
                const response = await trunksAPI.deleteTrunk(id)
                if (response.data.success) {
                    this.trunks = this.trunks.filter(trunk => trunk.id !== id)
                    await this.fetchStats() // Обновляем статистику
                    return { success: true }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to delete trunk'
                }
            }
        }
    }
})