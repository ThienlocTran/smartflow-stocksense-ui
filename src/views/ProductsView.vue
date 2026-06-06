<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold">Danh sách Sản phẩm</h2>
        <p class="text-body-2 text-medium-emphasis mt-1">Quản lý toàn bộ danh mục sản phẩm trong hệ thống</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" elevation="0" @click="openCreate">
        Thêm sản phẩm
      </v-btn>
    </div>

    <!-- Search & Filter -->
    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-text class="pa-4">
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              placeholder="Tìm theo tên, SKU, danh mục..."
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
              v-model="filterCategory"
              :items="categories"
              label="Danh mục"
              variant="outlined"
              density="compact"
              rounded="lg"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="auto">
            <v-chip color="primary" variant="tonal">
              {{ filteredProducts.length }} sản phẩm
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card rounded="xl" elevation="0" border>
      <v-data-table
        :headers="headers"
        :items="filteredProducts"
        :loading="loading"
        loading-text="Đang tải dữ liệu..."
        no-data-text="Chưa có sản phẩm nào"
        items-per-page-text="Hiển thị"
        :items-per-page="10"
        rounded="xl"
      >
        <template #item.minStockThreshold="{ item }">
          <v-chip
            :color="item.minStockThreshold > 0 ? 'warning' : 'default'"
            variant="tonal"
            size="small"
          >
            {{ item.minStockThreshold }}
          </v-chip>
        </template>
        <template #item.totalStock="{ item }">
          <v-chip
            :color="getTotalStockColor(item)"
            variant="tonal"
            size="small"
          >
            {{ inventoryMap[item.id] != null ? inventoryMap[item.id].toLocaleString('vi-VN') : '—' }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn icon="mdi-pencil-outline" variant="text" size="small" color="primary" @click="openEdit(item)" />
          <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" @click="confirmDelete(item)" />
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="dialog" max-width="520" persistent>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-h6 font-weight-bold">
          {{ editMode ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới' }}
        </v-card-title>
        <v-card-text class="pa-6 pt-4">
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.sku"
                label="Mã SKU *"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                :error-messages="errors.sku"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.unit"
                label="Đơn vị tính"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                placeholder="cái, hộp, kg..."
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="form.name"
                label="Tên sản phẩm *"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                :error-messages="errors.name"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.category"
                label="Danh mục"
                variant="outlined"
                rounded="lg"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.minStockThreshold"
                label="Ngưỡng tồn kho tối thiểu"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                type="number"
                min="0"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="closeDialog">Hủy</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" :loading="saving" @click="save">
            {{ editMode ? 'Cập nhật' : 'Thêm mới' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirm Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2 text-h6">Xác nhận xóa</v-card-title>
        <v-card-text class="pa-6 pt-0">
          Bạn có chắc muốn xóa sản phẩm <strong>{{ selectedItem?.name }}</strong>? Hành động này không thể hoàn tác.
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="deleteDialog = false">Hủy</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" :loading="deleting" @click="deleteProduct">Xóa</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

const products = ref([])
const inventoryMap = ref({}) // productId → total quantity
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const filterCategory = ref(null)
const dialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const selectedItem = ref(null)
const errors = ref({})
const snackbar = ref({ show: false, text: '', color: 'success' })

const form = ref({ sku: '', name: '', unit: '', category: '', minStockThreshold: 0 })

const headers = [
  { title: 'SKU', key: 'sku', width: '120px' },
  { title: 'Tên sản phẩm', key: 'name' },
  { title: 'Đơn vị', key: 'unit', width: '100px' },
  { title: 'Danh mục', key: 'category', width: '140px' },
  { title: 'Ngưỡng tối thiểu', key: 'minStockThreshold', width: '150px', align: 'center' },
  { title: 'Tổng tồn kho', key: 'totalStock', width: '140px', align: 'center' },
  { title: '', key: 'actions', sortable: false, width: '100px', align: 'center' },
]

const categories = computed(() => [...new Set(products.value.map(p => p.category).filter(Boolean))])

const filteredProducts = computed(() => {
  return products.value.filter(p => {
    const matchSearch = !search.value ||
      p.name?.toLowerCase().includes(search.value.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.value.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.value.toLowerCase())
    const matchCategory = !filterCategory.value || p.category === filterCategory.value
    return matchSearch && matchCategory
  })
})

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

function getTotalStockColor(item) {
  const total = inventoryMap.value[item.id]
  if (total == null) return 'default'
  if (total === 0) return 'error'
  if (total < item.minStockThreshold) return 'warning'
  return 'success'
}

function showSnackbar(text, color = 'success') {
  snackbar.value = { show: true, text, color }
}

async function fetchProducts() {
  loading.value = true
  try {
    const res = await springApi.get('/api/products')
    products.value = res.data
  } catch {
    showSnackbar('Không thể tải danh sách sản phẩm', 'error')
  } finally {
    loading.value = false
  }
}

async function fetchInventoryTotals() {
  try {
    const { data } = await springApi.get('/api/inventory')
    const map = {}
    for (const item of data) {
      map[item.productId] = (map[item.productId] || 0) + Number(item.quantity || 0)
    }
    inventoryMap.value = map
  } catch {
    // silent — column sẽ hiện '—'
  }
}

function openCreate() {
  editMode.value = false
  form.value = { sku: '', name: '', unit: '', category: '', minStockThreshold: 0 }
  errors.value = {}
  dialog.value = true
}

function openEdit(item) {
  editMode.value = true
  selectedItem.value = item
  form.value = { ...item }
  errors.value = {}
  dialog.value = true
}

function closeDialog() {
  dialog.value = false
  errors.value = {}
}

function validate() {
  errors.value = {}
  if (!form.value.sku) errors.value.sku = 'Vui lòng nhập mã SKU'
  if (!form.value.name) errors.value.name = 'Vui lòng nhập tên sản phẩm'
  return Object.keys(errors.value).length === 0
}

async function save() {
  if (!validate()) return
  saving.value = true
  try {
    if (editMode.value) {
      await springApi.put(`/api/products/${selectedItem.value.id}`, form.value)
      showSnackbar('Cập nhật sản phẩm thành công')
    } else {
      await springApi.post('/api/products', form.value)
      showSnackbar('Thêm sản phẩm thành công')
    }
    dialog.value = false
    fetchProducts()
  } catch (e) {
    showSnackbar(e.response?.data?.error || 'Có lỗi xảy ra', 'error')
  } finally {
    saving.value = false
  }
}

function confirmDelete(item) {
  selectedItem.value = item
  deleteDialog.value = true
}

async function deleteProduct() {
  deleting.value = true
  try {
    await springApi.delete(`/api/products/${selectedItem.value.id}`)
    showSnackbar('Đã xóa sản phẩm')
    deleteDialog.value = false
    fetchProducts()
  } catch {
    showSnackbar('Không thể xóa sản phẩm', 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchProducts()
  fetchInventoryTotals()
})
</script>
