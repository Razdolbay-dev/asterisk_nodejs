<template>
  <div class="max-w-7xl mx-auto">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Configuration Manager</h1>
      <p class="text-gray-600 mt-1">Manage Asterisk configuration files</p>
    </div>

    <!-- Files List -->
    <div class="card p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900">Configuration Files</h2>
        <button
            @click="refreshFiles"
            class="btn btn-outline flex items-center space-x-2"
            :disabled="loading"
        >
          <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>

      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-red-800">{{ error }}</span>
        </div>
      </div>

      <div v-else-if="configFiles.length === 0" class="text-center py-8">
        <div class="text-gray-400 mb-2">No configuration files found</div>
        <div class="text-sm text-gray-500">Generated configuration files will appear here</div>
      </div>

      <div v-else class="grid gap-4">
        <div
            v-for="file in configFiles"
            :key="file.name"
            class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center space-x-4">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span class="text-blue-600 font-mono text-sm">.conf</span>
            </div>
            <div>
              <h3 class="font-medium text-gray-900">{{ file.name }}</h3>
              <div class="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <span>{{ formatFileSize(file.size) }}</span>
                <span>•</span>
                <span>Modified: {{ formatDate(file.modified) }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-2">
            <button
                @click="viewFile(file.name)"
                class="btn btn-outline btn-sm"
            >
              View
            </button>
            <button
                @click="editFile(file.name)"
                class="btn btn-primary btn-sm"
                v-if="userRole === 'admin'"
            >
              Edit
            </button>
            <button
                @click="deleteFile(file.name)"
                class="btn btn-danger btn-sm"
                v-if="userRole === 'admin'"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Config Editor Modal -->
    <ConfigEditor
        v-if="showEditor"
        :filename="currentFilename"
        :content="currentFileContent"
        @close="closeEditor"
        @saved="handleSaveFile"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useConfigStore } from '@/stores/config'
import { useAuthStore } from '@/stores/auth'
import ConfigEditor from '@/components/ConfigEditor.vue'

export default {
  name: 'ConfigManager',
  components: {
    ConfigEditor
  },
  setup() {
    const configStore = useConfigStore()
    const authStore = useAuthStore()

    const showEditor = ref(false)
    const currentFilename = ref('')
    const currentFileContent = ref('')

    const configFiles = computed(() => configStore.configFiles)
    const loading = computed(() => configStore.loading)
    const error = computed(() => configStore.error)
    const userRole = computed(() => authStore.userRole)

    const loadFiles = async () => {
      await configStore.fetchConfigFiles()
    }

    const refreshFiles = async () => {
      await loadFiles()
    }

    const viewFile = async (filename) => {
      try {
        await configStore.fetchConfigFile(filename)
        currentFilename.value = filename
        currentFileContent.value = configStore.currentFile?.content || ''
        showEditor.value = true
      } catch (error) {
        console.error('Failed to load file:', error)
      }
    }

    const editFile = async (filename) => {
      await viewFile(filename)
    }

    const deleteFile = async (filename) => {
      if (!confirm(`Are you sure you want to delete ${filename}?`)) {
        return
      }

      const result = await configStore.deleteConfigFile(filename)
      if (!result.success) {
        alert(result.error)
      }
    }

    const closeEditor = () => {
      showEditor.value = false
      currentFilename.value = ''
      currentFileContent.value = ''
      configStore.clearCurrentFile()
    }

    const handleSaveFile = async (fileData) => {
      const result = await configStore.updateConfigFile(
          fileData.filename,
          fileData.content,
          fileData.comment
      )

      if (result.success) {
        await loadFiles() // Refresh the file list
      } else {
        alert(result.error)
      }
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleString()
    }

    onMounted(() => {
      loadFiles()
    })

    return {
      configFiles,
      loading,
      error,
      userRole,
      showEditor,
      currentFilename,
      currentFileContent,
      refreshFiles,
      viewFile,
      editFile,
      deleteFile,
      closeEditor,
      handleSaveFile,
      formatFileSize,
      formatDate
    }
  }
}
</script>