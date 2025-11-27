<template>
  <div class="max-w-7xl mx-auto">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Queues</h1>
      <p class="text-gray-600 mt-1">Manage call queues and members</p>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 rounded-lg">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Queues</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.total || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 rounded-lg">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Members</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.totalMembers || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 rounded-lg">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Avg Members</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.averageMembers || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="p-2 bg-orange-100 rounded-lg">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Last Updated</p>
            <p class="text-sm font-bold text-gray-900">{{ lastUpdated }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Таблица очередей -->
    <DataTable
        title="Queues"
        :items="queues"
        :columns="columns"
        :loading="loading"
        :error="error"
        @add="openCreateForm"
        @edit="handleEdit"
        @delete="handleDelete"
        add-button-text="Add Queue"
    >
      <template #column-members="{ value }">
        <span class="members-count">{{ value?.length || 0 }} members</span>
      </template>

      <template #column-strategy="{ value }">
        <span class="strategy-badge">{{ value }}</span>
      </template>

      <template #column-timeout="{ value }">
        <span class="timeout-value">{{ value }}s</span>
      </template>

      <template #actions="{ item }">
        <button
            @click="showMembers(item)"
            class="btn btn-sm btn-outline mr-2"
            title="Manage Members"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </button>
      </template>
    </DataTable>

    <!-- Queue Form Modal -->
    <QueueForm
        :visible="showQueueForm"
        :queue="selectedQueue"
        @close="closeQueueForm"
        @success="handleQueueFormSuccess"
    />

    <!-- Модальное окно управления участниками -->
    <div v-if="showMembersModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div class="p-6 border-b">
          <h3 class="text-lg font-semibold text-gray-900">
            Manage Members: {{ selectedQueue?.name }} ({{ selectedQueue?.id }})
          </h3>
        </div>

        <div class="p-6 overflow-y-auto max-h-96">
          <!-- Форма добавления участника -->
          <div class="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Add New Member</h4>
            <div class="flex gap-3">
              <input
                  v-model="newMember.interface"
                  type="text"
                  placeholder="Interface (e.g., SIP/1001)"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <input
                  v-model.number="newMember.penalty"
                  type="number"
                  placeholder="Penalty"
                  min="0"
                  max="100"
                  class="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <input
                  v-model="newMember.membername"
                  type="text"
                  placeholder="Member Name"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
              <button
                  @click="addMember"
                  :disabled="!newMember.interface"
                  class="btn btn-primary whitespace-nowrap"
              >
                Add Member
              </button>
            </div>
          </div>

          <!-- Список участников -->
          <div v-if="selectedQueue?.members?.length" class="space-y-3">
            <div
                v-for="member in selectedQueue.members"
                :key="member.interface"
                class="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div class="flex-1">
                <div class="flex items-center gap-4">
                  <span class="font-mono font-medium text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {{ member.interface }}
                  </span>
                  <span class="text-gray-700">{{ member.membername || 'No name' }}</span>
                  <span class="text-sm text-gray-500">Penalty: {{ member.penalty || 0 }}</span>
                </div>
              </div>
              <button
                  @click="removeMember(selectedQueue.id, member.interface)"
                  class="btn btn-sm btn-danger"
                  title="Remove Member"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>

          <div v-else class="text-center py-8 text-gray-500">
            <svg class="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <p class="mt-2">No members in this queue</p>
          </div>
        </div>

        <div class="p-6 border-t bg-gray-50 flex justify-end">
          <button
              @click="closeMembersModal"
              class="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useQueuesStore } from '@/stores/queues'
import DataTable from '@/components/ui/DataTable.vue'
import QueueForm from '@/components/forms/QueueForm.vue'

export default {
  name: 'Queues',
  components: {
    DataTable,
    QueueForm
  },
  setup() {
    const queuesStore = useQueuesStore()

    const showQueueForm = ref(false)
    const showMembersModal = ref(false)
    const selectedQueue = ref(null)
    const newMember = ref({
      interface: '',
      penalty: 0,
      membername: ''
    })

    const queues = computed(() => queuesStore.queues)
    const loading = computed(() => queuesStore.loading)
    const error = computed(() => queuesStore.error)
    const stats = computed(() => queuesStore.stats)

    const lastUpdated = computed(() => {
      return new Date().toLocaleString()
    })

    const columns = [
      { key: 'id', label: 'Queue ID', sortable: true },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'strategy', label: 'Strategy', sortable: true },
      { key: 'timeout', label: 'Timeout', sortable: true },
      { key: 'members', label: 'Members', sortable: true },
      { key: 'actions', label: 'Actions', sortable: false }
    ]

    const loadQueues = async () => {
      await queuesStore.fetchQueues()
      await queuesStore.fetchStats()
    }

    // Открытие формы создания
    const openCreateForm = () => {
      selectedQueue.value = null
      showQueueForm.value = true
    }

    // Открытие формы редактирования
    const handleEdit = (queue) => {
      selectedQueue.value = queue
      showQueueForm.value = true
    }

    // Закрытие формы
    const closeQueueForm = () => {
      showQueueForm.value = false
      selectedQueue.value = null
    }

    // Обработка успешного сохранения формы
    const handleQueueFormSuccess = (queue) => {
      // Данные автоматически обновляются через store
      console.log('Queue operation successful:', queue)
      // Можно добавить уведомление или другие действия
    }

    const handleDelete = async (queue) => {
      if (confirm(`Are you sure you want to delete queue "${queue.name}"?`)) {
        const result = await queuesStore.deleteQueue(queue.id)
        if (!result.success) {
          alert(result.error)
        } else {
          selectedQueue.value = null
        }
      }
    }

    const showMembers = (queue) => {
      selectedQueue.value = { ...queue }
      newMember.value = { interface: '', penalty: 0, membername: '' }
      showMembersModal.value = true
    }

    const closeMembersModal = () => {
      showMembersModal.value = false
      selectedQueue.value = null
    }

    const addMember = async () => {
      if (!newMember.value.interface) {
        alert('Please enter interface')
        return
      }

      const result = await queuesStore.addMember(selectedQueue.value.id, newMember.value)
      if (result.success) {
        newMember.value = { interface: '', penalty: 0, membername: '' }
        // Обновляем данные
        await loadQueues()
        // Обновляем выбранную очередь
        const updatedQueue = queues.value.find(q => q.id === selectedQueue.value.id)
        if (updatedQueue) {
          selectedQueue.value = { ...updatedQueue }
        }
      } else {
        alert(result.error)
      }
    }

    const removeMember = async (queueId, memberInterface) => {
      if (confirm('Remove this member from queue?')) {
        const result = await queuesStore.removeMember(queueId, memberInterface)
        if (result.success) {
          // Обновляем данные
          await loadQueues()
          // Обновляем выбранную очередь
          const updatedQueue = queues.value.find(q => q.id === selectedQueue.value.id)
          if (updatedQueue) {
            selectedQueue.value = { ...updatedQueue }
          }
        } else {
          alert(result.error)
        }
      }
    }

    onMounted(() => {
      loadQueues()
    })

    return {
      queues,
      loading,
      error,
      stats,
      columns,
      showQueueForm,
      showMembersModal,
      selectedQueue,
      newMember,
      lastUpdated,
      openCreateForm,
      handleEdit,
      handleDelete,
      closeQueueForm,
      handleQueueFormSuccess,
      showMembers,
      closeMembersModal,
      addMember,
      removeMember
    }
  }
}
</script>

<style scoped>
.strategy-badge {
  padding: 0.25rem 0.5rem;
  background: #e9ecef;
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: monospace;
}

.members-count {
  color: #6c757d;
  font-size: 0.875rem;
}

.timeout-value {
  font-family: monospace;
  font-size: 0.875rem;
  color: #495057;
}

.btn {
  @apply px-3 py-2 rounded-md font-medium text-sm transition-colors;
}

.btn-sm {
  @apply px-2 py-1 text-xs;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.btn-secondary {
  @apply bg-gray-600 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500;
}

.btn-danger {
  @apply bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500;
}

.btn-outline {
  @apply border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style>