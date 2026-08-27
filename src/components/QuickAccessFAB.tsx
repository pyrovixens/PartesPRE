import React, { useState } from 'react';
import { 
  Plus, 
  Flame, 
  Table2, 
  FileText, 
  Users, 
  Truck, 
  Download, 
  Shield, 
  Sparkles, 
  X,
  LogOut
} from 'lucide-react';
import { AppUser } from '../types';

interface QuickAccessFABProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewReport: () => void;
  onExportExcel: () => void;
  onLogout: () => void;
  currentUser: AppUser;
}

export const QuickAccessFAB: React.FC<QuickAccessFABProps> = ({
  activeTab,
  setActiveTab,
  onNewReport,
  onExportExcel,
  onLogout,
  currentUser,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Speed Dial Button (Desktop / Tablet) */}
      <div className="fixed bottom-20 sm:bottom-8 right-5 z-40 flex flex-col items-end space-y-2">
        {isOpen && (
          <div className="flex flex-col items-end space-y-2 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Action 1: Nuevo Parte */}
            {currentUser.permissions?.canCreateReports && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNewReport();
                }}
                className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 text-white text-xs font-black px-4 py-2.5 rounded-full shadow-2xl transition active:scale-95 border border-red-500/50"
              >
                <span className="hidden sm:inline">Nuevo Parte de Asistencia</span>
                <div className="w-6 h-6 rounded-full bg-red-900 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
              </button>
            )}

            {/* Action 2: Descargar Excel */}
            {currentUser.permissions?.canExportReports && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onExportExcel();
                }}
                className="flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-xl transition active:scale-95 border border-emerald-500/50"
              >
                <span className="hidden sm:inline">Exportar Planilla Excel</span>
                <div className="w-6 h-6 rounded-full bg-emerald-900 flex items-center justify-center">
                  <Download className="w-3.5 h-3.5 text-white" />
                </div>
              </button>
            )}

            {/* Action 3: Cerrar Sesión */}
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold px-3.5 py-2 rounded-full shadow-xl transition active:scale-95 border border-slate-600"
            >
              <span className="hidden sm:inline">Cerrar Sesión</span>
              <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center">
                <LogOut className="w-3.5 h-3.5 text-red-400" />
              </div>
            </button>
          </div>
        )}

        {/* Main Trigger Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-13 h-13 p-3.5 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform active:scale-90 border-2 ${
            isOpen
              ? 'bg-slate-900 border-slate-700 rotate-90'
              : 'bg-red-700 hover:bg-red-800 border-red-500/80 hover:shadow-red-900/50'
          }`}
          title="Menú de Acceso Rápido"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />}
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 dark:bg-slate-950/95 border-t border-slate-800 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around text-[10px] text-slate-400">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'dashboard' ? 'text-red-500 font-extrabold' : 'hover:text-white'
          }`}
        >
          <Flame className="w-5 h-5" />
          <span>Métricas</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'matrix' ? 'text-red-500 font-extrabold' : 'hover:text-white'
          }`}
        >
          <Table2 className="w-5 h-5" />
          <span>Matriz</span>
        </button>

        {currentUser.permissions?.canCreateReports && (
          <button
            onClick={onNewReport}
            className="flex flex-col items-center justify-center -mt-5 bg-red-700 hover:bg-red-800 text-white w-12 h-12 rounded-full shadow-lg border-2 border-slate-900 transition active:scale-95"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'reports' ? 'text-red-500 font-extrabold' : 'hover:text-white'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span>Partes</span>
        </button>

        <button
          onClick={() => setActiveTab('volunteers')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition ${
            activeTab === 'volunteers' ? 'text-red-500 font-extrabold' : 'hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Padrón</span>
        </button>
      </div>
    </>
  );
};
