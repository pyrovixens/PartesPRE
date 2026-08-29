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
  onOpenLogoManager?: () => void;
  currentUser: AppUser;
}

export const QuickAccessFAB: React.FC<QuickAccessFABProps> = ({
  activeTab,
  setActiveTab,
  onNewReport,
  onExportExcel,
  onLogout,
  onOpenLogoManager,
  currentUser,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Speed Dial Button (Desktop / Tablet only) */}
      <div className="hidden sm:flex fixed bottom-8 right-6 z-40 flex-col items-end space-y-2">
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
                <span>Nuevo Parte de Asistencia</span>
                <div className="w-6 h-6 rounded-full bg-red-900 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
              </button>
            )}

            {/* Action 2: Personalizar Escudo / Marca */}
            {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && onOpenLogoManager && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenLogoManager();
                }}
                className="flex items-center space-x-2 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-xl transition active:scale-95 border border-amber-500/50"
              >
                <span>Personalizar Escudo & Marca</span>
                <div className="w-6 h-6 rounded-full bg-amber-900 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </div>
              </button>
            )}

            {/* Action 3: Descargar Excel */}
            {currentUser.permissions?.canExportReports && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onExportExcel();
                }}
                className="flex items-center space-x-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-xl transition active:scale-95 border border-emerald-500/50"
              >
                <span>Exportar Planilla Excel</span>
                <div className="w-6 h-6 rounded-full bg-emerald-900 flex items-center justify-center">
                  <Download className="w-3.5 h-3.5 text-white" />
                </div>
              </button>
            )}

            {/* Action 4: Cerrar Sesión */}
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold px-3.5 py-2 rounded-full shadow-xl transition active:scale-95 border border-slate-600"
            >
              <span>Cerrar Sesión</span>
              <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center">
                <LogOut className="w-3.5 h-3.5 text-red-400" />
              </div>
            </button>
          </div>
        )}

        {/* Main Trigger Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-12 h-12 p-3 rounded-full shadow-2xl flex items-center justify-center text-white transition-all transform active:scale-90 border-2 ${
            isOpen
              ? 'bg-slate-900 border-slate-700 rotate-90'
              : 'bg-red-700 hover:bg-red-800 border-red-500/80 hover:shadow-red-900/50'
          }`}
          title="Menú de Acceso Rápido"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />}
        </button>
      </div>
    </>
  );
};
