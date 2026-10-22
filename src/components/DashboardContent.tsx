import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../lib/AuthContext'
import { 
  Users, 
  Calendar, 
  ClockAlert, 
  ChevronRight, 
  RefreshCw, 
  ArrowUpRight,
  Sparkles,
  Phone,
  Mail,
  CalendarCheck
} from 'lucide-react'
import { getDashboardMetrics, type DashboardMetrics, type PacienteSemRetorno } from '../lib/db'

interface DashboardContentProps {
  onSelectPatient: (patient: PacienteSemRetorno) => void
  onNavigateToPacientes: () => void
}

export const DashboardContent: React.FC<DashboardContentProps> = ({ 
  onSelectPatient,
  onNavigateToPacientes
}) => {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  const loadData = useCallback(async () => {
    if (!user?.id) return
    try {
      const data = await getDashboardMetrics(user.id)
      setMetrics(data)
    } catch (err) {
      console.error('Erro ao atualizar métricas do dashboard:', err)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    loadData()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner de Boas-vindas */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-700/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/30 backdrop-blur-md rounded-full text-xs font-semibold mb-3 border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Painel Clínico Integrado • Neon Postgres</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Olá, Dra. {user?.name || 'Nutricionista'}!
            </h1>
            <p className="text-emerald-100 text-sm mt-1 leading-relaxed">
              Aqui está o resumo da sua rotina clínica em tempo real. Acompanhe seus pacientes e consultas da semana.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing || loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl text-xs font-semibold backdrop-blur-md border border-white/20 transition-all cursor-pointer disabled:opacity-50"
              title="Atualizar dados do Neon"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}</span>
            </button>
          </div>
        </div>

        {/* Efeitos de iluminação de fundo */}
        <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-36 top-0 w-36 h-36 bg-teal-300/15 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Grid com os 3 Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* CARD 1: Total de pacientes ativos */}
        <div 
          onClick={onNavigateToPacientes}
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <span className="p-1.5 rounded-lg text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>

          <div className="mt-5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Card 1 • Prontuários
            </span>
            <h3 className="text-base font-bold text-slate-700 mt-0.5">
              Total de Pacientes Ativos
            </h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {loading ? '—' : metrics.totalPacientes}
              </span>
              <span className="text-xs text-slate-400 font-medium">pacientes cadastrados</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-medium">
            <span>Ver lista completa de pacientes</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* CARD 2: Consultas da semana */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-teal-300 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-100">
              <CalendarCheck className="w-3 h-3" />
              Semana Atual
            </span>
          </div>

          <div className="mt-5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Card 2 • Agenda Clínica
            </span>
            <h3 className="text-base font-bold text-slate-700 mt-0.5">
              Consultas da Semana
            </h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {loading ? '—' : metrics.consultasSemana}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {metrics.consultasSemana === 1 ? 'consulta agendada/realizada' : 'consultas agendadas/realizadas'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Período de segunda a domingo
          </div>
        </div>

        {/* CARD 3: Indicador de Pacientes sem retorno */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ClockAlert className="w-6 h-6" />
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              metrics.pacientesSemRetorno.length > 0 
                ? 'bg-amber-100/80 text-amber-800 border border-amber-200' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}>
              {metrics.pacientesSemRetorno.length > 0 ? 'Atenção necessária' : 'Tudo em dia'}
            </span>
          </div>

          <div className="mt-5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Card 3 • Retornos Pendentes
            </span>
            <h3 className="text-base font-bold text-slate-700 mt-0.5">
              Pacientes sem Retorno
            </h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                metrics.pacientesSemRetorno.length > 0 ? 'text-amber-600' : 'text-slate-900'
              }`}>
                {loading ? '—' : metrics.pacientesSemRetorno.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {metrics.pacientesSemRetorno.length === 1 ? 'paciente há mais de 30 dias' : 'pacientes há mais de 30 dias'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Sem retorno futuro agendado
          </div>
        </div>
      </div>

      {/* Seção Detalhada do Card 3: Lista de Pacientes sem Retorno */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">
                Card 3 — Pacientes sem retorno
              </h2>
              {metrics.pacientesSemRetorno.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                  {metrics.pacientesSemRetorno.length}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pacientes cuja última consulta foi realizada há mais de 30 dias e que não possuem próximo retorno agendado.
            </p>
          </div>
          <span className="text-xs text-slate-400 self-start sm:self-auto">
            Clique no paciente para abrir o perfil
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
            Carregando dados do Neon em tempo real...
          </div>
        ) : metrics.pacientesSemRetorno.length === 0 ? (
          /* Mensagem explícita solicitada pelo Prompt 3 */
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CalendarCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Nenhum paciente sem retorno no momento
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Excelente! Todos os seus pacientes atendidos recentemente já estão com retorno agendado ou em dia com o plano nutricional.
            </p>
          </div>
        ) : (
          /* Lista com o nome dos pacientes (cada um clicável redirecionando para o perfil) */
          <div className="divide-y divide-slate-100 mt-2">
            {metrics.pacientesSemRetorno.map((paciente) => (
              <div
                key={paciente.id}
                onClick={() => onSelectPatient(paciente)}
                className="py-4 px-3 sm:px-4 rounded-2xl hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 font-bold text-sm flex items-center justify-center shrink-0 border border-amber-200/50 group-hover:bg-amber-100 transition-colors">
                    {paciente.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectPatient(paciente)
                      }}
                      className="text-left font-bold text-slate-800 text-sm hover:text-emerald-700 transition-colors block truncate cursor-pointer group-hover:underline"
                    >
                      {paciente.nome}
                    </button>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      {paciente.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[140px] sm:max-w-[200px]">{paciente.email}</span>
                        </span>
                      )}
                      {(paciente.whatsapp || paciente.telefone) && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{paciente.whatsapp || paciente.telefone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      Há {paciente.dias_sem_consulta} dias sem consulta
                    </span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">
                      Última: {new Date(paciente.ultima_consulta + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-400 flex items-center justify-center transition-all shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
