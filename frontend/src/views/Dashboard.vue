<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Заголовок с статусом подключения -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-600 mt-1">Real-time overview of your Asterisk system</p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2 text-sm">
          <div class="flex items-center space-x-1">
            <div :class="['w-2 h-2 rounded-full', systemStatus.asteriskConnected ? 'bg-green-400' : 'bg-red-400']"></div>
            <span class="text-gray-600">Asterisk</span>
            <span :class="['font-medium', systemStatus.asteriskConnected ? 'text-green-600' : 'text-red-600']">
              {{ systemStatus.asteriskConnected ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
          <span class="text-gray-300">•</span>
          <div class="flex items-center space-x-1">
            <div :class="['w-2 h-2 rounded-full', realtimeConnected ? 'bg-green-400' : 'bg-red-400']"></div>
            <span class="text-gray-600">Live</span>
            <span :class="['font-medium', realtimeConnected ? 'text-green-600' : 'text-red-600']">
              {{ realtimeConnected ? 'Connected' : 'Disconnected' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Real-time Statistics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Active Calls -->
      <div class="stat-card border-l-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Active Calls</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ activeCallsCount }}</p>
            <div class="flex items-center space-x-2 mt-1">
              <div class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <p class="text-sm text-blue-600">Live</p>
            </div>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">📞</span>
          </div>
        </div>
      </div>

      <!-- Online SIP Peers -->
      <div class="stat-card border-l-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Online SIP Peers</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ onlineSipPeersCount }}</p>
            <p class="text-sm text-gray-500 mt-1">of {{ sipStats.total }} total</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">👤</span>
          </div>
        </div>
      </div>

      <!-- System Uptime -->
      <div class="stat-card border-l-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">System Uptime</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ systemUptime }}</p>
            <p class="text-sm text-green-600 mt-1">Stable</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">⏱️</span>
          </div>
        </div>
      </div>

      <!-- Recent Events -->
      <div class="stat-card border-l-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Recent Events</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ recentEventsCount }}</p>
            <p class="text-sm text-gray-500 mt-1">last 5 min</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">📊</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Real-time Sections -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Active Calls -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Active Calls</h2>
          <span class="text-sm text-gray-500">{{ activeCallsCount }} active</span>
        </div>

        <div v-if="activeCalls.length === 0" class="text-center py-8">
          <div class="text-gray-400 mb-2">No active calls</div>
          <div class="text-sm text-gray-500">Calls will appear here in real-time</div>
        </div>

        <div v-else class="space-y-3">
          <div
              v-for="call in activeCalls"
              :key="call.id"
              class="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <div :class="['w-3 h-3 rounded-full', getCallStatusColor(call.state)]"></div>
              <div>
                <div class="font-medium text-gray-900">{{ call.callerId }}</div>
                <div class="text-sm text-gray-500">to {{ call.destination }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm font-mono text-gray-600">{{ formatCallDuration(call.startTime) }}</div>
              <div class="text-xs text-gray-500 capitalize">{{ call.state }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Events -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Recent Events</h2>
          <button
              @click="clearEvents"
              class="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>

        <div class="space-y-2 max-h-80 overflow-y-auto">
          <div
              v-for="event in recentEvents.slice(0, 10)"
              :key="event.id"
              class="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50"
          >
            <div :class="['w-2 h-2 rounded-full mt-2', getEventColor(event.type)]"></div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-gray-900 capitalize">
                  {{ event.type.replace(/([A-Z])/g, ' $1').trim() }}
                </span>
                <span class="text-xs text-gray-500">{{ formatTimeAgo(event.timestamp) }}</span>
              </div>
              <div class="text-xs text-gray-600 mt-1 truncate">
                {{ getEventDescription(event) }}
              </div>
            </div>
          </div>

          <div v-if="recentEvents.length === 0" class="text-center py-8 text-gray-500">
            No recent events
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
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useSipStore } from '@/stores/sip'
import { useQueuesStore } from '@/stores/queues'
import { useTrunksStore } from '@/stores/trunks'
import { useRealtimeStore } from '@/stores/realtime'
import { asteriskAPI, configAPI } from '@/services/api'

export default {
  name: 'Dashboard',
  setup() {
    const sipStore = useSipStore()
    const queuesStore = useQueuesStore()
    const trunksStore = useTrunksStore()
    const realtimeStore = useRealtimeStore()

    const systemUptime = ref('0:00:00')

    // Real-time данные
    const activeCalls = computed(() => realtimeStore.activeCalls)
    const activeCallsCount = computed(() => realtimeStore.activeCallsCount)
    const onlineSipPeersCount = computed(() => realtimeStore.onlineSipPeers.length)
    const recentEvents = computed(() => realtimeStore.recentEvents)
    const recentEventsCount = computed(() => realtimeStore.recentEventsCount)
    const realtimeConnected = computed(() => realtimeStore.isConnected)
    const systemStatus = computed(() => realtimeStore.systemStatus)

    // Статические данные
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
    }

    const getCallStatusColor = (state) => {
      const colors = {
        'Ringing': 'bg-yellow-400',
        'Up': 'bg-green-400',
        'Busy': 'bg-red-400',
        'Ringing': 'bg-blue-400'
      }
      return colors[state] || 'bg-gray-400'
    }

    const getEventColor = (eventType) => {
      const colors = {
        'Newchannel': 'bg-green-400',
        'Hangup': 'bg-red-400',
        'PeerStatus': 'bg-blue-400',
        'QueueMemberStatus': 'bg-purple-400'
      }
      return colors[eventType] || 'bg-gray-400'
    }

    const getEventDescription = (event) => {
      const { type, data } = event
      switch (type) {
        case 'Newchannel':
          return `New call from ${data.calleridnum} to ${data.exten}`
        case 'Hangup':
          return `Call ended: ${data.channel}`
        case 'PeerStatus':
          return `SIP peer ${data.peer} is ${data.peerstatus}`
        default:
          return JSON.stringify(data)
      }
    }

    const formatCallDuration = (startTime) => {
      const start = new Date(startTime)
      const now = new Date()
      const diff = Math.floor((now - start) / 1000)
      const minutes = Math.floor(diff / 60)
      const seconds = diff % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const formatTimeAgo = (timestamp) => {
      const now = new Date()
      const time = new Date(timestamp)
      const diff = Math.floor((now - time) / 1000)

      if (diff < 60) return 'just now'
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
      return `${Math.floor(diff / 3600)}h ago`
    }

    const clearEvents = () => {
      realtimeStore.clearRecentEvents()
    }

    const reloadPJSIP = async () => {
      try {
        await asteriskAPI.reloadPJSIP()
        // Можно добавить toast уведомление
      } catch (error) {
        console.error('Failed to reload PJSIP:', error)
      }
    }

    const reloadQueues = async () => {
      try {
        await asteriskAPI.reloadQueues()
      } catch (error) {
        console.error('Failed to reload queues:', error)
      }
    }

    const createSnapshot = async () => {
      try {
        await configAPI.createSnapshot('Manual snapshot from dashboard')
      } catch (error) {
        console.error('Failed to create snapshot:', error)
      }
    }

    onMounted(() => {
      loadData()
      realtimeStore.initializeWebSocket()

      // Обновляем uptime каждую секунду
      const uptimeInterval = setInterval(() => {
        // В реальном приложении здесь был бы запрос к Asterisk
        const hours = Math.floor(Date.now() / 3600000) % 24
        const minutes = Math.floor(Date.now() / 60000) % 60
        const seconds = Math.floor(Date.now() / 1000) % 60
        systemUptime.value = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      }, 1000)
    })

    onUnmounted(() => {
      realtimeStore.disconnect()
    })

    return {
      sipStats,
      queueStats,
      trunkStats,
      systemUptime,
      activeCalls,
      activeCallsCount,
      onlineSipPeersCount,
      recentEvents,
      recentEventsCount,
      realtimeConnected,
      systemStatus,
      getCallStatusColor,
      getEventColor,
      getEventDescription,
      formatCallDuration,
      formatTimeAgo,
      clearEvents,
      reloadPJSIP,
      reloadQueues,
      createSnapshot
    }
  }
}
</script>