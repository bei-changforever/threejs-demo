import { createRouter, createWebHistory } from 'vue-router'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'demo1',
      component: () => import('../views/demo1/index.vue')
    },
    {
      path: "/demo2",
      name: 'demo2',
      component: () => import('../views/demo2/index.vue')
    }
  ]
})

export default router
