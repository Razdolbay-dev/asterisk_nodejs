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
            @click="openCreateForm"
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
              <div class="flex space-x-2">
                <button
                    @click="editUser(user)"
                    class="btn btn-outline btn-sm"
                    :disabled="user.id === currentUserId"
                    title="Edit User"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                    v-if="hasPermission('users:write') && user.id !== currentUserId"
                    @click="showPasswordForm(user.id, true)"
                    class="btn btn-outline btn-sm"
                    title="Reset Password"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </button>
                <button
                    v-if="hasPermission('users:delete') && user.id !== currentUserId"
                    @click="deleteUser(user)"
                    class="btn btn-danger btn-sm"
                    title="Delete User"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- User Form Modal -->
    <div v-if="showUserForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div class="p-6 border-b">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ selectedUser ? 'Edit User' : 'Create New User' }}
          </h3>
        </div>

        <UserForm
            :user="selectedUser"
            :loading="formLoading"
            :error="formError"
            @close="closeUserForm"
            @submit="handleUserFormSubmit"
        />
      </div>
    </div>

    <!-- Password Form Modal -->
    <div v-if="showPasswordFormModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div class="p-6 border-b">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ isPasswordReset ? 'Reset Password' : 'Change Password' }}
          </h3>
        </div>

        <PasswordForm
            :userId="selectedUserId"
            :isReset="isPasswordReset"
            :loading="passwordLoading"
            :error="passwordError"
            @close="closePasswordForm"
            @submit="handlePasswordFormSubmit"
        />
      </div>
    </div>
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

    const showUserForm = ref(false)
    const showPasswordFormModal = ref(false)
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
      return authStore.user?.permissions?.includes(permission) || false
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

    const openCreateForm = () => {
      selectedUser.value = null
      showUserForm.value = true
    }

    const editUser = (user) => {
      selectedUser.value = user
      showUserForm.value = true
    }

    const showPasswordForm = (userId, isReset = false) => {
      selectedUserId.value = userId
      isPasswordReset.value = isReset
      showPasswordFormModal.value = true
    }

    const deleteUser = async (user) => {
      if (!confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
        return
      }

      const result = await usersStore.deleteUser(user.id)
      if (!result.success) {
        alert(result.error)
      } else {
        await loadData()
      }
    }

    const handleUserFormSubmit = async (formData) => {
      formLoading.value = true
      formError.value = ''

      try {
        let result
        if (selectedUser.value) {
          result = await usersStore.updateUser(selectedUser.value.id, formData)
        } else {
          result = await usersStore.createUser(formData)
        }

        if (result.success) {
          closeUserForm()
          await loadData()
        } else {
          formError.value = result.error
        }
      } catch (err) {
        formError.value = 'An unexpected error occurred'
        console.error('User form error:', err)
      } finally {
        formLoading.value = false
      }
    }

    const handlePasswordFormSubmit = async (passwordData) => {
      passwordLoading.value = true
      passwordError.value = ''

      try {
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
      } catch (err) {
        passwordError.value = 'An unexpected error occurred'
        console.error('Password form error:', err)
      } finally {
        passwordLoading.value = false
      }
    }

    const closeUserForm = () => {
      showUserForm.value = false
      selectedUser.value = null
      formError.value = ''
    }

    const closePasswordForm = () => {
      showPasswordFormModal.value = false
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
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
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
      showUserForm,
      showPasswordFormModal,
      selectedUser,
      selectedUserId,
      isPasswordReset,
      formLoading,
      formError,
      passwordLoading,
      passwordError,
      hasPermission,
      refreshUsers,
      openCreateForm,
      editUser,
      showPasswordForm,
      deleteUser,
      handleUserFormSubmit,
      handlePasswordFormSubmit,
      closeUserForm,
      closePasswordForm,
      getRoleBadgeClass,
      formatDate
    }
  }
}
</script>

<style scoped>
.stat-card {
  @apply bg-white rounded-lg shadow p-6 border-l-4;
}

.data-table {
  @apply min-w-full divide-y divide-gray-200;
}

.data-table thead {
  @apply bg-gray-50;
}

.data-table th {
  @apply px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
}

.data-table td {
  @apply px-6 py-4 whitespace-nowrap text-sm text-gray-900;
}

.data-table tbody tr {
  @apply hover:bg-gray-50;
}

.actions-cell {
  @apply space-x-2;
}

.badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.badge-error {
  @apply bg-red-100 text-red-800;
}

.badge-warning {
  @apply bg-yellow-100 text-yellow-800;
}

.badge-info {
  @apply bg-blue-100 text-blue-800;
}

.badge-success {
  @apply bg-green-100 text-green-800;
}

.btn {
  @apply inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500;
}

.btn-outline {
  @apply border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500;
}

.btn-danger {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
}

.btn-sm {
  @apply px-2 py-1 text-xs;
}

.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.card {
  @apply bg-white rounded-lg shadow;
}
</style>