import { defineStore } from 'pinia'
import { configAPI } from '@/services/api'

export const useConfigStore = defineStore('config', {
    state: () => ({
        configFiles: [],
        currentFile: null,
        loading: false,
        error: null
    }),

    actions: {
        async fetchConfigFiles() {
            this.loading = true
            this.error = null

            try {
                const response = await configAPI.getRawConfigFiles()
                if (response.data.success) {
                    this.configFiles = response.data.data
                }
            } catch (error) {
                this.error = error.response?.data?.error || 'Failed to fetch config files'
            } finally {
                this.loading = false
            }
        },

        async fetchConfigFile(filename) {
            this.loading = true
            this.error = null

            try {
                const response = await configAPI.getRawConfigFile(filename)
                if (response.data.success) {
                    this.currentFile = response.data.data
                }
            } catch (error) {
                this.error = error.response?.data?.error || 'Failed to fetch config file'
                throw error
            } finally {
                this.loading = false
            }
        },

        async updateConfigFile(filename, content, comment = '') {
            try {
                const response = await configAPI.updateRawConfigFile(filename, { content, comment })
                if (response.data.success) {
                    return { success: true, data: response.data.data }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to update config file'
                }
            }
        },

        async deleteConfigFile(filename) {
            try {
                const response = await configAPI.deleteRawConfigFile(filename)
                if (response.data.success) {
                    this.configFiles = this.configFiles.filter(file => file.name !== filename)
                    return { success: true }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to delete config file'
                }
            }
        },

        clearCurrentFile() {
            this.currentFile = null
        }
    }
})