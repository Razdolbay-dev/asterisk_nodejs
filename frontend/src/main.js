import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Монтируем приложение сразу - store инициализируется синхронно
app.mount('#app')
console.log('✅ App mounted')