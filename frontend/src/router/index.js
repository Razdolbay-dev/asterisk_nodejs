import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/sip',
        name: 'SIPAccounts',
        component: () => import('@/views/SIPAccounts.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/queues',
        name: 'Queues',
        component: () => import('@/views/Queues.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/trunks',
        name: 'Trunks',
        component: () => import('@/views/Trunks.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/config',
        name: 'ConfigManager',
        component: () => import('@/views/ConfigManager.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { requiresAuth: true, requiredRole: 'admin' }
    },
    {
        path: '/audit',
        name: 'AuditLog',
        component: () => import('@/views/AuditLog.vue'),
        meta: { requiresAuth: true, requiredRole: 'admin' }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    console.log('🔐 Navigation guard triggered:', {
        to: to.path,
        requiresAuth: to.meta.requiresAuth,
        isAuthenticated: authStore.isAuthenticated,
        isInitialized: authStore.isInitialized
    })

    // Если стор еще не инициализирован, инициализируем его
    if (!authStore.isInitialized) {
        console.log('🔐 Initializing auth store...')
        await authStore.initialize()
    }

    // Если маршрут требует аутентификации
    if (to.meta.requiresAuth) {
        if (authStore.isAuthenticated) {
            console.log('✅ User is authenticated, allowing access')
            next()
        } else {
            console.log('🚫 User not authenticated, redirecting to login')
            next('/login')
        }
    } else {
        // Если маршрут не требует аутентификации (например, login)
        if (to.path === '/login' && authStore.isAuthenticated) {
            console.log('✅ User already authenticated, redirecting to dashboard')
            next('/')
        } else {
            console.log('✅ Allowing access to public route')
            next()
        }
    }
})

export default router