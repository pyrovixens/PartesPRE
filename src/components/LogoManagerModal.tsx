import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, RefreshCw, X, Check, Sparkles, Shield, Award } from 'lucide-react';
import { CompanyBranding } from '../types';

interface LogoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  branding: CompanyBranding;
  onSaveBranding: (branding: CompanyBranding) => void;
}

const PRESET_LOGOS = [
  {
    name: 'Emblema Oficial 4ª Cía',
    url: '/logo_4ta_calle_larga.png',
    description: 'Escudo oficial 4ª Compañía "Bomba Calle Larga"',
  },
  {
    name: 'Escudo 1 (N° 1)',
    url: '/logo_1.svg',
    description: 'Emblema personalizado Opción 1',
  },
  {
    name: 'Escudo 2 (N° 2)',
    url: '/logo_2.svg',
    description: 'Emblema personalizado Opción 2',
  },
  {
    name: 'Escudo 3 (N° 3)',
    url: '/logo_3.svg',
    description: 'Emblema personalizado Opción 3',
  },
  {
    name: 'Escudo 4 (N° 4)',
    url: '/logo_4.svg',
    description: 'Emblema personalizado Opción 4',
  },
  {
    name: 'Escudo 5 (N° 5)',
    url: '/logo_5.svg',
    description: 'Emblema personalizado Opción 5',
  },
  {
    name: 'Escudo 6 (N° 6)',
    url: '/logo_6.svg',
    description: 'Emblema personalizado Opción 6',
  },
];

export const LogoManagerModal: React.FC<LogoManagerModalProps> = ({
  isOpen,
  onClose,
  branding,
  onSaveBranding,
}) => {
  const [currentBranding, setCurrentBranding] = useState<CompanyBranding>(branding);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCurrentBranding({
        ...currentBranding,
        logoUrl: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleResetDefault = () => {
    setCurrentBranding({
      companyName: '4ª COMPAÑÍA "CALLE LARGA"',
      fireDepartment: 'Cuerpo de Bomberos de Los Andes',
      motto: 'Unión, Lealtad y Servicio • Fundada el 21 de Agosto de 1985',
      logoUrl: '/logo_4ta_calle_larga.png',
      primaryColor: '#8F0D0D',
      accentColor: '#B8860B',
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBranding(currentBranding);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden transition-colors">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-red-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-red-700 rounded-xl flex items-center justify-center text-amber-300 shadow-md">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white">
                Personalización de Escudo & Compañía
              </h3>
              <p className="text-[11px] text-slate-400">
                Ajusta el logo del programa, nombre y lema institucional a tu gusto
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs text-slate-800 dark:text-slate-200">
          {/* Logo Preview & Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="relative group">
              <img
                src={currentBranding.logoUrl}
                alt="Vista previa del logo"
                className="w-20 h-20 object-contain rounded-2xl bg-slate-900/60 p-1.5 shadow-md border border-slate-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo_4ta_calle_larga.png';
                }}
              />
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <p className="font-bold text-slate-900 dark:text-white text-xs">
                Escudo / Emblema Actual
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Se verá en la barra superior, PDF oficial firmado y reportes.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1.5 bg-red-700 hover:bg-red-800 text-white font-bold px-3 py-1.5 rounded-xl shadow-sm transition active:scale-95 text-[11px]"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Imagen</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="flex items-center space-x-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-[11px] transition"
                  title="Restablecer escudo original de la 4ta Compañía"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Restablecer</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre de la Compañía / Unidad
              </label>
              <input
                type="text"
                value={currentBranding.companyName}
                onChange={(e) => setCurrentBranding({ ...currentBranding, companyName: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                placeholder="Ej. 4ª COMPAÑÍA 'CALLE LARGA'"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Cuerpo de Bomberos / Jurisdicción
              </label>
              <input
                type="text"
                value={currentBranding.fireDepartment}
                onChange={(e) => setCurrentBranding({ ...currentBranding, fireDepartment: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                placeholder="Ej. Cuerpo de Bomberos de Los Andes"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lema Institucional / Fecha de Fundación
              </label>
              <input
                type="text"
                value={currentBranding.motto}
                onChange={(e) => setCurrentBranding({ ...currentBranding, motto: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                placeholder="Ej. Unión, Lealtad y Servicio • Fundada el 21 de Agosto de 1985"
              />
            </div>
          </div>

          {/* Preset Logo Options */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
              Opciones de Escudos Disponibles:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_LOGOS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setCurrentBranding({ ...currentBranding, logoUrl: preset.url })}
                  className={`p-2.5 rounded-2xl border text-center transition flex flex-row sm:flex-col items-center justify-start sm:justify-between gap-2.5 sm:gap-1.5 ${
                    currentBranding.logoUrl === preset.url
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-10 h-10 object-contain rounded-xl bg-slate-950/40 p-1 shrink-0"
                  />
                  <span className="text-[11px] sm:text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate w-full text-left sm:text-center">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs transition flex items-center space-x-1.5 active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cerrar</span>
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Emblema</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
