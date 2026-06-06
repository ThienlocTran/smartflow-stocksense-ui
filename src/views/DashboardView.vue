<template>
  <div>
    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col
        v-for="stat in stats"
        :key="stat.label"
        cols="12" sm="6" lg="3"
      >
        <v-card rounded="xl" elevation="0" border>
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-body-2 text-medium-emphasis font-weight-medium">{{ stat.label }}</span>
              <v-avatar :color="stat.color" size="40" rounded="lg">
                <v-icon :icon="stat.icon" size="20" color="white" />
              </v-avatar>
            </div>
            <div class="text-h4 font-weight-bold mb-1">
              <v-skeleton-loader v-if="loadingStats" type="text" width="60" height="36" class="mt-1" />
              <span v-else>{{ stat.value }}</span>
            </div>
            <div class="d-flex align-center" style="min-height:20px">
              <template v-if="!loadingStats && stat.trend !== 0">
                <v-icon
                  :icon="stat.trend > 0 ? 'mdi-trending-up' : 'mdi-trending-down'"
                  :color="stat.trend > 0 ? 'success' : 'error'"
                  size="16"
                  class="mr-1"
                />
                <span
                  :class="stat.trend > 0 ? 'text-success' : 'text-error'"
                  class="text-caption font-weight-medium"
                >
                  {{ Math.abs(stat.trend) }}% so với tháng trước
                </span>
              </template>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts Row -->
    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="xl" elevation="0" border>
          <v-card-title class="pa-5 pb-0 text-body-1 font-weight-bold">
            Biến động tồn kho 30 ngày qua
          </v-card-title>
          <v-card-text class="pa-4">
            <div v-if="loadingChart" class="d-flex justify-center align-center" style="height:280px">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <apexchart
              v-else
              type="area"
              height="280"
              :options="chartOptions"
              :series="chartSeries"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="xl" elevation="0" border height="100%">
          <v-card-title class="pa-5 pb-0">
            <div class="d-flex align-center gap-2">
              <v-icon color="error" size="18">mdi-alert-circle</v-icon>
              <span class="text-body-1 font-weight-bold">Sắp hết hàng</span>
            </div>
          </v-card-title>
          <v-card-text class="pa-3">
            <div v-if="loadingLowStock" class="d-flex justify-center py-6">
              <v-progress-circular indeterminate color="primary" size="24" />
            </div>
            <v-list v-else-if="lowStockItems.length" density="compact">
              <v-list-item
                v-for="item in lowStockItems"
                :key="`${item.product_id}-${item.warehouse_id}`"
                rounded="lg"
                class="mb-1"
              >
                <template #prepend>
                  <v-icon
                    :color="item.days_remaining < 7 ? 'error' : item.days_remaining < 14 ? 'warning' : 'success'"
                    icon="mdi-package-variant-closed"
                    size="20"
                  />
                </template>
                <v-list-item-title class="text-body-2 font-weight-medium">{{ item.product_name }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ item.warehouse_name }} &nbsp;·&nbsp; Tồn: {{ item.current_stock.toLocaleString('vi-VN') }} &nbsp;·&nbsp;
                  <span :class="item.days_remaining < 7 ? 'text-error' : item.days_remaining < 14 ? 'text-warning' : ''">
                    ~{{ item.days_remaining }} ngày
                  </span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <div v-else class="text-center text-medium-emphasis text-body-2 py-6">
              Không có sản phẩm nào có nguy cơ hết hàng
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { springApi, aiApi } from '@/api/index.js'

const loadingStats = ref(true)
const loadingChart = ref(true)

const stats = ref([
  { label: 'Tổng sản phẩm', value: '—', icon: 'mdi-package-variant-closed', color: 'primary', trend: 0 },
  { label: 'Tổng kho hàng', value: '—', icon: 'mdi-warehouse', color: 'secondary', trend: 0 },
  { label: 'Cảnh báo mở', value: '—', icon: 'mdi-bell-ring', color: 'warning', trend: 0 },
  { label: 'Độ chính xác AI', value: '—', icon: 'mdi-brain', color: 'success', trend: 0 },
])

const lowStockItems = ref([])
const loadingLowStock = ref(true)
const chartSeries = ref([])

const chartOptions = {
  chart: { toolbar: { show: false } },
  stroke: { curve: 'smooth', width: 2 },
  fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
  xaxis: {
    categories: Array.from({ length: 30 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - 29 + i)
      return `${d.getDate()}/${d.getMonth() + 1}`
    }),
    labels: { rotate: 0, style: { fontSize: '11px' } },
    tickAmount: 6,
  },
  yaxis: { labels: { style: { fontSize: '11px' } } },
  colors: ['#1565C0', '#E53935'],
  legend: { position: 'top' },
  tooltip: { x: { show: true } },
  grid: { borderColor: '#f0f0f0' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (mins < 60) return `${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} giờ trước`
  return `${Math.floor(hrs / 24)} ngày trước`
}

async function fetchStats() {
  try {
    const [productsRes, warehousesRes, alertsRes] = await Promise.all([
      springApi.get('/api/products'),
      springApi.get('/api/warehouses'),
      springApi.get('/api/alerts'),
    ])
    const openCount = alertsRes.data.filter(a => a.status === 'OPEN').length
    stats.value[0].value = String(productsRes.data.length)
    stats.value[1].value = String(warehousesRes.data.length)
    stats.value[2].value = String(openCount)

    try {
      const { data: meta } = await aiApi.get('/api/ai/model-metadata')
      if (meta.length > 0) {
        const winners = meta.filter(m => m.is_winner)
        const avgSmape = winners.length > 0
          ? winners.reduce((s, m) => s + (m.smape ?? 0), 0) / winners.length
          : 0
        stats.value[3].value = winners.length > 0 ? (100 - avgSmape).toFixed(1) + '%' : 'N/A'
      } else {
        stats.value[3].value = 'N/A'
      }
    } catch {
      stats.value[3].value = 'N/A'
    }
  } catch (err) {
    console.error('fetchStats error', err)
  } finally {
    loadingStats.value = false
  }
}

async function fetchLowStock() {
  try {
    const { data } = await aiApi.get('/api/ai/inventory-risk?limit=7')
    lowStockItems.value = data
  } catch (err) {
    console.error('fetchLowStock error', err)
  } finally {
    loadingLowStock.value = false
  }
}

async function fetchChartData() {
  try {
    const { data } = await springApi.get('/api/transactions')
    const today = new Date()
    const buckets = {}
    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(today.getDate() - 29 + i)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      buckets[key] = { in: 0, out: 0 }
    }
    for (const tx of data) {
      const key = tx.createdAt?.substring(0, 10)
      if (buckets[key]) {
        if (tx.transactionType === 'IN') buckets[key].in += tx.quantity ?? 0
        else if (tx.transactionType === 'OUT') buckets[key].out += tx.quantity ?? 0
      }
    }
    const keys = Object.keys(buckets).sort()
    chartSeries.value = [
      { name: 'Nhập kho', data: keys.map(k => buckets[k].in) },
      { name: 'Xuất kho', data: keys.map(k => buckets[k].out) },
    ]
  } catch (err) {
    console.error('fetchChartData error', err)
    chartSeries.value = [
      { name: 'Nhập kho', data: Array(30).fill(0) },
      { name: 'Xuất kho', data: Array(30).fill(0) },
    ]
  } finally {
    loadingChart.value = false
  }
}

onMounted(() => {
  fetchStats()
  fetchLowStock()
  fetchChartData()
})
</script>
