import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { hydrateFromChromeStorage } from './storage.js'

async function bootstrap() {
  await hydrateFromChromeStorage().catch((e) => {
    console.warn('storage hydrate failed', e)
  })
  const app = createApp(App)
  app.use(router)
  app.mount('#app')
}

bootstrap()
