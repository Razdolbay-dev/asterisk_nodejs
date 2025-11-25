import { defineStore } from 'pinia'
import { authAPI } from '@/services/api'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        token: localStorage.getItem('auth_token') || null,
        _initialized: false
    }),

    getters: {
        isAuthenticated: (state) => !!state.token && !!state.user,
        userRole: (state) => state.user?.role || null,
        userName: (state) => state.user?.username || null,
        isInitialized: (state) => state._initialized
    },

    actions: {
        // Синхронная инициализация из localStorage
        initialize() {
            const token = localStorage.getItem('auth_token')
            const user = localStorage.getItem('user')

            if (token && user) {
                this.token = token
                try {
                    this.user = JSON.parse(user)
                    console.log('✅ Auth store initialized from localStorage:', {
                        username: this.user.username,
                        role: this.user.role
                    })
                } catch (error) {
                    console.error('❌ Failed to parse user data from localStorage:', error)
                    this.clearAuth()
                }
            }

            this._initialized = true
            return Promise.resolve()
        },

        async login(credentials) {
            try {
                const response = await authAPI.login(credentials)

                if (response.data.success) {
                    this.token = response.data.token
                    this.user = response.data.user

                    // Сохраняем в localStorage
                    localStorage.setItem('auth_token', this.token)
                    localStorage.setItem('user', JSON.stringify(this.user))

                    return { success: true }
                }
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.error || 'Login failed'
                }
            }
        },

        async checkAuth() {
            if (!this.token) return false

            try {
                const response = await authAPI.getMe()
                if (response.data.success) {
                    this.user = response.data.user
                    // Обновляем localStorage
                    localStorage.setItem('user', JSON.stringify(this.user))
                    return true
                }
            } catch (error) {
                this.logout()
                return false
            }
        },

        async refreshToken() {
            try {
                const response = await authAPI.refresh()
                if (response.data.success) {
                    this.token = response.data.token
                    localStorage.setItem('auth_token', this.token)
                    return true
                }
            } catch (error) {
                this.logout()
                return false
            }
        },

        async logout() {
            try {
                await authAPI.logout()
            } catch (error) {
                // Ignore errors on logout
            } finally {
                this.clearAuth()
            }
        },

        clearAuth() {
            this.token = null
            this.user = null
            this._initialized = true
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user')
        }
    }
})