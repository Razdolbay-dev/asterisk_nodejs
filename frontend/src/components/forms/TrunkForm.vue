<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
      <!-- Заголовок -->
      <div class="p-6 border-b">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ isEditMode ? 'Edit Trunk' : 'Create New Trunk' }}
        </h3>
        <p class="text-sm text-gray-600 mt-1">
          {{ isEditMode ? 'Update trunk configuration' : 'Configure a new SIP trunk' }}
        </p>
      </div>

      <!-- Форма -->
      <form @submit.prevent="handleSubmit" class="p-6 overflow-y-auto max-h-[60vh]">
        <div class="space-y-6">
          <!-- Basic Information -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-4">Basic Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Trunk ID -->
              <div>
                <label for="id" class="block text-sm font-medium text-gray-700 mb-1">
                  Trunk ID *
                </label>
                <input
                    id="id"
                    v-model="formData.id"
                    type="text"
                    required
                    :disabled="isEditMode"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="e.g., provider-trunk"
                    pattern="[a-zA-Z0-9_-]+"
                    title="Only letters, numbers, hyphens and underscores allowed"
                >
                <p class="text-xs text-gray-500 mt-1">
                  Unique identifier for the trunk
                </p>
              </div>

              <!-- Trunk Name -->
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                  Trunk Name *
                </label>
                <input
                    id="name"
                    v-model="formData.name"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Main Provider Trunk"
                >
              </div>
            </div>
          </div>

          <!-- Connection Settings -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-4">Connection Settings</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Host -->
              <div>
                <label for="host" class="block text-sm font-medium text-gray-700 mb-1">
                  Host *
                </label>
                <input
                    id="host"
                    v-model="formData.host"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., sip.provider.com"
                >
              </div>

              <!-- Port -->
              <div>
                <label for="port" class="block text-sm font-medium text-gray-700 mb-1">
                  Port *
                </label>
                <input
                    id="port"
                    v-model.number="formData.port"
                    type="number"
                    min="1"
                    max="65535"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <p class="text-xs text-gray-500 mt-1">
                  SIP port (default: 5060)
                </p>
              </div>

              <!-- Username -->
              <div>
                <label for="username" class="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                    id="username"
                    v-model="formData.username"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., your_username"
                >
              </div>

              <!-- Password -->
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                    id="password"
                    v-model="formData.password"
                    type="password"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
                >
              </div>
            </div>
          </div>

          <!-- Advanced Settings -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-4">Advanced Settings</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- From User -->
              <div>
                <label for="fromuser" class="block text-sm font-medium text-gray-700 mb-1">
                  From User
                </label>
                <input
                    id="fromuser"
                    v-model="formData.fromuser"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., from_username"
                >
                <p class="text-xs text-gray-500 mt-1">
                  Username for From header
                </p>
              </div>

              <!-- From Domain -->
              <div>
                <label for="fromdomain" class="block text-sm font-medium text-gray-700 mb-1">
                  From Domain
                </label>
                <input
                    id="fromdomain"
                    v-model="formData.fromdomain"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., yourdomain.com"
                >
                <p class="text-xs text-gray-500 mt-1">
                  Domain for From header
                </p>
              </div>

              <!-- Context -->
              <div>
                <label for="context" class="block text-sm font-medium text-gray-700 mb-1">
                  Context *
                </label>
                <input
                    id="context"
                    v-model="formData.context"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., from-trunk"
                >
                <p class="text-xs text-gray-500 mt-1">
                  Dialplan context for incoming calls
                </p>
              </div>

              <!-- Protocol -->
              <div>
                <label for="protocol" class="block text-sm font-medium text-gray-700 mb-1">
                  Protocol *
                </label>
                <select
                    id="protocol"
                    v-model="formData.protocol"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="udp">UDP</option>
                  <option value="tcp">TCP</option>
                  <option value="tls">TLS</option>
                  <option value="ws">WebSocket</option>
                  <option value="wss">WebSocket Secure</option>
                </select>
              </div>

              <!-- Qualify -->
              <div>
                <label for="qualify" class="block text-sm font-medium text-gray-700 mb-1">
                  Qualify
                </label>
                <select
                    id="qualify"
                    v-model="formData.qualify"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">
                  Enable peer qualification
                </p>
              </div>

              <!-- Qualify Frequency -->
              <div>
                <label for="qualify_frequency" class="block text-sm font-medium text-gray-700 mb-1">
                  Qualify Frequency (seconds)
                </label>
                <input
                    id="qualify_frequency"
                    v-model.number="formData.qualify_frequency"
                    type="number"
                    min="10"
                    max="300"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <p class="text-xs text-gray-500 mt-1">
                  How often to qualify peer (10-300)
                </p>
              </div>

              <!-- Insecure -->
              <div>
                <label for="insecure" class="block text-sm font-medium text-gray-700 mb-1">
                  Insecure
                </label>
                <select
                    id="insecure"
                    v-model="formData.insecure"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="invite,port">invite,port</option>
                  <option value="port">port</option>
                  <option value="invite">invite</option>
                  <option value="no">No</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">
                  Insecure parameters for authentication
                </p>
              </div>

              <!-- Register -->
              <div>
                <label for="register" class="block text-sm font-medium text-gray-700 mb-1">
                  Register
                </label>
                <select
                    id="register"
                    v-model="formData.register"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">
                  Enable registration with provider
                </p>
              </div>

              <!-- Status -->
              <div>
                <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                    id="status"
                    v-model="formData.status"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Ошибки -->
        <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>
      </form>

      <!-- Футер -->
      <div class="p-6 border-t bg-gray-50 flex justify-between">
        <button
            type="button"
            @click="close"
            class="btn btn-secondary"
        >
          Cancel
        </button>
        <button
            type="submit"
            @click="handleSubmit"
            :disabled="loading"
            class="btn btn-primary"
        >
          <span v-if="loading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ isEditMode ? 'Updating...' : 'Creating...' }}
          </span>
          <span v-else>
            {{ isEditMode ? 'Update Trunk' : 'Create Trunk' }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, watch, computed } from 'vue'
import { useTrunksStore } from '@/stores/trunks'

export default {
  name: 'TrunkForm',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    trunk: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'success'],
  setup(props, { emit }) {
    const trunksStore = useTrunksStore()

    const loading = ref(false)
    const error = ref('')

    const defaultFormData = {
      id: '',
      name: '',
      type: 'peer',
      host: '',
      port: 5060,
      username: '',
      password: '',
      fromuser: '',
      fromdomain: '',
      context: 'from-trunk',
      qualify: 'yes',
      qualify_frequency: 60,
      insecure: 'invite,port',
      protocol: 'udp',
      register: 'no',
      status: 'active'
    }

    const formData = reactive({ ...defaultFormData })

    const isEditMode = computed(() => !!props.trunk)

    // Сбрасываем форму при открытии/закрытии
    watch(() => props.visible, (visible) => {
      if (visible) {
        resetForm()
        if (props.trunk) {
          Object.assign(formData, { ...props.trunk })
        }
      }
    })

    const resetForm = () => {
      Object.assign(formData, defaultFormData)
      error.value = ''
      loading.value = false
    }

    const close = () => {
      emit('close')
    }

    const validateForm = () => {
      if (!formData.id.trim()) {
        return 'Trunk ID is required'
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(formData.id)) {
        return 'Trunk ID can only contain letters, numbers, hyphens and underscores'
      }

      if (!formData.name.trim()) {
        return 'Trunk name is required'
      }

      if (!formData.host.trim()) {
        return 'Host is required'
      }

      if (!formData.username.trim()) {
        return 'Username is required'
      }

      if (!formData.password.trim()) {
        return 'Password is required'
      }

      if (formData.port < 1 || formData.port > 65535) {
        return 'Port must be between 1 and 65535'
      }

      if (formData.qualify_frequency < 10 || formData.qualify_frequency > 300) {
        return 'Qualify frequency must be between 10 and 300 seconds'
      }

      return null
    }

    const handleSubmit = async () => {
      error.value = ''

      const validationError = validateForm()
      if (validationError) {
        error.value = validationError
        return
      }

      loading.value = true

      try {
        let result
        if (isEditMode.value) {
          result = await trunksStore.updateTrunk(props.trunk.id, formData)
        } else {
          result = await trunksStore.createTrunk(formData)
        }

        if (result.success) {
          emit('success', result.data)
          close()
        } else {
          error.value = result.error
        }
      } catch (err) {
        error.value = 'An unexpected error occurred'
        console.error('Trunk form error:', err)
      } finally {
        loading.value = false
      }
    }

    return {
      formData,
      loading,
      error,
      isEditMode,
      close,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.btn {
  @apply px-4 py-2 rounded-md font-medium text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500;
}
</style>