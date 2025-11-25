<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <Header v-if="isAuthenticated" />
    <div class="flex pt-16">
      <Sidebar v-if="isAuthenticated" />
      <main :class="['flex-1 min-h-screen transition-all duration-300',
                    isAuthenticated ? 'ml-64' : 'ml-0']">
        <div class="p-6">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Header from '@/components/layout/Header.vue'
import Sidebar from '@/components/layout/Sidebar.vue'

export default {
  name: 'App',
  components: {
    Header,
    Sidebar
  },
  setup() {
    const authStore = useAuthStore()

    const isAuthenticated = computed(() => authStore.isAuthenticated)

    return {
      isAuthenticated
    }
  }
}
</script>