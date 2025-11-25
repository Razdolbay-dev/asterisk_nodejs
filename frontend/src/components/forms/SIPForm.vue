<template>
  <div class="modal-overlay" v-if="show" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h3>{{ isEdit ? 'Edit SIP Account' : 'Create SIP Account' }}</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-form">
        <div class="form-group">
          <label class="form-label">SIP ID *</label>
          <input
              v-model="form.id"
              type="text"
              class="form-input"
              :disabled="isEdit"
              required
          >
        </div>

        <div class="form-group">
          <label class="form-label">Password *</label>
          <input
              v-model="form.password"
              type="password"
              class="form-input"
              required
          >
        </div>

        <div class="form-group">
          <label class="form-label">Context</label>
          <select v-model="form.context" class="form-input">
            <option value="internal">Internal</option>
            <option value="external">External</option>
            <option value="from-trunk">From Trunk</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Codecs</label>
          <input
              v-model="form.codecs"
              type="text"
              class="form-input"
              placeholder="ulaw,alaw,g729"
          >
        </div>

        <div class="form-group">
          <label class="form-label">Status</label>
          <select v-model="form.status" class="form-input">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
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
  name: 'SIPForm',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    account: {
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
      id: '',
      password: '',
      context: 'internal',
      codecs: 'ulaw,alaw',
      status: 'active'
    })

    const resetForm = () => {
      form.value = {
        id: '',
        password: '',
        context: 'internal',
        codecs: 'ulaw,alaw',
        status: 'active'
      }
    }

    const handleSubmit = () => {
      emit('submit', { ...form.value })
    }

    watch(() => props.show, (newVal) => {
      if (newVal) {
        if (props.account) {
          // Edit mode
          isEdit.value = true
          form.value = { ...props.account }
          // Don't send password back in edit mode if it's not changed
          if (form.value.password && form.value.password.startsWith('***')) {
            form.value.password = ''
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
      handleSubmit
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
}

.close-btn:hover {
  color: #495057;
}

.modal-form {
  padding: 1.5rem;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}

.error-message {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #fee;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  color: #721c24;
}
</style>