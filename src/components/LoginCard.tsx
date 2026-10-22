import React, { useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { Logo } from './Logo'
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react'

interface LoginCardProps {
  onNavigateToRegister: () => void
}

export const LoginCard: React.FC<LoginCardProps> = ({ onNavigateToRegister }) => {
  const { login, isLoading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLocalError(null)

    if (!email.trim()) {
      setLocalError('Por favor, informe seu endereço de e-mail.')
      return
    }

    if (!password) {
      setLocalError('Por favor, informe sua senha de acesso.')
      return
    }

    if (password.length < 9) {
      setLocalError('A senha deve conter no mínimo 9 caracteres.')
      return
    }

    const res = await login(email, password)
    if (!res.success && res.error) {
      setLocalError(res.error)
    }
  }

  const activeError = localError || error

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-10 transition-all">
      <div className="mb-8">
        <Logo subtitle="Acesse o portal para gerenciar seus pacientes e planos alimentares" />
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Fazer Login</h2>
        <p className="text-sm text-slate-500 mt-1">
          Informe seus dados de acesso credenciados
        </p>
      </div>

      {activeError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200/80 flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800 leading-snug">
            {activeError}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            E-mail Profissional
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (activeError) setLocalError(null)
              }}
              placeholder="ex: nutricionista@munizbarbosa.com.br"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-sm"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Senha de Acesso
            </label>
            <span className="text-[11px] text-slate-400">mínimo 9 caracteres</span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (activeError) setLocalError(null)
              }}
              placeholder="•••••••••"
              className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-sm"
              required
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          id="btn-entrar"
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Entrar no Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-600">
          Não tem conta?{' '}
          <button
            id="link-cadastre-se"
            type="button"
            onClick={onNavigateToRegister}
            className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors cursor-pointer"
          >
            Cadastre-se
          </button>
        </p>
      </div>
    </div>
  )
}
