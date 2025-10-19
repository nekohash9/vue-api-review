import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/orders' },
  { path: '/orders', component: () => import('../pages/OrdersPage.vue') },
  { path: '/sales', component: () => import('../pages/SalesPage.vue') },
  { path: '/incomes', component: () => import('../pages/IncomesPage.vue') },
  { path: '/stocks', component: () => import('../pages/StocksPage.vue') },
]

const router = createRouter({ history: createWebHistory(), routes })
export default router
