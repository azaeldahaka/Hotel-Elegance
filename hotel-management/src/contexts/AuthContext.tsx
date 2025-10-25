import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { Usuario } from '@/types'

interface AuthContextType {
  user: Usuario | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, nombre: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Recuperar sesión guardada
    const savedUser = localStorage.getItem('hotel_user')
    const savedToken = localStorage.getItem('hotel_token')
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser))
      setToken(savedToken)
    }
    
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-login', {
        body: { email, password },
      })

      if (error) throw error

      const responseData = data?.data || data
      
      if (responseData?.user && responseData?.token) {
        setUser(responseData.user)
        setToken(responseData.token)
        localStorage.setItem('hotel_user', JSON.stringify(responseData.user))
        localStorage.setItem('hotel_token', responseData.token)
      } else {
        throw new Error('Respuesta inválida del servidor')
      }
    } catch (error: any) {
      console.error('Error en login:', error)
      throw new Error(error.message || 'Error al iniciar sesión')
    }
  }

  const register = async (email: string, password: string, nombre: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('auth-register', {
        body: { email, password, nombre },
      })

      if (error) throw error

      const responseData = data?.data || data
      
      if (responseData?.user && responseData?.token) {
        setUser(responseData.user)
        setToken(responseData.token)
        localStorage.setItem('hotel_user', JSON.stringify(responseData.user))
        localStorage.setItem('hotel_token', responseData.token)
      } else {
        throw new Error('Respuesta inválida del servidor')
      }
    } catch (error: any) {
      console.error('Error en registro:', error)
      throw new Error(error.message || 'Error al registrarse')
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('hotel_user')
    localStorage.removeItem('hotel_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
