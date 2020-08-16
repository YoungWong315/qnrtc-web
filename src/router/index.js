import Vue from 'vue'
import VueRouter from 'vue-router'
import RouterGuard from './routerGuard'

import Hq from '@/views/Hq'
import Student from '@/views/Student'

Vue.use(VueRouter)

const router = new VueRouter({
  routes: [
    {
      path: '/',
      redirect: '/hq',
    },
    {
      path: '/hq',
      name: 'Hq',
      component: Hq,
    },
    {
      path: '/student',
      name: 'Student',
      component: Student,
    },
  ],
})

new RouterGuard(router).start()

export default router
