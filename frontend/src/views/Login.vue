<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
    <div class="card w-full max-w-md fade-in">
      <div class="p-8">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span class="text-white font-bold text-2xl">AG</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">Asterisk GUI</h1>
          <p class="text-gray-600 mt-2">Please sign in to continue</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label class="form-label">Username</label>
            <input
                v-model="form.username"
                type="text"
                class="form-input"
                placeholder="Enter your username"
                required
            >
          </div>

          <div>
            <label class="form-label">Password</label>
            <input
                v-model="form.password"
                type="password"
                class="form-input"
                placeholder="Enter your password"
                required
            >
          </div>

          <button
              type="submit"
              class="btn btn-primary w-full py-3"
              :disabled="loading"
          >
            <span v-if="loading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
            <span v-else>Sign In</span>
          </button>

          <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-red-800 text-sm">{{ error }}</span>
            </div>
          </div>
        </form>

        <div class="mt-8 pt-6 border-t border-gray-200">
          <div class="text-center text-sm text-gray-600">
            <p>Default credentials:</p>
            <p class="font-mono mt-1">admin / password123</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'Login',
  setup() {
    const authStore = useAuthStore()
    const router = useRouter()

    const form = ref({
      username: '',
      password: ''
    })

    const loading = ref(false)
    const error = ref('')

    const handleLogin = async () => {
      loading.value = true
      error.value = ''

      const result = await authStore.login(form.value)

      if (result.success) {
        router.push('/')
      } else {
        error.value = result.error
      }

      loading.value = false
    }

    return {
      form,
      loading,
      error,
      handleLogin
    }
  }
}
</script>