import api from './api'

export interface User {
  id: number
  email: string
  name: string
  avatarUrl?: string
  provider: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export const authApi = {
  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
    }
    return response.data
  },

  login: async (credentials: LoginCredentials) => {
    const response = await api.post('/auth/login', credentials)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
    }
    return response.data
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/auth/me')
    return response.data
  },

  logout: () => {
    localStorage.removeItem('token')
    window.location.href = '/auth/login'
  },

  googleLogin: () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    window.location.href = `${apiUrl}/auth/google/login`
  },
}

