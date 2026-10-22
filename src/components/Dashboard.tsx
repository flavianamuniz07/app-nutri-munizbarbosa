import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { DashboardContent } from './DashboardContent'
import { PacientesView } from './PacientesView'
import { NovoPacienteForm } from './NovoPacienteForm'
import { PacienteDetalhes } from './PacienteDetalhes'
import type { Paciente } from '../lib/db'

export type ActiveScreen = 'dashboard' | 'pacientes_list' | 'pacientes_novo' | 'paciente_perfil'

export const Dashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'pacientes'>('dashboard')
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('dashboard')
  const [selectedPatient, setSelectedPatient] = useState<Paciente | any | null>(null)
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null)

  const handleSelectSidebarTab = (tab: 'dashboard' | 'pacientes') => {
    setCurrentTab(tab)
    if (tab === 'dashboard') {
      setActiveScreen('dashboard')
    } else {
      setActiveScreen('pacientes_list')
    }
  }

  // Ação ao clicar em um paciente da lista ou do dashboard: redirecionar para o perfil
  const handleOpenPatientProfile = (patient: any) => {
    setSelectedPatient(patient)
    setCurrentTab('pacientes')
    setActiveScreen('paciente_perfil')
    setProfileSuccessMsg(null)
  }

  // Ação ao clicar no botão "Novo Paciente"
  const handleOpenNovoPaciente = () => {
    setCurrentTab('pacientes')
    setActiveScreen('pacientes_novo')
    setProfileSuccessMsg(null)
  }

  // Regra: "Após salvar, redirecionar para o perfil do paciente recém cadastrado. Exibir mensagem de sucesso ao salvar"
  const handlePatientCreatedSuccess = (novoPaciente: Paciente) => {
    setSelectedPatient(novoPaciente)
    setActiveScreen('paciente_perfil')
    setProfileSuccessMsg('Paciente cadastrado com sucesso!')
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Menu Lateral Fixo mantido na tela de listagem e no formulário */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectSidebarTab}
      />

      {/* Área Principal */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeScreen === 'dashboard' && (
            <DashboardContent
              onSelectPatient={handleOpenPatientProfile}
              onNavigateToPacientes={() => {
                setCurrentTab('pacientes')
                setActiveScreen('pacientes_list')
              }}
            />
          )}

          {activeScreen === 'pacientes_list' && (
            <PacientesView
              onSelectPatient={handleOpenPatientProfile}
              onNovoPaciente={handleOpenNovoPaciente}
            />
          )}

          {activeScreen === 'pacientes_novo' && (
            <NovoPacienteForm
              onSuccess={handlePatientCreatedSuccess}
              onCancel={() => setActiveScreen('pacientes_list')}
            />
          )}

          {activeScreen === 'paciente_perfil' && selectedPatient && (
            <PacienteDetalhes
              patientId={selectedPatient.id}
              initialData={selectedPatient}
              successMessage={profileSuccessMsg}
              onClearSuccessMessage={() => setProfileSuccessMsg(null)}
              onBack={() => setActiveScreen('pacientes_list')}
            />
          )}
        </div>
      </main>
    </div>
  )
}
