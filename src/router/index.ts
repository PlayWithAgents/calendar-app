import { createRouter, createWebHistory } from 'vue-router'
import TwelveHourView from '../views/TwelveHourView.vue'
import SevenDayView from '../views/SevenDayView.vue'
import FourWeekView from '../views/FourWeekView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: '12hour',
      component: TwelveHourView,
    },
    {
      path: '/7day',
      name: '7day',
      component: SevenDayView,
    },
    {
      path: '/4week',
      name: '4week',
      component: FourWeekView,
    },
  ],
})

export default router
