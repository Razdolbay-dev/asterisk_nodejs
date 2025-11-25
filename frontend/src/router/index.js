import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: { requiresGuest: true }
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

// Глобальный navigation guard
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // Ждем инициализации store если нужно
    if (!authStore.isInitialized) {
        console.log('🔄 Waiting for auth store initialization...')
        await authStore.initialize()
    }

    console.log('🔐 Navigation guard after initialization:', {
        to: to.path,
        requiresAuth: to.meta.requiresAuth,
        requiredRole: to.meta.requiredRole,
        isAuthenticated: authStore.isAuthenticated,
        userRole: authStore.userRole,
        user: authStore.user
    })

    // Проверяем требуется ли аутентификация
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        console.log('🚫 Redirecting to login: not authenticated')
        next('/login')
        return
    }

    // Проверяем требуется ли роль
    if (to.meta.requiredRole && authStore.isAuthenticated) {
        const userRole = authStore.userRole
        if (!userRole || !to.meta.requiredRole.includes(userRole)) {
            console.log('🚫 Insufficient role:', {
                required: to.meta.requiredRole,
                userRole
            })
            next('/')
            return
        }
    }

    // Проверяем требует ли страница гостевого доступа
    if (to.meta.requiresGuest && authStore.isAuthenticated) {
        console.log('🚫 Redirecting to dashboard: already authenticated')
        next('/')
        return
    }

    console.log('✅ Navigation allowed')
    next()
})

export default router