import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY_JOB_ID = 'forecast_job_id'
const STORAGE_KEY_STATUS = 'forecast_status'
const STORAGE_KEY_PRODUCT_ID = 'forecast_product_id'
const STORAGE_KEY_WAREHOUSE_ID = 'forecast_warehouse_id'

export const useForecastStore = defineStore('forecast', () => {
  // State
  const jobId = ref(localStorage.getItem(STORAGE_KEY_JOB_ID) || null)
  const status = ref(localStorage.getItem(STORAGE_KEY_STATUS) || 'idle')
  const result = ref(null)
  const errorMsg = ref(null)
  const productId = ref(
    localStorage.getItem(STORAGE_KEY_PRODUCT_ID)
      ? Number(localStorage.getItem(STORAGE_KEY_PRODUCT_ID))
      : null
  )
  const warehouseId = ref(
    localStorage.getItem(STORAGE_KEY_WAREHOUSE_ID)
      ? Number(localStorage.getItem(STORAGE_KEY_WAREHOUSE_ID))
      : null
  )

  // Getters
  const isRunning = computed(() => status.value === 'running')
  const isDone = computed(() => status.value === 'done')
  const hasNotification = computed(() => isDone.value)

  // Actions
  function startJob(newJobId, newProductId, newWarehouseId) {
    jobId.value = newJobId
    productId.value = newProductId
    warehouseId.value = newWarehouseId
    status.value = 'running'
    result.value = null
    errorMsg.value = null

    localStorage.setItem(STORAGE_KEY_JOB_ID, newJobId)
    localStorage.setItem(STORAGE_KEY_STATUS, 'running')
    localStorage.setItem(STORAGE_KEY_PRODUCT_ID, newProductId)
    localStorage.setItem(STORAGE_KEY_WAREHOUSE_ID, newWarehouseId)
  }

  function setDone(forecastResult) {
    result.value = forecastResult
    status.value = 'done'
    errorMsg.value = null

    localStorage.removeItem(STORAGE_KEY_JOB_ID)
    localStorage.setItem(STORAGE_KEY_STATUS, 'done')
  }

  function setError(msg) {
    errorMsg.value = msg
    status.value = 'error'

    localStorage.removeItem(STORAGE_KEY_JOB_ID)
    localStorage.removeItem(STORAGE_KEY_STATUS)
    localStorage.removeItem(STORAGE_KEY_PRODUCT_ID)
    localStorage.removeItem(STORAGE_KEY_WAREHOUSE_ID)
  }

  function setCacheHit(forecastResult) {
    result.value = { ...forecastResult, from_cache: true }
    status.value = 'done'
    errorMsg.value = null

    localStorage.removeItem(STORAGE_KEY_JOB_ID)
    localStorage.setItem(STORAGE_KEY_STATUS, 'done')
  }

  function reset() {
    jobId.value = null
    status.value = 'idle'
    result.value = null
    errorMsg.value = null
    productId.value = null
    warehouseId.value = null

    localStorage.removeItem(STORAGE_KEY_JOB_ID)
    localStorage.removeItem(STORAGE_KEY_STATUS)
    localStorage.removeItem(STORAGE_KEY_PRODUCT_ID)
    localStorage.removeItem(STORAGE_KEY_WAREHOUSE_ID)
  }

  function seen() {
    status.value = 'idle'
    localStorage.setItem(STORAGE_KEY_STATUS, 'idle')
  }

  return {
    // State
    jobId,
    status,
    result,
    errorMsg,
    productId,
    warehouseId,
    // Getters
    isRunning,
    isDone,
    hasNotification,
    // Actions
    startJob,
    setDone,
    setError,
    setCacheHit,
    reset,
    seen,
  }
})
