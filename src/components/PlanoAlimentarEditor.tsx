import { useState, useId } from 'react'
import {
  Sparkles,
  Save,
  Calendar,
  Utensils,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  X,
  Clock,
} from 'lucide-react'
import type { Paciente } from '../lib/db'
import {
  type PlanoSemanalData,
  type RefeicoesDia,
  DIAS_DA_SEMANA,
  REFEICOES_LABELS,
  criarPlanoManualVazio,
} from '../types/planoAlimentar'

interface PlanoAlimentarEditorProps {
  paciente: Paciente
  onSave: (planoData: PlanoSemanalData) => Promise<void>
  onCancel?: () => void
}

const LOADING_MESSAGES = [
  'Buscando dados do paciente...',
  'Analisando objetivos, restrições e alergias...',
  'IA calculando cardápio semanal personalizado...',
  'Balanceando opções de refeições culturais brasileiras...',
  'Finalizando estruturação do plano alimentar...',
]

export function PlanoAlimentarEditor({
  paciente,
  onSave,
  onCancel,
}: PlanoAlimentarEditorProps) {
  const [plano, setPlano] = useState<PlanoSemanalData | null>(null)
  const [diaAtivo, setDiaAtivo] = useState<string>(DIAS_DA_SEMANA[0])
  const [loadingIA, setLoadingIA] = useState<boolean>(false)
  const [loadingMessageIdx, setLoadingMessageIdx] = useState<number>(0)
  const [saving, setSaving] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning'
    text: string
    actionPrompt?: boolean
  } | null>(null)

  const uniqueId = useId()

  // Formata o resumo do paciente para o prompt do backend
  const montarDadosDoPaciente = (): string => {
    const metas = (paciente.objetivos || []).join(', ') || paciente.objetivo_texto || 'Não informado'
    const alergias = (paciente.alergias || []).join(', ') || 'Nenhuma informada'
    const restricoes = (paciente.restricoes_alimentares || []).join(', ') || 'Nenhuma informada'
    const patologias = (paciente.patologias || []).join(', ') || 'Nenhuma informada'
    const atividade = paciente.nivel_atividade || (paciente.atividade_fisica ? paciente.atividade_fisica_descricao : 'Sedentário') || 'Não informado'
    const peso = paciente.peso_inicial ? `${paciente.peso_inicial} kg` : 'Não informado'
    const altura = paciente.altura ? `${paciente.altura} cm` : 'Não informado'
    const sexo = paciente.sexo || 'Não informado'
    const refeicoesPorDia = paciente.refeicoes_por_dia ? `${paciente.refeicoes_por_dia} refeições/dia` : '5 refeições/dia'
    const litrosAgua = paciente.litros_agua ? `${paciente.litros_agua}L/dia` : 'Não informado'
    const obs = paciente.observacoes || 'Nenhuma'

    return `
Nome: ${paciente.nome}
Sexo: ${sexo}
Peso Atual: ${peso}
Altura: ${altura}
Metas e Objetivos: ${metas}
Alergias Alimentares: ${alergias}
Restrições e Intolerâncias: ${restricoes}
Patologias Clínicas: ${patologias}
Nível de Atividade Física: ${atividade}
Rotina de Refeições: ${refeicoesPorDia}
Consumo de Água: ${litrosAgua}
Observações Gerais: ${obs}
`.trim()
  }

  // Gera plano alimentar via Serverless Function
  const handleGerarComIA = async () => {
    if (loadingIA) return

    setLoadingIA(true)
    setLoadingMessageIdx(0)
    setToastMessage(null)

    // Cicla mensagens dinâmicas a cada 2.5s
    const interval = setInterval(() => {
      setLoadingMessageIdx((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 2500)

    try {
      const dados_do_paciente = montarDadosDoPaciente()

      const response = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dados_do_paciente }),
      })

      clearInterval(interval)

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Erro HTTP ${response.status}`)
      }

      const data = await response.json()

      // Validação estrita do retorno
      if (!data || !Array.isArray(data.plano_semanal) || data.plano_semanal.length === 0) {
        throw new Error('Formato inválido retornado pela IA.')
      }

      // Normaliza garantindo que todos os 7 dias e todas as 5 refeições com 5 opções existam
      const planoNormalizado: PlanoSemanalData = {
        plano_semanal: DIAS_DA_SEMANA.map((nomeDia) => {
          const diaEncontrado = data.plano_semanal.find(
            (d: any) => d.dia?.toLowerCase().trim() === nomeDia.toLowerCase().trim()
          ) || data.plano_semanal[0]

          const getOpcoes = (opcoes: any) => {
            const arr = Array.isArray(opcoes) ? opcoes : []
            return [
              arr[0] || 'Opção equilibrada 1',
              arr[1] || 'Opção equilibrada 2',
              arr[2] || 'Opção equilibrada 3',
              arr[3] || 'Opção equilibrada 4',
              arr[4] || 'Opção equilibrada 5',
            ]
          }

          return {
            dia: nomeDia,
            refeicoes: {
              cafe_da_manha: getOpcoes(diaEncontrado?.refeicoes?.cafe_da_manha),
              lanche_manha: getOpcoes(diaEncontrado?.refeicoes?.lanche_manha),
              almoco: getOpcoes(diaEncontrado?.refeicoes?.almoco),
              lanche_tarde: getOpcoes(diaEncontrado?.refeicoes?.lanche_tarde),
              jantar: getOpcoes(diaEncontrado?.refeicoes?.jantar),
            },
          }
        }),
      }

      setPlano(planoNormalizado)
      setToastMessage({
        type: 'success',
        text: '✨ Plano alimentar gerado com sucesso pela IA! Revise e edite as opções abaixo.',
      })
    } catch (err: any) {
      clearInterval(interval)
      console.error('Falha ao gerar plano alimentar com IA:', err)
      setToastMessage({
        type: 'error',
        text: 'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?',
        actionPrompt: true,
      })
    } finally {
      setLoadingIA(false)
    }
  }

  // Fallback para criação manual
  const handleCriarManual = () => {
    setPlano(criarPlanoManualVazio())
    setToastMessage({
      type: 'warning',
      text: 'Plano em branco iniciado para preenchimento manual.',
    })
  }

  // Atualização de input individual
  const handleInputChange = (
    diaNome: string,
    refeicaoKey: keyof RefeicoesDia,
    opcaoIndex: number,
    value: string
  ) => {
    if (!plano) return

    setPlano((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        plano_semanal: prev.plano_semanal.map((diaItem) => {
          if (diaItem.dia !== diaNome) return diaItem
          const novasOpcoes = [...diaItem.refeicoes[refeicaoKey]]
          novasOpcoes[opcaoIndex] = value
          return {
            ...diaItem,
            refeicoes: {
              ...diaItem.refeicoes,
              [refeicaoKey]: novasOpcoes,
            },
          }
        }),
      }
    })
  }

  // Salvar no banco
  const handleSalvar = async () => {
    if (!plano) return
    setSaving(true)
    try {
      await onSave(plano)
      setPlano(null)
      setToastMessage({
        type: 'success',
        text: 'Plano alimentar salvo com sucesso no prontuário do paciente!',
      })
    } catch (err: any) {
      console.error('Erro ao salvar plano alimentar:', err)
      setToastMessage({
        type: 'error',
        text: err.message || 'Erro ao persistir o plano alimentar.',
      })
    } finally {
      setSaving(false)
    }
  }

  const diaSelecionadoObj = plano?.plano_semanal.find((d) => d.dia === diaAtivo)

  return (
    <div className="space-y-6">
      {/* Barra de Ações Superior */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-600" />
            <span>Gerador & Editor de Cardápio Semanal</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Gere um plano baseado no perfil clínico de <strong>{paciente.nome}</strong> ou preencha manualmente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Botão de Criação Manual (caso deseje ou fallback) */}
          <button
            type="button"
            onClick={handleCriarManual}
            disabled={loadingIA || saving}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>Plano Manual</span>
          </button>

          {/* Botão em destaque ✨ Gerar Plano com IA */}
          <button
            type="button"
            onClick={handleGerarComIA}
            disabled={loadingIA || saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingIA ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gerando com IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>✨ Gerar Plano com IA</span>
              </>
            )}
          </button>

          {/* Botão Salvar Plano Alimentar: só visível se houver um plano gerado/carregado */}
          {plano && (
            <button
              type="button"
              onClick={handleSalvar}
              disabled={saving || loadingIA}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed animate-in fade-in zoom-in-95"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Plano Alimentar</span>
                </>
              )}
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Fechar editor"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Loading Visual com Mensagens Dinâmicas */}
      {loadingIA && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-3xl p-8 border border-emerald-200/80 text-center animate-in fade-in">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-md text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">
            Inteligência Artificial em Ação
          </h4>
          <p className="text-xs text-emerald-800 font-medium mt-1.5 transition-all duration-300">
            {LOADING_MESSAGES[loadingMessageIdx]}
          </p>
          <div className="max-w-xs mx-auto mt-4 bg-emerald-200/60 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* Toast / Alerta de Notificação */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toastMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{toastMessage.text}</span>
          </div>

          <div className="flex items-center gap-2">
            {toastMessage.actionPrompt && (
              <>
                <button
                  type="button"
                  onClick={handleGerarComIA}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
                >
                  Tentar Novamente
                </button>
                <button
                  type="button"
                  onClick={handleCriarManual}
                  className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-700 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  Criar Manual
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="p-1 hover:bg-black/5 rounded-md cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Interface de Edição em Abas (Tabs) */}
      {plano && diaSelecionadoObj && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Navegação por Abas (Dias da semana) */}
          <div className="bg-slate-50/80 border-b border-slate-200/80 px-4 pt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {DIAS_DA_SEMANA.map((diaNome) => {
              const ativo = diaAtivo === diaNome
              return (
                <button
                  key={diaNome}
                  type="button"
                  onClick={() => setDiaAtivo(diaNome)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-t-2xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer border-t border-x ${
                    ativo
                      ? 'bg-white border-slate-200/80 text-emerald-700 shadow-xs -mb-[1px]'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                  }`}
                >
                  <Calendar className={`w-3.5 h-3.5 ${ativo ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{diaNome}</span>
                </button>
              )
            })}
          </div>

          {/* Conteúdo do Dia Ativo: 5 Refeições x 5 Opções */}
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h4 className="text-sm font-bold text-slate-800">
                  Cardápio de {diaAtivo}
                </h4>
              </div>
              <span className="text-xs text-slate-400">
                5 opções alternáveis por refeição (totalmente editáveis)
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(Object.keys(REFEICOES_LABELS) as (keyof RefeicoesDia)[]).map((refeicaoKey) => {
                const label = REFEICOES_LABELS[refeicaoKey]
                const opcoes = diaSelecionadoObj.refeicoes[refeicaoKey] || ['', '', '', '', '']

                return (
                  <div
                    key={refeicaoKey}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{label}</span>
                      </label>
                      <span className="text-[10px] bg-emerald-100/70 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        5 Opções
                      </span>
                    </div>

                    <div className="space-y-2">
                      {opcoes.map((opcaoTexto, optIdx) => (
                        <div key={`${uniqueId}-${refeicaoKey}-${optIdx}`} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-slate-500 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {optIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={opcaoTexto}
                            onChange={(e) =>
                              handleInputChange(diaAtivo, refeicaoKey, optIdx, e.target.value)
                            }
                            placeholder={`Opção ${optIdx + 1} para ${label.toLowerCase()}...`}
                            className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-2xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Rodapé com atalho para salvar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleSalvar}
                disabled={saving || loadingIA}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Salvando Alterações...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Plano Alimentar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

