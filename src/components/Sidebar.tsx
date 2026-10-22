import React from 'react'
import { LayoutDashboard, Users, LogOut, HeartPulse } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

interface SidebarProps {
  currentTab: 'dashboard' | 'pacientes'
  onSelectTab: (tab: 'dashboard' | 'pacientes') => void
  onOpenPatientProfile?: (patientId: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth()

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col h-screen sticky top-0 shrink-0 select-none z-20">
      {/* Topo com Logo Nutri APP */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/25 ring-2 ring-emerald-100">
          <HeartPulse className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-lg text-slate-800 tracking-tight leading-tight">
            Nutri <span className="text-emerald-600">APP</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Muniz Barbosa Nutri
          </span>
        </div>
      </div>

      {/* Menu de navegação */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Navegação
        </div>

        <button
          id="nav-btn-dashboard"
          onClick={() => onSelectTab('dashboard')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            currentTab === 'dashboard'
              ? 'bg-emerald-500/10 text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard
            className={`w-5 h-5 transition-colors ${
              currentTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-400'
            }`}
          />
          <span>Dashboard</span>
          {currentTab === 'dashboard' && (
            <span className="ml-auto w-1.5 h-5 rounded-full bg-emerald-600" />
          )}
        </button>

        <button
          id="nav-btn-pacientes"
          onClick={() => onSelectTab('pacientes')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            currentTab === 'pacientes'
              ? 'bg-emerald-500/10 text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Users
            className={`w-5 h-5 transition-colors ${
              currentTab === 'pacientes' ? 'text-emerald-600' : 'text-slate-400'
            }`}
          />
          <span>Pacientes</span>
          {currentTab === 'pacientes' && (
            <span className="ml-auto w-1.5 h-5 rounded-full bg-emerald-600" />
          )}
        </button>
      </nav>

      {/* Informações da nutricionista logada e botão de Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 px-2 py-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'N'}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-800 truncate" title={user?.name}>
              {user?.name}
            </span>
            <span className="text-[11px] text-slate-400 truncate" title={user?.email}>
              {user?.email}
            </span>
          </div>
        </div>

        <button
          id="btn-sidebar-logout"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border border-slate-200/70"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da conta</span>
        </button>
      </div>
    </aside>
  )
}
