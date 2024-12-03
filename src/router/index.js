import { createRouter, createMemoryHistory } from 'vue-router'
import Control from '../views/Control.vue'
import Preview from '../views/Preview.vue'

const routes = [
  {
    path: '/control',
    name: 'Control',
    component: Control
  },
  {
    path: '/',
    name: 'Preview',
    component: Preview
  }
]

const router = createRouter({
  history: createMemoryHistory(),
  routes
})

export default router