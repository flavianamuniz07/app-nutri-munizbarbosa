import React from 'react'
import { ArrowLeft, Phone, Mail, Calendar, AlertTriangle } from 'lucide-react'

interface PatientModalProps {
  patientId: string
  onClose: () => void
  patientInfo?: {
    id: string
    nome: string
    email?: string
    telefone?: string
    whatsapp?: string
    dias_sem_consulta?: number
    ultima_consulta?: string
  } | null
}

export const PatientModal: React.FC<PatientModalProps> = ({ onClose, patientInfo }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-2xl border border-white/20 shadow-inner">
              {patientInfo?.nome ? patientInfo.nome.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-[11px] font-semibold uppercase tracking-wider mb-1 border border-emerald-400/30">
                Perfil do Paciente
              </span>
              <h2 className="text-xl font-bold text-white">{patientInfo?.nome || 'Paciente'}</h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Alerta de Retorno Pendente */}
          {patientInfo?.dias_sem_consulta !== undefined && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900">Atenção ao Retorno</h4>
                <p className="text-xs text-amber-700 mt-0.5">
                  Este paciente não realiza consultas há <strong className="font-semibold text-amber-900">{patientInfo.dias_sem_consulta} dias</strong> e ainda não possui um retorno agendado.
                </p>
              </div>
            </div>
          )}

          {/* Dados de contato */}
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-400 block font-medium">E-mail</span>
                <span className="text-slate-700 font-semibold">{patientInfo?.email || 'Não informado'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-400 block font-medium">Telefone / WhatsApp</span>
                <span className="text-slate-700 font-semibold">
                  {patientInfo?.whatsapp || patientInfo?.telefone || 'Não informado'}
                </span>
              </div>
            </div>

            {patientInfo?.ultima_consulta && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <span className="text-slate-400 block font-medium">Data da Última Consulta</span>
                  <span className="text-slate-700 font-semibold">
                    {new Date(patientInfo.ultima_consulta + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                alert(`Agendamento de retorno para ${patientInfo?.nome || 'o paciente'}`)
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/30 cursor-pointer"
            >
              Agendar Retorno
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
