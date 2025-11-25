import { defineStore } from 'pinia'
import { sipAPI } from '@/services/api'

export const useSipStore = defineStore('sip', {
    state: () => ({
        accounts: [],
        loading: false,
        error: null
    }),

    getters: {
        totalAccounts: (state) => state.accounts.length,
        activeAccounts: (state) => state.accounts.filter(acc => acc.status === 'active')
    },

    actions: {
        async fetchAccounts() {
            this.loading = true
            this.error = null

            try {
                const response = await sipAPI.getAccounts()
                if (response.data.success) {
                    this.accounts = response.data.data
                }
            } catch (error) {
                this.error = error.response?.data?.error || 'Failed to fetch SIP accounts'
            } finally {
                this.loading = false
            }
        },

        async createAccount(accountData) {
            try {
                const response = await sipAPI.createAccount(accountData)
                if (response.data.success) {
                    this.accounts.push(response.data.data)
                    return { success: true, data: response.data.data }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to create SIP account'
                }
            }
        },

        async updateAccount(id, accountData) {
            try {
                const response = await sipAPI.updateAccount(id, accountData)
                if (response.data.success) {
                    const index = this.accounts.findIndex(acc => acc.id === id)
                    if (index !== -1) {
                        this.accounts[index] = response.data.data
                    }
                    return { success: true, data: response.data.data }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to update SIP account'
                }
            }
        },

        async deleteAccount(id) {
            try {
                const response = await sipAPI.deleteAccount(id)
                if (response.data.success) {
                    this.accounts = this.accounts.filter(acc => acc.id !== id)
                    return { success: true }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to delete SIP account'
                }
            }
        }
    }
})