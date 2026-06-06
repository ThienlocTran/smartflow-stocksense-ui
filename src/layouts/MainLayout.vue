<template>
  <v-app :theme="theme">
    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      color="primary"
    >
      <!-- Logo (expanded) -->
      <div v-if="!rail" class="d-flex align-center justify-space-between px-2 py-3">
        <v-list-item
          prepend-icon="mdi-chart-areaspline"
          title="StockSense"
          nav
          class="pa-1 flex-grow-1"
          style="min-width: 0"
        />
        <v-btn
          icon="mdi-chevron-left"
          variant="text"
          color="white"
          size="small"
          @click="rail = true"
        />
      </div>
      <!-- Expand button (collapsed) -->
      <div v-else class="d-flex justify-center py-3">
        <v-btn
          icon="mdi-chevron-right"
          variant="text"
          color="white"
          size="small"
          @click="rail = false"
        />
      </div>

      <v-divider color="rgba(255,255,255,0.2)" />

      <v-list density="compact" nav class="mt-2">
        <template v-for="item in navItems" :key="item.to">
          <!-- Dự báo AI nav item with badge -->
          <v-list-item
            v-if="item.to === '/forecast'"
            :prepend-icon="item.icon"
            :title="item.title"
            :to="item.to"
            rounded="lg"
            base-color="rgba(255,255,255,0.7)"
            class="mb-1"
          >
            <template #append>
              <!-- Spinning indicator when running -->
              <v-progress-circular
                v-if="forecastStore.isRunning"
                indeterminate
                color="warning"
                size="16"
                width="2"
                class="mr-1"
              />
              <!-- Green dot badge when done -->
              <v-badge
                v-else-if="forecastStore.isDone"
                color="success"
                dot
                inline
              />
            </template>
          </v-list-item>

          <!-- Regular nav items -->
          <v-list-item
            v-else
            :prepend-icon="item.icon"
            :title="item.title"
            :to="item.to"
            rounded="lg"
            base-color="rgba(255,255,255,0.7)"
            class="mb-1"
          />
        </template>
      </v-list>

      <template #append>
        <v-divider color="rgba(255,255,255,0.2)" />
        <v-list density="compact" nav class="py-2">
          <v-list-item
            prepend-icon="mdi-logout"
            title="Đăng xuất"
            rounded="lg"
            color="rgba(255,255,255,0.7)"
            @click="logout"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar elevation="0" border="b" color="surface">
      <v-app-bar-title>
        <span class="text-h6 font-weight-bold text-primary">{{ routeTitle }}</span>
      </v-app-bar-title>
      <template #append>
        <v-btn
          :icon="theme === 'light' ? 'mdi-weather-night' : 'mdi-weather-sunny'"
          variant="text"
          @click="toggleTheme"
        />
        <v-avatar color="primary" size="36" class="mr-3 cursor-pointer">
          <span class="text-caption font-weight-bold text-white">AD</span>
        </v-avatar>
      </template>
    </v-app-bar>

    <!-- Main Content -->
    <v-main :style="{ background: 'rgb(var(--v-theme-background))' }">
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>

    <!-- Forecast completion snackbar -->
    <v-snackbar
      v-model="showForecastSnackbar"
      location="bottom right"
      color="success"
      :timeout="-1"
      multi-line
    >
      <v-icon icon="mdi-check-circle-outline" class="mr-2" />
      Dự báo AI hoàn tất! Nhấn để xem kết quả

      <template #actions>
        <v-btn
          variant="text"
          color="white"
          @click="goToForecast"
        >
          Xem
        </v-btn>
        <v-btn
          icon="mdi-close"
          variant="text"
          color="white"
          size="small"
          @click="dismissForecastSnackbar"
        />
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useForecastStore } from '@/stores/forecast'

const drawer = ref(true)
const rail = ref(false)
const theme = ref('light')
const router = useRouter()
const route = useRoute()
const forecastStore = useForecastStore()

const showForecastSnackbar = ref(false)

// Show snackbar when forecast transitions to done
watch(
  () => forecastStore.isDone,
  (isDone) => {
    if (isDone) {
      showForecastSnackbar.value = true
    }
  }
)

function goToForecast() {
  showForecastSnackbar.value = false
  router.push('/forecast')
}

function dismissForecastSnackbar() {
  showForecastSnackbar.value = false
}

const navItems = [
  { title: 'Tổng quan', icon: 'mdi-view-dashboard-outline', to: '/dashboard' },
  { title: 'Sản phẩm', icon: 'mdi-package-variant-closed', to: '/products' },
  { title: 'Kho hàng', icon: 'mdi-warehouse', to: '/warehouses' },
  { title: 'Tồn kho', icon: 'mdi-clipboard-list-outline', to: '/inventory' },
  { title: 'Dự báo AI', icon: 'mdi-chart-timeline-variant', to: '/forecast' },
  { title: 'Cảnh báo', icon: 'mdi-bell-ring-outline', to: '/alerts' },
]

const routeTitles = {
  Dashboard: 'Tổng quan',
  Products: 'Quản lý Sản phẩm',
  Warehouses: 'Quản lý Kho hàng',
  Inventory: 'Tồn kho',
  Forecast: 'Dự báo AI',
  Alerts: 'Cảnh báo Tái đặt hàng',
}

const routeTitle = computed(() => routeTitles[route.name] || route.name)

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

function logout() {
  router.push('/login')
}
</script>
