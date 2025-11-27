// frontend/src/stores/auth.js
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
            console.log('🔐 Auth store initialization complete:', {
                isAuthenticated: this.isAuthenticated,
                user: this.user
            })
        },

        async login(credentials) {
            try {
                console.log('🔐 Attempting login for user:', credentials.username)
                const response = await authAPI.login(credentials)
                console.log('📥 Login response:', response.data)

                if (response.data.success) {
                    const { token, user } = response.data.data

                    this.token = token
                    this.user = user

                    // Сохраняем в localStorage
                    localStorage.setItem('auth_token', this.token)
                    localStorage.setItem('user', JSON.stringify(this.user))

                    console.log('✅ Login successful:', {
                        username: user.username,
                        role: user.role,
                        token: token ? 'present' : 'missing'
                    })

                    return { success: true }
                } else {
                    console.error('❌ Login failed - success false:', response.data)
                    return {
                        success: false,
                        error: response.data.error || 'Login failed'
                    }
                }
            } catch (error) {
                console.error('❌ Login error:', error)
                const errorMessage = error.response?.data?.error || error.message || 'Login failed'
                return {
                    success: false,
                    error: errorMessage
                }
            }
        },

        async checkAuth() {
            if (!this.token) {
                console.log('🔐 No token available for auth check')
                return false
            }

            try {
                console.log('🔐 Checking authentication...')
                const response = await authAPI.getMe()
                console.log('📥 Auth check response:', response.data)

                if (response.data.success) {
                    this.user = response.data.data
                    // Обновляем localStorage
                    localStorage.setItem('user', JSON.stringify(this.user))
                    console.log('✅ Auth check successful:', this.user.username)
                    return true
                } else {
                    console.error('❌ Auth check failed - success false')
                    this.logout()
                    return false
                }
            } catch (error) {
                console.error('❌ Auth check error:', error)
                this.logout()
                return false
            }
        },

        async refreshToken() {
            if (!this.token) {
                console.log('🔐 No token available for refresh')
                return false
            }

            try {
                console.log('🔐 Refreshing token...')
                const response = await authAPI.refresh()
                console.log('📥 Token refresh response:', response.data)

                if (response.data.success) {
                    this.token = response.data.data.token
                    localStorage.setItem('auth_token', this.token)
                    console.log('✅ Token refreshed successfully')
                    return true
                } else {
                    console.error('❌ Token refresh failed - success false')
                    this.logout()
                    return false
                }
            } catch (error) {
                console.error('❌ Token refresh error:', error)
                this.logout()
                return false
            }
        },

        async logout() {
            try {
                console.log('🔐 Logging out...')
                await authAPI.logout()
            } catch (error) {
                console.error('❌ Logout API error:', error)
                // Ignore errors on logout
            } finally {
                this.clearAuth()
                console.log('✅ Logout completed')
            }
        },

        clearAuth() {
            console.log('🔐 Clearing auth data...')
            this.token = null
            this.user = null
            this._initialized = true
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user')
            console.log('✅ Auth data cleared')
        }
    }
})