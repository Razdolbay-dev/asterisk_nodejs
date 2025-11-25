import { defineStore } from 'pinia'
import { usersAPI } from '@/services/api'

export const useUsersStore = defineStore('users', {
    state: () => ({
        users: [],
        currentUser: null,
        loading: false,
        error: null,
        stats: null
    }),

    getters: {
        totalUsers: (state) => state.users.length,
        activeUsers: (state) => state.users.filter(user => user.isActive),
        usersByRole: (state) => {
            return state.users.reduce((acc, user) => {
                acc[user.role] = (acc[user.role] || 0) + 1
                return acc
            }, {})
        }
    },

    actions: {
        async fetchUsers() {
            this.loading = true
            this.error = null

            try {
                const response = await usersAPI.getUsers()
                if (response.data.success) {
                    this.users = response.data.data
                }
            } catch (error) {
                this.error = error.response?.data?.error || 'Failed to fetch users'
            } finally {
                this.loading = false
            }
        },

        async fetchUserStats() {
            try {
                const response = await usersAPI.getUserStats()
                if (response.data.success) {
                    this.stats = response.data.data
                }
            } catch (error) {
                console.error('Failed to fetch user stats:', error)
            }
        },

        async fetchUser(id) {
            this.loading = true
            this.error = null

            try {
                const response = await usersAPI.getUser(id)
                if (response.data.success) {
                    this.currentUser = response.data.data
                }
            } catch (error) {
                this.error = error.response?.data?.error || 'Failed to fetch user'
                throw error
            } finally {
                this.loading = false
            }
        },

        async createUser(userData) {
            try {
                const response = await usersAPI.createUser(userData)
                if (response.data.success) {
                    this.users.push(response.data.data)
                    return { success: true, data: response.data.data }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to create user'
                }
            }
        },

        async updateUser(id, userData) {
            try {
                const response = await usersAPI.updateUser(id, userData)
                if (response.data.success) {
                    const index = this.users.findIndex(user => user.id === id)
                    if (index !== -1) {
                        this.users[index] = response.data.data
                    }
                    return { success: true, data: response.data.data }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to update user'
                }
            }
        },

        async deleteUser(id) {
            try {
                const response = await usersAPI.deleteUser(id)
                if (response.data.success) {
                    this.users = this.users.filter(user => user.id !== id)
                    return { success: true }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to delete user'
                }
            }
        },

        async changePassword(id, passwordData) {
            try {
                const response = await usersAPI.changePassword(id, passwordData)
                if (response.data.success) {
                    return { success: true }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to change password'
                }
            }
        },

        async resetPassword(id, newPassword) {
            try {
                const response = await usersAPI.resetPassword(id, { newPassword })
                if (response.data.success) {
                    return { success: true, data: response.data.data }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to reset password'
                }
            }
        },

        async deactivateUser(id) {
            try {
                const response = await usersAPI.deactivateUser(id)
                if (response.data.success) {
                    const index = this.users.findIndex(user => user.id === id)
                    if (index !== -1) {
                        this.users[index] = response.data.data
                    }
                    return { success: true, data: response.data.data }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Failed to deactivate user'
                }
            }
        },

        clearCurrentUser() {
            this.currentUser = null
        }
    }
})