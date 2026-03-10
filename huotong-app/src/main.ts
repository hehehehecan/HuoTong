import { createApp } from 'vue'
import { createPinia } from 'pinia'
import {
  Button as VanButton,
  Field,
  Form,
  Toast,
  NavBar,
  Tabbar,
  TabbarItem,
  List,
  Cell,
  CellGroup,
  PullRefresh,
  Search,
  Dialog,
} from 'vant'
import 'vant/lib/index.css'
import router from './router'
import App from './App.vue'
import { useUserStore } from './stores/user'
import './style.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(VanButton)
app.use(Field)
app.use(Form)
app.use(Toast)
app.use(NavBar)
app.use(Tabbar)
app.use(TabbarItem)
app.use(List)
app.use(Cell)
app.use(CellGroup)
app.use(PullRefresh)
app.use(Search)
app.use(Dialog)

async function bootstrap() {
  const userStore = useUserStore()
  await userStore.initSession()
  userStore.subscribeAuth()
  // Ensure initial auth state is restored before first route resolution.
  app.use(router)
  await router.isReady()
  app.mount('#app')
}

bootstrap()
