import { defineStore } from 'pinia'
import { trunksAPI } from '@/services/api'

export const useTrunksStore = defineStore('trunks', {
    state: () => ({
        trunks: [],
        loading: false,
        error: null
    }),

    getters: {
        totalTrunks: (state) => state.trunks.length,
        activeTrunks: (state) => state.trunks.filter(trunk => trunk.status === 'active')
    },

    actions: {
        async fetchTrunks() {
            this.loading = true
            this.error = null

            try {
                const response = await trunksAPI.getTrunks()
                if (response.data.success) {
                    this.trunks = response.data.data
                }
            } catch (error) {
                this.error = error.response?.data?.error || 'Failed to fetch trunks'
            } finally {
                this.loading = false
            }
        },

        async createTrunk(trunkData) {
            try {
                const response = await trunksAPI.createTrunk(trunkData)
                if (response.data.success) {
                    this.trunks.push(response.data.data)
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