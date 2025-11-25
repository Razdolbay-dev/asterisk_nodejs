<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Заголовок -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600 mt-1">Overview of your Asterisk system</p>
      </div>
    </div>

    <!-- Statistics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="stat-card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">SIP Accounts</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ sipStats.total }}</p>
            <p class="text-sm text-green-600 mt-1">{{ sipStats.active }} active</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">📞</span>
          </div>
        </div>
      </div>

      <div class="stat-card border-l-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Queues</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ queueStats.total }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">👥</span>
          </div>
        </div>
      </div>

      <div class="stat-card border-l-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Trunks</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ trunkStats.total }}</p>
            <p class="text-sm text-green-600 mt-1">{{ trunkStats.active }} active</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">🔗</span>
          </div>
        </div>
      </div>

      <div class="stat-card border-l-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">System Status</p>
            <p class="text-3xl font-bold mt-1" :class="systemStatus.connected ? 'text-green-600' : 'text-red-600'">
              {{ systemStatus.connected ? 'Online' : 'Offline' }}
            </p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">⚡</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
            @click="reloadPJSIP"
            class="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div class="text-center">
            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-200 transition-colors">
              <span class="text-lg">🔄</span>
            </div>
            <span class="text-sm font-medium text-gray-700">Reload PJSIP</span>
          </div>
        </button>

        <button
            @click="reloadQueues"
            class="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div class="text-center">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-green-200 transition-colors">
              <span class="text-lg">👥</span>
            </div>
            <span class="text-sm font-medium text-gray-700">Reload Queues</span>
          </div>
        </button>

        <button
            @click="createSnapshot"
            class="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
        >
          <div class="text-center">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-200 transition-colors">
              <span class="text-lg">💾</span>
            </div>
            <span class="text-sm font-medium text-gray-700">Create Snapshot</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { useSipStore } from '@/stores/sip'
import { useQueuesStore } from '@/stores/queues'
import { useTrunksStore } from '@/stores/trunks'
import { asteriskAPI, configAPI } from '@/services/api'

export default {
  name: 'Dashboard',
  setup() {
    const sipStore = useSipStore()
    const queuesStore = useQueuesStore()
    const trunksStore = useTrunksStore()

    const systemStatus = ref({
      connected: false,
      version: 'Unknown'
    })

    const sipStats = computed(() => ({
      total: sipStore.totalAccounts,
      active: sipStore.activeAccounts.length
    }))

    const queueStats = computed(() => ({
      total: queuesStore.totalQueues
    }))

    const trunkStats = computed(() => ({
      total: trunksStore.totalTrunks,
      active: trunksStore.activeTrunks.length
    }))

    const loadData = async () => {
      await Promise.all([
        sipStore.fetchAccounts(),
        queuesStore.fetchQueues(),
        trunksStore.fetchTrunks()
      ])

      try {
        const statusResponse = await asteriskAPI.getStatus()
        systemStatus.value = statusResponse.data.data
      } catch (error) {
        console.error('Failed to fetch system status:', error)
      }
    }

    const reloadPJSIP = async () => {
      try {
        await asteriskAPI.reloadPJSIP()
        alert('PJSIP reloaded successfully')
      } catch (error) {
        alert('Failed to reload PJSIP')
      }
    }

    const reloadQueues = async () => {
      try {
        await asteriskAPI.reloadQueues()
        alert('Queues reloaded successfully')
      } catch (error) {
        alert('Failed to reload queues')
      }
    }

    const createSnapshot = async () => {
      try {
        await configAPI.createSnapshot('Manual snapshot from dashboard')
        alert('Snapshot created successfully')
      } catch (error) {
        alert('Failed to create snapshot')
      }
    }

    onMounted(() => {
      loadData()
    })

    return {
      sipStats,
      queueStats,
      trunkStats,
      systemStatus,
      reloadPJSIP,
      reloadQueues,
      createSnapshot
    }
  }
}
</script>