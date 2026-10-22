import React, { useState } from 'react'
import { 
  ArrowLeft, 
  Check, 
  User, 
  Activity, 
  Clock, 
  Scale, 
  Plus, 
  X,
  Phone,
  Mail,
  Calendar,
  AlertCircle
} from 'lucide-react'
import { criarPaciente, criarConsulta, type Paciente, type NovoPacientePayload } from '../lib/db'
import { useAuth } from '../lib/AuthContext'

interface NovoPacienteFormProps {
  onSuccess: (paciente: Paciente) => void
  onCancel: () => void
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

export const NovoPacienteForm: React.FC<NovoPacienteFormProps> = ({ onSuccess, onCancel }) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'pessoal' | 'clinico' | 'habitos'>('pessoal')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Aba 1 — Pessoal
  const [nome, setNome] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [dataInicioTratamento, setDataInicioTratamento] = useState(() => new Date().toISOString().split('T')[0])
  const [sexo, setSexo] = useState<string>('')
  const [telefone, setTelefone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')

  // Aba 2 — Clínico
  const [pesoAtual, setPesoAtual] = useState<string>('')
  const [altura, setAltura] = useState<string>('')
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

  // Aba 3 — Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState<string>('')
  const [horarioAcorda, setHorarioAcorda] = useState('')
  const [horarioDorme, setHorarioDorme] = useState('')
  const [litrosAgua, setLitrosAgua] = useState<string>('')
  const [praticaAtividade, setPraticaAtividade] = useState<boolean | null>(null)
  const [atividadeDescricao, setAtividadeDescricao] = useState('')
  const [observacoes, setObservacoes] = useState('')

  // Helper: cálculo automático de idade
  const calcularIdade = (dataIso: string): number | null => {
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

  // Helper: formatação de telefone e whatsapp
  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits ? `(${digits}` : ''
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
  }

  // Helper: cálculo automático de IMC
  const pesoNum = parseFloat(pesoAtual.replace(',', '.'))
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

  // Helper: formatação automática de hora (ex: 6 -> 06:00, 630 -> 06:30, 23 -> 23:00, 2230 -> 22:30)
  const autoFormatTime = (raw: string): string => {
    const clean = raw.trim().replace(/\D/g, '')
    if (!clean) return raw
    if (clean.length === 1) {
      return `0${clean}:00`
    }
    if (clean.length === 2) {
      const num = parseInt(clean, 10)
      if (num >= 0 && num <= 23) {
        return `${clean.padStart(2, '0')}:00`
      }
      return `${clean}:00`
    }
    if (clean.length === 3) {
      // Ex: 630 -> 06:30
      const h = clean.slice(0, 1).padStart(2, '0')
      const m = clean.slice(1, 3)
      return `${h}:${m}`
    }
    if (clean.length >= 4) {
      // Ex: 2230 -> 22:30
      const h = clean.slice(0, 2)
      const m = clean.slice(2, 4)
      return `${h}:${m}`
    }
    return raw
  }

  // Handlers para seleção múltipla com suporte a "Nenhum"
  const toggleMultiSelectWithNone = (
    currentList: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    if (item === 'Nenhum') {
      if (currentList.includes('Nenhum')) {
        setter([])
      } else {
        setter(['Nenhum'])
      }
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
    if (!withoutNone.includes(trimmed)) {
      setList([...withoutNone, trimmed])
    }
    clearInput()
  }

  const removeItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    setList(list.filter((i) => i !== item))
  }

  const toggleObjetivo = (item: string) => {
    if (objetivos.includes(item)) {
      setObjetivos(objetivos.filter((o) => o !== item))
    } else {
      setObjetivos([...objetivos, item])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Regra: "O único campo obrigatório é o nome completo"
    if (!nome.trim()) {
      setErrorMessage('Por favor, preencha o nome completo do paciente.')
      setActiveTab('pessoal')
      return
    }

    if (!user?.id) {
      setErrorMessage('Sessão expirada. Por favor faça login novamente.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload: NovoPacientePayload = {
        nutricionista_id: user.id,
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
        atividade_fisica: praticaAtividade,
        atividade_fisica_descricao: praticaAtividade ? atividadeDescricao.trim() || null : null,
        observacoes: observacoes.trim() || null,
      }

      const novo = await criarPaciente(payload)

      // Regra Prompt 5: "ao cadastrar o Paciente eu possa colocar a data de início do tratamento, essa data ficará registrada como a primeira consulta"
      if (dataInicioTratamento && novo?.id) {
        try {
          await criarConsulta({
            paciente_id: novo.id,
            data_consulta: dataInicioTratamento,
            peso: payload.peso_inicial ?? 0,
            observacoes: 'Consulta inicial (Início do tratamento)',
          })
        } catch (consErr) {
          console.warn('Erro ao registrar primeira consulta automática:', consErr)
        }
      }

      onSuccess(novo)
    } catch (err: any) {
      console.error('Erro ao cadastrar paciente:', err)
      setErrorMessage('Ocorreu um erro ao salvar o paciente. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const idadeCalculada = calcularIdade(dataNascimento)

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header com Botão Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/80 bg-white shadow-2xs"
            title="Voltar para a lista de pacientes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
              Novo Paciente
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Preencha os dados do paciente organizados em abas. Apenas o nome completo é obrigatório.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Salvar Paciente</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerta de Erro */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Abas de Navegação */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('pessoal')}
          className={`flex items-center gap-2.5 pb-3.5 px-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'pessoal'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Aba 1 — Pessoal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clinico')}
          className={`flex items-center gap-2.5 pb-3.5 px-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'clinico'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Aba 2 — Clínico</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('habitos')}
          className={`flex items-center gap-2.5 pb-3.5 px-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'habitos'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Aba 3 — Hábitos</span>
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        {/* ==================== ABA 1: PESSOAL ==================== */}
        {activeTab === 'pessoal' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-base font-bold text-slate-800">Dados Pessoais e Contato</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Informações cadastrais e meios de comunicação com o paciente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nome completo (obrigatório) */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nome Completo <span className="text-emerald-600">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Mariana Silva Muniz"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* Data de nascimento com cálculo de idade automático */}
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
                {idadeCalculada !== null && (
                  <p className="text-xs text-emerald-700 font-semibold mt-1.5 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">
                    <span>Idade calculada:</span>
                    <strong>{idadeCalculada} anos</strong>
                  </p>
                )}
              </div>

              {/* Data de início do tratamento (Prompt 5: essa data ficará registrada como a primeira consulta) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Início do Tratamento (1ª Consulta)</span>
                  <span className="text-[10px] text-emerald-600 font-normal">Registra 1ª consulta</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={dataInicioTratamento}
                    onChange={(e) => setDataInicioTratamento(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Sexo (seleção única: Feminino, Masculino, Outro) */}
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

              {/* Telefone */}
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

              {/* WhatsApp */}
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

              {/* Email */}
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
                    placeholder="paciente@exemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTab('clinico')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Próximo: Dados Clínicos &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ==================== ABA 2: CLÍNICO ==================== */}
        {activeTab === 'clinico' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-base font-bold text-slate-800">Dados Antropométricos e Clínicos</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Medidas corporais, histórico patológico, alergias e medicamentos.
              </p>
            </div>

            {/* Peso, Altura e IMC Automático */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              {/* Peso com sufixo kg */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Peso atual
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={pesoAtual}
                    onChange={(e) => setPesoAtual(e.target.value)}
                    placeholder="70.5"
                    className="w-full pr-12 pl-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-semibold text-slate-800"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    kg
                  </span>
                </div>
              </div>

              {/* Altura com sufixo cm */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Altura
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                    placeholder="175"
                    className="w-full pr-12 pl-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-semibold text-slate-800"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    cm
                  </span>
                </div>
              </div>

              {/* IMC Calculado (somente leitura) */}
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
                Objetivos (Múltipla escolha)
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
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {selected && <Check className="w-3.5 h-3.5" />}
                      <span>{obj}</span>
                    </button>
                  )
                })}
              </div>

              <div>
                <input
                  type="text"
                  value={objetivoTexto}
                  onChange={(e) => setObjetivoTexto(e.target.value)}
                  placeholder="Observação adicional ou objetivo específico livre..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Nível de atividade física (seleção única) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nível de Atividade Física (Seleção única)
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

            {/* Patologias ou condições de saúde */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Patologias ou Condições de Saúde
              </label>
              <div className="flex flex-wrap gap-2">
                {/* Opção "Nenhum" */}
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
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                      <span>{pat}</span>
                    </button>
                  )
                })}

                {/* Itens adicionados livremente */}
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

              {/* Input livre para adicionar patologia */}
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
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 disabled:bg-slate-100"
                />
                <button
                  type="button"
                  disabled={patologias.includes('Nenhum') || !customPatologia.trim()}
                  onClick={() => addCustomItem(customPatologia, patologias, setPatologias, () => setCustomPatologia(''))}
                  className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Restrições alimentares */}
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
                      ? 'bg-slate-700 text-white border-slate-700 shadow-2xs'
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
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'
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
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 disabled:bg-slate-100"
                />
                <button
                  type="button"
                  disabled={restricoes.includes('Nenhum') || !customRestricao.trim()}
                  onClick={() => addCustomItem(customRestricao, restricoes, setRestricoes, () => setCustomRestricao(''))}
                  className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Alergias alimentares */}
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
                      ? 'bg-slate-700 text-white border-slate-700 shadow-2xs'
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
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'
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
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-emerald-600 disabled:bg-slate-100"
                />
                <button
                  type="button"
                  disabled={alergias.includes('Nenhum') || !customAlergia.trim()}
                  onClick={() => addCustomItem(customAlergia, alergias, setAlergias, () => setCustomAlergia(''))}
                  className="px-3 py-2 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Medicamentos e Suplementos (texto livre) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Medicamentos Contínuos
                </label>
                <textarea
                  rows={3}
                  value={medicamentos}
                  onChange={(e) => setMedicamentos(e.target.value)}
                  placeholder="Ex: Levotiroxina 50mcg pela manhã, Losartana..."
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
                  placeholder="Ex: Whey protein 30g pós treino, Creatina 5g, Vitamina D..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('pessoal')}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                &larr; Voltar para Pessoal
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('habitos')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Próximo: Hábitos &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ==================== ABA 3: HÁBITOS ==================== */}
        {activeTab === 'habitos' && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-base font-bold text-slate-800">Rotina e Hábitos Diários</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Rotina de sono, hidratação, número de refeições e prática de atividades.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Quantas refeições faz por dia */}
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
                  placeholder="Ex: 4"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-semibold text-slate-800"
                />
              </div>

              {/* Horário que acorda com conversão automática */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Horário que acorda
                </label>
                <input
                  type="text"
                  value={horarioAcorda}
                  onChange={(e) => setHorarioAcorda(e.target.value)}
                  onBlur={() => setHorarioAcorda(autoFormatTime(horarioAcorda))}
                  placeholder="Ex: 6 → 06:00"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-semibold text-slate-800"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Ex: digite 630 para 06:30
                </span>
              </div>

              {/* Horário que dorme com conversão automática */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Horário que dorme
                </label>
                <input
                  type="text"
                  value={horarioDorme}
                  onChange={(e) => setHorarioDorme(e.target.value)}
                  onBlur={() => setHorarioDorme(autoFormatTime(horarioDorme))}
                  placeholder="Ex: 23 → 23:00"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-semibold text-slate-800"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Ex: digite 2230 para 22:30
                </span>
              </div>

              {/* Quantidade de água por dia com sufixo litros */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Água por dia
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={litrosAgua}
                    onChange={(e) => setLitrosAgua(e.target.value)}
                    placeholder="2.5"
                    className="w-full pr-14 pl-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-semibold text-slate-800"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                    litros
                  </span>
                </div>
              </div>
            </div>

            {/* Pratica atividade física (sim/não) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pratica atividade física?
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPraticaAtividade(true)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    praticaAtividade === true
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPraticaAtividade(false)
                    setAtividadeDescricao('')
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    praticaAtividade === false
                      ? 'bg-slate-700 text-white border-slate-700 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Não
                </button>
              </div>

              {/* Se sim, abre campo de texto: qual atividade e frequência semanal */}
              {praticaAtividade === true && (
                <div className="pt-2 animate-in fade-in">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Qual atividade e frequência semanal?
                  </label>
                  <input
                    type="text"
                    value={atividadeDescricao}
                    onChange={(e) => setAtividadeDescricao(e.target.value)}
                    placeholder="Ex: Musculação 4x na semana e corrida aos sábados"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
                  />
                </div>
              )}
            </div>

            {/* Observações gerais */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Observações Gerais
              </label>
              <textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações complementares, preferências alimentares, histórico familiar ou anotações livres..."
                className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800"
              />
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('clinico')}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                &larr; Voltar para Clínico
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Cadastrar Paciente</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
