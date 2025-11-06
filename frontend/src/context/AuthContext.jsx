import React, { createContext, useState, useEffect } from 'react'
import api, { setAccessToken, clearAccessToken } from '../services/api.js'
import { useNavigate } from 'react-router-dom'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // On mount, try to refresh using cookie -> get accessToken & user
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const resp = await api.get('/auth/refresh') // baseURL already points to /api
        if (!mounted) return
        const { accessToken, user } = resp.data
        setAccessToken(accessToken)
        setUser(user)
      } catch (err) {
        setUser(null)
        clearAccessToken()
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    // backend returns { accessToken, user }
    setAccessToken(data.accessToken)
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
      await api.post('/auth/logout')
    } catch (err) { /* ignore */ }
    clearAccessToken()
    setUser(null)
    navigate('/')
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
