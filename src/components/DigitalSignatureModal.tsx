import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Check, 
  PenTool, 
  Award, 
  ShieldCheck, 
  RotateCcw, 
  FileCheck2, 
  UserCheck, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { EmergencyReport, Volunteer, AppUser } from '../types';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: EmergencyReport;
  volunteers: Volunteer[];
  currentUser?: AppUser | null;
  onSignReport: (signatureData: {
    signedBy: string;
    signedByRank: string;
    signedAt: string;
    signatureDataUrl?: string;
    verificationCode: string;
  }) => void;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  report,
  volunteers,
  currentUser,
  onSignReport,
}) => {
  const [signatureMode, setSignatureMode] = useState<'SEAL' | 'DRAW'>('SEAL');

  // Helper to extract clean institutional rank (never software role)
  const getInstitutionalRank = (name?: string, userRank?: string): string => {
    if (!name) return 'Ayudante';
    const match = volunteers.find(v => 
      v.fullName.toLowerCase() === name.toLowerCase() ||
      (currentUser?.volunteerId && v.id === currentUser.volunteerId) ||
      (currentUser?.registrationNumber && v.registrationNumber === currentUser.registrationNumber) ||
      (currentUser?.email && v.email && v.email.toLowerCase() === currentUser.email.toLowerCase())
    );
    if (match && match.rank && !match.rank.includes('Administrador')) {
      return match.rank;
    }
    if (userRank && !userRank.includes('Administrador') && !userRank.includes('SUP-')) {
      return userRank;
    }
    return 'Ayudante';
  };

  const captainVolunteer = volunteers.find(v => v.rank === 'Capitán');
  const defaultSignerName = currentUser?.fullName || captainVolunteer?.fullName || 'Oficial de Compañía';
  const defaultSignerRank = currentUser 
    ? getInstitutionalRank(currentUser.fullName, currentUser.rank) 
    : (captainVolunteer?.rank || 'Ayudante');

  const [signerName, setSignerName] = useState<string>(defaultSignerName);
  const [signerRank, setSignerRank] = useState<string>(defaultSignerRank);

  // Canvas refs for drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const officerRanks = ['Director', 'Capitán', 'Teniente', 'Ayudante', 'Secretario', 'Tesorero', 'Comandante'];
      const designatedName = report.digitalSignature?.signedBy || report.captainName || report.approvedBy;
      const designatedOfficer = designatedName 
        ? volunteers.find(v => v.fullName.toLowerCase() === designatedName.toLowerCase() && officerRanks.some(r => v.rank.toLowerCase().includes(r.toLowerCase())))
        : null;

      const isUserOfficer = currentUser && (
        currentUser.role === 'SUPER_ADMIN' ||
        currentUser.role === 'ADMIN' ||
        currentUser.role === 'OFICIAL' ||
        officerRanks.some(r => currentUser.rank?.toLowerCase().includes(r.toLowerCase()))
      );

      // Prioritize the designated reviewing officer configured on the report
      if (designatedOfficer) {
        setSignerName(designatedOfficer.fullName);
        setSignerRank(report.digitalSignature?.signedByRank || report.captainRank || designatedOfficer.rank);
      } else if (designatedName) {
        setSignerName(designatedName);
        setSignerRank(report.digitalSignature?.signedByRank || report.captainRank || 'Oficial de Compañía');
      } else if (isUserOfficer && currentUser) {
        setSignerName(currentUser.fullName);
        setSignerRank(getInstitutionalRank(currentUser.fullName, currentUser.rank));
      } else if (captainVolunteer) {
        setSignerName(captainVolunteer.fullName);
        setSignerRank(captainVolunteer.rank);
      }
      setHasDrawn(false);
      clearCanvas();
    }
  }, [isOpen, captainVolunteer, currentUser, report]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setHasDrawn(false);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b'; // dark slate ink

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const generateVerificationCode = () => {
    const folio = report.correlativoCompania || report.fullFolio.replace(/[^0-9]/g, '') || '001';
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `DIG-4CIA-${folio}-${rand}`;
  };

  const handleConfirmSignature = () => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) + ' ' + now.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const verificationCode = generateVerificationCode();

    let signatureDataUrl: string | undefined = undefined;

    if (signatureMode === 'DRAW' && hasDrawn && canvasRef.current) {
      signatureDataUrl = canvasRef.current.toDataURL('image/png');
    }

    onSignReport({
      signedBy: signerName.trim() || 'Capitán de Compañía',
      signedByRank: signerRank.trim() || 'Capitán',
      signedAt: formattedDate,
      signatureDataUrl,
      verificationCode,
    });

    onClose();
  };

  if (!isOpen) return null;

  // Officers list from padrón (Strictly company officers: Capitán, Ayudante, Tenientes, Director, Secretario, Tesorero)
  const officersList = volunteers.filter(v => 
    v.rank.includes('Capitán') || 
    v.rank.includes('Ayudante') ||
    v.rank.includes('Teniente') || 
    v.rank.includes('Director') || 
    v.rank.includes('Secretario') ||
    v.rank.includes('Tesorero') ||
    v.rank.includes('Comandante')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-700 to-red-800 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-white truncate">
                Firma Digital & V°B° de Mando
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">
                Parte Oficial: <span className="text-amber-400 font-bold">{report.correlativoCompania || report.fullFolio}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 text-xs text-slate-800 dark:text-slate-200">
          
          {/* Dual Signature Comparison Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {/* OBAC Box */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl p-3 space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <UserCheck className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>1. Oficial a Cargo (OBAC)</span>
              </div>
              <p className="font-black text-slate-900 dark:text-white text-xs">
                {report.officerInChargeName}
              </p>
              <p className="text-[10px] text-red-700 dark:text-red-400 font-bold">
                {report.officerInChargeRank} • Mando en Terreno
              </p>
            </div>

            {/* Signing Officer Box */}
            <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-red-700 dark:text-red-400 font-bold text-[10px] uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>2. Oficial que Valida (V°B°)</span>
              </div>
              <p className="font-black text-slate-900 dark:text-white text-xs truncate">
                {signerName || 'Seleccione oficial'}
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold truncate">
                {signerRank || 'Cargo asignado'} • 4ª Cía.
              </p>
            </div>
          </div>

          {/* Signer Selection */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 dark:text-white">
                Oficial Firmante y Cargo Institucional:
              </label>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setSignerName(currentUser.fullName);
                    setSignerRank(getInstitutionalRank(currentUser.fullName, currentUser.rank));
                  }}
                  className="text-[10px] text-red-700 dark:text-red-400 font-bold hover:underline"
                >
                  Usar mi usuario ({currentUser.fullName.split(' ')[0]} - {getInstitutionalRank(currentUser.fullName, currentUser.rank)})
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Nombre del Oficial:
                </label>
                <select
                  value={signerName}
                  onChange={(e) => {
                    const selected = volunteers.find(v => v.fullName === e.target.value);
                    if (selected) {
                      setSignerName(selected.fullName);
                      setSignerRank(selected.rank);
                    } else {
                      setSignerName(e.target.value);
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <optgroup label="Oficiales de Compañía Habilitados">
                    {officersList.map(o => (
                      <option key={o.id} value={o.fullName}>
                        {o.rank} - {o.fullName} ({o.registrationNumber})
                      </option>
                    ))}
                  </optgroup>
                  {currentUser && (
                    <optgroup label="Sesión Actual">
                      <option value={currentUser.fullName}>
                        {getInstitutionalRank(currentUser.fullName, currentUser.rank)} - {currentUser.fullName}
                      </option>
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Cargo Institucional Asignado:
                </label>
                <input
                  type="text"
                  value={signerRank}
                  onChange={(e) => setSignerRank(e.target.value)}
                  placeholder="Ej: Capitán de Compañía / Ayudante"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Quick Cargo Preset Chips */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Cargos Rápidos:
              </p>
              <div className="flex flex-wrap gap-1">
                {[
                  'Capitán de Compañía',
                  'Ayudante de Compañía',
                  'Teniente 1°',
                  'Teniente 2°',
                  'Teniente 3°',
                  'Director de Compañía',
                  'Secretario de Compañía',
                  'Oficial de Guardia'
                ].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSignerRank(c)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition ${
                      signerRank === c
                        ? 'bg-red-700 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setSignatureMode('SEAL')}
              className={`flex-1 py-2.5 font-bold text-xs flex items-center justify-center space-x-2 border-b-2 transition ${
                signatureMode === 'SEAL'
                  ? 'border-red-700 text-red-700 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Sello Digital Oficial</span>
            </button>
            <button
              type="button"
              onClick={() => setSignatureMode('DRAW')}
              className={`flex-1 py-2.5 font-bold text-xs flex items-center justify-center space-x-2 border-b-2 transition ${
                signatureMode === 'DRAW'
                  ? 'border-red-700 text-red-700 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>Trazar Firma Manuscrita</span>
            </button>
          </div>

          {/* Mode 1: Digital Certificate Seal Preview */}
          {signatureMode === 'SEAL' && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center space-y-2.5">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-700/10 text-red-700 dark:text-red-400 rounded-full border border-red-200 dark:border-red-800/60 mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest">
                  Certificado de Firma Electrónica
                </p>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {signerName}
                </h4>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {signerRank} • 4ª Cía. Bomberos Calle Larga
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Visto Bueno y Aprobación Oficial de Servicio
                </p>
              </div>
            </div>
          )}

          {/* Mode 2: Interactive Signature Canvas */}
          {signatureMode === 'DRAW' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Dibuja tu firma o rúbrica con el dedo o ratón:
                </label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[11px] text-red-600 hover:text-red-700 font-bold flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpiar Trazo</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white overflow-hidden shadow-inner touch-none relative">
                <canvas
                  ref={canvasRef}
                  width={420}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[140px] cursor-crosshair block"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 dark:text-slate-400 text-xs font-serif italic">
                    Firma aquí
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmSignature}
            className="flex-1 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-lg transition transform active:scale-98 flex items-center justify-center space-x-2 border border-red-600/50"
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>Firmar Digitalmente y Aprobar Parte</span>
          </button>
        </div>
      </div>
    </div>
  );
};
