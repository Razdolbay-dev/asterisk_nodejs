<template>
  <div class="max-w-7xl mx-auto">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Queues</h1>
      <p class="text-gray-600 mt-1">Manage call queues and members</p>
    </div>
    <DataTable
        title="Queues"
        :items="queues"
        :columns="columns"
        :loading="loading"
        :error="error"
        @add="showCreateForm = true"
        @edit="handleEdit"
        @delete="handleDelete"
    >
      <template #column-members="{ value }">
        <span class="members-count">{{ value.length }} members</span>
      </template>

      <template #column-strategy="{ value }">
        <span class="strategy-badge">{{ value }}</span>
      </template>
    </DataTable>

    <!-- Здесь будет QueueForm компонент -->

    <div v-if="selectedQueue" class="queue-details">
      <h3>Queue Members: {{ selectedQueue.name }}</h3>
      <div class="members-list">
        <div
            v-for="member in selectedQueue.members"
            :key="member.interface"
            class="member-item"
        >
          <span class="member-interface">{{ member.interface }}</span>
          <span class="member-name">{{ member.membername }}</span>
          <span class="member-penalty">Penalty: {{ member.penalty }}</span>
          <button
              @click="removeMember(selectedQueue.id, member.interface)"
              class="btn btn-sm btn-danger"
          >
            Remove
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

export default {
  name: 'Queues',
  components: {
    DataTable
  },
  setup() {
    const queuesStore = useQueuesStore()

    const showCreateForm = ref(false)
    const selectedQueue = ref(null)

    const queues = computed(() => queuesStore.queues)
    const loading = computed(() => queuesStore.loading)
    const error = computed(() => queuesStore.error)

    const columns = [
      { key: 'id', label: 'Queue ID' },
      { key: 'name', label: 'Name' },
      { key: 'strategy', label: 'Strategy' },
      { key: 'timeout', label: 'Timeout' },
      { key: 'members', label: 'Members' }
    ]

    const loadQueues = () => {
      queuesStore.fetchQueues()
    }

    const handleEdit = (queue) => {
      selectedQueue.value = queue
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

    const removeMember = async (queueId, memberInterface) => {
      if (confirm('Remove this member from queue?')) {
        const result = await queuesStore.removeMember(queueId, memberInterface)
        if (!result.success) {
          alert(result.error)
        } else {
          loadQueues()
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
      columns,
      showCreateForm,
      selectedQueue,
      handleEdit,
      handleDelete,
      removeMember
    }
  }
}
</script>

<style scoped>
.queue-details {
  margin-top: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.member-interface {
  font-family: monospace;
  font-weight: bold;
}

.member-name {
  flex: 1;
}

.member-penalty {
  color: #6c757d;
  font-size: 0.875rem;
}

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
</style>