<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 class="text-h6 font-weight-bold">Danh sách Kho hàng</h2>
        <p class="text-body-2 text-medium-emphasis mt-1">Quản lý toàn bộ hệ thống kho hàng trong hệ thống</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" elevation="0" @click="openCreate">
        Thêm kho hàng
      </v-btn>
    </div>

    <!-- Search & Filter -->
    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-text class="pa-4">
        <v-row align="center">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              placeholder="Tìm theo tên kho, địa điểm..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              rounded="lg"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="auto">
            <v-chip color="primary" variant="tonal">
              {{ filteredWarehouses.length }} kho hàng
            </v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card rounded="xl" elevation="0" border>
      <div class="d-flex align-center ga-2 pa-4 pb-2 text-caption text-medium-emphasis flex-wrap">
        <span>Chú thích sức chứa:</span>
        <v-chip color="success" size="x-small" variant="tonal" prepend-icon="mdi-circle-small">Còn nhiều chỗ (&lt; 70%)</v-chip>
        <v-chip color="warning" size="x-small" variant="tonal" prepend-icon="mdi-circle-small">Gần đầy (70–90%)</v-chip>
        <v-chip color="error" size="x-small" variant="tonal" prepend-icon="mdi-circle-small">Quá tải (≥ 90%)</v-chip>
      </div>
      <v-data-table
        :headers="headers"
        :items="filteredWarehouses"
        :loading="loading"
        loading-text="Đang tải dữ liệu..."
        no-data-text="Chưa có kho hàng nào"
        items-per-page-text="Hiển thị"
        :items-per-page="10"
        rounded="xl"
      >
        <template #item.capacity="{ item }">
          <v-chip
            :color="capacityChipColor(item)"
            variant="tonal"
            size="small"
          >
            <template v-if="item.capacity && inventoryMap[item.id] != null">
              {{ Math.round(fillRate(item) * 100) }}%
              <span class="text-caption ml-1 opacity-70">
                ({{ (inventoryMap[item.id] ?? 0).toLocaleString('vi-VN') }}/{{ item.capacity.toLocaleString('vi-VN') }})
              </span>
            </template>
            <template v-else>
              {{ item.capacity != null ? item.capacity.toLocaleString('vi-VN') : '—' }}
            </template>
          </v-chip>
        </template>
        <template #item.location="{ item }">
          <span>{{ item.location || '—' }}</span>
        </template>
        <template #item.description="{ item }">
          <span class="text-medium-emphasis">{{ item.description || '—' }}</span>
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
          {{ editMode ? 'Chỉnh sửa kho hàng' : 'Thêm kho hàng mới' }}
        </v-card-title>
        <v-card-text class="pa-6 pt-4">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="form.name"
                label="Tên kho *"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                :error-messages="errors.name"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.location"
                label="Địa điểm"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                placeholder="TP. Hà Nội, TP. HCM..."
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.capacity"
                label="Sức chứa"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                type="number"
                min="0"
                placeholder="Số lượng tối đa"
              />
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="form.description"
                label="Mô tả"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                placeholder="Mô tả thêm về kho hàng..."
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
          Bạn có chắc muốn xóa kho <strong>{{ selectedItem?.name }}</strong>? Hành động này không thể hoàn tác.
        </v-card-text>
        <v-card-actions class="pa-6 pt-0">
          <v-spacer />
          <v-btn variant="text" rounded="lg" @click="deleteDialog = false">Hủy</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" :loading="deleting" @click="deleteWarehouse">Xóa</v-btn>
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

const warehouses = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const dialog = ref(false)
const deleteDialog = ref(false)
const editMode = ref(false)
const selectedItem = ref(null)
const errors = ref({})
const snackbar = ref({ show: false, text: '', color: 'success' })

const form = ref({ name: '', location: '', capacity: null, description: '' })
const inventoryMap = ref({})

const headers = [
  { title: 'Tên kho', key: 'name' },
  { title: 'Địa điểm', key: 'location', width: '180px' },
  { title: 'Sức chứa (Đã dùng)', key: 'capacity', width: '230px', align: 'center' },
  { title: '', key: 'actions', sortable: false, width: '100px', align: 'center' },
]

const filteredWarehouses = computed(() => {
  return warehouses.value.filter(w => {
    return !search.value ||
      w.name?.toLowerCase().includes(search.value.toLowerCase()) ||
      w.location?.toLowerCase().includes(search.value.toLowerCase())
  })
})

async function fetchInventoryTotals() {
  try {
    const { data } = await springApi.get('/api/inventory')
    const map = {}
    for (const item of data) {
      map[item.warehouseId] = (map[item.warehouseId] || 0) + Number(item.quantity || 0)
    }
    inventoryMap.value = map
  } catch { /* silent */ }
}

function fillRate(item) {
  if (!item.capacity || item.capacity <= 0) return null
  return (inventoryMap.value[item.id] ?? 0) / item.capacity
}

function capacityChipColor(item) {
  const rate = fillRate(item)
  if (rate === null) return 'default'
  if (rate >= 0.9) return 'error'
  if (rate >= 0.7) return 'warning'
  return 'success'
}

function showSnackbar(text, color = 'success') {
  snackbar.value = { show: true, text, color }
}

async function fetchWarehouses() {
  loading.value = true
  try {
    const res = await springApi.get('/api/warehouses')
    warehouses.value = res.data
  } catch {
    showSnackbar('Không thể tải danh sách kho hàng', 'error')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editMode.value = false
  form.value = { name: '', location: '', capacity: null, description: '' }
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
  if (!form.value.name) errors.value.name = 'Vui lòng nhập tên kho'
  return Object.keys(errors.value).length === 0
}

async function save() {
  if (!validate()) return
  saving.value = true
  try {
    if (editMode.value) {
      await springApi.put(`/api/warehouses/${selectedItem.value.id}`, form.value)
      showSnackbar('Cập nhật kho hàng thành công')
    } else {
      await springApi.post('/api/warehouses', form.value)
      showSnackbar('Thêm kho hàng thành công')
    }
    dialog.value = false
    fetchWarehouses()
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

async function deleteWarehouse() {
  deleting.value = true
  try {
    await springApi.delete(`/api/warehouses/${selectedItem.value.id}`)
    showSnackbar('Đã xóa kho hàng')
    deleteDialog.value = false
    fetchWarehouses()
  } catch {
    showSnackbar('Không thể xóa kho hàng', 'error')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchWarehouses()
  fetchInventoryTotals()
})
</script>
