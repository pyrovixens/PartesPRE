import React from 'react';
import { 
  Flame, 
  Table2, 
  FileText, 
  Users, 
  Truck, 
  Plus, 
  Download, 
  Database,
  Moon,
  Sun,
  Shield,
  Cloud,
  CheckCircle2
} from 'lucide-react';
import { exportMatrixToExcel } from '../utils/excelExport';
import { EmergencyReport, Volunteer, UserProfile } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewReport: () => void;
  onOpenBackup: () => void;
  onOpenAuth: () => void;
  reports: EmergencyReport[];
  volunteers: Volunteer[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  currentUser: UserProfile | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewReport,
  onOpenBackup,
  onOpenAuth,
  reports,
  volunteers,
  isDarkMode,
  onToggleDarkMode,
  currentUser,
}) => {
  const isCloud = isSupabaseConfigured();

  const handleExportExcel = () => {
    exportMatrixToExcel(reports, volunteers, new Date().getFullYear());
  };

  return (
    <header className="bg-slate-900 dark:bg-slate-950 text-white border-b border-red-800/80 shadow-md sticky top-0 z-40 transition-colors">
      {/* Top Banner with Crest and Brand */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative flex-shrink-0">
            <img 
              src="/logo_4ta_calle_larga.png" 
              alt="4ta Compañía Bomberos Calle Larga" 
              className="w-11 h-11 object-contain drop-shadow-md rounded-full bg-slate-950/40 p-0.5" 
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>4ª COMPAÑÍA "CALLE LARGA"</span>
              </h1>
              <span className="hidden md:inline-block bg-red-700/80 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-red-600/60 uppercase tracking-wider">
                C.B. Los Andes
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              Sistema Oficial de Control de Asistencias y Partes de Emergencia
            </p>
          </div>
        </div>

        {/* Action Buttons Right */}
        <div className="flex items-center space-x-2">
          {/* Cloud Sync Badge */}
          <div 
            title={isCloud ? 'Base de datos en la nube Supabase conectada con sincronización en tiempo real' : 'Trabajando en almacenamiento local seguro (LocalStorage)'}
            className={`hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              isCloud 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' 
                : 'bg-amber-950/60 text-amber-300 border-amber-800'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>{isCloud ? 'Supabase En Vivo' : 'Modo Local'}</span>
          </div>

          {/* User Profile Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
            title="Identificación de Oficial"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline max-w-[120px] truncate">
              {currentUser ? currentUser.fullName.split(' ')[0] : 'Oficial'}
            </span>
          </button>

          {/* Dark/Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
            title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-300" />}
          </button>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            className="hidden sm:flex items-center space-x-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition active:scale-95 border border-emerald-600/40"
            title="Descargar Planilla Oficial de Asistencia en Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Descargar</span> Excel
          </button>

          {/* Backup Button */}
          <button
            onClick={onOpenBackup}
            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
            title="Copias de Seguridad y Base de Datos"
          >
            <Database className="w-4 h-4 text-slate-300" />
          </button>

          {/* New Report CTA */}
          <button
            onClick={onNewReport}
            className="flex items-center space-x-1.5 bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-lg shadow-md transition active:scale-95 border border-red-500/40"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Parte</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-950/70 border-t border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto py-1 text-xs no-scrollbar">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-bold transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Dashboard & Métricas</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-bold transition whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Table2 className="w-4 h-4 text-amber-400" />
            <span>Matriz de Asistencia (4 Bloques)</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-bold transition whitespace-nowrap ${
              activeTab === 'reports'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Registro de Partes ({reports.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('volunteers')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-bold transition whitespace-nowrap ${
              activeTab === 'volunteers'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-amber-400" />
            <span>Padrón de Bomberos ({volunteers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('units')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-bold transition whitespace-nowrap ${
              activeTab === 'units'
                ? 'bg-red-700 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Truck className="w-4 h-4 text-amber-400" />
            <span>Material Mayor (Carros)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
