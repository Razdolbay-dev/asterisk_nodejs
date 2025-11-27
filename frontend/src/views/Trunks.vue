<template>
  <div class="max-w-7xl mx-auto">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Trunks</h1>
      <p class="text-gray-600 mt-1">Manage SIP trunks and provider connections</p>
    </div>

    <!-- Статистика -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 rounded-lg">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Trunks</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.total || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 rounded-lg">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Active</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.active || 0 }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 rounded-lg">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Registered</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.registered || 0 }}</p>
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
            <p class="text-sm font-medium text-gray-600">Registration Rate</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.registrationRate || '0%' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Таблица транков -->
    <DataTable
        title="Trunks"
        :items="trunks"
        :columns="columns"
        :loading="loading"
        :error="error"
        @add="openCreateForm"
        @edit="handleEdit"
        @delete="handleDelete"
        add-button-text="Add Trunk"
    >
      <template #column-host="{ value }">
        <span class="host-info">{{ value }}</span>
      </template>

      <template #column-protocol="{ value }">
        <span class="protocol-badge">{{ value.toUpperCase() }}</span>
      </template>

      <template #column-status="{ value }">
        <span :class="['status-badge', value]">{{ value }}</span>
      </template>

      <template #column-register="{ value }">
        <span :class="['register-badge', value]">
          {{ value === 'yes' ? 'Registered' : 'Not Registered' }}
        </span>
      </template>

      <template #actions="{ item }">
        <button
            @click="showDetails(item)"
            class="btn btn-sm btn-outline mr-2"
            title="View Details"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </button>
      </template>
    </DataTable>

    <!-- Форма создания/редактирования транка -->
    <TrunkForm
        :visible="showTrunkForm"
        :trunk="selectedTrunk"
        @close="closeTrunkForm"
        @success="handleTrunkFormSuccess"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useTrunksStore } from '@/stores/trunks'
import DataTable from '@/components/ui/DataTable.vue'
import TrunkForm from '@/components/forms/TrunkForm.vue'

export default {
  name: 'Trunks',
  components: {
    DataTable,
    TrunkForm
  },
  setup() {
    const trunksStore = useTrunksStore()

    const showTrunkForm = ref(false)
    const selectedTrunk = ref(null)

    const trunks = computed(() => trunksStore.trunks)
    const loading = computed(() => trunksStore.loading)
    const error = computed(() => trunksStore.error)
    const stats = computed(() => trunksStore.stats)

    const lastUpdated = computed(() => {
      return new Date().toLocaleString()
    })

    const columns = [
      { key: 'id', label: 'Trunk ID', sortable: true },
      { key: 'name', label: 'Name', sortable: true },
      { key: 'host', label: 'Host', sortable: true },
      { key: 'username', label: 'Username', sortable: true },
      { key: 'protocol', label: 'Protocol', sortable: true },
      { key: 'register', label: 'Registration', sortable: true },
      { key: 'status', label: 'Status', sortable: true },
      { key: 'actions', label: 'Actions', sortable: false }
    ]

    const loadTrunks = async () => {
      await trunksStore.fetchTrunks()
      await trunksStore.fetchStats()
    }

    const openCreateForm = () => {
      selectedTrunk.value = null
      showTrunkForm.value = true
    }

    const handleEdit = (trunk) => {
      selectedTrunk.value = trunk
      showTrunkForm.value = true
    }

    const closeTrunkForm = () => {
      showTrunkForm.value = false
      selectedTrunk.value = null
    }

    const handleTrunkFormSuccess = (trunk) => {
      console.log('Trunk operation successful:', trunk)
    }

    const handleDelete = async (trunk) => {
      if (confirm(`Are you sure you want to delete trunk "${trunk.name}"?`)) {
        const result = await trunksStore.deleteTrunk(trunk.id)
        if (!result.success) {
          alert(result.error)
        }
      }
    }

    const showDetails = (trunk) => {
      alert(`Trunk Details:\n\nID: ${trunk.id}\nName: ${trunk.name}\nHost: ${trunk.host}:${trunk.port}\nUsername: ${trunk.username}\nProtocol: ${trunk.protocol}\nStatus: ${trunk.status}\nRegister: ${trunk.register}`)
    }

    onMounted(() => {
      loadTrunks()
    })

    return {
      trunks,
      loading,
      error,
      stats,
      columns,
      showTrunkForm,
      selectedTrunk,
      lastUpdated,
      openCreateForm,
      handleEdit,
      handleDelete,
      closeTrunkForm,
      handleTrunkFormSuccess,
      showDetails
    }
  }
}
</script>

<style scoped>
.host-info {
  font-family: monospace;
  font-size: 0.875rem;
}

.protocol-badge {
  padding: 0.25rem 0.5rem;
  background: #e9ecef;
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: monospace;
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

.btn {
  @apply px-3 py-2 rounded-md font-medium text-sm transition-colors;
}

.btn-sm {
  @apply px-2 py-1 text-xs;
}

.btn-outline {
  @apply border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500;
}
</style>