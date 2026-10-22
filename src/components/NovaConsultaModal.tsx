import React, { useState } from 'react'
import { X, Calendar, Scale, Activity, Check, AlertCircle } from 'lucide-react'
import { criarConsulta, type NovaConsultaPayload, type Consulta } from '../lib/db'

interface NovaConsultaModalProps {
  pacienteId: string
  onClose: () => void
  onSuccess: (consulta: Consulta) => void
}

export const NovaConsultaModal: React.FC<NovaConsultaModalProps> = ({
  pacienteId,
  onClose,
  onSuccess,
}) => {
  // Data da consulta (preenchida automaticamente com hoje, editável)
  const [dataConsulta, setDataConsulta] = useState(() => new Date().toISOString().split('T')[0])
  const [peso, setPeso] = useState('')
  const [cintura, setCintura] = useState('')
  const [quadril, setQuadril] = useState('')
  const [percentualGordura, setPercentualGordura] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [proximoRetorno, setProximoRetorno] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const pesoNum = parseFloat(peso.replace(',', '.'))
    if (isNaN(pesoNum) || pesoNum <= 0) {
      setErrorMessage('Por favor, informe um peso atual válido.')
      return
    }

    if (!dataConsulta) {
      setErrorMessage('Por favor, selecione a data da consulta.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload: NovaConsultaPayload = {
        paciente_id: pacienteId,
        data_consulta: dataConsulta,
        peso: pesoNum,
        cintura: cintura ? parseFloat(cintura.replace(',', '.')) : null,
        quadril: quadril ? parseFloat(quadril.replace(',', '.')) : null,
        percentual_gordura: percentualGordura ? parseFloat(percentualGordura.replace(',', '.')) : null,
        observacoes: observacoes.trim() || null,
        proximo_retorno: proximoRetorno || null,
      }

      const nova = await criarConsulta(payload)
      onSuccess(nova)
    } catch (err: any) {
      console.error('Erro ao salvar consulta:', err)
      setErrorMessage('Não foi possível salvar a consulta no banco de dados. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-100 overflow-hidden transform transition-all my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-[10px] font-bold uppercase tracking-wider mb-1 border border-emerald-400/30">
                Acompanhamento Clínico
              </span>
              <h2 className="text-xl font-extrabold text-white">Nova Consulta</h2>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2.5 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Data e Peso */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Data da Consulta <span className="text-emerald-600">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={dataConsulta}
                  onChange={(e) => setDataConsulta(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-semibold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Peso Atual <span className="text-emerald-600">*</span>
              </label>
              <div className="relative">
                <Scale className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  placeholder="Ex: 72.5"
                  className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-bold text-slate-800"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  kg
                </span>
              </div>
            </div>
          </div>

          {/* Cintura, Quadril e % Gordura (opcionais) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Cintura <span className="text-[10px] text-slate-400 lowercase font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cintura}
                  onChange={(e) => setCintura(e.target.value)}
                  placeholder="Ex: 82"
                  className="w-full pr-10 pl-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-emerald-600 text-slate-800"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                  cm
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Quadril <span className="text-[10px] text-slate-400 lowercase font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={quadril}
                  onChange={(e) => setQuadril(e.target.value)}
                  placeholder="Ex: 100"
                  className="w-full pr-10 pl-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-emerald-600 text-slate-800"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                  cm
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                % Gordura <span className="text-[10px] text-slate-400 lowercase font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={percentualGordura}
                  onChange={(e) => setPercentualGordura(e.target.value)}
                  placeholder="Ex: 21.4"
                  className="w-full pr-8 pl-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-emerald-600 text-slate-800"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Observações da Consulta
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adesão ao plano, alterações de rotina, sintomas relatados..."
                className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Próximo retorno */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Próximo Retorno
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={proximoRetorno}
                onChange={(e) => setProximoRetorno(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Ações */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Consulta</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
