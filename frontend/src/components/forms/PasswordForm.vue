<template>
  <div>
    <!-- Modal Content -->
    <div class="p-6 overflow-y-auto">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="!isReset" class="form-group">
          <label class="form-label">Current Password *</label>
          <input
              v-model="form.currentPassword"
              type="password"
              class="form-input"
              required
              placeholder="Enter current password"
          >
        </div>

        <div class="form-group">
          <label class="form-label">New Password *</label>
          <input
              v-model="form.newPassword"
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

        <div class="form-group">
          <label class="form-label">Confirm New Password *</label>
          <input
              v-model="form.confirmPassword"
              type="password"
              class="form-input"
              required
              minlength="6"
              placeholder="Confirm new password"
          >
        </div>

        <!-- Password Match Warning -->
        <div v-if="form.newPassword && form.confirmPassword && !passwordsMatch" class="warning-message">
          <div class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Passwords do not match
          </div>
        </div>

        <!-- Password Strength Indicator -->
        <div v-if="form.newPassword" class="password-strength">
          <div class="text-xs text-gray-600 mb-1">Password strength:</div>
          <div class="flex space-x-1">
            <div
                v-for="n in 4"
                :key="n"
                class="h-1 flex-1 rounded-full transition-colors"
                :class="getStrengthClass(n)"
            ></div>
          </div>
          <div class="text-xs text-gray-500 mt-1">
            {{ getStrengthText }}
          </div>
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
              Updating...
            </span>
            <span v-else>
              {{ isReset ? 'Reset Password' : 'Change Password' }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'PasswordForm',
  props: {
    userId: {
      type: String,
      required: true
    },
    isReset: {
      type: Boolean,
      default: false
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
    const form = ref({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })

    const passwordsMatch = computed(() => {
      return form.value.newPassword === form.value.confirmPassword
    })

    const passwordStrength = computed(() => {
      const password = form.value.newPassword
      if (!password) return 0

      let strength = 0
      if (password.length >= 6) strength += 1
      if (password.length >= 8) strength += 1
      if (/[A-Z]/.test(password)) strength += 1
      if (/[0-9]/.test(password)) strength += 1
      if (/[^A-Za-z0-9]/.test(password)) strength += 1

      return Math.min(strength, 4)
    })

    const getStrengthText = computed(() => {
      const strength = passwordStrength.value
      const texts = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
      return texts[strength]
    })

    const isFormValid = computed(() => {
      if (!form.value.newPassword || form.value.newPassword.length < 6) return false
      if (!passwordsMatch.value) return false
      if (!props.isReset && !form.value.currentPassword) return false
      return true
    })

    const handleSubmit = () => {
      if (!isFormValid.value) return

      const submitData = props.isReset
          ? { newPassword: form.value.newPassword }
          : {
            currentPassword: form.value.currentPassword,
            newPassword: form.value.newPassword
          }

      emit('submit', submitData)
    }

    const resetForm = () => {
      form.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    }

    const getStrengthClass = (n) => {
      if (n <= passwordStrength.value) {
        const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500']
        return colors[passwordStrength.value - 1] || 'bg-gray-300'
      }
      return 'bg-gray-200'
    }

    watch(() => props.loading, (newLoading) => {
      if (!newLoading && !props.error) {
        resetForm()
      }
    })

    return {
      form,
      passwordsMatch,
      passwordStrength,
      getStrengthText,
      isFormValid,
      handleSubmit,
      getStrengthClass
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
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500;
}

.error-message {
  @apply bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm;
}

.warning-message {
  @apply bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-700 text-sm;
}

.password-strength {
  @apply p-3 bg-gray-50 rounded-lg;
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