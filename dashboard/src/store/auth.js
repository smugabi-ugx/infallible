import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password })
        const { user, accessToken, refreshToken } = response.data
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true
        })
        return response.data
      },

      register: async (data) => {
        const response = await api.post('/auth/register', data)
        const { user, accessToken, refreshToken } = response.data
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true
        })
        return response.data
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        })
      },

      refreshTokens: async () => {
        const { refreshToken } = get()
        if (!refreshToken) throw new Error('No refresh token')
        
        const response = await api.post('/auth/refresh', { refreshToken })
        set({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken
        })
        return response.data.accessToken
      }
    }),
    {
      name: 'infallible-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
