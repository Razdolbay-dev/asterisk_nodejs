<template>
  <header class="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
    <div class="flex justify-between items-center px-6 h-16">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
          <span class="text-white font-bold text-sm">AG</span>
        </div>
        <h1 class="text-xl font-bold text-gray-900">Asterisk GUI</h1>
      </div>

      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2 text-sm bg-gray-50 px-3 py-1 rounded-lg">
          <div class="w-2 h-2 bg-green-400 rounded-full"></div>
          <span class="text-gray-600">Connected</span>
        </div>
        <span class="text-gray-700 text-sm">Welcome, {{ userName }}</span>
        <button
            @click="logout"
            class="btn btn-outline border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 flex items-center space-x-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'Header',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()

    const userName = computed(() => authStore.userName)

    const logout = async () => {
      await authStore.logout()
      router.push('/login')
    }

    return {
      userName,
      logout
    }
  }
}
</script>