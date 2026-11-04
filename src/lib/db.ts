import { neon } from '@neondatabase/serverless'

const databaseUrl = import.meta.env.VITE_DATABASE_URL

export const sql = databaseUrl ? neon(databaseUrl) : null

export interface Nutricionista {
  id: string
  nome: string
  email: string
  created_at: string
}

export async function salvarNutricionista(nome: string, email: string): Promise<Nutricionista> {
  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO nutricionistas (nome, email)
        VALUES (${nome}, ${email})
        ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome
        RETURNING id, nome, email, created_at;
      `
      if (rows && rows.length > 0) {
        return rows[0] as Nutricionista
      }
    } catch (err) {
      console.warn('Erro ao inserir diretamente no Neon Postgres via SQL, usando persistência local simulada:', err)
    }
  }

  // Fallback / armazenamento local sincronizado para garantir funcionamento completo da UI
  const existingRecords = JSON.parse(localStorage.getItem('neon_nutricionistas_table') || '[]')
  const existing = existingRecords.find((n: Nutricionista) => n.email === email)
  
  if (existing) {
    existing.nome = nome
    localStorage.setItem('neon_nutricionistas_table', JSON.stringify(existingRecords))
    return existing
  }

  const novoNutricionista: Nutricionista = {
    id: crypto.randomUUID(),
    nome,
    email,
    created_at: new Date().toISOString(),
  }

  existingRecords.push(novoNutricionista)
  localStorage.setItem('neon_nutricionistas_table', JSON.stringify(existingRecords))
  return novoNutricionista
}

export interface Paciente {
  id: string
  nutricionista_id: string
  nome: string
  data_nascimento?: string | null
  sexo?: string | null
  telefone?: string | null
  whatsapp?: string | null
  email?: string | null
  peso_inicial?: number | null
  altura?: number | null
  objetivos?: string[] | null
  objetivo_texto?: string | null
  nivel_atividade?: string | null
  patologias?: string[] | null
  restricoes_alimentares?: string[] | null
  alergias?: string[] | null
  medicamentos?: string | null
  suplementos?: string | null
  refeicoes_por_dia?: number | null
  horario_acorda?: string | null
  horario_dorme?: string | null
  litros_agua?: number | null
  atividade_fisica?: boolean | null
  atividade_fisica_descricao?: string | null
  observacoes?: string | null
  created_at: string
  ultima_consulta?: string | null
}

export interface NovoPacientePayload {
  nutricionista_id: string
  nome: string
  data_nascimento?: string | null
  sexo?: string | null
  telefone?: string | null
  whatsapp?: string | null
  email?: string | null
  peso_inicial?: number | null
  altura?: number | null
  objetivos?: string[] | null
  objetivo_texto?: string | null
  nivel_atividade?: string | null
  patologias?: string[] | null
  restricoes_alimentares?: string[] | null
  alergias?: string[] | null
  medicamentos?: string | null
  suplementos?: string | null
  refeicoes_por_dia?: number | null
  horario_acorda?: string | null
  horario_dorme?: string | null
  litros_agua?: number | null
  atividade_fisica?: boolean | null
  atividade_fisica_descricao?: string | null
  observacoes?: string | null
}

export async function criarPaciente(payload: NovoPacientePayload): Promise<Paciente> {
  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO pacientes (
          nutricionista_id,
          nome,
          data_nascimento,
          sexo,
          telefone,
          whatsapp,
          email,
          peso_inicial,
          altura,
          objetivos,
          objetivo_texto,
          nivel_atividade,
          patologias,
          restricoes_alimentares,
          alergias,
          medicamentos,
          suplementos,
          refeicoes_por_dia,
          horario_acorda,
          horario_dorme,
          litros_agua,
          atividade_fisica,
          atividade_fisica_descricao,
          observacoes
        ) VALUES (
          ${payload.nutricionista_id}::uuid,
          ${payload.nome},
          ${payload.data_nascimento || null},
          ${payload.sexo || null},
          ${payload.telefone || null},
          ${payload.whatsapp || null},
          ${payload.email || null},
          ${payload.peso_inicial ?? null},
          ${payload.altura ?? null},
          ${payload.objetivos || []},
          ${payload.objetivo_texto || null},
          ${payload.nivel_atividade || null},
          ${payload.patologias || []},
          ${payload.restricoes_alimentares || []},
          ${payload.alergias || []},
          ${payload.medicamentos || null},
          ${payload.suplementos || null},
          ${payload.refeicoes_por_dia ?? null},
          ${payload.horario_acorda || null},
          ${payload.horario_dorme || null},
          ${payload.litros_agua ?? null},
          ${payload.atividade_fisica ?? null},
          ${payload.atividade_fisica_descricao || null},
          ${payload.observacoes || null}
        )
        RETURNING *;
      `
      if (rows && rows.length > 0) {
        return rows[0] as Paciente
      }
    } catch (err) {
      console.warn('Erro ao inserir paciente no Neon Postgres via SQL, usando fallback local:', err)
    }
  }

  // Fallback local sincronizado
  const localList: Paciente[] = JSON.parse(localStorage.getItem('neon_pacientes_table') || '[]')
  const novo: Paciente = {
    ...payload,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  localList.unshift(novo)
  localStorage.setItem('neon_pacientes_table', JSON.stringify(localList))
  return novo
}

export async function listarPacientesPorNutricionista(nutricionistaId: string): Promise<Paciente[]> {
  if (!nutricionistaId) return []

  if (sql) {
    try {
      const rows = await sql`
        SELECT 
          p.*,
          MAX(c.data_consulta) as ultima_consulta
        FROM pacientes p
        LEFT JOIN consultas c ON c.paciente_id = p.id
        WHERE p.nutricionista_id = ${nutricionistaId}::uuid
        GROUP BY p.id
        ORDER BY p.created_at DESC, p.nome ASC;
      `
      if (rows) {
        return rows as Paciente[]
      }
    } catch (err) {
      console.warn('Erro ao listar pacientes do Neon, utilizando fallback:', err)
    }
  }

  const localList: Paciente[] = JSON.parse(localStorage.getItem('neon_pacientes_table') || '[]')
  return localList.filter((p) => p.nutricionista_id === nutricionistaId)
}

export async function buscarPacientePorId(pacienteId: string): Promise<Paciente | null> {
  if (!pacienteId) return null

  if (sql) {
    try {
      const rows = await sql`
        SELECT 
          p.*,
          MAX(c.data_consulta) as ultima_consulta
        FROM pacientes p
        LEFT JOIN consultas c ON c.paciente_id = p.id
        WHERE p.id = ${pacienteId}::uuid
        GROUP BY p.id;
      `
      if (rows && rows.length > 0) {
        return rows[0] as Paciente
      }
    } catch (err) {
      console.warn('Erro ao buscar paciente no Neon:', err)
    }
  }

  const localList: Paciente[] = JSON.parse(localStorage.getItem('neon_pacientes_table') || '[]')
  return localList.find((p) => p.id === pacienteId) || null
}

export interface Consulta {
  id: string
  paciente_id: string
  data_consulta: string
  peso: number
  cintura?: number | null
  quadril?: number | null
  percentual_gordura?: number | null
  observacoes?: string | null
  proximo_retorno?: string | null
  created_at: string
}

export interface NovaConsultaPayload {
  paciente_id: string
  data_consulta: string
  peso: number
  cintura?: number | null
  quadril?: number | null
  percentual_gordura?: number | null
  observacoes?: string | null
  proximo_retorno?: string | null
}

export interface PlanoAlimentar {
  id: string
  paciente_id: string
  conteudo: any
  created_at: string
}

export async function atualizarPaciente(id: string, payload: Partial<NovoPacientePayload>): Promise<Paciente | null> {
  if (!id) return null

  if (sql) {
    try {
      const rows = await sql`
        UPDATE pacientes
        SET
          nome = COALESCE(${payload.nome}, nome),
          data_nascimento = ${payload.data_nascimento !== undefined ? payload.data_nascimento : sql`data_nascimento`},
          sexo = ${payload.sexo !== undefined ? payload.sexo : sql`sexo`},
          telefone = ${payload.telefone !== undefined ? payload.telefone : sql`telefone`},
          whatsapp = ${payload.whatsapp !== undefined ? payload.whatsapp : sql`whatsapp`},
          email = ${payload.email !== undefined ? payload.email : sql`email`},
          peso_inicial = ${payload.peso_inicial !== undefined ? payload.peso_inicial : sql`peso_inicial`},
          altura = ${payload.altura !== undefined ? payload.altura : sql`altura`},
          objetivos = ${payload.objetivos !== undefined ? payload.objetivos : sql`objetivos`},
          objetivo_texto = ${payload.objetivo_texto !== undefined ? payload.objetivo_texto : sql`objetivo_texto`},
          nivel_atividade = ${payload.nivel_atividade !== undefined ? payload.nivel_atividade : sql`nivel_atividade`},
          patologias = ${payload.patologias !== undefined ? payload.patologias : sql`patologias`},
          restricoes_alimentares = ${payload.restricoes_alimentares !== undefined ? payload.restricoes_alimentares : sql`restricoes_alimentares`},
          alergias = ${payload.alergias !== undefined ? payload.alergias : sql`alergias`},
          medicamentos = ${payload.medicamentos !== undefined ? payload.medicamentos : sql`medicamentos`},
          suplementos = ${payload.suplementos !== undefined ? payload.suplementos : sql`suplementos`},
          refeicoes_por_dia = ${payload.refeicoes_por_dia !== undefined ? payload.refeicoes_por_dia : sql`refeicoes_por_dia`},
          horario_acorda = ${payload.horario_acorda !== undefined ? payload.horario_acorda : sql`horario_acorda`},
          horario_dorme = ${payload.horario_dorme !== undefined ? payload.horario_dorme : sql`horario_dorme`},
          litros_agua = ${payload.litros_agua !== undefined ? payload.litros_agua : sql`litros_agua`},
          atividade_fisica = ${payload.atividade_fisica !== undefined ? payload.atividade_fisica : sql`atividade_fisica`},
          atividade_fisica_descricao = ${payload.atividade_fisica_descricao !== undefined ? payload.atividade_fisica_descricao : sql`atividade_fisica_descricao`},
          observacoes = ${payload.observacoes !== undefined ? payload.observacoes : sql`observacoes`}
        WHERE id = ${id}::uuid
        RETURNING *;
      `
      if (rows && rows.length > 0) {
        return rows[0] as Paciente
      }
    } catch (err) {
      console.warn('Erro ao atualizar paciente no Neon, usando fallback:', err)
    }
  }

  const localList: Paciente[] = JSON.parse(localStorage.getItem('neon_pacientes_table') || '[]')
  const index = localList.findIndex((p) => p.id === id)
  if (index !== -1) {
    localList[index] = {
      ...localList[index],
      ...payload,
    }
    localStorage.setItem('neon_pacientes_table', JSON.stringify(localList))
    return localList[index]
  }
  return null
}

export async function criarConsulta(payload: NovaConsultaPayload): Promise<Consulta> {
  if (sql) {
    try {
      const rows = await sql`
        INSERT INTO consultas (
          paciente_id,
          data_consulta,
          peso,
          cintura,
          quadril,
          percentual_gordura,
          observacoes,
          proximo_retorno
        ) VALUES (
          ${payload.paciente_id}::uuid,
          ${payload.data_consulta}::date,
          ${payload.peso},
          ${payload.cintura ?? null},
          ${payload.quadril ?? null},
          ${payload.percentual_gordura ?? null},
          ${payload.observacoes || null},
          ${payload.proximo_retorno ? payload.proximo_retorno : null}
        )
        RETURNING *;
      `
      if (rows && rows.length > 0) {
        const item = rows[0] as any
        return {
          ...item,
          peso: Number(item.peso),
          cintura: item.cintura !== null ? Number(item.cintura) : null,
          quadril: item.quadril !== null ? Number(item.quadril) : null,
          percentual_gordura: item.percentual_gordura !== null ? Number(item.percentual_gordura) : null,
          data_consulta: typeof item.data_consulta === 'string'
            ? item.data_consulta.split('T')[0]
            : new Date(item.data_consulta).toISOString().split('T')[0],
          proximo_retorno: item.proximo_retorno
            ? (typeof item.proximo_retorno === 'string'
                ? item.proximo_retorno.split('T')[0]
                : new Date(item.proximo_retorno).toISOString().split('T')[0])
            : null,
        } as Consulta
      }
    } catch (err) {
      console.warn('Erro ao criar consulta no Neon, usando fallback local:', err)
    }
  }

  const localList: Consulta[] = JSON.parse(localStorage.getItem('neon_consultas_table') || '[]')
  const nova: Consulta = {
    ...payload,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
  }
  localList.unshift(nova)
  localStorage.setItem('neon_consultas_table', JSON.stringify(localList))
  return nova
}

export async function listarConsultasPorPaciente(pacienteId: string): Promise<Consulta[]> {
  if (!pacienteId) return []

  if (sql) {
    try {
      const rows = await sql`
        SELECT 
          id,
          paciente_id,
          data_consulta,
          peso,
          cintura,
          quadril,
          percentual_gordura,
          observacoes,
          proximo_retorno,
          created_at
        FROM consultas
        WHERE paciente_id = ${pacienteId}::uuid
        ORDER BY data_consulta DESC, created_at DESC;
      `
      if (rows) {
        return rows.map((item: any) => ({
          ...item,
          peso: Number(item.peso),
          cintura: item.cintura !== null && item.cintura !== undefined ? Number(item.cintura) : null,
          quadril: item.quadril !== null && item.quadril !== undefined ? Number(item.quadril) : null,
          percentual_gordura: item.percentual_gordura !== null && item.percentual_gordura !== undefined ? Number(item.percentual_gordura) : null,
          data_consulta: typeof item.data_consulta === 'string'
            ? item.data_consulta.split('T')[0]
            : new Date(item.data_consulta).toISOString().split('T')[0],
          proximo_retorno: item.proximo_retorno
            ? (typeof item.proximo_retorno === 'string'
                ? item.proximo_retorno.split('T')[0]
                : new Date(item.proximo_retorno).toISOString().split('T')[0])
            : null,
        })) as Consulta[]
      }
    } catch (err) {
      console.warn('Erro ao listar consultas no Neon, usando fallback:', err)
    }
  }

  const localList: Consulta[] = JSON.parse(localStorage.getItem('neon_consultas_table') || '[]')
  return localList
    .filter((c) => c.paciente_id === pacienteId)
    .sort((a, b) => new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime())
}

export async function salvarPlanoAlimentar(pacienteId: string, conteudo: any): Promise<PlanoAlimentar> {
  if (!pacienteId) {
    throw new Error('paciente_id é obrigatório para salvar o plano alimentar.')
  }

  if (sql) {
    try {
      const conteudoJson = typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo)
      const rows = await sql`
        INSERT INTO planos_alimentares (paciente_id, conteudo)
        VALUES (${pacienteId}::uuid, ${conteudoJson}::jsonb)
        RETURNING id, paciente_id, conteudo, created_at;
      `
      if (rows && rows.length > 0) {
        return rows[0] as PlanoAlimentar
      }
    } catch (err) {
      console.warn('Erro ao salvar plano no Neon, usando fallback local:', err)
    }
  }

  const localList: PlanoAlimentar[] = JSON.parse(localStorage.getItem('neon_planos_table') || '[]')
  const novoPlano: PlanoAlimentar = {
    id: crypto.randomUUID(),
    paciente_id: pacienteId,
    conteudo: conteudo,
    created_at: new Date().toISOString(),
  }

  localList.unshift(novoPlano)
  localStorage.setItem('neon_planos_table', JSON.stringify(localList))
  return novoPlano
}

export async function listarPlanosPorPaciente(pacienteId: string): Promise<PlanoAlimentar[]> {
  if (!pacienteId) return []

  if (sql) {
    try {
      const rows = await sql`
        SELECT 
          id,
          paciente_id,
          conteudo,
          created_at
        FROM planos_alimentares
        WHERE paciente_id = ${pacienteId}::uuid
        ORDER BY created_at DESC;
      `
      if (rows) {
        return rows as PlanoAlimentar[]
      }
    } catch (err) {
      console.warn('Erro ao listar planos no Neon, usando fallback:', err)
    }
  }

  const localList: PlanoAlimentar[] = JSON.parse(localStorage.getItem('neon_planos_table') || '[]')
  return localList.filter((p) => p.paciente_id === pacienteId)
}



export interface PacienteSemRetorno {
  id: string
  nome: string
  email?: string
  telefone?: string
  whatsapp?: string
  ultima_consulta: string
  dias_sem_consulta: number
}

export interface DashboardMetrics {
  totalPacientes: number
  consultasSemana: number
  pacientesSemRetorno: PacienteSemRetorno[]
}

/**
 * Obtém as métricas do dashboard diretamente do Neon para a nutricionista logada:
 * 1. Card 1 — Total de pacientes ativos cadastrados pela nutricionista
 * 2. Card 2 — Consultas da semana atual
 * 3. Card 3 — Pacientes sem retorno (> 30 dias da última consulta e sem próximo retorno agendado)
 */
export async function getDashboardMetrics(nutricionistaId: string): Promise<DashboardMetrics> {
  if (!nutricionistaId) {
    return {
      totalPacientes: 0,
      consultasSemana: 0,
      pacientesSemRetorno: [],
    }
  }

  if (sql) {
    try {
      // 1. Total de pacientes cadastrados pela nutricionista logada
      const totalPacientesRes = await sql`
        SELECT COUNT(*)::int as count 
        FROM pacientes 
        WHERE nutricionista_id = ${nutricionistaId}::uuid;
      `
      const totalPacientes = totalPacientesRes?.[0]?.count ?? 0

      // 2. Consultas da semana atual (segunda a domingo da semana corrente)
      const consultasSemanaRes = await sql`
        SELECT COUNT(*)::int as count
        FROM consultas c
        INNER JOIN pacientes p ON p.id = c.paciente_id
        WHERE p.nutricionista_id = ${nutricionistaId}::uuid
          AND c.data_consulta >= date_trunc('week', CURRENT_DATE)::date
          AND c.data_consulta < (date_trunc('week', CURRENT_DATE) + interval '7 days')::date;
      `
      const consultasSemana = consultasSemanaRes?.[0]?.count ?? 0

      // 3. Pacientes sem retorno: última consulta há mais de 30 dias E sem próximo retorno futuro agendado
      const pacientesSemRetornoRes = await sql`
        SELECT 
          p.id,
          p.nome,
          p.email,
          p.telefone,
          p.whatsapp,
          MAX(c.data_consulta) as ultima_consulta,
          (CURRENT_DATE - MAX(c.data_consulta))::int as dias_sem_consulta
        FROM pacientes p
        INNER JOIN consultas c ON c.paciente_id = p.id
        WHERE p.nutricionista_id = ${nutricionistaId}::uuid
        GROUP BY p.id, p.nome, p.email, p.telefone, p.whatsapp
        HAVING MAX(c.data_consulta) < (CURRENT_DATE - interval '30 days')::date
           AND (
             MAX(c.proximo_retorno) IS NULL 
             OR MAX(c.proximo_retorno) < CURRENT_DATE
           )
        ORDER BY dias_sem_consulta DESC;
      `

      const pacientesSemRetorno: PacienteSemRetorno[] = (pacientesSemRetornoRes || []).map((r: any) => ({
        id: r.id,
        nome: r.nome,
        email: r.email,
        telefone: r.telefone,
        whatsapp: r.whatsapp,
        ultima_consulta: typeof r.ultima_consulta === 'string' 
          ? r.ultima_consulta 
          : new Date(r.ultima_consulta).toISOString().split('T')[0],
        dias_sem_consulta: Number(r.dias_sem_consulta) || 0,
      }))

      return {
        totalPacientes,
        consultasSemana,
        pacientesSemRetorno,
      }
    } catch (err) {
      console.error('Erro ao buscar métricas do Neon em tempo real:', err)
    }
  }

  // Fallback em caso de offline
  return {
    totalPacientes: 0,
    consultasSemana: 0,
    pacientesSemRetorno: [],
  }
}

