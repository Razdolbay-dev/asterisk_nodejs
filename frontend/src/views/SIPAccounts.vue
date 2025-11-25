<template>
  <div class="sip-accounts max-w-7xl mx-auto">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-900">SIP Accounts</h1>
      <p class="text-gray-600 mt-1">Manage your SIP accounts and extensions</p>
    </div>

    <DataTable
        title=""
        :items="accounts"
        :columns="columns"
        :loading="loading"
        :error="error"
        @add="showCreateForm = true"
        @edit="handleEdit"
        @delete="handleDelete"
    >
      <template #column-status="{ value }">
        <span :class="['badge', value === 'active' ? 'badge-success' : 'badge-error']">
          {{ value }}
        </span>
      </template>

      <template #column-createdAt="{ value }">
        {{ formatDate(value) }}
      </template>
    </DataTable>

    <SIPForm
        :show="showCreateForm || showEditForm"
        :account="selectedAccount"
        :loading="formLoading"
        :error="formError"
        @close="closeForm"
        @submit="handleFormSubmit"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useSipStore } from '@/stores/sip'
import DataTable from '@/components/ui/DataTable.vue'
import SIPForm from '@/components/forms/SIPForm.vue'

export default {
  name: 'SIPAccounts',
  components: {
    DataTable,
    SIPForm
  },
  setup() {
    const sipStore = useSipStore()

    const showCreateForm = ref(false)
    const showEditForm = ref(false)
    const selectedAccount = ref(null)
    const formLoading = ref(false)
    const formError = ref('')

    const accounts = computed(() => sipStore.accounts)
    const loading = computed(() => sipStore.loading)
    const error = computed(() => sipStore.error)

    const columns = [
      { key: 'id', label: 'SIP ID' },
      { key: 'username', label: 'Username' },
      { key: 'context', label: 'Context' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created' }
    ]

    const loadAccounts = () => {
      sipStore.fetchAccounts()
    }

    const handleEdit = (account) => {
      selectedAccount.value = account
      showEditForm.value = true
    }

    const handleDelete = async (account) => {
      if (confirm(`Are you sure you want to delete SIP account ${account.id}?`)) {
        const result = await sipStore.deleteAccount(account.id)
        if (!result.success) {
          alert(result.error)
        }
      }
    }

    const handleFormSubmit = async (formData) => {
      formLoading.value = true
      formError.value = ''

      let result
      if (selectedAccount.value) {
        result = await sipStore.updateAccount(selectedAccount.value.id, formData)
      } else {
        result = await sipStore.createAccount(formData)
      }

      if (result.success) {
        closeForm()
        loadAccounts()
      } else {
        formError.value = result.error
      }

      formLoading.value = false
    }

    const closeForm = () => {
      showCreateForm.value = false
      showEditForm.value = false
      selectedAccount.value = null
      formError.value = ''
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString()
    }

    onMounted(() => {
      loadAccounts()
    })

    return {
      accounts,
      loading,
      error,
      columns,
      showCreateForm,
      showEditForm,
      selectedAccount,
      formLoading,
      formError,
      handleEdit,
      handleDelete,
      handleFormSubmit,
      closeForm,
      formatDate
    }
  }
}
</script>

<style scoped>
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