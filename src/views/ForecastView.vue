<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h2 class="text-h5 font-weight-bold">Dự báo AI</h2>
      <p class="text-body-2 text-medium-emphasis mt-1">
        Chạy mô hình AI cạnh tranh để dự báo nhu cầu tồn kho
      </p>
    </div>

    <!-- Step 1: Selection Card -->
    <v-card rounded="xl" elevation="0" border class="mb-5">
      <v-card-title class="pa-5 pb-3">
        <div class="d-flex align-center gap-2">
          <v-avatar color="primary" size="32" rounded="lg">
            <v-icon size="18" color="white">mdi-tune</v-icon>
          </v-avatar>
          <span class="text-body-1 font-weight-bold">Chọn Sản phẩm & Kho hàng</span>
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-5">
        <v-row align="center">
          <v-col cols="12" sm="4">
            <v-select
              v-model="selectedProductId"
              :items="products"
              item-title="name"
              item-value="id"
              label="Sản phẩm"
              variant="outlined"
              rounded="lg"
              density="comfortable"
              prepend-inner-icon="mdi-package-variant-closed"
              :loading="loadingProducts"
              :disabled="forecasting"
              clearable
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="selectedWarehouseId"
              :items="warehouses"
              item-title="name"
              item-value="id"
              label="Kho hàng"
              variant="outlined"
              rounded="lg"
              density="comfortable"
              prepend-inner-icon="mdi-warehouse"
              :loading="loadingWarehouses"
              :disabled="forecasting"
              clearable
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-btn
              color="primary"
              rounded="lg"
              elevation="0"
              size="large"
              block
              :loading="forecasting"
              :disabled="!selectedProductId || !selectedWarehouseId || forecasting || forecastStore.isRunning"
              prepend-icon="mdi-brain"
              @click="runForecast(true)"
            >
              Chạy Dự báo AI
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Loading State: POST đang in-flight (rất ngắn) -->
    <v-card v-if="forecasting" rounded="xl" elevation="0" border class="mb-5">
      <v-card-text class="pa-8 text-center">
        <v-progress-circular indeterminate color="primary" size="48" width="4" class="mb-3" />
        <p class="text-body-1 font-weight-medium">Đang khởi động...</p>
      </v-card-text>
    </v-card>

    <!-- Running in background state -->
    <v-card v-if="forecastStore.isRunning && !forecasting" rounded="xl" elevation="0" border class="mb-5" color="primary" variant="tonal">
      <v-card-text class="pa-6">
        <div class="d-flex align-center gap-4">
          <v-progress-circular indeterminate color="primary" size="48" width="4" />
          <div>
            <p class="text-body-1 font-weight-bold mb-1">Đang huấn luyện mô hình AI...</p>
            <p class="text-body-2 text-medium-emphasis">
              Quá trình này mất 2–3 phút. Bạn có thể di chuyển sang trang khác — kết quả sẽ hiện khi hoàn tất.
            </p>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Step 2: Forecast Results -->
    <template v-if="forecastResult && !forecasting">

      <!-- Alert notification after forecast -->
      <v-alert
        v-if="forecastResult && forecastResult.alerts_created > 0"
        type="warning"
        variant="tonal"
        rounded="lg"
        class="mb-4"
        icon="mdi-bell-ring"
      >
        <div class="d-flex align-center justify-space-between">
          <span>
            Phát hiện <strong>{{ forecastResult.alerts_created }} cảnh báo tái đặt hàng</strong> — tồn kho dự báo thấp hơn ngưỡng tối thiểu
          </span>
          <v-btn
            variant="tonal"
            color="warning"
            size="small"
            rounded="lg"
            class="ml-4"
            to="/alerts"
          >
            Xem cảnh báo
          </v-btn>
        </div>
      </v-alert>

      <!-- Winner Banner -->
      <v-card
        rounded="xl"
        elevation="0"
        border
        class="mb-5"
        :style="`border-color: ${winnerColor} !important; border-width: 2px !important;`"
      >
        <v-card-text class="pa-5">
          <div class="d-flex align-center justify-space-between flex-wrap gap-3">
            <div class="d-flex align-center gap-3">
              <v-avatar :color="winnerColor" size="56" rounded="xl">
                <v-icon size="32" color="white">mdi-trophy</v-icon>
              </v-avatar>
              <div>
                <p class="text-caption text-medium-emphasis font-weight-medium text-uppercase mb-1">
                  Mô hình chiến thắng
                </p>
                <p class="text-h5 font-weight-bold" :style="`color: ${winnerColor}`">
                  {{ winnerLabel }}
                </p>
                <p class="text-body-2 text-medium-emphasis">
                  sMAPE thấp nhất:
                  <strong>{{ forecastResult.results[forecastResult.competition_winner]?.smape?.toFixed(2) }}%</strong>
                </p>
              </div>
            </div>
            <div class="d-flex align-center gap-2">
              <v-chip
                v-if="forecastResult.saved_to_db"
                color="success"
                rounded="lg"
                variant="tonal"
                prepend-icon="mdi-check-circle"
                size="large"
              >
                Đã lưu vào hệ thống
              </v-chip>
              <v-chip
                color="primary"
                rounded="lg"
                variant="tonal"
                size="small"
              >
                SP: {{ forecastResult.product_id }} / Kho: {{ forecastResult.warehouse_id }}
              </v-chip>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Cluster Insight Card -->
      <v-card v-if="selectedCluster && forecastResult && !forecasting" rounded="xl" elevation="0" border class="mb-5">
        <v-card-text class="pa-4">
          <div class="d-flex align-center gap-2 flex-wrap">
            <v-icon color="primary" size="18">mdi-chart-scatter-plot</v-icon>
            <span class="text-body-2 font-weight-medium">Phân tích hành vi sản phẩm</span>
            <v-chip color="primary" size="small" rounded="lg" variant="tonal">
              Cụm {{ selectedCluster.cluster_id + 1 }}
            </v-chip>
            <v-chip
              :color="selectedCluster.volatility > 0.5 ? 'error' : selectedCluster.volatility > 0.2 ? 'warning' : 'success'"
              size="small" rounded="lg" variant="tonal"
            >{{ selectedCluster.volatility > 0.5 ? 'Biến động cao' : selectedCluster.volatility > 0.2 ? 'Biến động vừa' : 'Ổn định' }}</v-chip>
            <v-chip v-if="selectedCluster.trend > 0.05" color="success" size="small" rounded="lg" variant="tonal" prepend-icon="mdi-trending-up">Xu hướng tăng</v-chip>
            <v-chip v-else-if="selectedCluster.trend < -0.05" color="error" size="small" rounded="lg" variant="tonal" prepend-icon="mdi-trending-down">Xu hướng giảm</v-chip>
            <v-chip v-if="selectedCluster.seasonality > 0.3" color="deep-purple" size="small" rounded="lg" variant="tonal" prepend-icon="mdi-calendar-sync">Mùa vụ</v-chip>
            <v-spacer />
            <span class="text-caption text-medium-emphasis">Khuyến nghị:</span>
            <v-chip
              :color="selectedCluster.best_model === 'prophet' ? 'primary' : selectedCluster.best_model === 'ets' ? 'success' : 'deep-orange'"
              size="small" rounded="lg" variant="tonal"
            >{{ selectedCluster.best_model }}</v-chip>
            <v-chip
              :color="clusterMatchesWinner ? 'success' : 'warning'"
              size="small" rounded="lg"
              :prepend-icon="clusterMatchesWinner ? 'mdi-check-circle' : 'mdi-alert-circle-outline'"
            >{{ clusterMatchesWinner ? 'Khớp kết quả thực tế' : 'Thực tế: ' + forecastResult.competition_winner }}</v-chip>
          </div>
        </v-card-text>
      </v-card>

      <!-- Model Competition Table -->
      <v-card rounded="xl" elevation="0" border class="mb-5">
        <v-card-title class="pa-5 pb-2">
          <div class="d-flex align-center gap-2">
            <v-icon color="primary">mdi-tournament</v-icon>
            <span class="text-body-1 font-weight-bold">Kết quả cạnh tranh mô hình</span>
          </div>
          <p class="text-body-2 text-medium-emphasis mt-1 font-weight-regular">
            3 mô hình AI chạy song song trên cùng dữ liệu. sMAPE càng thấp càng chính xác — mô hình thắng được dùng để tính dự báo tồn kho.
          </p>
        </v-card-title>
        <v-divider />
        <v-card-text class="pa-0">
          <v-table>
            <thead>
              <tr>
                <th class="text-left pa-4 text-body-2 font-weight-bold">Mô hình</th>
                <th class="text-center pa-4 text-body-2 font-weight-bold">
                  sMAPE
                  <v-tooltip text="Thấp hơn = tốt hơn">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" size="14" class="ml-1">mdi-information-outline</v-icon>
                    </template>
                  </v-tooltip>
                </th>
                <th class="text-center pa-4 text-body-2 font-weight-bold">Dự báo 7 ngày</th>
                <th class="text-center pa-4 text-body-2 font-weight-bold">Dự báo 14 ngày</th>
                <th class="text-center pa-4 text-body-2 font-weight-bold">Dự báo 30 ngày</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="model in modelRows"
                :key="model.key"
                :class="model.key === forecastResult.competition_winner ? 'winner-row' : ''"
              >
                <td class="pa-4">
                  <div class="d-flex align-center gap-2">
                    <v-icon
                      v-if="model.key === forecastResult.competition_winner"
                      color="amber-darken-2"
                      size="18"
                    >mdi-trophy</v-icon>
                    <v-icon v-else size="18" color="medium-emphasis">mdi-robot-outline</v-icon>
                    <span
                      class="font-weight-medium"
                      :class="model.key === forecastResult.competition_winner ? 'text-primary' : ''"
                    >{{ model.label }}</span>
                    <v-chip
                      v-if="model.key === forecastResult.competition_winner"
                      color="primary"
                      size="x-small"
                      rounded="lg"
                      variant="tonal"
                    >
                      Winner
                    </v-chip>
                  </div>
                </td>
                <td class="text-center pa-4">
                  <v-chip
                    :color="model.key === forecastResult.competition_winner ? 'success' : 'default'"
                    size="small"
                    rounded="lg"
                    variant="tonal"
                    class="font-weight-medium"
                  >
                    {{ forecastResult.results[model.key]?.smape?.toFixed(2) }}%
                  </v-chip>
                </td>
                <td class="text-center pa-4 font-weight-medium">
                  {{ forecastResult.results[model.key]?.forecast_7d?.toLocaleString('vi-VN') }}
                </td>
                <td class="text-center pa-4 font-weight-medium">
                  {{ forecastResult.results[model.key]?.forecast_14d?.toLocaleString('vi-VN') }}
                </td>
                <td class="text-center pa-4">
                  <span
                    class="font-weight-bold"
                    :class="model.key === forecastResult.competition_winner ? 'text-primary' : ''"
                  >
                    {{ forecastResult.results[model.key]?.forecast_30d?.toLocaleString('vi-VN') }}
                  </span>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
      </v-card>

      <!-- Charts Row -->
      <v-row class="mb-5">
        <!-- Bar Chart: 30-day comparison -->
        <v-col cols="12" md="5">
          <v-card rounded="xl" elevation="0" border height="100%">
            <v-card-title class="pa-5 pb-0">
              <div class="d-flex align-center gap-2">
                <v-icon color="primary" size="20">mdi-chart-bar</v-icon>
                <span class="text-body-2 font-weight-bold">So sánh dự báo 30 ngày</span>
              </div>
            </v-card-title>
            <v-card-text class="pa-4">
              <apexchart
                type="bar"
                height="260"
                :options="barChartOptions"
                :series="barChartSeries"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Line Chart: Timeline forecast -->
        <v-col cols="12" md="7">
          <v-card rounded="xl" elevation="0" border height="100%">
            <v-card-title class="pa-5 pb-0">
              <div class="d-flex align-center gap-2">
                <v-icon color="primary" size="20">mdi-chart-line</v-icon>
                <span class="text-body-2 font-weight-bold">Đường dự báo theo thời gian (7 / 14 / 30 ngày)</span>
              </div>
            </v-card-title>
            <v-card-text class="pa-4">
              <apexchart
                type="line"
                height="260"
                :options="lineChartOptions"
                :series="lineChartSeries"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Error State -->
    <v-alert
      v-if="forecastError"
      type="error"
      rounded="xl"
      variant="tonal"
      class="mb-5"
      closable
      @click:close="forecastError = null"
    >
      <strong>Dự báo thất bại:</strong> {{ forecastError }}
    </v-alert>

    <!-- Bottom Tabs: Clusters & Drift -->
    <v-card rounded="xl" elevation="0" border>
      <v-tabs v-model="analyticsTab" color="primary" class="px-4 pt-2">
        <v-tab value="clusters" class="text-body-2 font-weight-medium">
          <v-icon start>mdi-scatter-plot</v-icon>
          Phân cụm K-Means
        </v-tab>
        <v-tab value="drift" class="text-body-2 font-weight-medium">
          <v-icon start>mdi-chart-bell-curve-cumulative</v-icon>
          Phát hiện Drift
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-tabs-window v-model="analyticsTab">
        <!-- K-Means Clusters Tab -->
        <v-tabs-window-item value="clusters">
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <div>
                <p class="text-body-2 font-weight-medium mb-1">Phân nhóm hành vi sản phẩm</p>
                <p class="text-body-2 text-medium-emphasis">
                  K-Means phân tích lịch sử bán hàng và chia sản phẩm thành 4 nhóm theo mức biến động, xu hướng và tính mùa vụ.
                  Mỗi nhóm được gán mô hình AI phù hợp nhất dựa trên kết quả dự báo thực tế.
                  Nên chạy lại sau khi có thêm dữ liệu forecast mới.
                </p>
              </div>
              <v-btn
                size="small"
                variant="tonal"
                color="primary"
                rounded="lg"
                prepend-icon="mdi-brain"
                :loading="reclusterLoading"
                class="ml-4 flex-shrink-0"
                @click="runClustering"
              >
                Chạy lại phân cụm
              </v-btn>
            </div>
            <v-data-table
              :headers="clusterHeaders"
              :items="clusterItems"
              :loading="loadingClusters"
              item-value="product_id"
              rounded="lg"
              hover
            >
              <template #[`item.product_id`]="{ item }">
                <span class="font-weight-medium">{{ productName(item.product_id) }}</span>
              </template>
              <template #[`item.cluster_id`]="{ item }">
                <v-chip
                  :color="clusterColors[item.cluster_id % clusterColors.length]"
                  size="small"
                  rounded="lg"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  Cụm {{ item.cluster_id + 1 }}
                </v-chip>
              </template>
              <template #[`item.volatility`]="{ item }">
                <v-chip
                  :color="item.volatility > 0.5 ? 'error' : item.volatility > 0.2 ? 'warning' : 'success'"
                  size="small" rounded="lg" variant="tonal"
                >
                  {{ item.volatility > 0.5 ? 'Cao' : item.volatility > 0.2 ? 'Vừa' : 'Thấp' }}
                </v-chip>
              </template>
              <template #[`item.trend`]="{ item }">
                <v-chip
                  :color="item.trend > 0.05 ? 'success' : item.trend < -0.05 ? 'error' : 'default'"
                  size="small" rounded="lg" variant="tonal"
                  :prepend-icon="item.trend > 0.05 ? 'mdi-trending-up' : item.trend < -0.05 ? 'mdi-trending-down' : 'mdi-minus'"
                >
                  {{ item.trend > 0.05 ? 'Tăng' : item.trend < -0.05 ? 'Giảm' : 'Ổn định' }}
                </v-chip>
              </template>
              <template #[`item.seasonality`]="{ item }">
                <v-chip
                  :color="item.seasonality > 0.3 ? 'deep-purple' : item.seasonality > 0.1 ? 'secondary' : 'default'"
                  size="small" rounded="lg" variant="tonal"
                >
                  {{ item.seasonality > 0.3 ? 'Mạnh' : item.seasonality > 0.1 ? 'Nhẹ' : 'Không' }}
                </v-chip>
              </template>
              <template #[`item.best_model`]="{ item }">
                <div class="d-flex align-center ga-2">
                  <v-chip :color="modelChipColor(item.best_model)" size="small" rounded="lg" variant="tonal">
                    {{ modelLabel(item.best_model) }}
                  </v-chip>
                  <span v-if="item.model_source === 'forecast'" class="d-flex align-center ga-1 text-success text-caption">
                    <v-icon icon="mdi-check-circle" size="14" />
                    Thực tế
                  </span>
                  <span v-else class="d-flex align-center ga-1 text-medium-emphasis text-caption">
                    <v-icon icon="mdi-lightbulb-outline" size="14" />
                    Gợi ý
                  </span>
                </div>
              </template>
              <template #loading>
                <v-skeleton-loader type="table-row@4" />
              </template>
              <template #no-data>
                <div class="text-center py-8 text-medium-emphasis">
                  <v-icon size="48" class="mb-2">mdi-scatter-plot</v-icon>
                  <p>Chưa có dữ liệu phân cụm</p>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-tabs-window-item>

        <!-- Drift Detection Tab -->
        <v-tabs-window-item value="drift">
          <v-card-text class="pa-4">
            <div class="d-flex align-center justify-space-between mb-3">
              <p class="text-body-2 text-medium-emphasis">
                Theo dõi sự trôi dạt của mô hình và kích hoạt huấn luyện lại
              </p>
              <v-btn
                size="small"
                variant="tonal"
                color="primary"
                rounded="lg"
                prepend-icon="mdi-refresh"
                :loading="loadingDrift"
                @click="fetchDrift"
              >
                Làm mới
              </v-btn>
            </div>
            <v-data-table
              :headers="driftHeaders"
              :items="driftItems"
              :loading="loadingDrift"
              item-value="product_id"
              rounded="lg"
              hover
            >
              <template #[`item.product_id`]="{ item }">
                <span class="font-weight-medium">{{ productName(item.product_id) }}</span>
              </template>
              <template #[`item.warehouse_id`]="{ item }">
                <span class="text-medium-emphasis">{{ warehouseName(item.warehouse_id) }}</span>
              </template>
              <template #[`item.detected_at`]="{ item }">
                <span class="text-body-2 text-medium-emphasis">
                  {{ formatDate(item.detected_at) }}
                </span>
              </template>
              <template #[`item.rolling_smape`]="{ item }">
                <v-tooltip :text="`sMAPE đo độ lệch trung bình của dự báo. ${item.rolling_smape > 20 ? 'Sai số cao — nên train lại' : item.rolling_smape > 10 ? 'Sai số trung bình' : 'Mô hình ổn định'}`" location="top">
                  <template #activator="{ props }">
                    <v-chip
                      v-bind="props"
                      :color="item.rolling_smape > 20 ? 'error' : item.rolling_smape > 10 ? 'warning' : 'success'"
                      size="small"
                      rounded="lg"
                      variant="tonal"
                      class="font-weight-medium"
                    >
                      {{ typeof item.rolling_smape === 'number' ? item.rolling_smape.toFixed(2) : item.rolling_smape }}%
                    </v-chip>
                  </template>
                </v-tooltip>
              </template>
              <template #[`item.retrain_triggered`]="{ item }">
                <v-chip
                  :color="item.retrain_triggered ? 'warning' : 'success'"
                  size="small"
                  rounded="lg"
                  variant="tonal"
                  :prepend-icon="item.retrain_triggered ? 'mdi-sync' : 'mdi-check-circle'"
                  class="font-weight-medium"
                >
                  {{ item.retrain_triggered ? 'Đã kích hoạt' : 'Ổn định' }}
                </v-chip>
              </template>
              <template #[`item.drift_actions`]="{ item }">
                <v-btn
                  v-if="item.rolling_smape > 10"
                  size="x-small"
                  color="warning"
                  variant="tonal"
                  rounded="lg"
                  :loading="retrainingId === item.product_id"
                  @click="triggerRetrain(item)"
                >
                  Train lại
                </v-btn>
                <span v-else class="text-caption text-medium-emphasis">—</span>
              </template>
              <template #loading>
                <v-skeleton-loader type="table-row@4" />
              </template>
              <template #no-data>
                <div class="text-center py-8 text-medium-emphasis">
                  <v-icon size="48" class="mb-2">mdi-chart-bell-curve-cumulative</v-icon>
                  <p>Chưa có dữ liệu drift</p>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      rounded="lg"
      location="bottom right"
      :timeout="4000"
    >
      <div class="d-flex align-center gap-2">
        <v-icon :icon="snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'" />
        {{ snackbar.message }}
      </div>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { springApi, aiApi } from '@/api/index.js'
import { useForecastStore } from '@/stores/forecast.js'

const forecastStore = useForecastStore()

// ─── State ────────────────────────────────────────────────────────────────────

const products = ref([])
const warehouses = ref([])
const loadingProducts = ref(false)
const loadingWarehouses = ref(false)

const selectedProductId = ref(null)
const selectedWarehouseId = ref(null)

const forecasting = ref(false)       // true chỉ khi POST /forecast đang in-flight
const forecastResult = ref(null)
const forecastError = ref(null)

let _pollingTimer = null

const analyticsTab = ref('clusters')
const clusterItems = ref([])
const driftItems = ref([])
const loadingClusters = ref(false)
const reclusterLoading = ref(false)
const retrainingId = ref(null)
const loadingDrift = ref(false)

const snackbar = ref({ show: false, message: '', color: 'success' })

// ─── Constants ────────────────────────────────────────────────────────────────

const modelRows = [
  { key: 'prophet', label: 'Prophet' },
  { key: 'ets', label: 'ETS (Holt-Winters)' },
  { key: 'xgboost', label: 'XGBoost' },
]

const clusterColors = ['primary', 'secondary', 'success', 'warning', 'error', 'info']

const MODEL_COLORS = {
  prophet: '#1565C0',
  ets: '#2E7D32',
  xgboost: '#E65100',
}

// ─── Table Headers ────────────────────────────────────────────────────────────

const clusterHeaders = [
  { title: 'Sản phẩm', key: 'product_id', width: '200px' },
  { title: 'Cụm', key: 'cluster_id', width: '80px', align: 'center' },
  { title: 'Biến động', key: 'volatility', width: '120px', align: 'center' },
  { title: 'Xu hướng', key: 'trend', width: '120px', align: 'center' },
  { title: 'Mùa vụ', key: 'seasonality', width: '120px', align: 'center' },
  { title: 'Mô hình tốt nhất', key: 'best_model', width: '160px', align: 'center' },
]

const driftHeaders = [
  { title: 'Sản phẩm', key: 'product_id', width: '200px' },
  { title: 'Phát hiện lúc', key: 'detected_at', width: '170px' },
  { title: 'sMAPE rolling', key: 'rolling_smape', width: '150px', align: 'center' },
  { title: 'Kho', key: 'warehouse_id', width: '140px', align: 'center' },
  { title: 'Kích hoạt train lại', key: 'retrain_triggered', width: '180px', align: 'center' },
  { title: 'Thao tác', key: 'drift_actions', sortable: false, width: '130px', align: 'center' },
]

// ─── Computed ─────────────────────────────────────────────────────────────────

const winnerLabel = computed(() => {
  const map = { prophet: 'Prophet', ets: 'ETS (Holt-Winters)', xgboost: 'XGBoost' }
  return map[forecastResult.value?.competition_winner] ?? forecastResult.value?.competition_winner ?? '—'
})

const winnerColor = computed(() => {
  return MODEL_COLORS[forecastResult.value?.competition_winner] ?? '#1565C0'
})

function productName(id) {
  return products.value.find(p => p.id === id)?.name ?? `SP #${id}`
}

function warehouseName(id) {
  return warehouses.value.find(w => w.id === id)?.name ?? `Kho #${id}`
}

const selectedCluster = computed(() => {
  if (!selectedProductId.value || !clusterItems.value.length) return null
  return clusterItems.value.find(c => c.product_id === Number(selectedProductId.value)) ?? null
})

const clusterMatchesWinner = computed(() => {
  if (!selectedCluster.value || !forecastResult.value) return false
  return selectedCluster.value.best_model === forecastResult.value.competition_winner
})

const barChartOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    fontFamily: 'inherit',
  },
  plotOptions: {
    bar: {
      borderRadius: 6,
      columnWidth: '55%',
      distributed: true,
    },
  },
  colors: modelRows.map(m =>
    m.key === forecastResult.value?.competition_winner
      ? MODEL_COLORS[m.key]
      : MODEL_COLORS[m.key] + '99'
  ),
  xaxis: {
    categories: modelRows.map(m => m.label),
    labels: { style: { fontSize: '12px', fontWeight: 500 } },
  },
  yaxis: {
    labels: {
      formatter: v => v.toLocaleString('vi-VN'),
      style: { fontSize: '11px' },
    },
  },
  legend: { show: false },
  tooltip: {
    y: { formatter: v => v.toLocaleString('vi-VN') + ' đơn vị' },
  },
  grid: { borderColor: '#f0f0f0' },
  dataLabels: {
    enabled: true,
    formatter: v => v.toLocaleString('vi-VN'),
    style: { fontSize: '11px', fontWeight: 'bold' },
  },
}))

const barChartSeries = computed(() => [
  {
    name: 'Dự báo 30 ngày',
    data: modelRows.map(m => forecastResult.value?.results[m.key]?.forecast_30d ?? 0),
  },
])

const lineChartOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    fontFamily: 'inherit',
  },
  stroke: { curve: 'smooth', width: 3 },
  markers: { size: 6, hover: { size: 8 } },
  xaxis: {
    categories: ['7 ngày', '14 ngày', '30 ngày'],
    labels: { style: { fontSize: '12px', fontWeight: 500 } },
  },
  yaxis: {
    labels: {
      formatter: v => v.toLocaleString('vi-VN'),
      style: { fontSize: '11px' },
    },
  },
  colors: modelRows.map(m => MODEL_COLORS[m.key]),
  legend: { position: 'top', fontSize: '12px' },
  tooltip: {
    y: { formatter: v => v.toLocaleString('vi-VN') + ' đơn vị' },
  },
  grid: { borderColor: '#f0f0f0' },
}))

const lineChartSeries = computed(() =>
  modelRows.map(m => ({
    name: m.label,
    data: [
      forecastResult.value?.results[m.key]?.forecast_7d ?? 0,
      forecastResult.value?.results[m.key]?.forecast_14d ?? 0,
      forecastResult.value?.results[m.key]?.forecast_30d ?? 0,
    ],
  }))
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function modelLabel(key) {
  const map = { prophet: 'Prophet', ets: 'ETS', xgboost: 'XGBoost' }
  return map[key] ?? key
}

function modelChipColor(key) {
  const map = { prophet: 'primary', ets: 'success', xgboost: 'deep-orange' }
  return map[key] ?? 'default'
}

function getVolatilityClass(value) {
  if (typeof value !== 'number') return ''
  if (value > 0.5) return 'text-error font-weight-medium'
  if (value > 0.2) return 'text-warning font-weight-medium'
  return 'text-success font-weight-medium'
}

function showSnackbar(message, color = 'success') {
  snackbar.value = { show: true, message, color }
}

// ─── API Calls ────────────────────────────────────────────────────────────────

async function fetchProducts() {
  loadingProducts.value = true
  try {
    const { data } = await springApi.get('/api/products')
    products.value = data.map(p => ({
      ...p,
      name: p.name ?? `Sản phẩm #${p.id}`,
    }))
  } catch (err) {
    showSnackbar('Không thể tải danh sách sản phẩm', 'error')
    console.error(err)
  } finally {
    loadingProducts.value = false
  }
}

async function fetchWarehouses() {
  loadingWarehouses.value = true
  try {
    const { data } = await springApi.get('/api/warehouses')
    warehouses.value = data.map(w => ({
      ...w,
      name: w.name ?? `Kho #${w.id}`,
    }))
  } catch (err) {
    showSnackbar('Không thể tải danh sách kho hàng', 'error')
    console.error(err)
  } finally {
    loadingWarehouses.value = false
  }
}

function stopPolling() {
  if (_pollingTimer) {
    clearInterval(_pollingTimer)
    _pollingTimer = null
  }
}

function startPolling(jobId) {
  stopPolling()
  _pollingTimer = setInterval(async () => {
    try {
      const { data } = await aiApi.get(`/api/ai/forecast/status/${jobId}`)
      if (data.status === 'done') {
        stopPolling()
        forecastStore.setDone(data.result)
        forecastResult.value = data.result
        showSnackbar(`Dự báo hoàn tất! Mô hình chiến thắng: ${winnerLabel.value}`)
      } else if (data.status === 'error') {
        stopPolling()
        forecastStore.setError(data.error)
        forecastError.value = data.error
        showSnackbar('Dự báo thất bại: ' + data.error, 'error')
      }
    } catch (err) {
      console.error('Polling error', err)
    }
  }, 5000)
}

async function runForecast(force = false) {
  if (!selectedProductId.value || !selectedWarehouseId.value) return

  forecasting.value = true
  forecastResult.value = null
  forecastError.value = null
  forecastStore.reset()

  try {
    const url = force ? '/api/ai/forecast?force=true' : '/api/ai/forecast'
    const { data } = await aiApi.post(url, {
      product_id: Number(selectedProductId.value),
      warehouse_id: Number(selectedWarehouseId.value),
    })

    if (data.status === 'done') {
      // Cache hit — kết quả trả về ngay
      const result = data.result ?? data
      forecastStore.setCacheHit(result)
      forecastResult.value = result
      showSnackbar(`Dự báo hoàn tất! Mô hình chiến thắng: ${winnerLabel.value} (từ cache)`)
    } else if (data.job_id) {
      // Job đang chạy ngầm — bắt đầu polling
      forecastStore.startJob(data.job_id, Number(selectedProductId.value), Number(selectedWarehouseId.value))
      startPolling(data.job_id)
      showSnackbar('Đang chạy dự báo ngầm — bạn có thể di chuyển sang trang khác', 'info')
    }
  } catch (err) {
    const msg = err.response?.data?.detail ?? err.message ?? 'Lỗi không xác định'
    forecastError.value = msg
    showSnackbar('Dự báo thất bại: ' + msg, 'error')
    console.error(err)
  } finally {
    forecasting.value = false
  }
}

async function triggerRetrain(item) {
  retrainingId.value = item.product_id
  try {
    await aiApi.post('/api/ai/forecast?force=true', {
      product_id: item.product_id,
      warehouse_id: item.warehouse_id,
    })
    showSnackbar(`Đã kích hoạt train lại cho ${productName(item.product_id)}`)
    await fetchDrift()
  } catch {
    showSnackbar('Kích hoạt train lại thất bại', 'error')
  } finally {
    retrainingId.value = null
  }
}

async function runClustering() {
  reclusterLoading.value = true
  try {
    await aiApi.post('/api/ai/cluster/1')
    await fetchClusters()
    showSnackbar('Phân cụm hoàn tất — dữ liệu đã được cập nhật')
  } catch (err) {
    showSnackbar('Chạy phân cụm thất bại', 'error')
    console.error(err)
  } finally {
    reclusterLoading.value = false
  }
}

async function fetchClusters() {
  loadingClusters.value = true
  try {
    const { data } = await aiApi.get('/api/ai/clusters')
    clusterItems.value = data
  } catch (err) {
    showSnackbar('Không thể tải dữ liệu phân cụm', 'error')
    console.error(err)
  } finally {
    loadingClusters.value = false
  }
}

async function fetchDrift() {
  loadingDrift.value = true
  try {
    const { data } = await aiApi.get('/api/ai/drift')
    driftItems.value = data
  } catch (err) {
    showSnackbar('Không thể tải dữ liệu drift', 'error')
    console.error(err)
  } finally {
    loadingDrift.value = false
  }
}

async function fetchFromCache() {
  if (!forecastStore.productId) return
  forecasting.value = true
  try {
    const { data } = await aiApi.post('/api/ai/forecast', {
      product_id: Number(forecastStore.productId),
      warehouse_id: Number(forecastStore.warehouseId),
    })
    if (data.status === 'done') {
      const result = data.result ?? data
      forecastStore.setCacheHit(result)
      forecastResult.value = result
      forecastStore.seen()
    }
  } catch (err) {
    console.error('Re-fetch cache error', err)
    forecastStore.reset()
  } finally {
    forecasting.value = false
  }
}

// ─── Auto-load cache khi chọn sản phẩm + kho ─────────────────────────────────

watch([selectedProductId, selectedWarehouseId], async ([pid, wid]) => {
  // Reset kết quả cũ khi đổi lựa chọn
  forecastResult.value = null
  forecastError.value = null

  if (!pid || !wid || forecastStore.isRunning) return

  // Tự động kiểm tra DB, hiển thị kết quả nếu đã có
  try {
    const { data } = await aiApi.post('/api/ai/forecast', {
      product_id: Number(pid),
      warehouse_id: Number(wid),
    })
    if (data.status === 'done') {
      const result = data.result ?? data
      forecastResult.value = result
    }
  } catch { /* silent */ }
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────

// Resume polling nếu đang có job chạy ngầm
watch(() => forecastStore.status, (status) => {
  if (status === 'done' && forecastStore.result && !forecastResult.value) {
    forecastResult.value = forecastStore.result
    forecastStore.seen()
  }
}, { immediate: true })

onMounted(() => {
  fetchProducts()
  fetchWarehouses()
  fetchClusters()
  fetchDrift()

  if (forecastStore.isRunning && forecastStore.jobId) {
    startPolling(forecastStore.jobId)
  } else if (forecastStore.isDone && forecastStore.result) {
    // Result vẫn còn trong memory (navigate về trang này)
    forecastResult.value = forecastStore.result
    selectedProductId.value = forecastStore.productId
    selectedWarehouseId.value = forecastStore.warehouseId
    forecastStore.seen()
  } else if (forecastStore.isDone && !forecastStore.result && forecastStore.productId) {
    // Sau page refresh: status='done' nhưng result bị mất → fetch lại từ cache DB
    selectedProductId.value = forecastStore.productId
    selectedWarehouseId.value = forecastStore.warehouseId
    fetchFromCache()
  }
})

onUnmounted(() => {
  stopPolling() // Dừng timer nhưng job server vẫn chạy, store vẫn giữ state
})
</script>

<style scoped>
.winner-row {
  background-color: rgba(21, 101, 192, 0.05);
}
</style>
