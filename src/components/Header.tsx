import React from 'react';
import { 
  Flame, 
  Table2, 
  FileText, 
  Users, 
  Truck, 
  Plus, 
  Download, 
  Moon, 
  Sun, 
  Shield, 
  LogOut,
  UserCheck,
  Image as ImageIcon
} from 'lucide-react';
import { exportMatrixToExcel } from '../utils/excelExport';
import { EmergencyReport, Volunteer, UserProfile, CompanyBranding } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewReport: () => void;
  onLogout: () => void;
  onOpenLogoManager: () => void;
  reports: EmergencyReport[];
  volunteers: Volunteer[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser: UserProfile;
  branding: CompanyBranding;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewReport,
  onLogout,
  onOpenLogoManager,
  reports,
  volunteers,
  isDarkMode,
  onToggleDarkMode,
  currentUser,
  branding,
}) => {
  const handleExportExcel = () => {
    exportMatrixToExcel(reports, volunteers, new Date().getFullYear());
  };

  const isSuperAdminOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  return (
    <header className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white border-b border-red-800/70 shadow-lg sticky top-0 z-40 transition-colors">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-2">
        {/* Crest & Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={() => {
              if (isSuperAdminOrAdmin) {
                onOpenLogoManager();
              }
            }}
            className="relative flex-shrink-0 group focus:outline-none"
            title={isSuperAdminOrAdmin ? 'Personalizar escudo institucional' : branding.companyName}
          >
            <img 
              src={branding.logoUrl || '/logo_4ta_calle_larga.png'} 
              alt={branding.companyName} 
              className="w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow-md rounded-2xl bg-slate-950/60 p-1 border border-slate-700/80 group-hover:border-red-500 transition-all transform group-hover:scale-105" 
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo_4ta_calle_larga.png';
              }}
            />
          </button>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white truncate flex items-center gap-1.5">
                <span>{branding.companyName}</span>
              </h1>
              <span className="hidden sm:inline-block bg-red-700/80 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-600/60 uppercase tracking-wider">
                {branding.fireDepartment.replace('Cuerpo de Bomberos de ', 'C.B. ')}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-300 font-medium truncate">
              {branding.motto || 'Sistema Oficial de Control de Asistencias y Partes de Emergencia'}
            </p>
          </div>
        </div>

        {/* Action Buttons Right */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
          {/* User Profile Card & Role */}
          <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 rounded-2xl px-3 py-1.5 shadow-sm">
            <div className="w-7 h-7 rounded-xl bg-red-700 text-white font-black text-xs flex items-center justify-center">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <p className="font-extrabold text-white text-[11px] leading-tight truncate max-w-[130px]">
                {currentUser.fullName}
              </p>
              <span className="text-[9px] text-amber-400 font-bold block uppercase">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-red-400 p-1 rounded-lg transition ml-1"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Dark/Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 transition active:scale-95"
            title={isDarkMode ? 'Modo Diurno' : 'Modo Guardia Nocturna'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-300" />}
          </button>

          {/* Export Excel Button */}
          {currentUser.permissions?.canExportReports && (
            <button
              onClick={handleExportExcel}
              className="hidden sm:flex items-center space-x-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-2xl shadow-md transition active:scale-95 border border-emerald-600/50"
              title="Descargar Planilla Oficial de Asistencia en Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Descargar</span> Excel
            </button>
          )}

          {/* New Report CTA */}
          {currentUser.permissions?.canCreateReports && (
            <button
              onClick={onNewReport}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-2xl shadow-md transition active:scale-95 border border-red-500/50"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Parte</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-950/80 border-t border-slate-800 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto py-1 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-red-700 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Bitácora & Métricas</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-red-700 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Table2 className="w-4 h-4 text-amber-400" />
            <span>Matriz de Asistencia (4 Bloques)</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-red-700 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Libro de Partes ({reports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('volunteers')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'volunteers'
                ? 'bg-red-700 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Padrón de Bomberos ({volunteers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('units')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              activeTab === 'units'
                ? 'bg-red-700 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4 text-amber-400" />
            <span>Material Mayor (Carros)</span>
          </button>

          {/* Admin / Super Admin Users Management Tab */}
          {isSuperAdminOrAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                activeTab === 'users'
                  ? 'bg-red-700 text-white shadow-md'
                  : 'text-amber-300 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-800/60'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Usuarios & Permisos</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
