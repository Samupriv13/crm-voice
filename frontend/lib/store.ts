import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Company {
  id: string
  name: string
  slug: string
}

interface AuthState {
  user: User | null
  company: Company | null
  token: string | null
  setAuth: (user: User, company: Company, token: string) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  company: null,
  token: null,
  setAuth: (user, company, token) => {
    localStorage.setItem('crm_token', token)
    localStorage.setItem('crm_user', JSON.stringify({ user, company }))
    set({ user, company, token })
  },
  logout: () => {
    localStorage.removeItem('crm_token')
    localStorage.removeItem('crm_user')
    set({ user: null, company: null, token: null })
  },
  hydrate: () => {
    const token = localStorage.getItem('crm_token')
    const stored = localStorage.getItem('crm_user')
    if (token && stored) {
      const { user, company } = JSON.parse(stored)
      set({ user, company, token })
    }
  }
}))
