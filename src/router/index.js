import { createRouter } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EditorView from '../views/EditorView.vue'
import { createAppHistory } from './history.js'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/map',
    name: 'editor',
    component: EditorView,
  },
]

const router = createRouter({
  history: createAppHistory(),
  routes,
})

export default router
