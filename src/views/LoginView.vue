<template>
  <v-container class="fill-height pa-0" fluid>
    <v-row class="fill-height" no-gutters>
      <!-- Left Panel -->
      <v-col
        cols="12"
        md="6"
        class="d-none d-md-flex"
        :style="{
          background: 'linear-gradient(135deg, #1565C0 0%, #0288D1 50%, #00BCD4 100%)',
          minHeight: '100vh'
        }"
      >
        <v-container class="d-flex flex-column justify-center align-center pa-12">
          <v-icon icon="mdi-chart-areaspline" size="80" color="white" class="mb-6" />
          <h1 class="text-h3 font-weight-bold text-white text-center mb-4">
            StockSense
          </h1>
          <p class="text-h6 text-white text-center" style="opacity: 0.85">
            Hệ thống Dự báo Tồn kho Thông minh
          </p>
          <p class="text-body-1 text-white text-center mt-4" style="opacity: 0.7">
            Tự học · Tự cải tiến · Tiết kiệm chi phí
          </p>

          <v-row class="mt-10" justify="center">
            <v-col cols="auto" v-for="stat in stats" :key="stat.label" class="text-center px-6">
              <div class="text-h5 font-weight-bold text-white">{{ stat.value }}</div>
              <div class="text-caption text-white" style="opacity: 0.75">{{ stat.label }}</div>
            </v-col>
          </v-row>
        </v-container>
      </v-col>

      <!-- Right Panel - Login Form -->
      <v-col cols="12" md="6" class="d-flex align-center justify-center" style="background: #F5F7FA; min-height: 100vh">
        <v-card
          width="420"
          elevation="0"
          rounded="xl"
          class="pa-8"
          color="white"
        >
          <!-- Mobile logo -->
          <div class="d-flex d-md-none align-center justify-center mb-6">
            <v-icon icon="mdi-chart-areaspline" color="primary" size="40" class="mr-2" />
            <span class="text-h5 font-weight-bold text-primary">StockSense</span>
          </div>

          <h2 class="text-h5 font-weight-bold mb-1">Đăng nhập</h2>
          <p class="text-body-2 text-medium-emphasis mb-6">
            Chào mừng trở lại! Vui lòng nhập thông tin tài khoản.
          </p>

          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            rounded="lg"
            class="mb-4"
            density="compact"
          >
            {{ error }}
          </v-alert>

          <v-text-field
            v-model="form.username"
            label="Tên đăng nhập"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            rounded="lg"
            class="mb-3"
            hide-details="auto"
            autocomplete="username"
          />
          <v-text-field
            v-model="form.password"
            label="Mật khẩu"
            prepend-inner-icon="mdi-lock-outline"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            variant="outlined"
            rounded="lg"
            class="mb-6"
            hide-details="auto"
            autocomplete="current-password"
            @click:append-inner="showPassword = !showPassword"
            @keyup.enter="login"
          />

          <v-btn
            block
            color="primary"
            size="large"
            rounded="lg"
            :loading="loading"
            elevation="0"
            @click="login"
          >
            <v-icon start icon="mdi-login" />
            Đăng nhập
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const form = ref({ username: '', password: '' })

const stats = [
  { value: '< 10%', label: 'Sai số dự báo' },
  { value: '3 mô hình', label: 'AI thi đua' },
  { value: 'Tự động', label: 'Tái huấn luyện' },
]

async function login() {
  if (!form.value.username || !form.value.password) {
    error.value = 'Vui lòng nhập đầy đủ thông tin.'
    return
  }
  error.value = ''
  loading.value = true
  setTimeout(() => {
    loading.value = false
    router.push('/dashboard')
  }, 800)
}
</script>
