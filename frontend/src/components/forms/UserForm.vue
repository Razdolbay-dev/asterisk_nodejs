<template>
  <div>
    <!-- Modal Content -->
    <div class="p-6 overflow-y-auto">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="form-group">
          <label class="form-label">Username *</label>
          <input
              v-model="form.username"
              type="text"
              class="form-input"
              :disabled="isEdit"
              required
              placeholder="Enter username"
          >
        </div>

        <div class="form-group">
          <label class="form-label">Email *</label>
          <input
              v-model="form.email"
              type="email"
              class="form-input"
              required
              placeholder="user@example.com"
          >
        </div>

        <div class="form-group">
          <label class="form-label">Role *</label>
          <select v-model="form.role" class="form-input" required>
            <option value="viewer">Viewer</option>
            <option value="operator">Operator</option>
            <option value="admin">Administrator</option>
          </select>
          <div class="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-600">
            <div class="font-medium">{{ getRoleTitle(form.role) }}</div>
            <div>{{ getRoleDescription(form.role) }}</div>
          </div>
        </div>

        <div v-if="!isEdit" class="form-group">
          <label class="form-label">Password *</label>
          <input
              v-model="form.password"
              type="password"
              class="form-input"
              required
              minlength="6"
              placeholder="At least 6 characters"
          >
          <p class="text-xs text-gray-500 mt-1">
            Password must be at least 6 characters long
          </p>
        </div>

        <div v-if="isEdit" class="form-group">
          <label class="flex items-center space-x-2 p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
            <input
                v-model="form.isActive"
                type="checkbox"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            >
            <span class="text-sm text-gray-700">Active user account</span>
          </label>
          <p class="text-xs text-gray-500 mt-1">
            Inactive users cannot log into the system
          </p>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="error-message">
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ error }}
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex space-x-3 pt-4 border-t border-gray-200">
          <button
              type="button"
              @click="$emit('close')"
              class="btn btn-secondary flex-1"
              :disabled="loading"
          >
            Cancel
          </button>
          <button
              type="submit"
              class="btn btn-primary flex-1"
              :disabled="loading || !isFormValid"
          >
            <span v-if="loading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
            <span v-else>
              {{ isEdit ? 'Update User' : 'Create User' }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, watch, computed } from 'vue'

export default {
  name: 'UserForm',
  props: {
    user: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    }
  },
  emits: ['close', 'submit'],
  setup(props, { emit }) {
    const isEdit = ref(false)

    const form = ref({
      username: '',
      email: '',
      role: 'viewer',
      password: '',
      isActive: true
    })

    const isFormValid = computed(() => {
      if (!form.value.username || !form.value.email || !form.value.role) {
        return false
      }
      if (!isEdit.value && (!form.value.password || form.value.password.length < 6)) {
        return false
      }
      return true
    })

    const resetForm = () => {
      form.value = {
        username: '',
        email: '',
        role: 'viewer',
        password: '',
        isActive: true
      }
    }

    const handleSubmit = () => {
      if (!isFormValid.value) return

      const submitData = { ...form.value }

      // Для редактирования не отправляем пароль если он не менялся
      if (isEdit.value) {
        delete submitData.password
      }

      emit('submit', submitData)
    }

    const getRoleTitle = (role) => {
      const titles = {
        admin: 'Administrator',
        operator: 'Operator',
        viewer: 'Viewer'
      }
      return titles[role] || role
    }

    const getRoleDescription = (role) => {
      const descriptions = {
        admin: 'Full access to all features and user management',
        operator: 'Can manage SIP accounts, queues, trunks but cannot edit raw configs',
        viewer: 'Read-only access to view system status and configurations'
      }
      return descriptions[role] || ''
    }

    watch(() => props.user, (newUser) => {
      if (newUser) {
        // Edit mode
        isEdit.value = true
        form.value = {
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          password: '',
          isActive: newUser.isActive
        }
      } else {
        // Create mode
        isEdit.value = false
        resetForm()
      }
    }, { immediate: true })

    return {
      form,
      isEdit,
      isFormValid,
      handleSubmit,
      getRoleTitle,
      getRoleDescription
    }
  }
}
</script>

<style scoped>
.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed;
}

.error-message {
  @apply bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm;
}

.btn {
  @apply inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply border-transparent bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-primary-400 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed;
}
</style>