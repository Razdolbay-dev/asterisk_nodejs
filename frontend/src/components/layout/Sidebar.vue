<template>
  <aside class="fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 overflow-y-auto">
    <nav class="p-4 space-y-2">
      <router-link
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          class="nav-item group"
          :class="{ 'active': $route.path === item.to }"
      >
        <span class="flex-shrink-0 w-5 h-5 text-gray-400 group-hover:text-primary-600 group-[.active]:text-primary-600 transition-colors">
          {{ item.icon }}
        </span>
        <span class="ml-3 font-medium text-gray-700 group-hover:text-primary-600 group-[.active]:text-primary-600 transition-colors">
          {{ item.text }}
        </span>
      </router-link>
    </nav>

    <!-- Divider -->
    <div class="px-4 py-2">
      <div class="border-t border-gray-200"></div>
    </div>

    <!-- System Status -->
    <div class="px-4 py-3">
      <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
        System
      </div>
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">Asterisk</span>
          <span class="flex items-center">
            <span class="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            <span class="text-green-600 font-medium">Online</span>
          </span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'Sidebar',
  setup() {
    const menuItems = [
      { to: '/', text: 'Dashboard', icon: '📊' },
      { to: '/sip', text: 'SIP Accounts', icon: '📞' },
      { to: '/queues', text: 'Queues', icon: '👥' },
      { to: '/trunks', text: 'Trunks', icon: '🔗' },
      { to: '/config', text: 'Config Manager', icon: '⚙️' }
    ]

    return {
      menuItems
    }
  }
}
</script>