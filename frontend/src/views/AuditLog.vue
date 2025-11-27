<template>
  <div class="max-w-7xl mx-auto">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">Audit Log</h1>
      <p class="text-gray-600 mt-1">System activity and security events</p>
    </div>

    <!-- Audit Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div class="stat-card border-l-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Entries</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ auditStats?.totalEntries || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">📊</span>
          </div>
        </div>
      </div>

      <div class="stat-card border-l-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Recent Activity</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ auditStats?.recentActivity || 0 }}</p>
            <p class="text-sm text-gray-500 mt-1">last 7 days</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">🔄</span>
          </div>
        </div>
      </div>

      <div class="stat-card border-l-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Unique Users</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ auditStats?.users || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">👥</span>
          </div>
        </div>
      </div>

      <div class="stat-card border-l-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Most Active</p>
            <p class="text-lg font-bold text-gray-900 mt-1 truncate">{{ auditStats?.mostActiveUser || 'N/A' }}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">⭐</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters and Actions -->
    <div class="card p-6 mb-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div class="flex flex-col sm:flex-row gap-4 flex-1">
          <div class="flex-1">
            <label class="form-label">Action Type</label>
            <select v-model="filters.action" class="form-input">
              <option value="">All Actions</option>
              <option value="USER_CREATED">User Created</option>
              <option value="USER_UPDATED">User Updated</option>
              <option value="USER_DELETED">User Deleted</option>
              <option value="PASSWORD_CHANGED">Password Changed</option>
              <option value="PASSWORD_RESET">Password Reset</option>
              <option value="LOGIN_SUCCESS">Login Success</option>
              <option value="LOGIN_FAILED">Login Failed</option>
            </select>
          </div>

          <div class="flex-1">
            <label class="form-label">User ID</label>
            <input
                v-model="filters.userId"
                type="text"
                class="form-input"
                placeholder="Filter by user ID"
            >
          </div>
        </div>

        <div class="flex items-center space-x-3">
          <button
              @click="clearLogs"
              class="btn btn-danger"
              :disabled="loading"
          >
            Clear Logs
          </button>
          <button
              @click="refreshLogs"
              class="btn btn-outline"
              :disabled="loading"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Audit Log Table -->
    <div class="card p-6">
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

      <div v-else-if="auditLogs.length === 0" class="text-center py-8">
        <div class="text-gray-400 mb-2">No audit entries found</div>
        <div class="text-sm text-gray-500">System activity will appear here</div>
      </div>

      <div v-else class="space-y-4">
        <div
            v-for="log in auditLogs"
            :key="log.id"
            class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center space-x-3">
              <div :class="['w-3 h-3 rounded-full', getActionColor(log.action)]"></div>
              <span class="font-medium text-gray-900">{{ formatAction(log.action) }}</span>
            </div>
            <span class="text-sm text-gray-500">{{ formatTimeAgo(log.timestamp) }}</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-gray-600">User:</span>
              <span class="ml-2 font-medium">{{ log.userId }}</span>
            </div>

            <div v-if="log.targetUserId">
              <span class="text-gray-600">Target:</span>
              <span class="ml-2 font-medium">{{ log.targetUserId }}</span>
            </div>

            <div>
              <span class="text-gray-600">Time:</span>
              <span class="ml-2">{{ formatDateTime(log.timestamp) }}</span>
            </div>
          </div>

          <div v-if="log.details" class="mt-3">
            <details class="text-sm">
              <summary class="cursor-pointer text-gray-600 hover:text-gray-800">
                View Details
              </summary>
              <pre class="mt-2 p-3 bg-gray-100 rounded-lg text-xs overflow-x-auto">{{ JSON.stringify(log.details, null, 2) }}</pre>
            </details>
          </div>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between pt-4 border-t border-gray-200">
          <div class="text-sm text-gray-600">
            Showing {{ auditLogs.length }} of {{ totalLogs }} entries
          </div>
          <div class="flex space-x-2">
            <button
                @click="loadPrevious"
                :disabled="offset === 0"
                class="btn btn-outline btn-sm"
            >
              Previous
            </button>
            <button
                @click="loadNext"
                :disabled="!hasMore"
                class="btn btn-outline btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { auditAPI } from '@/services/api'

export default {
  name: 'AuditLog',
  setup() {
    const auditLogs = ref([])
    const auditStats = ref(null)
    const loading = ref(false)
    const error = ref('')
    const totalLogs = ref(0)
    const hasMore = ref(false)

    const filters = ref({
      action: '',
      userId: '',
      startDate: '',
      endDate: ''
    })

    const pagination = ref({
      limit: 20,
      offset: 0
    })

    const loadAuditLogs = async () => {
      loading.value = true
      error.value = ''

      try {
        const params = {
          ...pagination.value,
          ...filters.value
        }

        // Remove empty filters
        Object.keys(params).forEach(key => {
          if (params[key] === '') {
            delete params[key]
          }
        })

        const response = await auditAPI.getLogs(params)
        if (response.data.success) {
          auditLogs.value = response.data.data.logs
          totalLogs.value = response.data.data.total
          hasMore.value = response.data.data.hasMore
        }
      } catch (err) {
        error.value = err.response?.data?.error || 'Failed to load audit logs'
      } finally {
        loading.value = false
      }
    }

    const loadAuditStats = async () => {
      try {
        const response = await auditAPI.getStats()
        if (response.data.success) {
          auditStats.value = response.data.data
        }
      } catch (err) {
        console.error('Failed to load audit stats:', err)
      }
    }

    const refreshLogs = async () => {
      pagination.value.offset = 0
      await Promise.all([
        loadAuditLogs(),
        loadAuditStats()
      ])
    }

    const clearLogs = async () => {
      if (!confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) {
        return
      }

      try {
        await auditAPI.clearLogs()
        await refreshLogs()
      } catch (err) {
        error.value = err.response?.data?.error || 'Failed to clear audit logs'
      }
    }

    const loadNext = () => {
      pagination.value.offset += pagination.value.limit
      loadAuditLogs()
    }

    const loadPrevious = () => {
      pagination.value.offset = Math.max(0, pagination.value.offset - pagination.value.limit)
      loadAuditLogs()
    }

    const getActionColor = (action) => {
      const colors = {
        'USER_CREATED': 'bg-green-400',
        'USER_UPDATED': 'bg-blue-400',
        'USER_DELETED': 'bg-red-400',
        'PASSWORD_CHANGED': 'bg-purple-400',
        'PASSWORD_RESET': 'bg-orange-400',
        'LOGIN_SUCCESS': 'bg-green-400',
        'LOGIN_FAILED': 'bg-red-400',
        'UNAUTHORIZED_ACCESS': 'bg-red-400'
      }
      return colors[action] || 'bg-gray-400'
    }

    const formatAction = (action) => {
      return action.replace(/_/g, ' ').toLowerCase()
          .replace(/\b\w/g, l => l.toUpperCase())
    }

    const formatDateTime = (timestamp) => {
      return new Date(timestamp).toLocaleString()
    }

    const formatTimeAgo = (timestamp) => {
      const now = new Date()
      const time = new Date(timestamp)
      const diff = Math.floor((now - time) / 1000)

      if (diff < 60) return 'just now'
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
      return `${Math.floor(diff / 86400)}d ago`
    }

    // Watch filters and reload logs when they change
    watch(filters, () => {
      pagination.value.offset = 0
      loadAuditLogs()
    }, { deep: true })

    onMounted(() => {
      refreshLogs()
    })

    return {
      auditLogs,
      auditStats,
      loading,
      error,
      totalLogs,
      hasMore,
      filters,
      refreshLogs,
      clearLogs,
      loadNext,
      loadPrevious,
      getActionColor,
      formatAction,
      formatDateTime,
      formatTimeAgo
    }
  }
}
</script>