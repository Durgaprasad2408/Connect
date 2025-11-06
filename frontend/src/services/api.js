// ES Module
import axios from 'axios'

// Storage keys
const REFRESH_TOKEN_KEY = 'refresh_token'

// Refresh token management
export function setRefreshToken(token) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function clearRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export { REFRESH_TOKEN_KEY }

const API_BASE = (import.meta.env.VITE_BACKEND_URL || 'https://connect-5y7z.onrender.com') + '/api'

let accessToken = null
export function setAccessToken(token) { accessToken = token }
export function clearAccessToken() { accessToken = null }

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  headers: { 'Accept': 'application/json' },
})

// attach access token to requests
api.interceptors.request.use(cfg => {
  if (accessToken) cfg.headers.Authorization = `Bearer ${accessToken}`
  return cfg
})

// response interceptor to auto-refresh once on 401
api.interceptors.response.use(
  r => r,
  async err => {
    const original = err.config
    if (!original || original._retry) return Promise.reject(err)

    if (err.response && err.response.status === 401) {
      original._retry = true
      try {
        // call refresh endpoint using localStorage refresh token
        const refreshToken = getRefreshToken()
        const refreshResp = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken })
        const { accessToken: newToken, newRefreshToken } = refreshResp.data
        setAccessToken(newToken)
        if (newRefreshToken) {
          setRefreshToken(newRefreshToken)
        }
        // retry original request with new token
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshErr) {
        // refresh failed, clear tokens
        clearAccessToken()
        clearRefreshToken()
        return Promise.reject(refreshErr)
      }
    }
    return Promise.reject(err)
  }
)

export default api
