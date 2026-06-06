import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue') },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/DashboardView.vue') },
      { path: 'products', name: 'Products', component: () => import('../views/ProductsView.vue') },
      { path: 'warehouses', name: 'Warehouses', component: () => import('../views/WarehousesView.vue') },
      { path: 'inventory', name: 'Inventory', component: () => import('../views/InventoryView.vue') },
      { path: 'forecast', name: 'Forecast', component: () => import('../views/ForecastView.vue') },
      { path: 'alerts', name: 'Alerts', component: () => import('../views/AlertsView.vue') },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
