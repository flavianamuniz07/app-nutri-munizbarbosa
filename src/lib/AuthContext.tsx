import React, { createContext, useContext, useEffect, useState } from 'react'
import { neonAuthClient } from './authClient'
import { salvarNutricionista, type Nutricionista } from './db'

export interface UserSession {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: UserSession | null
  isLoading: boolean
  error: string | null
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_STORAGE_KEY = 'muniz_barbosa_nutri_session'
const USERS_STORAGE_KEY = 'muniz_barbosa_nutri_users'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Recupera sessão ativa persistente
  useEffect(() => {
    const initSession = async () => {
      try {
        // Tenta obter sessão do Neon Auth
        try {
          if (neonAuthClient && typeof (neonAuthClient as any).getSession === 'function') {
            const session = await (neonAuthClient as any).getSession()
            if (session?.data?.user) {
              const u = session.data.user
              setUser({
                id: u.id,
                name: u.name || u.email?.split('@')[0] || 'Nutricionista',
                email: u.email,
              })
              setIsLoading(false)
              return
            }
          }
        } catch (e) {
          console.debug('Neon Auth getSession remote check fallback:', e)
        }

        // Sessão persistida localmente (mantém logado mesmo recarregando ou reabrindo o navegador)
        const savedSession = localStorage.getItem(SESSION_STORAGE_KEY)
        if (savedSession) {
          const parsed = JSON.parse(savedSession)
          // Se tiver banco Neon, sincroniza o id da tabela nutricionistas
          if (parsed?.email) {
            salvarNutricionista(parsed.name, parsed.email).then((nutri) => {
              if (nutri?.id && nutri.id !== parsed.id) {
                const updated = { ...parsed, id: nutri.id }
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated))
                setUser(updated)
              }
            }).catch(() => {})
          }
          setUser(parsed)
        }
      } catch (err) {
        console.error('Falha ao restaurar sessão:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, [])

  const clearError = () => setError(null)

  const register = async (name: string, email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()
    const trimmedName = name.trim()

    if (pass.length < 9) {
      const err = 'A senha deve conter no mínimo 9 caracteres.'
      setError(err)
      setIsLoading(false)
      return { success: false, error: err }
    }

    try {
      // 1. Tentar cadastro pelo Neon Auth Client se disponível
      try {
        if (neonAuthClient && typeof (neonAuthClient as any).signUp?.email === 'function') {
          await (neonAuthClient as any).signUp.email({
            name: trimmedName,
            email: normalizedEmail,
            password: pass,
          })
        }
      } catch (e: any) {
        console.warn('Neon Auth remoto não disponível ou não configurado, utilizando armazenamento gerenciado:', e)
      }

      // 2. Persistir localmente as credenciais e na tabela 'nutricionistas'
      const existingUsers: Array<{ id: string; name: string; email: string; pass: string }> = 
        JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]')

      if (existingUsers.some(u => u.email === normalizedEmail)) {
        const err = 'Este e-mail já está cadastrado no sistema.'
        setError(err)
        setIsLoading(false)
        return { success: false, error: err }
      }

      // Salvar na tabela nutricionistas (Neon / Local)
      const nutriRecord: Nutricionista = await salvarNutricionista(trimmedName, normalizedEmail)

      const newUser = {
        id: nutriRecord.id || crypto.randomUUID(),
        name: trimmedName,
        email: normalizedEmail,
        pass,
      }

      existingUsers.push(newUser)
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(existingUsers))

      const sessionData: UserSession = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      }

      // Salva sessão ativa
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
      setUser(sessionData)
      setIsLoading(false)
      return { success: true }
    } catch (err: any) {
      const msg = err?.message || 'Falha ao realizar cadastro. Verifique os dados e tente novamente.'
      setError(msg)
      setIsLoading(false)
      return { success: false, error: msg }
    }
  }

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)
    setError(null)

    const normalizedEmail = email.trim().toLowerCase()

    if (pass.length < 9) {
      const err = 'A senha informada deve ter pelo menos 9 caracteres.'
      setError(err)
      setIsLoading(false)
      return { success: false, error: err }
    }

    try {
      // 1. Tentar login pelo Neon Auth se configurado
      try {
        if (neonAuthClient && typeof (neonAuthClient as any).signIn?.email === 'function') {
          const res = await (neonAuthClient as any).signIn.email({
            email: normalizedEmail,
            password: pass,
          })
          if (res?.data?.user) {
            const u = res.data.user
            const sessionData: UserSession = {
              id: u.id,
              name: u.name || 'Nutricionista',
              email: u.email,
            }
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
            setUser(sessionData)
            setIsLoading(false)
            return { success: true }
          }
        }
      } catch (e: any) {
        console.warn('Tentativa Neon Auth remota:', e)
      }

      // 2. Validar com usuários cadastrados
      const existingUsers: Array<{ id: string; name: string; email: string; pass: string }> = 
        JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]')

      const found = existingUsers.find(u => u.email === normalizedEmail)

      if (!found) {
        const err = 'Não encontramos nenhuma conta com este e-mail. Cadastre-se para continuar.'
        setError(err)
        setIsLoading(false)
        return { success: false, error: err }
      }

      if (found.pass !== pass) {
        const err = 'Senha incorreta. Por favor, verifique sua senha e tente novamente.'
        setError(err)
        setIsLoading(false)
        return { success: false, error: err }
      }

      // Salva ou sincroniza nutricionista na tabela
      const nutriDb = await salvarNutricionista(found.name, found.email)

      const sessionData: UserSession = {
        id: nutriDb.id || found.id,
        name: found.name,
        email: found.email,
      }

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
      setUser(sessionData)
      setIsLoading(false)
      return { success: true }
    } catch (err: any) {
      const msg = err?.message || 'Erro ao realizar login. Tente novamente mais tarde.'
      setError(msg)
      setIsLoading(false)
      return { success: false, error: msg }
    }
  }

  const logout = async () => {
    try {
      if (neonAuthClient && typeof (neonAuthClient as any).signOut === 'function') {
        await (neonAuthClient as any).signOut().catch(() => {})
      }
    } catch (e) {
      console.debug('SignOut neon:', e)
    }
    localStorage.removeItem(SESSION_STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
