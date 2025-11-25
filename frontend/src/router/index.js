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
    }

]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Навигационный guard
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login')
    } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
        next('/')
    } else {
        next()
    }
})

export default router