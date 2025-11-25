<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 class="text-xl font-semibold text-gray-900">Config Editor: {{ filename }}</h2>
          <p class="text-sm text-gray-600 mt-1">Edit configuration file</p>
        </div>
        <div class="flex items-center space-x-3">
          <button
              @click="$emit('close')"
              class="btn btn-outline"
          >
            Cancel
          </button>
          <button
              @click="handleSave"
              :disabled="saving || !hasChanges"
              class="btn btn-primary"
          >
            <span v-if="saving" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 flex flex-col min-h-0">
        <!-- Comment Input -->
        <div class="p-4 border-b border-gray-200 bg-gray-50">
          <label class="form-label">Change Comment (optional)</label>
          <input
              v-model="comment"
              type="text"
              class="form-input"
              placeholder="Describe what you're changing..."
          >
        </div>

        <!-- Editor -->
        <div class="flex-1 flex min-h-0">
          <div class="flex-1 border-r border-gray-200">
            <textarea
                v-model="content"
                class="w-full h-full font-mono text-sm p-4 resize-none focus:outline-none"
                spellcheck="false"
                placeholder="Configuration content..."
            ></textarea>
          </div>

          <!-- Preview (optional) -->
          <div class="flex-1 bg-gray-50 p-4 overflow-auto" v-if="false">
            <pre class="text-sm text-gray-600 whitespace-pre-wrap">{{ content }}</pre>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="px-4 py-2 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-sm">
          <div class="flex items-center space-x-4">
            <span class="text-gray-600">Lines: {{ lineCount }}</span>
            <span class="text-gray-600">Size: {{ content.length }} chars</span>
            <span v-if="hasChanges" class="text-orange-600 font-medium">● Unsaved changes</span>
          </div>
          <div v-if="originalContent" class="text-gray-600">
            Original size: {{ originalContent.length }} chars
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border-t border-red-200 p-4">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-red-800">{{ error }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'ConfigEditor',
  props: {
    filename: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    }
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const content = ref(props.content)
    const comment = ref('')
    const saving = ref(false)
    const error = ref('')

    const originalContent = ref(props.content)

    const lineCount = computed(() => {
      return content.value.split('\n').length
    })

    const hasChanges = computed(() => {
      return content.value !== originalContent.value
    })

    const handleSave = async () => {
      if (!hasChanges.value) {
        emit('close')
        return
      }

      saving.value = true
      error.value = ''

      try {
        emit('saved', {
          filename: props.filename,
          content: content.value,
          comment: comment.value
        })
        emit('close')
      } catch (err) {
        error.value = err.message || 'Failed to save configuration'
      } finally {
        saving.value = false
      }
    }

    // Close on Escape key
    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        if (hasChanges.value) {
          if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
            return
          }
        }
        emit('close')
      }
    }

    // Add event listener when component mounts
    watch(() => props.content, (newContent) => {
      content.value = newContent
      originalContent.value = newContent
    }, { immediate: true })

    return {
      content,
      comment,
      saving,
      error,
      originalContent,
      lineCount,
      hasChanges,
      handleSave,
      handleKeydown
    }
  },
  mounted() {
    document.addEventListener('keydown', this.handleKeydown)
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleKeydown)
  }
}
</script>