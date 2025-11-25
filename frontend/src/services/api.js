import axios from 'axios'

// Базовый URL API
const API_BASE_URL = 'http://192.168.88.182:3000/api'

// Создаем экземпляр axios
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// Interceptor для добавления токена к запросам
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Interceptor для обработки ответов
api.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        if (error.response?.status === 401) {
            // Токен истек или невалидный
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// API методы
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    getMe: () => api.get('/auth/me'),
    refresh: () => api.post('/auth/refresh'),
    logout: () => api.post('/auth/logout')
}

export const sipAPI = {
    getAccounts: () => api.get('/sip'),
    getAccount: (id) => api.get(`/sip/${id}`),
    createAccount: (data) => api.post('/sip', data),
    updateAccount: (id, data) => api.put(`/sip/${id}`, data),
    deleteAccount: (id) => api.delete(`/sip/${id}`)
}

export const queuesAPI = {
    getQueues: () => api.get('/queues'),
    getQueue: (id) => api.get(`/queues/${id}`),
    createQueue: (data) => api.post('/queues', data),
    updateQueue: (id, data) => api.put(`/queues/${id}`, data),
    deleteQueue: (id) => api.delete(`/queues/${id}`),
    addMember: (id, member) => api.post(`/queues/${id}/members`, member),
    removeMember: (id, memberInterface) => api.delete(`/queues/${id}/members/${memberInterface}`)
}

export const trunksAPI = {
    getTrunks: () => api.get('/trunks'),
    getTrunk: (id) => api.get(`/trunks/${id}`),
    createTrunk: (data) => api.post('/trunks', data),
    updateTrunk: (id, data) => api.put(`/trunks/${id}`, data),
    deleteTrunk: (id) => api.delete(`/trunks/${id}`)
}

export const asteriskAPI = {
    getStatus: () => api.get('/asterisk/status'),
    getSystemInfo: () => api.get('/asterisk/system-info'),
    getSIPPeers: () => api.get('/asterisk/sip-peers'),
    getQueuesStatus: () => api.get('/asterisk/queues'),
    reloadPJSIP: () => api.post('/asterisk/reload/pjsip'),
    reloadQueues: () => api.post('/asterisk/reload/queues'),
    reloadAll: () => api.post('/asterisk/reload/all')
}

export const configAPI = {
    getSnapshots: () => api.get('/config/snapshots'),
    createSnapshot: (comment) => api.post('/config/snapshots', { comment }),
    restoreSnapshot: (id) => api.post(`/config/snapshots/${id}/restore`),
    deleteSnapshot: (id) => api.delete(`/config/snapshots/${id}`),

    // Новые методы для raw-конфигов
    getRawConfigFiles: () => api.get('/config/raw'),
    getRawConfigFile: (filename) => api.get(`/config/raw/${filename}`),
    updateRawConfigFile: (filename, data) => api.put(`/config/raw/${filename}`, data),
    deleteRawConfigFile: (filename) => api.delete(`/config/raw/${filename}`)
}

export default api