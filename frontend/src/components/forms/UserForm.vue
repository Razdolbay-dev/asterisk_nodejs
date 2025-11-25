<template>
  <div class="modal-overlay" v-if="show" @click.self="$emit('close')">
    <div class="modal max-w-md">
      <div class="modal-header">
        <h3>{{ isEdit ? 'Edit User' : 'Create User' }}</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="form-group">
          <label class="form-label">Username *</label>
          <input
              v-model="form.username"
              type="text"
              class="form-input"
              :disabled="isEdit"
              required
          >
        </div>

        <div class="form-group">
          <label class="form-label">Email *</label>
          <input
              v-model="form.email"
              type="email"
              class="form-input"
              required
          >
        </div>

        <div class="form-group">
          <label class="form-label">Role *</label>
          <select v-model="form.role" class="form-input" required>
            <option value="viewer">Viewer</option>
            <option value="operator">Operator</option>
            <option value="admin">Administrator</option>
          </select>
          <p class="text-xs text-gray-500 mt-1">
            {{ getRoleDescription(form.role) }}
          </p>
        </div>

        <div v-if="!isEdit" class="form-group">
          <label class="form-label">Password *</label>
          <input
              v-model="form.password"
              type="password"
              class="form-input"
              required
              minlength="6"
          >
          <p class="text-xs text-gray-500 mt-1">
            Password must be at least 6 characters long
          </p>
        </div>

        <div v-if="isEdit" class="form-group">
          <label class="flex items-center">
            <input
                v-model="form.isActive"
                type="checkbox"
                class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            >
            <span class="ml-2 text-sm text-gray-700">Active user</span>
          </label>
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
              :disabled="loading"
          >
            {{ loading ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
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
import { ref, watch } from 'vue'

export default {
  name: 'UserForm',
  props: {
    show: {
      type: Boolean,
      required: true
    },
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
      const submitData = { ...form.value }

      // Для редактирования не отправляем пароль если он не менялся
      if (isEdit.value) {
        delete submitData.password
      }

      emit('submit', submitData)
    }

    const getRoleDescription = (role) => {
      const descriptions = {
        admin: 'Full access to all features and user management',
        operator: 'Can manage SIP accounts, queues, trunks but cannot edit raw configs',
        viewer: 'Read-only access to view system status and configurations'
      }
      return descriptions[role] || ''
    }

    watch(() => props.show, (newVal) => {
      if (newVal) {
        if (props.user) {
          // Edit mode
          isEdit.value = true
          form.value = {
            username: props.user.username,
            email: props.user.email,
            role: props.user.role,
            password: '',
            isActive: props.user.isActive
          }
        } else {
          // Create mode
          isEdit.value = false
          resetForm()
        }
      }
    })

    return {
      form,
      isEdit,
      handleSubmit,
      getRoleDescription
    }
  }
}
</script>