<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold">Cảnh báo tồn kho</h2>
        <p class="text-body-2 text-medium-emphasis mt-1">Theo dõi và xử lý các cảnh báo tồn kho từ hệ thống</p>
        <p class="text-caption text-medium-emphasis mt-1">
          <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
          Cảnh báo dựa trên dự báo AI — tồn kho hiện tại có thể vẫn đủ nhưng sẽ thiếu trong 30 ngày tới
        </p>
      </div>
    </div>

    <!-- Summary Chips -->
    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-text class="pa-4">
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              placeholder="Tìm theo tên sản phẩm hoặc tên kho..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              rounded="lg"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filterStatus"
              :items="statusOptions"
              label="Trạng thái"
              variant="outlined"
              density="compact"
              rounded="lg"
              hide-details
            />
          </v-col>
        </v-row>
        <v-row class="mt-2">
          <v-col cols="auto">
            <v-chip color="primary" variant="tonal" class="mr-2">
              Tổng: {{ alerts.length }}
            </v-chip>
            <v-chip color="error" variant="tonal" class="mr-2">
              Chưa xử lý: {{ unresolvedCount }}
            </v-chip>
            <v-chip color="success" variant="tonal">
              Đã xử lý: {{ resolvedCount }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card rounded="xl" elevation="0" border>
      <v-data-table
        :headers="headers"
        :items="filteredAlerts"
        :loading="loading"
        loading-text="Đang tải dữ liệu..."
        no-data-text="Không có cảnh báo nào"
        items-per-page-text="Hiển thị"
        :items-per-page="10"
        rounded="xl"
      >
        <template #item.productName="{ item }">
          <span class="font-weight-medium">{{ item.productName || ('SP #' + item.productId) }}</span>
        </template>
        <template #item.warehouseName="{ item }">
          <span class="text-medium-emphasis">{{ item.warehouseName || ('Kho #' + item.warehouseId) }}</span>
        </template>
        <template #item.alertDate="{ item }">
          <span class="text-body-2">{{ formatDate(item.alertDate) }}</span>
        </template>
        <template #item.forecastedStock="{ item }">
          <div>
            <v-chip
              v-if="item.forecastedStock === 0"
              color="error" size="small" variant="tonal"
            >
              Sẽ hết hàng
            </v-chip>
            <span v-else :class="item.forecastedStock < item.threshold ? 'text-error font-weight-medium' : ''">
              {{ item.forecastedStock.toLocaleString('vi-VN') }}
            </span>
            <div class="text-caption text-medium-emphasis">dự báo 30 ngày tới</div>
          </div>
        </template>
        <template #item.recommendedOrderQty="{ item }">
          <v-chip v-if="item.recommendedOrderQty" color="warning" size="small" variant="tonal">
            {{ item.recommendedOrderQty.toLocaleString('vi-VN') }}
          </v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
        <template #item.threshold="{ item }">
          <span class="text-medium-emphasis">{{ item.threshold }}</span>
        </template>
        <template #item.status="{ item }">
          <v-chip
            :color="item.status === 'RESOLVED' ? 'success' : 'error'"
            variant="tonal"
            size="small"
          >
            {{ item.status === 'RESOLVED' ? 'Đã xử lý' : 'Chưa xử lý' }}
          </v-chip>
        </template>
        <template #item.createdAt="{ item }">
          <span class="text-caption text-medium-emphasis">{{ formatDate(item.createdAt) }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            v-if="item.status !== 'RESOLVED'"
            size="small"
            color="success"
            variant="tonal"
            rounded="lg"
            :loading="resolvingId === item.id"
            @click="resolveAlert(item)"
          >
            Đánh dấu đã xử lý
          </v-btn>
          <v-icon v-else icon="mdi-check-circle" color="success" size="20" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="lg" timeout="3000" location="bottom right">
      <div class="d-flex align-center gap-2">
        <v-icon :icon="snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'" />
        {{ snackbar.text }}
      </div>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { springApi } from '../api/index.js'

const alerts = ref([])
const loading = ref(false)
const resolvingId = ref(null)
const search = ref('')
const filterStatus = ref('Tất cả')
const snackbar = ref({ show: false, text: '', color: 'success' })

const statusOptions = ['Tất cả', 'Chưa xử lý', 'Đã xử lý']

const headers = [
  { title: 'Sản phẩm', key: 'productName' },
  { title: 'Kho', key: 'warehouseName', width: '140px' },
  { title: 'Dự kiến hết hàng', key: 'alertDate', width: '160px' },
  { title: 'Còn lại sau 30 ngày', key: 'forecastedStock', width: '150px', align: 'center' },
  { title: 'Ngưỡng tối thiểu', key: 'threshold', width: '150px', align: 'center' },
  { title: 'Cần đặt hàng', key: 'recommendedOrderQty', width: '130px', align: 'center' },
  { title: 'Trạng thái', key: 'status', width: '130px', align: 'center' },
  { title: 'Ngày tạo', key: 'createdAt', width: '120px' },
  { title: 'Thao tác', key: 'actions', sortable: false, width: '180px', align: 'center' },
]

const unresolvedCount = computed(() => alerts.value.filter(a => a.status === 'OPEN').length)
const resolvedCount = computed(() => alerts.value.filter(a => a.status === 'RESOLVED').length)

const filteredAlerts = computed(() => {
  return alerts.value
    .filter(a => {
      const matchSearch = !search.value ||
        a.productName?.toLowerCase().includes(search.value.toLowerCase()) ||
        a.warehouseName?.toLowerCase().includes(search.value.toLowerCase())
      const matchStatus =
        filterStatus.value === 'Tất cả' ||
        (filterStatus.value === 'Chưa xử lý' && a.status === 'OPEN') ||
        (filterStatus.value === 'Đã xử lý' && a.status === 'RESOLVED')
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'OPEN' ? -1 : 1
      const ratioA = a.threshold > 0 ? a.forecastedStock / a.threshold : Infinity
      const ratioB = b.threshold > 0 ? b.forecastedStock / b.threshold : Infinity
      return ratioA - ratioB
    })
})

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

function showSnackbar(text, color = 'success') {
  snackbar.value = { show: true, text, color }
}

async function fetchAlerts() {
  loading.value = true
  try {
    const res = await springApi.get('/api/alerts')
    alerts.value = res.data
  } catch {
    showSnackbar('Không thể tải danh sách cảnh báo', 'error')
  } finally {
    loading.value = false
  }
}

async function resolveAlert(item) {
  resolvingId.value = item.id
  try {
    await springApi.patch(`/api/alerts/${item.id}/resolve`)
    showSnackbar('Đã đánh dấu cảnh báo là đã xử lý')
    fetchAlerts()
  } catch {
    showSnackbar('Không thể cập nhật trạng thái cảnh báo', 'error')
  } finally {
    resolvingId.value = null
  }
}

onMounted(fetchAlerts)
</script>
