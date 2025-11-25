<template>
  <div class="modal-overlay" v-if="show" @click.self="$emit('close')">
    <div class="modal max-w-md">
      <div class="modal-header">
        <h3>{{ isReset ? 'Reset Password' : 'Change Password' }}</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div v-if="!isReset" class="form-group">
          <label class="form-label">Current Password *</label>
          <input
              v-model="form.currentPassword"
              type="password"
              class="form-input"
              required
          >
        </div>

        <div class="form-group">
          <label class="form-label">{{ isReset ? 'New Password' : 'New Password' }} *</label>
          <input
              v-model="form.newPassword"
              type="password"
              class="form-input"
              required
              minlength="6"
          >
        </div>

        <div class="form-group">
          <label class="form-label">Confirm New Password *</label>
          <input
              v-model="form.confirmPassword"
              type="password"
              class="form-input"
              required
              minlength="6"
          >
        </div>

        <div v-if="!passwordsMatch" class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div class="flex items-center">
            <svg class="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span class="text-yellow-800 text-sm">Passwords do not match</span>
          </div>
        </div>

        <div class="form-actions">
          <button
              type="button"
              @click="$emit('close')"
              class="btn btn-outline"
          >
            Cancel
          </button>
          <button
              type="submit"
              class="btn btn-primary"
              :disabled="loading || !passwordsMatch"
          >
            {{ loading ? 'Updating...' : (isReset ? 'Reset Password' : 'Change Password') }}
          </button>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
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
    show: {
      type: Boolean,
      required: true
    },
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

    const handleSubmit = () => {
      if (!passwordsMatch.value) return

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

    watch(() => props.show, (newVal) => {
      if (newVal) {
        resetForm()
      }
    })

    return {
      form,
      passwordsMatch,
      handleSubmit
    }
  }
}
</script>