import React, { useState } from 'react';
import { Database, Download, Upload, RefreshCw, X, CheckCircle } from 'lucide-react';
import { exportAllDataBackup, importDataBackup, resetToInitialData } from '../utils/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReload: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  onDataReload,
}) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    const jsonStr = exportAllDataBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Respaldo_Partes_4taCia_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDataBackup(content);
      if (success) {
        setImportStatus('¡Datos restaurados con éxito!');
        onDataReload();
        setTimeout(() => {
          setImportStatus(null);
          onClose();
        }, 1500);
      } else {
        setImportStatus('Error: El archivo no tiene un formato válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('¿Restaurar la nómina oficial y los datos iniciales de la 4ª Compañía?')) {
      resetToInitialData();
      onDataReload();
      setImportStatus('¡Datos restablecidos con el padrón oficial de la 4ª Cía!');
      setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-5 space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-red-700 dark:text-red-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Copia de Seguridad y Datos
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {importStatus && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs p-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          {/* Export JSON */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">Exportar Copia de Seguridad (.JSON)</p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Descarga todos los partes, asistencias, voluntarios y unidades.</p>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">Importar Copia de Seguridad (.JSON)</p>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Restaura datos previamente exportados.</p>
            </div>
            <label className="flex items-center space-x-1 bg-blue-700 hover:bg-blue-800 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Importar</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Reset initial */}
          <div className="p-3.5 bg-red-50/50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center justify-between">
            <div>
              <p className="font-bold text-red-900 dark:text-red-300">Restablecer Padrón Oficial 4ª Cía</p>
              <p className="text-red-700/80 dark:text-red-400 text-[11px] mt-0.5">Recarga los 31 integrantes reales (Fundadores, Honorarios, Activos y Aspirantes).</p>
            </div>
            <button
              onClick={handleResetData}
              className="flex items-center space-x-1 bg-red-700 hover:bg-red-800 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
