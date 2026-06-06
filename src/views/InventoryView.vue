<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h5 font-weight-bold">Quản lý Tồn kho</h2>
        <p class="text-body-2 text-medium-emphasis mt-1">Theo dõi tồn kho và lịch sử giao dịch</p>
      </div>
      <v-btn
        v-if="activeTab === 'transactions'"
        color="primary"
        rounded="lg"
        elevation="0"
        prepend-icon="mdi-plus"
        @click="openAddDialog"
      >
        Thêm giao dịch
      </v-btn>
    </div>

    <!-- Tabs -->
    <v-card rounded="xl" elevation="0" border>
      <v-tabs v-model="activeTab" color="primary" class="px-4 pt-2">
        <v-tab value="inventory" class="text-body-2 font-weight-medium">
          <v-icon start>mdi-warehouse</v-icon>
          Tồn kho hiện tại
        </v-tab>
        <v-tab value="transactions" class="text-body-2 font-weight-medium">
          <v-icon start>mdi-swap-horizontal</v-icon>
          Lịch sử giao dịch
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-tabs-window v-model="activeTab">
        <!-- Tab 1: Tồn kho hiện tại -->
        <v-tabs-window-item value="inventory">
          <v-card-text class="pa-4">
            <div class="d-flex align-center gap-3 mb-3">
              <v-select
                v-model="selectedWarehouseId"
                :items="[{ id: null, name: 'Tất cả kho' }, ...warehouses]"
                item-title="name"
                item-value="id"
                variant="outlined"
                density="compact"
                rounded="lg"
                hide-details
                prepend-inner-icon="mdi-warehouse"
                style="max-width: 220px"
              />
              <v-text-field
                v-model="inventorySearch"
                placeholder="Tìm theo sản phẩm, SKU..."
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                rounded="lg"
                hide-details
                clearable
                style="max-width: 320px"
              />
            </div>
            <div class="d-flex align-center ga-2 mb-2 text-caption text-medium-emphasis flex-wrap">
              <span>Chú thích số lượng:</span>
              <v-chip color="success" size="x-small" variant="tonal" prepend-icon="mdi-circle-small">Đủ hàng</v-chip>
              <v-chip color="warning" size="x-small" variant="tonal" prepend-icon="mdi-circle-small">Sắp thiếu</v-chip>
              <v-chip color="error" size="x-small" variant="tonal" prepend-icon="mdi-circle-small">Thiếu / Hết hàng</v-chip>
            </div>
            <v-data-table
              :headers="activeInventoryHeaders"
              :items="filteredInventory"
              :loading="loadingInventory"
              item-value="id"
              rounded="lg"
              hover
            >
              <template #[`item.quantity`]="{ item }">
                <v-chip
                  :color="getQuantityColor(item)"
                  size="small"
                  rounded="lg"
                  variant="tonal"
                  class="font-weight-medium"
                >
                  {{ item.quantity.toLocaleString('vi-VN') }}
                </v-chip>
              </template>
              <template #[`item.productName`]="{ item }">
                <span class="font-weight-medium">{{ item.productName || ('SP #' + item.productId) }}</span>
                <div class="text-caption text-medium-emphasis">{{ item.productSku }}</div>
              </template>
              <template #[`item.warehouseName`]="{ item }">
                <span class="text-medium-emphasis">{{ item.warehouseName || ('Kho #' + item.warehouseId) }}</span>
              </template>
              <template #[`item.updatedAt`]="{ item }">
                <span class="text-body-2 text-medium-emphasis">
                  {{ formatDate(item.updatedAt) }}
                </span>
              </template>
              <template #loading>
                <v-skeleton-loader type="table-row@5" />
              </template>
              <template #no-data>
                <div class="text-center py-8 text-medium-emphasis">
                  <v-icon size="48" class="mb-2">mdi-warehouse</v-icon>
                  <p>Chưa có dữ liệu tồn kho</p>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-tabs-window-item>

        <!-- Tab 2: Lịch sử giao dịch -->
        <v-tabs-window-item value="transactions">
          <v-card-text class="pa-4">
            <v-data-table
              :headers="transactionHeaders"
              :items="transactionItems"
              :loading="loadingTransactions"
              item-value="id"
              rounded="lg"
              hover
            >
              <template #[`item.transactionType`]="{ item }">
                <v-chip
                  :color="item.transactionType === 'IN' ? 'success' : 'error'"
                  size="small"
                  rounded="lg"
                  variant="tonal"
                  class="font-weight-medium"
                >
                  <v-icon start size="14">
                    {{ item.transactionType === 'IN' ? 'mdi-arrow-down-circle' : 'mdi-arrow-up-circle' }}
                  </v-icon>
                  {{ item.transactionType === 'IN' ? 'Nhập kho' : 'Xuất kho' }}
                </v-chip>
              </template>
              <template #[`item.quantity`]="{ item }">
                <span class="font-weight-medium">{{ item.quantity.toLocaleString('vi-VN') }}</span>
              </template>
              <template #[`item.productName`]="{ item }">
                <span class="font-weight-medium">{{ item.productName || ('SP #' + item.productId) }}</span>
              </template>
              <template #[`item.warehouseName`]="{ item }">
                <span class="text-medium-emphasis">{{ item.warehouseName || ('Kho #' + item.warehouseId) }}</span>
              </template>
              <template #[`item.createdAt`]="{ item }">
                <span class="text-body-2 text-medium-emphasis">
                  {{ formatDate(item.createdAt) }}
                </span>
              </template>
              <template #[`item.note`]="{ item }">
                <span class="text-body-2 text-medium-emphasis">
                  {{ item.note || '—' }}
                </span>
              </template>
              <template #loading>
                <v-skeleton-loader type="table-row@5" />
              </template>
              <template #no-data>
                <div class="text-center py-8 text-medium-emphasis">
                  <v-icon size="48" class="mb-2">mdi-swap-horizontal</v-icon>
                  <p>Chưa có giao dịch nào</p>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>

    <!-- Add Transaction Dialog -->
    <v-dialog v-model="addDialog" max-width="500" persistent>
      <v-card rounded="xl" elevation="0" border>
        <v-card-title class="pa-5 pb-3 d-flex align-center justify-space-between">
          <span class="text-body-1 font-weight-bold">Thêm giao dịch mới</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="closeAddDialog" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-5">
          <v-form ref="addForm" v-model="formValid" @submit.prevent="submitTransaction">
            <v-row dense>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="newTransaction.productId"
                  :items="products"
                  item-title="name"
                  item-value="id"
                  label="Sản phẩm *"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  :rules="[v => !!v || 'Bắt buộc']"
                  prepend-inner-icon="mdi-package-variant"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="newTransaction.warehouseId"
                  :items="warehouses"
                  item-title="name"
                  item-value="id"
                  label="Kho hàng *"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  :rules="[v => !!v || 'Bắt buộc']"
                  prepend-inner-icon="mdi-warehouse"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="newTransaction.transactionType"
                  label="Loại giao dịch"
                  :items="transactionTypeOptions"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  :rules="[v => !!v || 'Bắt buộc']"
                  prepend-inner-icon="mdi-swap-horizontal"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="newTransaction.quantity"
                  label="Số lượng"
                  type="number"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  :rules="[v => !!v || 'Bắt buộc', v => v > 0 || 'Phải lớn hơn 0']"
                  prepend-inner-icon="mdi-counter"
                />
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="newTransaction.note"
                  label="Ghi chú"
                  variant="outlined"
                  rounded="lg"
                  density="comfortable"
                  rows="3"
                  prepend-inner-icon="mdi-note-text"
                  no-resize
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn
            variant="text"
            rounded="lg"
            @click="closeAddDialog"
            :disabled="submitting"
          >
            Huỷ
          </v-btn>
          <v-btn
            color="primary"
            rounded="lg"
            elevation="0"
            :loading="submitting"
            :disabled="!formValid"
            @click="submitTransaction"
          >
            Lưu giao dịch
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      rounded="lg"
      location="bottom right"
      :timeout="3000"
    >
      <div class="d-flex align-center gap-2">
        <v-icon :icon="snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'" />
        {{ snackbar.message }}
      </div>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { springApi } from '@/api/index.js'

// ─── State ───────────────────────────────────────────────────────────────────

const activeTab = ref('inventory')

const inventoryItems = ref([])
const transactionItems = ref([])
const loadingInventory = ref(false)
const loadingTransactions = ref(false)

const addDialog = ref(false)
const formValid = ref(false)
const submitting = ref(false)
const addForm = ref(null)

const newTransaction = ref({
  productId: null,
  warehouseId: null,
  transactionType: null,
  quantity: null,
  note: '',
})

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

const products = ref([])
const warehouses = ref([])
const inventorySearch = ref('')
const selectedWarehouseId = ref(null)

const filteredInventory = computed(() => {
  let items = inventoryItems.value
  if (selectedWarehouseId.value) {
    items = items.filter(i => i.warehouseId === selectedWarehouseId.value)
  }
  if (inventorySearch.value) {
    const q = inventorySearch.value.toLowerCase()
    items = items.filter(i =>
      i.productName?.toLowerCase().includes(q) ||
      i.productSku?.toLowerCase().includes(q)
    )
  }
  return items
})

const activeInventoryHeaders = computed(() =>
  selectedWarehouseId.value
    ? inventoryHeaders.filter(h => h.key !== 'warehouseName')
    : inventoryHeaders
)

// ─── Table Headers ────────────────────────────────────────────────────────────

const inventoryHeaders = [
  { title: 'Sản phẩm', key: 'productName' },
  { title: 'Kho hàng', key: 'warehouseName', width: '160px' },
  { title: 'Số lượng', key: 'quantity', width: '140px' },
  { title: 'Cập nhật lần cuối', key: 'updatedAt', width: '180px' },
]

const transactionHeaders = [
  { title: 'Sản phẩm', key: 'productName' },
  { title: 'Kho', key: 'warehouseName', width: '140px' },
  { title: 'Loại', key: 'transactionType', width: '130px' },
  { title: 'Số lượng', key: 'quantity', width: '110px' },
  { title: 'Ghi chú', key: 'note' },
  { title: 'Ngày giao dịch', key: 'createdAt', width: '170px' },
]

const transactionTypeOptions = [
  { title: 'Nhập kho (IN)', value: 'IN' },
  { title: 'Xuất kho (OUT)', value: 'OUT' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getProductThreshold(productId) {
  return products.value.find(p => p.id === productId)?.minStockThreshold ?? 0
}

function getQuantityColor(item) {
  const threshold = getProductThreshold(item.productId)
  if (threshold > 0) {
    if (item.quantity === 0) return 'error'
    if (item.quantity < threshold) return 'error'
    if (item.quantity < threshold * 1.5) return 'warning'
    return 'success'
  }
  if (item.quantity > 100) return 'success'
  if (item.quantity >= 10) return 'warning'
  return 'error'
}

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

function showSnackbar(message, color = 'success') {
  snackbar.value = { show: true, message, color }
}

// ─── API Calls ────────────────────────────────────────────────────────────────

async function fetchInventory() {
  loadingInventory.value = true
  try {
    const { data } = await springApi.get('/api/inventory')
    inventoryItems.value = data
  } catch (err) {
    showSnackbar('Không thể tải dữ liệu tồn kho', 'error')
    console.error(err)
  } finally {
    loadingInventory.value = false
  }
}

async function fetchTransactions() {
  loadingTransactions.value = true
  try {
    const { data } = await springApi.get('/api/transactions')
    transactionItems.value = data
  } catch (err) {
    showSnackbar('Không thể tải lịch sử giao dịch', 'error')
    console.error(err)
  } finally {
    loadingTransactions.value = false
  }
}

async function fetchProductOptions() {
  try {
    const { data } = await springApi.get('/api/products')
    products.value = data
  } catch { /* silent */ }
}

async function fetchWarehouseOptions() {
  try {
    const { data } = await springApi.get('/api/warehouses')
    warehouses.value = data
  } catch { /* silent */ }
}

// ─── Dialog Actions ───────────────────────────────────────────────────────────

function openAddDialog() {
  newTransaction.value = {
    productId: null,
    warehouseId: null,
    transactionType: null,
    quantity: null,
    note: '',
  }
  addDialog.value = true
}

function closeAddDialog() {
  addDialog.value = false
  addForm.value?.reset()
}

async function submitTransaction() {
  const { valid } = await addForm.value.validate()
  if (!valid) return

  submitting.value = true
  try {
    await springApi.post('/api/transactions', {
      productId: newTransaction.value.productId,
      warehouseId: newTransaction.value.warehouseId,
      transactionType: newTransaction.value.transactionType,
      quantity: newTransaction.value.quantity,
      note: newTransaction.value.note || '',
    })
    showSnackbar('Giao dịch đã được lưu thành công')
    closeAddDialog()
    await fetchTransactions()
    await fetchInventory()
  } catch (err) {
    showSnackbar('Lưu giao dịch thất bại', 'error')
    console.error(err)
  } finally {
    submitting.value = false
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  fetchInventory()
  fetchTransactions()
  fetchProductOptions()
  fetchWarehouseOptions()
})
</script>
