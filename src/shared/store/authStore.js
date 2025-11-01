import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearAuth: () => set({ token: null}),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token }),
    }
  )
)

export function getAuthToken() {
  return useAuthStore.getState().token
}

export function setAuthToken(token) {
  useAuthStore.getState().setToken(token)
}

