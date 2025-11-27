import { useAuthStore } from './auth'

export async function initializeStores() {
    const authStore = useAuthStore()
    await authStore.initialize()
    return { authStore }
}