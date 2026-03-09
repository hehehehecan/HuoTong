import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Button as VanButton } from 'vant'
import 'vant/lib/index.css'
import router from './router'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.component('VanButton', VanButton)
app.mount('#app')
