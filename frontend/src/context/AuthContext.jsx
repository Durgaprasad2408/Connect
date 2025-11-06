import React, { createContext, useState, useEffect } from 'react'
import api, { setAccessToken, clearAccessToken, getRefreshToken, setRefreshToken, clearRefreshToken } from '../services/api.js'
import { useNavigate } from 'react-router-dom'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // On mount, try to refresh using localStorage refresh token -> get accessToken & user
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) {
          throw new Error('No refresh token found')
        }
        const resp = await api.post('/auth/refresh', { refreshToken })
        if (!mounted) return
        const { accessToken, user, newRefreshToken } = resp.data
        setAccessToken(accessToken)
        if (newRefreshToken) {
          setRefreshToken(newRefreshToken)
        }
        setUser(user)
      } catch (error) {
        console.log('Token refresh failed, user needs to login')
        setUser(null)
        clearAccessToken()
        clearRefreshToken()
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    // backend returns { accessToken, user, refreshToken }
    setAccessToken(data.accessToken)
    if (data.refreshToken) {
      setRefreshToken(data.refreshToken)
    }
    setUser(data.user)
    return data.user
  }

  const signup = async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password })
    // after signup we still ask user to login — but if backend returns user, handle it
    return data
  }

  const logout = async () => {
    try {
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } catch (err) { /* ignore */ }
    clearAccessToken()
    clearRefreshToken()
    setUser(null)
    navigate('/')
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
