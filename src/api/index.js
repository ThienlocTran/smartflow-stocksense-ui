import axios from 'axios'

const springApi = axios.create({
  baseURL: import.meta.env.VITE_SPRING_API_URL ?? 'http://localhost:8080',
  timeout: 10000,
})

const aiApi = axios.create({
  baseURL: import.meta.env.VITE_AI_API_URL ?? 'http://localhost:8000',
  timeout: 300000,
})

export { springApi, aiApi }
