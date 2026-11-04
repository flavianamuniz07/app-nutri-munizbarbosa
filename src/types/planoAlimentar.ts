export interface RefeicoesDia {
  cafe_da_manha: string[]
  lanche_manha: string[]
  almoco: string[]
  lanche_tarde: string[]
  jantar: string[]
}

export interface DiaPlano {
  dia: string
  refeicoes: RefeicoesDia
}

export interface PlanoSemanalData {
  plano_semanal: DiaPlano[]
}

export const DIAS_DA_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
]

export const REFEICOES_LABELS: { [key in keyof RefeicoesDia]: string } = {
  cafe_da_manha: 'Café da Manhã',
  lanche_manha: 'Lanche da Manhã',
  almoco: 'Almoço',
  lanche_tarde: 'Lanche da Tarde',
  jantar: 'Jantar',
}

export function criarPlanoManualVazio(): PlanoSemanalData {
  return {
    plano_semanal: DIAS_DA_SEMANA.map((dia) => ({
      dia,
      refeicoes: {
        cafe_da_manha: ['', '', '', '', ''],
        lanche_manha: ['', '', '', '', ''],
        almoco: ['', '', '', '', ''],
        lanche_tarde: ['', '', '', '', ''],
        jantar: ['', '', '', '', ''],
      },
    })),
  }
}

