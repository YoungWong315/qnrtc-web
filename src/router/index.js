import Vue from 'vue'
import VueRouter from 'vue-router'
import RouterGuard from './routerGuard'

import Hq from '@/views/Hq'
import Teacher from '@/views/Teacher'
import Student from '@/views/Student'

Vue.use(VueRouter)

const router = new VueRouter({
  routes: [
    {
      path: '/hq',
      name: 'Hq',
      component: Hq,
    },
    {
      path: '/teacher',
      name: 'Teacher',
      component: Teacher,
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