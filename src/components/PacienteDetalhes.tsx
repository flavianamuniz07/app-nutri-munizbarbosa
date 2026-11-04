import React, { useEffect, useState, useCallback } from 'react'
import { 
  ArrowLeft, 
  User, 
  Activity, 
  FileText, 
  Calendar, 
  Scale, 
  Check, 
  Plus, 
  X, 
  Phone, 
  Mail, 
  Save, 
  AlertCircle,
  Eye,
  CalendarCheck
} from 'lucide-react'
import { 
  buscarPacientePorId, 
  atualizarPaciente, 
  listarConsultasPorPaciente, 
  listarPlanosPorPaciente,
  salvarPlanoAlimentar,
  type Paciente, 
  type Consulta, 
  type PlanoAlimentar 
} from '../lib/db'
import { EvolucaoPesoChart } from './EvolucaoPesoChart'
import { NovaConsultaModal } from './NovaConsultaModal'
import { PlanoAlimentarEditor } from './PlanoAlimentarEditor'
import { PlanoAlimentarViewModal } from './PlanoAlimentarViewModal'
import type { PlanoSemanalData } from '../types/planoAlimentar'

interface PacienteDetalhesProps {
  patientId: string
  initialData?: any
  onBack: () => void
  successMessage?: string | null
  onClearSuccessMessage?: () => void
}

const OBJETIVOS_OPCOES = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
]

const NIVEIS_ATIVIDADE = [
  { value: 'Sedentário', label: 'Sedentário' },
  { value: 'Levemente ativo', label: 'Levemente ativo' },
  { value: 'Moderadamente ativo', label: 'Moderadamente ativo' },
  { value: 'Muito ativo', label: 'Muito ativo' },
  { value: 'Extremamente ativo', label: 'Extremamente ativo' },
]

const PATOLOGIAS_OPCOES = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
]

const RESTRICOES_OPCOES = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
]

const ALERGIAS_OPCOES = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
]

export const PacienteDetalhes: React.FC<PacienteDetalhesProps> = ({
  patientId,
  initialData,
  onBack,
  successMessage,
  onClearSuccessMessage,
}) => {
  const [paciente, setPaciente] = useState<Paciente | null>(initialData || null)
  const [loading, setLoading] = useState<boolean>(!initialData)

  // 3 seções principais do Prompt 5: 'dados' | 'consultas' | 'planos'
  const [mainSection, setMainSection] = useState<'dados' | 'consultas' | 'planos'>('dados')

  // Seção 1: Abas de dados do paciente: Pessoal, Clínico e Hábitos
  const [dadosTab, setDadosTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal')

  // Feedback de salvamento
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(successMessage || null)
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Estados editáveis do paciente (Seção 1)
  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [sexo, setSexo] = useState('')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')

  const [pesoInicial, setPesoInicial] = useState('')
  const [altura, setAltura] = useState('')
  const [objetivos, setObjetivos] = useState<string[]>([])
  const [objetivoTexto, setObjetivoTexto] = useState('')
  const [nivelAtividade, setNivelAtividade] = useState('')
  const [patologias, setPatologias] = useState<string[]>([])
  const [customPatologia, setCustomPatologia] = useState('')
  const [restricoes, setRestricoes] = useState<string[]>([])
  const [customRestricao, setCustomRestricao] = useState('')
  const [alergias, setAlergias] = useState<string[]>([])
  const [customAlergia, setCustomAlergia] = useState('')
  const [medicamentos, setMedicamentos] = useState('')
  const [suplementos, setSuplementos] = useState('')

  const [refeicoesPorDia, setRefeicoesPorDia] = useState('')
  const [horarioAcorda, setHorarioAcorda] = useState('')
  const [horarioDorme, setHorarioDorme] = useState('')
  const [litrosAgua, setLitrosAgua] = useState('')
  const [atividadeFisica, setAtividadeFisica] = useState<boolean | null>(null)
  const [atividadeDescricao, setAtividadeDescricao] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Seção 2: Consultas
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [loadingConsultas, setLoadingConsultas] = useState(false)
  const [isNovaConsultaOpen, setIsNovaConsultaOpen] = useState(false)

  // Seção 3: Planos Alimentares
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([])
  const [loadingPlanos, setLoadingPlanos] = useState(false)
  const [selectedPlano, setSelectedPlano] = useState<PlanoAlimentar | null>(null)

  // Popula formulário a partir dos dados do paciente
  const populateFormData = useCallback((p: Paciente) => {
    setNome(p.nome || '')
    setDataNascimento(p.data_nascimento ? p.data_nascimento.split('T')[0] : '')
    setSexo(p.sexo || '')
    setTelefone(p.telefone || '')
    setWhatsapp(p.whatsapp || '')
    setEmail(p.email || '')

    setPesoInicial(p.peso_inicial !== null && p.peso_inicial !== undefined ? String(p.peso_inicial) : '')
    setAltura(p.altura !== null && p.altura !== undefined ? String(p.altura) : '')
    setObjetivos(Array.isArray(p.objetivos) ? p.objetivos : [])
    setObjetivoTexto(p.objetivo_texto || '')
    setNivelAtividade(p.nivel_atividade || '')
    setPatologias(Array.isArray(p.patologias) ? p.patologias : [])
    setRestricoes(Array.isArray(p.restricoes_alimentares) ? p.restricoes_alimentares : [])
    setAlergias(Array.isArray(p.alergias) ? p.alergias : [])
    setMedicamentos(p.medicamentos || '')
    setSuplementos(p.suplementos || '')

    setRefeicoesPorDia(p.refeicoes_por_dia !== null && p.refeicoes_por_dia !== undefined ? String(p.refeicoes_por_dia) : '')
    setHorarioAcorda(p.horario_acorda || '')
    setHorarioDorme(p.horario_dorme || '')
    setLitrosAgua(p.litros_agua !== null && p.litros_agua !== undefined ? String(p.litros_agua) : '')
    setAtividadeFisica(p.atividade_fisica ?? null)
    setAtividadeDescricao(p.atividade_fisica_descricao || '')
    setObservacoes(p.observacoes || '')
  }, [])

  // Carrega consultas em tempo real
  const fetchConsultas = useCallback(async () => {
    if (!patientId) return
    setLoadingConsultas(true)
    try {
      const data = await listarConsultasPorPaciente(patientId)
      setConsultas(data)
    } catch (err) {
      console.error('Erro ao buscar consultas do Neon:', err)
    } finally {
      setLoadingConsultas(false)
    }
  }, [patientId])

  // Carrega planos em tempo real
  const fetchPlanos = useCallback(async () => {
    if (!patientId) return
    setLoadingPlanos(true)
    try {
      const data = await listarPlanosPorPaciente(patientId)
      setPlanos(data)
    } catch (err) {
      console.error('Erro ao buscar planos do Neon:', err)
    } finally {
      setLoadingPlanos(false)
    }
  }, [patientId])

  // Carrega paciente
  useEffect(() => {
    async function load() {
      if (initialData && initialData.nome) {
        setPaciente(initialData)
        populateFormData(initialData)
        setLoading(false)
      } else {
        setLoading(true)
        try {
          const p = await buscarPacientePorId(patientId)
          if (p) {
            setPaciente(p)
            populateFormData(p)
          }
        } catch (err) {
          console.error('Erro ao carregar paciente:', err)
        } finally {
          setLoading(false)
        }
      }
    }

    load()
    fetchConsultas()
    fetchPlanos()
  }, [patientId, initialData, populateFormData, fetchConsultas, fetchPlanos])

  // Helper para cálculo de idade
  const calcularIdade = (dataIso?: string | null): number | null => {
    if (!dataIso) return null
    const hoje = new Date()
    const nasc = new Date(dataIso + 'T00:00:00')
    if (isNaN(nasc.getTime())) return null
    let idade = hoje.getFullYear() - nasc.getFullYear()
    const m = hoje.getMonth() - nasc.getMonth()
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--
    }
    return idade >= 0 ? idade : null
  }

  // Helper IMC em tempo real
  const pesoNum = parseFloat(pesoInicial.replace(',', '.'))
  const alturaNum = parseFloat(altura.replace(',', '.'))
  let imcValor: string | null = null
  let imcClassificacao = ''

  if (!isNaN(pesoNum) && !isNaN(alturaNum) && pesoNum > 0 && alturaNum > 0) {
    const alturaMetros = alturaNum > 3 ? alturaNum / 100 : alturaNum
    const imc = pesoNum / (alturaMetros * alturaMetros)
    imcValor = imc.toFixed(1)
    if (imc < 18.5) imcClassificacao = 'Abaixo do peso'
    else if (imc < 25) imcClassificacao = 'Peso ideal'
    else if (imc < 30) imcClassificacao = 'Sobrepeso'
    else if (imc < 35) imcClassificacao = 'Obesidade grau I'
    else if (imc < 40) imcClassificacao = 'Obesidade grau II'
    else imcClassificacao = 'Obesidade grau III'
  }

  // Formatação de telefone
  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits ? `(${digits}` : ''
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  }

  // Conversão de horários
  const autoFormatTime = (raw: string): string => {
    const clean = raw.trim().replace(/\D/g, '')
    if (!clean) return raw
    if (clean.length === 1) return `0${clean}:00`
    if (clean.length === 2) {
      const num = parseInt(clean, 10)
      if (num >= 0 && num <= 23) return `${clean.padStart(2, '0')}:00`
      return `${clean}:00`
    }
    if (clean.length === 3) {
      const h = clean.slice(0, 1).padStart(2, '0')
      const m = clean.slice(1, 3)
      return `${h}:${m}`
    }
    if (clean.length >= 4) {
      const h = clean.slice(0, 2)
      const m = clean.slice(2, 4)
      return `${h}:${m}`
    }
    return raw
  }

  // Tags com suporte a "Nenhum"
  const toggleMultiSelectWithNone = (
    currentList: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    if (item === 'Nenhum') {
      if (currentList.includes('Nenhum')) setter([])
      else setter(['Nenhum'])
      return
    }
    const withoutNone = currentList.filter((i) => i !== 'Nenhum')
    if (withoutNone.includes(item)) {
      setter(withoutNone.filter((i) => i !== item))
    } else {
      setter([...withoutNone, item])
    }
  }

  const addCustomItem = (
    value: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    clearInput: () => void
  ) => {
    const trimmed = value.trim()
    if (!trimmed) return
    const withoutNone = list.filter((i) => i !== 'Nenhum')
    if (!withoutNone.includes(trimmed)) setList([...withoutNone, trimmed])
    clearInput()
  }

  const removeItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setList(list.filter((i) => i !== item))
  }

  const toggleObjetivo = (item: string) => {
    if (objetivos.includes(item)) setObjetivos(objetivos.filter((o) => o !== item))
    else setObjetivos([...objetivos, item])
  }

  // Salvar alterações da Seção 1 no Neon
  const handleSalvarAlteracoes = async () => {
    if (!nome.trim()) {
      setSaveErrorMsg('O nome completo do paciente é obrigatório.')
      setDadosTab('pessoal')
      return
    }

    setIsSaving(true)
    setSaveErrorMsg(null)
    setSaveSuccessMsg(null)

    try {
      const payload = {
        nome: nome.trim(),
        data_nascimento: dataNascimento || null,
        sexo: sexo || null,
        telefone: telefone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        email: email.trim() || null,
        peso_inicial: !isNaN(pesoNum) && pesoNum > 0 ? pesoNum : null,
        altura: !isNaN(alturaNum) && alturaNum > 0 ? alturaNum : null,
        objetivos: objetivos.length > 0 ? objetivos : null,
        objetivo_texto: objetivoTexto.trim() || null,
        nivel_atividade: nivelAtividade || null,
        patologias: patologias.length > 0 ? patologias : null,
        restricoes_alimentares: restricoes.length > 0 ? restricoes : null,
        alergias: alergias.length > 0 ? alergias : null,
        medicamentos: medicamentos.trim() || null,
        suplementos: suplementos.trim() || null,
        refeicoes_por_dia: refeicoesPorDia ? parseInt(refeicoesPorDia, 10) : null,
        horario_acorda: horarioAcorda.trim() || null,
        horario_dorme: horarioDorme.trim() || null,
        litros_agua: litrosAgua ? parseFloat(litrosAgua.replace(',', '.')) : null,
        atividade_fisica: atividadeFisica,
        atividade_fisica_descricao: atividadeFisica ? atividadeDescricao.trim() || null : null,
        observacoes: observacoes.trim() || null,
      }

      const updated = await atualizarPaciente(patientId, payload)
      if (updated) {
        setPaciente(updated)
        populateFormData(updated)
      }
      setSaveSuccessMsg('Alterações salvas com sucesso no banco de dados Neon!')
    } catch (err: any) {
      console.error('Erro ao atualizar paciente:', err)
      setSaveErrorMsg('Erro ao salvar alterações no Neon. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const idade = calcularIdade(dataNascimento)

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-16 text-center text-slate-400">
        <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3" />
        Carregando prontuário do paciente...
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Topo / Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/80 bg-white shadow-2xs"
            title="Voltar para a lista de pacientes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
                Perfil do Paciente
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-0.5">
              {paciente?.nome || 'Carregando paciente...'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200 bg-white shadow-2xs"
          >
            Voltar para a Lista
          </button>
        </div>
      </div>

      {/* Banner de Identificação Rápida */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-extrabold text-2xl border border-white/20 shadow-inner shrink-0">
              {paciente?.nome?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{paciente?.nome || 'Paciente'}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100/90 mt-1">
                {sexo && <span>{sexo}</span>}
                {idade !== null && <span>• {idade} anos</span>}
                {email && <span>• {email}</span>}
                {(whatsapp || telefone) && <span>• {whatsapp || telefone}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:text-right shrink-0">
              <span className="text-[10px] uppercase tracking-wider text-emerald-200 font-semibold block">
                Consultas Realizadas
              </span>
              <span className="text-lg font-extrabold text-white block mt-0.5">
                {consultas.length} {consultas.length === 1 ? 'consulta' : 'consultas'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Seções Principais (Prompt 5) */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setMainSection('dados')}
          className={`flex items-center gap-2 pb-3.5 px-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            mainSection === 'dados'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Seção 1 — Dados do Paciente</span>
        </button>

        <button
          type="button"
          onClick={() => setMainSection('consultas')}
          className={`flex items-center gap-2 pb-3.5 px-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            mainSection === 'consultas'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Seção 2 — Consultas ({consultas.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMainSection('planos')}
          className={`flex items-center gap-2 pb-3.5 px-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            mainSection === 'planos'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Seção 3 — Planos Alimentares ({planos.length})</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* SEÇÃO 1 — DADOS DO PACIENTE                                  */}
      {/* ============================================================ */}
      {mainSection === 'dados' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Mensagens de Sucesso ou Erro */}
          {saveSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 flex items-center justify-between text-sm shadow-xs animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <span>{saveSuccessMsg}</span>
              </div>
              <button
                onClick={() => {
                  setSaveSuccessMsg(null)
                  if (onClearSuccessMessage) onClearSuccessMessage()
                }}
                className="text-xs text-emerald-700 hover:text-emerald-950 font-semibold px-2 py-1 cursor-pointer"
              >
                Dispensar
              </button>
            </div>
          )}

          {saveErrorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
              <span>{saveErrorMsg}</span>
            </div>
          )}

          {/* Abas internas: Pessoal, Clínico, Hábitos */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="flex border-b border-slate-100 bg-slate-50/60 px-6 pt-4 gap-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => setDadosTab('pessoal')}
                className={`pb-3 px-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  dadosTab === 'pessoal'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                1. Pessoal
              </button>
              <button
                type="button"
                onClick={() => setDadosTab('clinico')}
                className={`pb-3 px-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  dadosTab === 'clinico'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                2. Clínico
              </button>
              <button
                type="button"
                onClick={() => setDadosTab('habitos')}
                className={`pb-3 px-3 border-b-2 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  dadosTab === 'habitos'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                3. Hábitos
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* ABA PESSOAL */}
              {dadosTab === 'pessoal' && (
                <div className="space-y-5 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Nome Completo <span className="text-emerald-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-semibold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Data de Nascimento
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="date"
                          value={dataNascimento}
                          onChange={(e) => setDataNascimento(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
                        />
                      </div>
                      {idade !== null && (
                        <p className="text-xs text-emerald-700 font-semibold mt-1.5">
                          Idade calculada: <strong>{idade} anos</strong>
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Sexo
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Feminino', 'Masculino', 'Outro'].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setSexo(opt)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              sexo === opt
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Telefone
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={telefone}
                          onChange={(e) => setTelefone(formatPhone(e.target.value))}
                          placeholder="(00) 0000-0000"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                          placeholder="(00) 90000-0000"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@exemplo.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA CLÍNICO */}
              {dadosTab === 'clinico' && (
                <div className="space-y-6 animate-in fade-in">
                  {/* Antropometria inicial e IMC */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Peso inicial
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={pesoInicial}
                          onChange={(e) => setPesoInicial(e.target.value)}
                          placeholder="Ex: 70.5"
                          className="w-full pr-12 pl-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-semibold text-slate-800"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                          kg
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Altura
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={altura}
                          onChange={(e) => setAltura(e.target.value)}
                          placeholder="Ex: 175"
                          className="w-full pr-12 pl-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-semibold text-slate-800"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                          cm
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>IMC (Calculado)</span>
                        <Scale className="w-3.5 h-3.5 text-emerald-600" />
                      </label>
                      <div className="py-2.5 px-4 rounded-xl border border-emerald-200 bg-emerald-100/60 text-sm font-bold text-emerald-950 flex items-center justify-between">
                        <span>{imcValor ? `${imcValor} kg/m²` : '—'}</span>
                        {imcClassificacao && (
                          <span className="text-[11px] font-semibold text-emerald-800 bg-white/70 px-2 py-0.5 rounded-md">
                            {imcClassificacao}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Objetivos */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Objetivos
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {OBJETIVOS_OPCOES.map((obj) => {
                        const selected = objetivos.includes(obj)
                        return (
                          <button
                            key={obj}
                            type="button"
                            onClick={() => toggleObjetivo(obj)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              selected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {selected && <Check className="w-3.5 h-3.5" />}
                            <span>{obj}</span>
                          </button>
                        )
                      })}
                    </div>
                    <input
                      type="text"
                      value={objetivoTexto}
                      onChange={(e) => setObjetivoTexto(e.target.value)}
                      placeholder="Observação adicional ou objetivo específico livre..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
                    />
                  </div>

                  {/* Nível de atividade */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Nível de Atividade Física
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {NIVEIS_ATIVIDADE.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setNivelAtividade(item.value)}
                          className={`p-2.5 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                            nivelAtividade === item.value
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500/20'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Patologias */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Patologias ou Condições de Saúde
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleMultiSelectWithNone(patologias, setPatologias, 'Nenhum')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          patologias.includes('Nenhum')
                            ? 'bg-slate-700 text-white border-slate-700 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Nenhum
                      </button>

                      {PATOLOGIAS_OPCOES.map((pat) => {
                        const selected = patologias.includes(pat)
                        return (
                          <button
                            key={pat}
                            type="button"
                            disabled={patologias.includes('Nenhum')}
                            onClick={() => toggleMultiSelectWithNone(patologias, setPatologias, pat)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              selected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-40'
                            }`}
                          >
                            {selected && <Check className="w-3 h-3" />}
                            <span>{pat}</span>
                          </button>
                        )
                      })}

                      {patologias
                        .filter((p) => p !== 'Nenhum' && !PATOLOGIAS_OPCOES.includes(p))
                        .map((custom) => (
                          <span
                            key={custom}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5"
                          >
                            <span>{custom}</span>
                            <button
                              type="button"
                              onClick={() => removeItem(patologias, setPatologias, custom)}
                              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                    </div>

                    <div className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        disabled={patologias.includes('Nenhum')}
                        value={customPatologia}
                        onChange={(e) => setCustomPatologia(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addCustomItem(customPatologia, patologias, setPatologias, () => setCustomPatologia(''))
                          }
                        }}
                        placeholder="Adicionar outra patologia..."
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        disabled={patologias.includes('Nenhum') || !customPatologia.trim()}
                        onClick={() => addCustomItem(customPatologia, patologias, setPatologias, () => setCustomPatologia(''))}
                        className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Restrições */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Restrições Alimentares
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleMultiSelectWithNone(restricoes, setRestricoes, 'Nenhum')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          restricoes.includes('Nenhum')
                            ? 'bg-slate-700 text-white border-slate-700'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Nenhum
                      </button>

                      {RESTRICOES_OPCOES.map((rest) => {
                        const selected = restricoes.includes(rest)
                        return (
                          <button
                            key={rest}
                            type="button"
                            disabled={restricoes.includes('Nenhum')}
                            onClick={() => toggleMultiSelectWithNone(restricoes, setRestricoes, rest)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              selected
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-40'
                            }`}
                          >
                            {selected && <Check className="w-3 h-3" />}
                            <span>{rest}</span>
                          </button>
                        )
                      })}

                      {restricoes
                        .filter((r) => r !== 'Nenhum' && !RESTRICOES_OPCOES.includes(r))
                        .map((custom) => (
                          <span
                            key={custom}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5"
                          >
                            <span>{custom}</span>
                            <button
                              type="button"
                              onClick={() => removeItem(restricoes, setRestricoes, custom)}
                              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                    </div>

                    <div className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        disabled={restricoes.includes('Nenhum')}
                        value={customRestricao}
                        onChange={(e) => setCustomRestricao(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addCustomItem(customRestricao, restricoes, setRestricoes, () => setCustomRestricao(''))
                          }
                        }}
                        placeholder="Adicionar outra restrição alimentar..."
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        disabled={restricoes.includes('Nenhum') || !customRestricao.trim()}
                        onClick={() => addCustomItem(customRestricao, restricoes, setRestricoes, () => setCustomRestricao(''))}
                        className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Alergias */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Alergias Alimentares
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleMultiSelectWithNone(alergias, setAlergias, 'Nenhum')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          alergias.includes('Nenhum')
                            ? 'bg-slate-700 text-white border-slate-700'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Nenhum
                      </button>

                      {ALERGIAS_OPCOES.map((alerg) => {
                        const selected = alergias.includes(alerg)
                        return (
                          <button
                            key={alerg}
                            type="button"
                            disabled={alergias.includes('Nenhum')}
                            onClick={() => toggleMultiSelectWithNone(alergias, setAlergias, alerg)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              selected
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-40'
                            }`}
                          >
                            {selected && <Check className="w-3 h-3" />}
                            <span>{alerg}</span>
                          </button>
                        )
                      })}

                      {alergias
                        .filter((a) => a !== 'Nenhum' && !ALERGIAS_OPCOES.includes(a))
                        .map((custom) => (
                          <span
                            key={custom}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5"
                          >
                            <span>{custom}</span>
                            <button
                              type="button"
                              onClick={() => removeItem(alergias, setAlergias, custom)}
                              className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                    </div>

                    <div className="flex gap-2 max-w-md">
                      <input
                        type="text"
                        disabled={alergias.includes('Nenhum')}
                        value={customAlergia}
                        onChange={(e) => setCustomAlergia(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            addCustomItem(customAlergia, alergias, setAlergias, () => setCustomAlergia(''))
                          }
                        }}
                        placeholder="Adicionar outra alergia alimentar..."
                        className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        disabled={alergias.includes('Nenhum') || !customAlergia.trim()}
                        onClick={() => addCustomItem(customAlergia, alergias, setAlergias, () => setCustomAlergia(''))}
                        className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Medicamentos e Suplementos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Medicamentos Contínuos
                      </label>
                      <textarea
                        rows={3}
                        value={medicamentos}
                        onChange={(e) => setMedicamentos(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Suplementos em Uso
                      </label>
                      <textarea
                        rows={3}
                        value={suplementos}
                        onChange={(e) => setSuplementos(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ABA HÁBITOS */}
              {dadosTab === 'habitos' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Refeições por dia
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={refeicoesPorDia}
                        onChange={(e) => setRefeicoesPorDia(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-emerald-600 font-semibold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Horário que acorda
                      </label>
                      <input
                        type="text"
                        value={horarioAcorda}
                        onChange={(e) => setHorarioAcorda(e.target.value)}
                        onBlur={() => setHorarioAcorda(autoFormatTime(horarioAcorda))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-emerald-600 font-semibold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Horário que dorme
                      </label>
                      <input
                        type="text"
                        value={horarioDorme}
                        onChange={(e) => setHorarioDorme(e.target.value)}
                        onBlur={() => setHorarioDorme(autoFormatTime(horarioDorme))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-emerald-600 font-semibold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Água por dia
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={litrosAgua}
                          onChange={(e) => setLitrosAgua(e.target.value)}
                          className="w-full pr-14 pl-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-emerald-600 font-semibold text-slate-800"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                          litros
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Pratica atividade física?
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setAtividadeFisica(true)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          atividadeFisica === true
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAtividadeFisica(false)
                          setAtividadeDescricao('')
                        }}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          atividadeFisica === false
                            ? 'bg-slate-700 text-white border-slate-700 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Não
                      </button>
                    </div>

                    {atividadeFisica === true && (
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Qual atividade e frequência semanal?
                        </label>
                        <input
                          type="text"
                          value={atividadeDescricao}
                          onChange={(e) => setAtividadeDescricao(e.target.value)}
                          placeholder="Ex: Musculação 4x na semana..."
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-emerald-600 text-slate-800"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Observações Gerais
                    </label>
                    <textarea
                      rows={3}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Observações complementares..."
                      className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-emerald-600 text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé com botão de Salvar Alterações (Prompt 5) */}
            <div className="px-6 sm:px-8 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Os dados são sincronizados diretamente com o banco de dados Neon.
              </span>
              <button
                type="button"
                onClick={handleSalvarAlteracoes}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEÇÃO 2 — CONSULTAS                                          */}
      {/* ============================================================ */}
      {mainSection === 'consultas' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header da Seção de Consultas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Histórico de Consultas e Evolução Antropométrica
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Acompanhe o peso, medidas e próximos retornos do paciente ao longo do tratamento.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsNovaConsultaOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Consulta</span>
            </button>
          </div>

          {/* Gráfico de Evolução de Peso sempre visível em destaque */}
          <EvolucaoPesoChart consultas={consultas} />

          {/* Lista de Consultas em ordem cronológica decrescente */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                Registros de Consultas ({consultas.length})
              </h3>
              <span className="text-xs text-slate-400">Mais recentes primeiro</span>
            </div>

            {loadingConsultas ? (
              <div className="p-10 text-center text-slate-400 text-sm">
                <div className="w-7 h-7 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
                Carregando consultas...
              </div>
            ) : consultas.length === 0 ? (
              <div className="p-10 text-center">
                <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-700">Nenhuma consulta registrada ainda</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Clique no botão "Nova Consulta" acima para adicionar a primeira consulta deste paciente.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3.5 px-6">Data</th>
                      <th className="py-3.5 px-4">Peso</th>
                      <th className="py-3.5 px-4">Cintura</th>
                      <th className="py-3.5 px-4">Quadril</th>
                      <th className="py-3.5 px-4">% Gordura</th>
                      <th className="py-3.5 px-4">Próximo Retorno</th>
                      <th className="py-3.5 px-6">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {consultas.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-6 font-semibold text-slate-900 whitespace-nowrap">
                          {new Date(c.data_consulta + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-700 whitespace-nowrap">
                          {c.peso} kg
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {c.cintura ? `${c.cintura} cm` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {c.quadril ? `${c.quadril} cm` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {c.percentual_gordura ? `${c.percentual_gordura}%` : '—'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {c.proximo_retorno ? (
                            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                              <Calendar className="w-3 h-3" />
                              {new Date(c.proximo_retorno + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-slate-400">Não agendado</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-slate-600 max-w-xs truncate" title={c.observacoes || ''}>
                          {c.observacoes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEÇÃO 3 — PLANOS ALIMENTARES                                 */}
      {/* ============================================================ */}
      {mainSection === 'planos' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Editor e Gerador de Plano com IA / Manual */}
          {paciente && (
            <PlanoAlimentarEditor
              paciente={paciente}
              onSave={async (planoData: PlanoSemanalData) => {
                await salvarPlanoAlimentar(patientId, planoData)
                await fetchPlanos()
              }}
            />
          )}

          {/* Histórico de planos salvos ou mensagem se vazio */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Histórico de Planos Salvos ({planos.length})
                </h3>
                <span className="text-xs text-slate-400">Mais recentes primeiro</span>
              </div>
            </div>

            {loadingPlanos ? (
              <div className="p-10 text-center text-slate-400 text-sm">
                <div className="w-7 h-7 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-2" />
                Carregando planos alimentares...
              </div>
            ) : planos.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-800">
                  Nenhum plano alimentar gerado ainda
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Clique no botão "✨ Gerar Plano com IA" acima para criar um cardápio semanal personalizado baseado nos dados clínicos do paciente.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {planos.map((plano) => (
                  <div
                    key={plano.id}
                    onClick={() => setSelectedPlano(plano)}
                    className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                          Plano Alimentar #{plano.id.slice(0, 8)}
                        </h4>
                        <span className="text-xs text-slate-400">
                          Gerado em {new Date(plano.created_at).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(plano.created_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white rounded-xl transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Cardápio</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal / Visualizador de conteúdo do plano selecionado com suporte a Abas e visual moderno */}
          {selectedPlano && (
            <PlanoAlimentarViewModal
              plano={selectedPlano}
              onClose={() => setSelectedPlano(null)}
            />
          )}
        </div>
      )}

      {/* Modal de Nova Consulta */}
      {isNovaConsultaOpen && (
        <NovaConsultaModal
          pacienteId={patientId}
          onClose={() => setIsNovaConsultaOpen(false)}
          onSuccess={(_nova) => {
            setIsNovaConsultaOpen(false)
            fetchConsultas()
          }}
        />
      )}
    </div>
  )
}
