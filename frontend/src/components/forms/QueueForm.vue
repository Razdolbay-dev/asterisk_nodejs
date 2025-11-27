<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
      <!-- Заголовок -->
      <div class="p-6 border-b">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ isEditMode ? 'Edit Queue' : 'Create New Queue' }}
        </h3>
        <p class="text-sm text-gray-600 mt-1">
          {{ isEditMode ? 'Update queue settings and members' : 'Configure a new call queue' }}
        </p>
      </div>

      <!-- Форма -->
      <form @submit.prevent="handleSubmit" class="p-6 overflow-y-auto max-h-[60vh]">
        <div class="space-y-6">
          <!-- Basic Information -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-4">Basic Information</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Queue ID -->
              <div>
                <label for="id" class="block text-sm font-medium text-gray-700 mb-1">
                  Queue ID *
                </label>
                <input
                    id="id"
                    v-model="formData.id"
                    type="text"
                    required
                    :disabled="isEditMode"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="e.g., sales-queue"
                    pattern="[a-zA-Z0-9_-]+"
                    title="Only letters, numbers, hyphens and underscores allowed"
                >
                <p class="text-xs text-gray-500 mt-1">
                  Unique identifier for the queue
                </p>
              </div>

              <!-- Queue Name -->
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                  Queue Name *
                </label>
                <input
                    id="name"
                    v-model="formData.name"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Sales Team Queue"
                >
              </div>
            </div>
          </div>

          <!-- Queue Settings -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-4">Queue Settings</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Strategy -->
              <div>
                <label for="strategy" class="block text-sm font-medium text-gray-700 mb-1">
                  Strategy *
                </label>
                <select
                    id="strategy"
                    v-model="formData.strategy"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ringall">Ring All</option>
                  <option value="roundrobin">Round Robin</option>
                  <option value="leastrecent">Least Recent</option>
                  <option value="fewestcalls">Fewest Calls</option>
                  <option value="random">Random</option>
                  <option value="rrmemory">Round Robin Memory</option>
                </select>
                <p class="text-xs text-gray-500 mt-1">
                  How to distribute calls to members
                </p>
              </div>

              <!-- Timeout -->
              <div>
                <label for="timeout" class="block text-sm font-medium text-gray-700 mb-1">
                  Timeout (seconds) *
                </label>
                <input
                    id="timeout"
                    v-model.number="formData.timeout"
                    type="number"
                    min="0"
                    max="300"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <p class="text-xs text-gray-500 mt-1">
                  How long to ring members (0-300)
                </p>
              </div>

              <!-- Wrap-up Time -->
              <div>
                <label for="wrapuptime" class="block text-sm font-medium text-gray-700 mb-1">
                  Wrap-up Time (seconds) *
                </label>
                <input
                    id="wrapuptime"
                    v-model.number="formData.wrapuptime"
                    type="number"
                    min="0"
                    max="300"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <p class="text-xs text-gray-500 mt-1">
                  Post-call processing time (0-300)
                </p>
              </div>

              <!-- Max Length -->
              <div>
                <label for="maxlen" class="block text-sm font-medium text-gray-700 mb-1">
                  Max Length *
                </label>
                <input
                    id="maxlen"
                    v-model.number="formData.maxlen"
                    type="number"
                    min="0"
                    max="1000"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <p class="text-xs text-gray-500 mt-1">
                  Maximum calls in queue (0 for unlimited)
                </p>
              </div>

              <!-- Service Level -->
              <div>
                <label for="servicelevel" class="block text-sm font-medium text-gray-700 mb-1">
                  Service Level (seconds) *
                </label>
                <input
                    id="servicelevel"
                    v-model.number="formData.servicelevel"
                    type="number"
                    min="0"
                    max="3600"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <p class="text-xs text-gray-500 mt-1">
                  Target answer time
                </p>
              </div>

              <!-- Music Class -->
              <div>
                <label for="musicclass" class="block text-sm font-medium text-gray-700 mb-1">
                  Music on Hold *
                </label>
                <select
                    id="musicclass"
                    v-model="formData.musicclass"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="default">Default</option>
                  <option value="classic">Classic</option>
                  <option value="rock">Rock</option>
                  <option value="jazz">Jazz</option>
                  <option value="electronic">Electronic</option>
                  <option value="none">None</option>
                </select>
              </div>

              <!-- Announce -->
              <div>
                <label for="announce" class="block text-sm font-medium text-gray-700 mb-1">
                  Announce Sound
                </label>
                <input
                    id="announce"
                    v-model="formData.announce"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., queue-thankyou"
                >
                <p class="text-xs text-gray-500 mt-1">
                  Sound file to play when call enters queue
                </p>
              </div>
            </div>
          </div>

          <!-- Initial Members -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-4">Initial Members</h4>
            <div class="space-y-3">
              <div
                  v-for="(member, index) in formData.members"
                  :key="index"
                  class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                      v-model="member.interface"
                      type="text"
                      placeholder="Interface (e.g., SIP/1001)"
                      class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                  <input
                      v-model.number="member.penalty"
                      type="number"
                      placeholder="Penalty"
                      min="0"
                      max="100"
                      class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                  <input
                      v-model="member.membername"
                      type="text"
                      placeholder="Member Name"
                      class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                </div>
                <button
                    type="button"
                    @click="removeMember(index)"
                    class="btn btn-sm btn-danger"
                    title="Remove Member"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>

              <button
                  type="button"
                  @click="addMember"
                  class="btn btn-outline w-full"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                Add Member
              </button>
            </div>
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
                id="description"
                v-model="formData.description"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description for this queue..."
            ></textarea>
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
            {{ isEditMode ? 'Update Queue' : 'Create Queue' }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, watch, computed } from 'vue'
import { useQueuesStore } from '@/stores/queues'

export default {
  name: 'QueueForm',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    queue: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'success'],
  setup(props, { emit }) {
    const queuesStore = useQueuesStore()

    const loading = ref(false)
    const error = ref('')

    const defaultFormData = {
      id: '',
      name: '',
      strategy: 'ringall',
      timeout: 30,
      wrapuptime: 10,
      maxlen: 0,
      servicelevel: 60,
      musicclass: 'default',
      announce: 'queue-thankyou',
      description: '',
      members: []
    }

    const formData = reactive({ ...defaultFormData })

    const isEditMode = computed(() => !!props.queue)

    // Сбрасываем форму при открытии/закрытии
    watch(() => props.visible, (visible) => {
      if (visible) {
        resetForm()
        if (props.queue) {
          Object.assign(formData, {
            ...props.queue,
            // Копируем members чтобы не мутировать оригинал
            members: props.queue.members ? [...props.queue.members] : []
          })
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

    const addMember = () => {
      formData.members.push({
        interface: '',
        penalty: 0,
        membername: ''
      })
    }

    const removeMember = (index) => {
      formData.members.splice(index, 1)
    }

    const validateForm = () => {
      if (!formData.id.trim()) {
        return 'Queue ID is required'
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(formData.id)) {
        return 'Queue ID can only contain letters, numbers, hyphens and underscores'
      }

      if (!formData.name.trim()) {
        return 'Queue name is required'
      }

      // Проверяем members
      for (const member of formData.members) {
        if (!member.interface.trim()) {
          return 'Member interface is required'
        }
        if (member.penalty < 0 || member.penalty > 100) {
          return 'Member penalty must be between 0 and 100'
        }
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
        // Фильтруем пустых members
        const submitData = {
          ...formData,
          members: formData.members.filter(member => member.interface.trim())
        }

        let result
        if (isEditMode.value) {
          result = await queuesStore.updateQueue(props.queue.id, submitData)
        } else {
          result = await queuesStore.createQueue(submitData)
        }

        if (result.success) {
          emit('success', result.data)
          close()
        } else {
          error.value = result.error
        }
      } catch (err) {
        error.value = 'An unexpected error occurred'
        console.error('Queue form error:', err)
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
      addMember,
      removeMember,
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

.btn-danger {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
}

.btn-outline {
  @apply border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500;
}

.btn-sm {
  @apply px-2 py-1 text-xs;
}
</style>