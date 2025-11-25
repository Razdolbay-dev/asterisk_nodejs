<template>
  <div class="max-w-7xl mx-auto">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Trunks</h1>
      <p class="text-gray-600 mt-1">Manage trunks</p>
    </div>
    <DataTable
        title="Trunks"
        :items="trunks"
        :columns="columns"
        :loading="loading"
        :error="error"
        @add="showCreateForm = true"
        @edit="handleEdit"
        @delete="handleDelete"
    >
      <template #column-host="{ value }">
        <span class="host-info">{{ value }}</span>
      </template>

      <template #column-status="{ value }">
        <span :class="['status-badge', value]">{{ value }}</span>
      </template>

      <template #column-register="{ value }">
        <span :class="['register-badge', value]">
          {{ value === 'yes' ? 'Registered' : 'Not Registered' }}
        </span>
      </template>
    </DataTable>

    <!-- Здесь будет TrunkForm компонент -->
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useTrunksStore } from '@/stores/trunks'
import DataTable from '@/components/ui/DataTable.vue'

export default {
  name: 'Trunks',
  components: {
    DataTable
  },
  setup() {
    const trunksStore = useTrunksStore()

    const showCreateForm = ref(false)
    const selectedTrunk = ref(null)

    const trunks = computed(() => trunksStore.trunks)
    const loading = computed(() => trunksStore.loading)
    const error = computed(() => trunksStore.error)

    const columns = [
      { key: 'id', label: 'Trunk ID' },
      { key: 'name', label: 'Name' },
      { key: 'host', label: 'Host' },
      { key: 'username', label: 'Username' },
      { key: 'register', label: 'Registration' },
      { key: 'status', label: 'Status' }
    ]

    const loadTrunks = () => {
      trunksStore.fetchTrunks()
    }

    const handleEdit = (trunk) => {
      selectedTrunk.value = trunk
      showCreateForm.value = true
    }

    const handleDelete = async (trunk) => {
      if (confirm(`Are you sure you want to delete trunk "${trunk.name}"?`)) {
        const result = await trunksStore.deleteTrunk(trunk.id)
        if (!result.success) {
          alert(result.error)
        }
      }
    }

    onMounted(() => {
      loadTrunks()
    })

    return {
      trunks,
      loading,
      error,
      columns,
      showCreateForm,
      selectedTrunk,
      handleEdit,
      handleDelete
    }
  }
}
</script>

<style scoped>
.host-info {
  font-family: monospace;
  font-size: 0.875rem;
}

.register-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.register-badge.yes {
  background-color: #d4edda;
  color: #155724;
}

.register-badge.no {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.active {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.inactive {
  background-color: #f8d7da;
  color: #721c24;
}
</style>