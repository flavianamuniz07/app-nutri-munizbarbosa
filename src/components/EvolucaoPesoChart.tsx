import React, { useMemo } from 'react'
import { TrendingDown, TrendingUp, Minus } from 'lucide-react'
import type { Consulta } from '../lib/db'

interface EvolucaoPesoChartProps {
  consultas: Consulta[]
}

export const EvolucaoPesoChart: React.FC<EvolucaoPesoChartProps> = ({ consultas }) => {
  // Ordena cronologicamente crescente para o gráfico (da mais antiga para a mais recente)
  const sorted = useMemo(() => {
    return [...consultas].sort(
      (a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime()
    )
  }, [consultas])

  if (sorted.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-10 text-center">
        <p className="text-sm font-semibold text-slate-500">
          Nenhuma consulta registrada ainda
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Adicione a primeira consulta para visualizar o gráfico de evolução de peso do paciente.
        </p>
      </div>
    )
  }

  // Cálculos de limites do SVG
  const pesos = sorted.map((c) => c.peso)
  const pesoMin = Math.min(...pesos)
  const pesoMax = Math.max(...pesos)
  const diffPeso = pesoMax - pesoMin

  // Diferença do primeiro para o último
  const primeiroPeso = pesos[0]
  const ultimoPeso = pesos[pesos.length - 1]
  const deltaPeso = +(ultimoPeso - primeiroPeso).toFixed(1)

  // Altura e largura do SVG viewBox
  const width = 640
  const height = 220
  const paddingX = 45
  const paddingY = 35

  const points = sorted.map((c, index) => {
    const x =
      sorted.length === 1
        ? width / 2
        : paddingX + (index / (sorted.length - 1)) * (width - paddingX * 2)

    const y =
      diffPeso === 0
        ? height / 2
        : height - paddingY - ((c.peso - pesoMin) / diffPeso) * (height - paddingY * 2)

    return { x, y, consulta: c }
  })

  // Montar caminho SVG suavizado ou em linha
  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
  }, '')

  // Área preenchida com gradiente abaixo da linha
  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY + 10} L ${points[0].x} ${
          height - paddingY + 10
        } Z`
      : ''

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
      {/* Header do Gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">
            Evolução Antropométrica
          </span>
          <h3 className="text-base font-extrabold text-slate-800">
            Evolução de Peso ao Longo do Tempo
          </h3>
        </div>

        {/* Resumo da Variação */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
              deltaPeso < 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                : deltaPeso > 0
                ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                : 'bg-slate-50 text-slate-600 border border-slate-200'
            }`}
          >
            {deltaPeso < 0 ? (
              <TrendingDown className="w-4 h-4 text-emerald-600" />
            ) : deltaPeso > 0 ? (
              <TrendingUp className="w-4 h-4 text-amber-600" />
            ) : (
              <Minus className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {deltaPeso > 0 ? `+${deltaPeso} kg` : `${deltaPeso} kg`} desde o início
            </span>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            ({sorted.length} {sorted.length === 1 ? 'registro' : 'registros'})
          </span>
        </div>
      </div>

      {/* Área do SVG Interativo */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-56 select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="pesoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas de grade horizontais sutis */}
          {[0, 0.5, 1].map((pct, i) => {
            const y = paddingY + pct * (height - paddingY * 2)
            const valorReferencia = +(pesoMax - pct * diffPeso).toFixed(1)
            return (
              <g key={i}>
                <line
                  x1={paddingX - 10}
                  y1={y}
                  x2={width - paddingX + 10}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 15}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fontWeight="600"
                  fill="#94a3b8"
                >
                  {diffPeso === 0 && i > 0 ? '' : `${valorReferencia} kg`}
                </text>
              </g>
            )
          })}

          {/* Área sombreada */}
          {areaD && <path d={areaD} fill="url(#pesoGradient)" />}

          {/* Linha principal de tendência */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#059669"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Pontos de dados */}
          {points.map((p, i) => {
            const dataFmt = new Date(p.consulta.data_consulta + 'T00:00:00').toLocaleDateString(
              'pt-BR',
              { day: '2-digit', month: '2-digit' }
            )
            return (
              <g key={p.consulta.id || i} className="group cursor-pointer">
                {/* Linha vertical até a base */}
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={p.x}
                  y2={height - paddingY + 5}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />

                {/* Círculo do ponto */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  fill="#ffffff"
                  stroke="#059669"
                  strokeWidth="3"
                  className="transition-transform group-hover:scale-125"
                />

                {/* Label com peso acima do ponto */}
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#065f46"
                >
                  {p.consulta.peso} kg
                </text>

                {/* Data na base */}
                <text
                  x={p.x}
                  y={height - paddingY + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="#64748b"
                >
                  {dataFmt}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
