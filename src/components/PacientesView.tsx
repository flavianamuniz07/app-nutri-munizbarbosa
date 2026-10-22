import React, { useEffect, useState } from 'react'
import { Users, UserPlus, Search, ArrowRight, Calendar, Target } from 'lucide-react'
import { listarPacientesPorNutricionista, type Paciente } from '../lib/db'
import { useAuth } from '../lib/AuthContext'

interface PacientesViewProps {
  onSelectPatient: (patient: Paciente) => void
  onNovoPaciente: () => void
}

export const PacientesView: React.FC<PacientesViewProps> = ({ onSelectPatient, onNovoPaciente }) => {
  const { user } = useAuth()
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function carregarPacientes() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const rows = await listarPacientesPorNutricionista(user.id)
        setPacientes(rows || [])
      } catch (err) {
        console.error('Erro ao buscar pacientes:', err)
      } finally {
        setLoading(false)
      }
    }

    carregarPacientes()
  }, [user?.id])

  // Filtragem por nome no topo da listagem
  const filtered = pacientes.filter((p) =>
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Helper para formatar o resumo dos objetivos
  const getObjetivoDisplay = (paciente: Paciente) => {
    if (paciente.objetivos && paciente.objetivos.length > 0) {
      return paciente.objetivos.slice(0, 2).join(', ') + (paciente.objetivos.length > 2 ? '...' : '')
    }
    if (paciente.objetivo_texto) {
      return paciente.objetivo_texto
    }
    return 'Não especificado'
  }

  // Helper para formatar a data da última consulta
  const getUltimaConsultaDisplay = (data?: string | null) => {
    if (!data) return 'Sem consultas'
    return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header com Título e Botão Novo Paciente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Pacientes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gerencie os prontuários, acompanhamentos e histórico clínico dos seus pacientes
          </p>
        </div>

        <button
          onClick={onNovoPaciente}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Paciente</span>
        </button>
      </div>

      {/* Campo de busca por nome no topo da listagem */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar paciente por nome..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
        />
      </div>

      {/* Lista de pacientes */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
            Carregando pacientes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7" />
            </div>
            {/* Mensagem solicitada pelo Prompt 4 se não houver pacientes cadastrados */}
            <h3 className="text-base font-bold text-slate-800 mb-1">
              {searchTerm ? 'Nenhum paciente encontrado com essa busca' : 'Nenhum paciente cadastrado ainda'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
              {searchTerm
                ? 'Tente pesquisar com outro nome ou limpe o campo de busca.'
                : 'Cadastre seu primeiro paciente para registrar histórico, medidas e hábitos nutricionais.'}
            </p>
            {!searchTerm && (
              <button
                onClick={onNovoPaciente}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Cadastrar primeiro paciente</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3.5 px-6">Nome</th>
                  <th className="py-3.5 px-4">Objetivo</th>
                  <th className="py-3.5 px-4">Data da Última Consulta</th>
                  <th className="py-3.5 px-6 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((paciente) => (
                  <tr
                    key={paciente.id}
                    onClick={() => onSelectPatient(paciente)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Nome */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                          {paciente.nome?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 block group-hover:text-emerald-700 transition-colors">
                            {paciente.nome}
                          </span>
                          {paciente.email && (
                            <span className="text-xs text-slate-400">{paciente.email}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Objetivo */}
                    <td className="py-4 px-4 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-medium truncate max-w-[200px]">
                          {getObjetivoDisplay(paciente)}
                        </span>
                      </div>
                    </td>

                    {/* Data da última consulta */}
                    <td className="py-4 px-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{getUltimaConsultaDisplay(paciente.ultima_consulta)}</span>
                      </div>
                    </td>

                    {/* Ação */}
                    <td className="py-4 px-6 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white rounded-xl transition-all">
                        <span>Ver Perfil</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
