// ES Module
import axios from 'axios'

const API_BASE = import.meta.env.BACKEND_URL || '/api'

let accessToken = null
export function setAccessToken(token) { accessToken = token }
export function clearAccessToken() { accessToken = null }

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
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
        // call refresh endpoint using cookie
        const refreshResp = await axios.get(`${API_BASE}/auth/refresh`, {
          withCredentials: true,
        })
        const { accessToken: newToken } = refreshResp.data
        setAccessToken(newToken)
        // retry original request with new token
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshErr) {
        // refresh failed, clear token
        clearAccessToken()
        return Promise.reject(refreshErr)
      }
    }
    return Promise.reject(err)
  }
)

export default api
