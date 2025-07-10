import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import jwt_decode from 'jwt-decode'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  // Configure axios
  axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me')
      setUser(response.data)
    } catch (error) {
      logout()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password })
      const { access_token } = response.data
      setToken(access_token)
      localStorage.setItem('token', access_token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      await fetchUser()
      return user // Return de huidige gebruiker na fetchUser()
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Login failed')
    }
  }

  const register = async (username, email, password) => {
    try {
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password
      })
      return { success: true, data: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed'
      }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  // --- ADMIN ---
  const fetchUsers = async () => {
    const response = await axios.get('/api/auth/users')
    return response.data
  }
  const createUser = async (user) => {
    const response = await axios.post('/api/auth/users', user)
    return response.data
  }
  const updateUser = async (id, user) => {
    const response = await axios.put(`/api/auth/users/${id}`, user)
    return response.data
  }
  const deleteUser = async (id) => {
    const response = await axios.delete(`/api/auth/users/${id}`)
    return response.data
  }

  // --- Helpers ---
  const isAuthenticated = !!user
  const isAdmin = user?.role === 'admin'
  
  // Trial en tier helpers
  const isInTrial = user?.is_trial_active && user?.days_left_in_trial > 0
  const getEffectiveTier = () => {
    if (!user) return 'basic'
    if (isInTrial) return 'premium' // Trial gebruikers krijgen premium functionaliteit
    return user.tier
  }
  
  const getTierLimits = () => {
    const effectiveTier = getEffectiveTier()
    
    if (effectiveTier === 'premium' || effectiveTier === 'white_label') {
      return {
        documents: Infinity,
        queries_per_day: Infinity,
        features: ["Onbeperkte documenten", "Onbeperkte vragen", "Premium AI modellen", "Prioriteit support"]
      }
    } else if (effectiveTier === 'basic') {
      return {
        documents: 50,
        queries_per_day: 100,
        features: ["50 documenten", "100 vragen per dag", "Basis AI modellen", "E-mail support"]
      }
    } else {
      return {
        documents: 10,
        queries_per_day: 20,
        features: ["10 documenten", "20 vragen per dag", "Basis functionaliteit"]
      }
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin,
    isInTrial,
    getEffectiveTier,
    getTierLimits,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
} 