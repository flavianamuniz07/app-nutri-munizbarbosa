import React, { useState } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import { LoginCard } from './components/LoginCard'
import { RegisterCard } from './components/RegisterCard'
import { Dashboard } from './components/Dashboard'

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'register'>('login')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-600 font-medium text-sm animate-pulse">
          Carregando autenticação Muniz Barbosa Nutri...
        </p>
      </div>
    )
  }

  // Regra: "Se já estiver logado e tentar acessar a tela de login, redirecionar direto para o dashboard"
  if (user) {
    return <Dashboard />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Background soft blur effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md my-auto">
        {authView === 'login' ? (
          <LoginCard onNavigateToRegister={() => setAuthView('register')} />
        ) : (
          <RegisterCard onNavigateToLogin={() => setAuthView('login')} />
        )}
      </div>

      <footer className="relative z-10 mt-8 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Muniz Barbosa Nutri. Todos os direitos reservados.
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}
