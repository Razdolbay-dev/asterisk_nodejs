<template>
  <div class="max-w-7xl mx-auto">
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
          <p class="text-gray-600 mt-1">Manage system users and permissions</p>
        </div>
        <button
            v-if="hasPermission('users:write')"
            @click="showCreateForm = true"
            class="btn btn-primary"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>
    </div>

    <!-- Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div class="stat-card border-l-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Users</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats?.total || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">👥</span>
          </div>
        </div>
      </div>

      <div class="stat-card border-l-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Active Users</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats?.active || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">✅</span>
          </div>
        </div>
      </div>

      <div class="stat-card border-l-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Administrators</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats?.byRole?.admin || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">👑</span>
          </div>
        </div>
      </div>

      <div class="stat-card border-l-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Recent Activity</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats?.recentActivity || 0 }}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <span class="text-2xl">📈</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Users Table -->
    <div class="card p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900">System Users</h2>
        <button
            @click="refreshUsers"
            class="btn btn-outline flex items-center space-x-2"
            :disabled="loading"
        >
          <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

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

      <div v-else-if="users.length === 0" class="text-center py-8">
        <div class="text-gray-400 mb-2">No users found</div>
        <div class="text-sm text-gray-500">Create the first user to get started</div>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>Last Login</th>
            <th>Created</th>
            <th v-if="hasPermission('users:write')">Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span class="text-primary-600 font-medium text-sm">
                      {{ user.username.charAt(0).toUpperCase() }}
                    </span>
                </div>
                <div>
                  <div class="font-medium text-gray-900">{{ user.username }}</div>
                  <div class="text-sm text-gray-500">{{ user.email }}</div>
                </div>
              </div>
            </td>
            <td>
                <span :class="['badge', getRoleBadgeClass(user.role)]">
                  {{ user.role }}
                </span>
            </td>
            <td>
                <span :class="['badge', user.isActive ? 'badge-success' : 'badge-error']">
                  {{ user.isActive ? 'Active' : 'Inactive' }}
                </span>
            </td>
            <td class="text-sm text-gray-500">
              {{ user.lastLogin ? formatDate(user.lastLogin) : 'Never' }}
            </td>
            <td class="text-sm text-gray-500">
              {{ formatDate(user.createdAt) }}
            </td>
            <td v-if="hasPermission('users:write')" class="actions-cell">
              <button
                  @click="editUser(user)"
                  class="btn btn-outline btn-sm"
                  :disabled="user.id === currentUserId"
              >
                Edit
              </button>
              <button
                  v-if="hasPermission('users:write') && user.id !== currentUserId"
                  @click="showPasswordForm(user.id, true)"
                  class="btn btn-outline btn-sm"
              >
                Reset Password
              </button>
              <button
                  v-if="hasPermission('users:delete') && user.id !== currentUserId"
                  @click="deleteUser(user)"
                  class="btn btn-danger btn-sm"
              >
                Delete
              </button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <UserForm
        :show="showCreateForm || showEditForm"
        :user="selectedUser"
        :loading="formLoading"
        :error="formError"
        @close="closeForm"
        @submit="handleFormSubmit"
    />

    <PasswordForm
        :show="showPasswordModal"
        :userId="selectedUserId"
        :isReset="isPasswordReset"
        :loading="passwordLoading"
        :error="passwordError"
        @close="closePasswordForm"
        @submit="handlePasswordSubmit"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import UserForm from '@/components/forms/UserForm.vue'
import PasswordForm from '@/components/forms/PasswordForm.vue'

export default {
  name: 'Users',
  components: {
    UserForm,
    PasswordForm
  },
  setup() {
    const usersStore = useUsersStore()
    const authStore = useAuthStore()

    const showCreateForm = ref(false)
    const showEditForm = ref(false)
    const showPasswordModal = ref(false)
    const selectedUser = ref(null)
    const selectedUserId = ref('')
    const isPasswordReset = ref(false)
    const formLoading = ref(false)
    const formError = ref('')
    const passwordLoading = ref(false)
    const passwordError = ref('')

    const users = computed(() => usersStore.users)
    const loading = computed(() => usersStore.loading)
    const error = computed(() => usersStore.error)
    const stats = computed(() => usersStore.stats)
    const currentUserId = computed(() => authStore.user?.id)

    const hasPermission = (permission) => {
      // В реальном приложении здесь была бы проверка прав
      return authStore.userRole === 'admin'
    }

    const loadData = async () => {
      await Promise.all([
        usersStore.fetchUsers(),
        usersStore.fetchUserStats()
      ])
    }

    const refreshUsers = async () => {
      await loadData()
    }

    const editUser = (user) => {
      selectedUser.value = user
      showEditForm.value = true
    }

    const showPasswordForm = (userId, isReset = false) => {
      selectedUserId.value = userId
      isPasswordReset.value = isReset
      showPasswordModal.value = true
    }

    const deleteUser = async (user) => {
      if (!confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
        return
      }

      const result = await usersStore.deleteUser(user.id)
      if (!result.success) {
        alert(result.error)
      } else {
        await loadData() // Refresh data
      }
    }

    const handleFormSubmit = async (formData) => {
      formLoading.value = true
      formError.value = ''

      let result
      if (selectedUser.value) {
        result = await usersStore.updateUser(selectedUser.value.id, formData)
      } else {
        result = await usersStore.createUser(formData)
      }

      if (result.success) {
        closeForm()
        await loadData() // Refresh data
      } else {
        formError.value = result.error
      }

      formLoading.value = false
    }

    const handlePasswordSubmit = async (passwordData) => {
      passwordLoading.value = true
      passwordError.value = ''

      let result
      if (isPasswordReset.value) {
        result = await usersStore.resetPassword(selectedUserId.value, passwordData.newPassword)
      } else {
        result = await usersStore.changePassword(selectedUserId.value, passwordData)
      }

      if (result.success) {
        closePasswordForm()
        alert('Password updated successfully')
      } else {
        passwordError.value = result.error
      }

      passwordLoading.value = false
    }

    const closeForm = () => {
      showCreateForm.value = false
      showEditForm.value = false
      selectedUser.value = null
      formError.value = ''
    }

    const closePasswordForm = () => {
      showPasswordModal.value = false
      selectedUserId.value = ''
      passwordError.value = ''
    }

    const getRoleBadgeClass = (role) => {
      const classes = {
        admin: 'badge-error',
        operator: 'badge-warning',
        viewer: 'badge-info'
      }
      return classes[role] || 'badge-info'
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString()
    }

    onMounted(() => {
      loadData()
    })

    return {
      users,
      loading,
      error,
      stats,
      currentUserId,
      showCreateForm,
      showEditForm,
      showPasswordModal,
      selectedUser,
      selectedUserId,
      isPasswordReset,
      formLoading,
      formError,
      passwordLoading,
      passwordError,
      hasPermission,
      refreshUsers,
      editUser,
      showPasswordForm,
      deleteUser,
      handleFormSubmit,
      handlePasswordSubmit,
      closeForm,
      closePasswordForm,
      getRoleBadgeClass,
      formatDate
    }
  }
}
</script>