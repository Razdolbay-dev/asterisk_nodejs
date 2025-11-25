<template>
  <div class="data-table-container">
    <div class="table-header">
      <h3>{{ title }}</h3>
      <div class="table-actions">
        <slot name="actions"></slot>
        <button
            v-if="showAddButton"
            @click="$emit('add')"
            class="btn btn-primary"
        >
          Add New
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else-if="items.length === 0" class="empty-state">
      No data available
    </div>

    <table v-else class="data-table">
      <thead>
      <tr>
        <th v-for="column in columns" :key="column.key">
          {{ column.label }}
        </th>
        <th v-if="showActions">Actions</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="item in items" :key="item.id">
        <td v-for="column in columns" :key="column.key">
          <slot
              :name="`column-${column.key}`"
              :value="getNestedValue(item, column.key)"
              :item="item"
          >
            {{ getNestedValue(item, column.key) }}
          </slot>
        </td>
        <td v-if="showActions" class="actions-cell">
          <button
              @click="$emit('edit', item)"
              class="btn btn-sm btn-outline"
          >
            Edit
          </button>
          <button
              @click="$emit('delete', item)"
              class="btn btn-sm btn-danger"
          >
            Delete
          </button>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'DataTable',
  props: {
    title: {
      type: String,
      required: true
    },
    items: {
      type: Array,
      default: () => []
    },
    columns: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    showAddButton: {
      type: Boolean,
      default: true
    },
    showActions: {
      type: Boolean,
      default: true
    }
  },
  emits: ['add', 'edit', 'delete'],
  methods: {
    getNestedValue(obj, path) {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj)
    }
  }
}
</script>

<style scoped>
.data-table-container {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.table-header h3 {
  margin: 0;
  color: #2c3e50;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
  font-style: italic;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background-color: #f8f9fa;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

.data-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #dee2e6;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  border-bottom: none;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.btn-outline {
  background: transparent;
  border: 1px solid #007bff;
  color: #007bff;
}

.btn-outline:hover {
  background: #007bff;
  color: white;
}
</style>