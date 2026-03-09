import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Button as VanButton, Field, Form, Toast } from 'vant'
import 'vant/lib/index.css'
import router from './router'
import App from './App.vue'
import { useUserStore } from './stores/user'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(VanButton)
app.use(Field)
app.use(Form)
app.use(Toast)
app.component('VanButton', VanButton)

async function bootstrap() {
  const userStore = useUserStore()
  await userStore.initSession()
  userStore.subscribeAuth()
  app.mount('#app')
}

bootstrap()
