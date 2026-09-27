import React from 'react';
import { ZeroGravityProvider, useZeroGravity } from './context/ZeroGravityContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import StatCards from './components/StatCards';
import QuantumFilterBar from './components/QuantumFilterBar';
import EmployeeList from './components/EmployeeList';
import EmployeeKanban from './components/EmployeeKanban';
import EmployeeModal from './components/EmployeeModal';
import EmployeeDossierDrawer from './components/EmployeeDossierDrawer';
import TelemetryHUD from './components/TelemetryHUD';
import CosmicToasts from './components/CosmicToasts';
import ContractManagement from './components/ContractManagement';
import WorkingScheduleSetup from './components/WorkingScheduleSetup';
import AttendanceManagement from './components/AttendanceManagement';
import TimeOffManagement from './components/TimeOffManagement';
import SalaryStructureManagement from './components/SalaryStructureManagement';
import PayrollDashboard from './components/PayrollDashboard';
import PayrunWizard from './components/PayrunWizard';
import { Sparkles, Compass, Shield, FileText, CalendarClock } from 'lucide-react';

function DashboardContent() {
  const { viewMode, activeNav } = useZeroGravity();

  // ─── Zero-G Payroll Cockpit Dashboard (Final Turn) ────────────────────────
  if (activeNav === 'payroll') {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-cosmic-950 overflow-y-auto pb-28">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <PayrollDashboard />
          </main>
        </div>
        <EmployeeDossierDrawer />
        <TelemetryHUD />
        <CosmicToasts />
      </div>
    );
  }

  // ─── Orbital Payrun Setup Wizard & Processing Screen (Final Turn) ─────────
  if (activeNav === 'payruns') {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-cosmic-950 overflow-y-auto pb-28">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <PayrunWizard />
          </main>
        </div>
        <EmployeeDossierDrawer />
        <TelemetryHUD />
        <CosmicToasts />
      </div>
    );
  }

  // ─── Salary Structure & Salary Rule Configuration ─────────────────────────
  if (activeNav === 'salary-structures' || activeNav === 'salary-rules') {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-cosmic-950 overflow-y-auto pb-28">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <SalaryStructureManagement />
          </main>
        </div>
        <EmployeeDossierDrawer />
        <TelemetryHUD />
        <CosmicToasts />
      </div>
    );
  }

  // ─── Orbital Attendance Management Page (Turn 2) ──────────────────────────
  if (activeNav === 'attendance') {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-cosmic-950 overflow-y-auto pb-28">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <AttendanceManagement />
          </main>
        </div>
        <EmployeeDossierDrawer />
        <TelemetryHUD />
        <CosmicToasts />
      </div>
    );
  }

  // ─── Zero-G Time Off Matrix Page (Turn 2) ─────────────────────────────────
  if (activeNav === 'timeoff') {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-cosmic-950 overflow-y-auto pb-28">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <TimeOffManagement />
          </main>
        </div>
        <EmployeeDossierDrawer />
        <TelemetryHUD />
        <CosmicToasts />
      </div>
    );
  }

  // ─── Contract Management Page ────────────────────────────────────────────
  if (activeNav === 'contracts') {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-cosmic-950 overflow-y-auto pb-28">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <ContractManagement />
          </main>
        </div>
        <EmployeeDossierDrawer />
        <TelemetryHUD />
        <CosmicToasts />
      </div>
    );
  }

  // ─── Working Schedule Setup Page ─────────────────────────────────────────
  if (activeNav === 'schedules') {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-cosmic-950 overflow-y-auto pb-28">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <WorkingScheduleSetup />
          </main>
        </div>
        <EmployeeDossierDrawer />
        <TelemetryHUD />
        <CosmicToasts />
      </div>
    );
  }

  // ─── Default: Employee Master Directory ───────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-cosmic-950 overflow-y-auto pb-28">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Dashboard Header */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-quantum-cyan border border-cyan-500/30 flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3 h-3 animate-spin text-quantum-cyan" />
                  ORBITAL HUMAN CAPITAL SUITE
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Sector 07 • Anti-Gravity Active
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                Astronaut & Crew Master Directory
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl font-sans">
                Autonomous human resource matrix calibrated with zero-gravity state management,
                quantum-level database pooling, and frictionless levitation security clearance.
              </p>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <StatCards />

          {/* Filtering and View Switcher */}
          <QuantumFilterBar />

          {/* Main View: List Matrix or Zero-G Kanban */}
          {viewMode === 'list' ? <EmployeeList /> : <EmployeeKanban />}
        </main>
      </div>

      {/* Floating Modals and Drawers */}
      <EmployeeModal />
      <EmployeeDossierDrawer />
      <TelemetryHUD />
      <CosmicToasts />
    </div>
  );
}

export default function App() {
  return (
    <ZeroGravityProvider>
      <DashboardContent />
    </ZeroGravityProvider>
  );
}
