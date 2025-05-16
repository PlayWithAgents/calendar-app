import { createRouter, createWebHistory } from 'vue-router'
import TwelveHourView from '../views/TwelveHourView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'TwelveHourView',
      component: TwelveHourView,
    },
  ],
})

export default router
