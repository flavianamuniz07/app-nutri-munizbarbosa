import React from 'react'

interface LogoProps {
  className?: string
  subtitle?: string
}

export const Logo: React.FC<LogoProps> = ({ className = '', subtitle }) => {
  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-50">
          <svg
            className="w-7 h-7 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Folha / Saúde estilizada */}
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        </div>
        <div className="text-left">
          <span className="block text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            Muniz Barbosa <span className="text-emerald-600 font-extrabold">Nutri</span>
          </span>
          <span className="block text-xs font-semibold text-emerald-700 tracking-wide uppercase">
            Gestão & Consultoria Nutricional
          </span>
        </div>
      </div>
      {subtitle && (
        <p className="mt-3 text-sm text-slate-500 text-center font-normal max-w-sm">
          {subtitle}
        </p>
      )}
    </div>
  )
}
