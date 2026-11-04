import { useState, useId } from 'react'
import {
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Utensils,
} from 'lucide-react'
import type { PlanoAlimentar } from '../lib/db'
import {
  type PlanoSemanalData,
  type RefeicoesDia,
  REFEICOES_LABELS,
  DIAS_DA_SEMANA,
} from '../types/planoAlimentar'

interface PlanoAlimentarViewModalProps {
  plano: PlanoAlimentar
  onClose: () => void
}

export function PlanoAlimentarViewModal({ plano, onClose }: PlanoAlimentarViewModalProps) {
  const [diaAtivo, setDiaAtivo] = useState<string>(DIAS_DA_SEMANA[0])
  const [expandRawJson, setExpandRawJson] = useState<boolean>(false)

  const uniqueId = useId()

  // Tenta converter o conteúdo caso venha em string JSON ou objeto estruturado
  let parsedData: PlanoSemanalData | null = null
  try {
    if (typeof plano.conteudo === 'string') {
      parsedData = JSON.parse(plano.conteudo)
    } else if (plano.conteudo && typeof plano.conteudo === 'object') {
      parsedData = plano.conteudo as PlanoSemanalData
    }
  } catch (err) {
    console.warn('Conteúdo do plano não é um JSON padrão estruturado:', err)
  }

  const diaSelecionado = parsedData?.plano_semanal?.find((d) => d.dia === diaAtivo) || parsedData?.plano_semanal?.[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-100 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Utensils className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Plano Alimentar Semanal #{plano.id.slice(0, 8)}
              </h3>
              <span className="text-xs text-emerald-100">
                Criado em {new Date(plano.created_at).toLocaleDateString('pt-BR')} às{' '}
                {new Date(plano.created_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {parsedData && parsedData.plano_semanal && parsedData.plano_semanal.length > 0 ? (
            <div className="space-y-6">
              {/* Abas dos Dias */}
              <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {parsedData.plano_semanal.map((diaItem) => {
                  const ativo = diaAtivo === diaItem.dia
                  return (
                    <button
                      key={diaItem.dia}
                      type="button"
                      onClick={() => setDiaAtivo(diaItem.dia)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                        ativo
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{diaItem.dia}</span>
                    </button>
                  )
                })}
              </div>

              {/* Grid das Refeições do dia ativo */}
              {diaSelecionado && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(Object.keys(REFEICOES_LABELS) as (keyof RefeicoesDia)[]).map((refeicaoKey) => {
                    const label = REFEICOES_LABELS[refeicaoKey]
                    const opcoes = diaSelecionado.refeicoes?.[refeicaoKey] || []

                    return (
                      <div
                        key={refeicaoKey}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            {label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {opcoes.length} opções
                          </span>
                        </div>

                        <ul className="space-y-1.5">
                          {opcoes.map((opcao, optIdx) => (
                            <li
                              key={`${uniqueId}-${refeicaoKey}-${optIdx}`}
                              className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/60 flex items-start gap-2 shadow-2xs"
                            >
                              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {optIdx + 1}
                              </span>
                              <span>{opcao}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : null}

          {/* Opção para alternar visualização do JSON original bruto */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setExpandRawJson(!expandRawJson)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-bold cursor-pointer"
            >
              {expandRawJson ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Ocultar JSON técnico</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Ver JSON técnico original</span>
                </>
              )}
            </button>

            {expandRawJson && (
              <pre className="mt-3 text-[11px] font-mono bg-slate-900 text-emerald-400 p-4 rounded-2xl overflow-x-auto max-h-60 leading-relaxed">
                {typeof plano.conteudo === 'string'
                  ? plano.conteudo
                  : JSON.stringify(plano.conteudo, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
