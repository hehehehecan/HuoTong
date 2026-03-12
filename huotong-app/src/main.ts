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
  Popup,
  Loading,
  Overlay,
  Collapse,
  CollapseItem,
  Empty,
  Tag,
  showToast,
} from 'vant'
import 'vant/lib/index.css'
import router from './router'
import App from './App.vue'
import { useUserStore } from './stores/user'
import { onAppResume } from './lib/appLifecycle'
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
app.use(Popup)
app.use(Loading)
app.use(Overlay)
app.use(Collapse)
app.use(CollapseItem)
app.use(Empty)
app.use(Tag)

async function bootstrap() {
  const userStore = useUserStore()
  await userStore.initSession()
  userStore.subscribeAuth()
  // Ensure initial auth state is restored before first route resolution.
  app.use(router)
  await router.isReady()
  app.mount('#app')

  let checkingSession = false
  onAppResume(async () => {
    if (checkingSession) return
    checkingSession = true
    try {
      const sessionState = await userStore.refreshSession()
      if (sessionState !== 'invalid') return

      const currentPath = router.currentRoute.value.fullPath || '/'
      if (currentPath.startsWith('/login')) return
      showToast({
        type: 'fail',
        message: '登录状态已失效，请重新登录',
      })
      await router.replace({
        path: '/login',
        query: { redirect: currentPath },
      })
    } finally {
      checkingSession = false
    }
  })
}

bootstrap()
