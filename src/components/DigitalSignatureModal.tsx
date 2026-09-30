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
  Sparkles,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { EmergencyReport, Volunteer, AppUser, DigitalSignatureInfo } from '../types';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: EmergencyReport;
  volunteers: Volunteer[];
  currentUser?: AppUser | null;
  targetRole?: 'OBAC' | 'REVISOR';
  onSignReport: (signatureData: {
    role: 'OBAC' | 'REVISOR';
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
  targetRole = 'REVISOR',
  onSignReport,
}) => {
  const [activeRole, setActiveRole] = useState<'OBAC' | 'REVISOR'>(targetRole);
  const [signatureMode, setSignatureMode] = useState<'DRAW' | 'SEAL'>('DRAW');

  // Helper to extract clean institutional rank
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

  const captainVolunteer = volunteers.find(v => v.rank === 'Capitán') || volunteers.find(v => v.fullName.toLowerCase().includes('josé vargas'));
  const defaultReviewerName = currentUser?.fullName || captainVolunteer?.fullName || 'José Vargas Ortega';
  const defaultReviewerRank = currentUser 
    ? getInstitutionalRank(currentUser.fullName, currentUser.rank) 
    : (captainVolunteer?.rank || 'Capitán');

  const [signerName, setSignerName] = useState<string>(defaultReviewerName);
  const [signerRank, setSignerRank] = useState<string>(defaultReviewerRank);

  // Canvas refs for drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setActiveRole(targetRole);
    }
  }, [isOpen, targetRole]);

  useEffect(() => {
    if (isOpen) {
      if (activeRole === 'OBAC') {
        setSignerName(report.officerInChargeName || 'Oficial a Cargo');
        setSignerRank(report.officerInChargeRank || 'Oficial a Cargo');
      } else {
        const officerRanks = ['Director', 'Capitán', 'Teniente', 'Ayudante', 'Secretario', 'Tesorero', 'Comandante'];
        let designatedName = report.reviewerSignature?.signedBy || report.digitalSignature?.signedBy || report.captainName || report.approvedBy;
        if (designatedName && designatedName.toLowerCase().includes('enrique')) {
          designatedName = 'José Vargas Ortega';
        }
        const designatedOfficer = designatedName 
          ? volunteers.find(v => v.fullName.toLowerCase() === designatedName.toLowerCase() && officerRanks.some(r => v.rank.toLowerCase().includes(r.toLowerCase())))
          : null;

        const isUserOfficer = currentUser && (
          currentUser.role === 'SUPER_ADMIN' ||
          currentUser.role === 'ADMIN' ||
          currentUser.role === 'OFICIAL' ||
          officerRanks.some(r => currentUser.rank?.toLowerCase().includes(r.toLowerCase()))
        );

        if (designatedOfficer) {
          setSignerName(designatedOfficer.fullName);
          setSignerRank(report.reviewerSignature?.signedByRank || report.digitalSignature?.signedByRank || report.captainRank || designatedOfficer.rank);
        } else if (designatedName) {
          setSignerName(designatedName);
          setSignerRank(report.reviewerSignature?.signedByRank || report.digitalSignature?.signedByRank || report.captainRank || (designatedName.toLowerCase().includes('josé vargas') ? 'Capitán' : 'Oficial de Compañía'));
        } else if (isUserOfficer && currentUser) {
          setSignerName(currentUser.fullName);
          setSignerRank(getInstitutionalRank(currentUser.fullName, currentUser.rank));
        } else if (captainVolunteer) {
          setSignerName(captainVolunteer.fullName);
          setSignerRank(captainVolunteer.rank);
        }
      }
      setHasDrawn(false);
      clearCanvas();
    }
  }, [isOpen, activeRole, captainVolunteer, currentUser, report, volunteers]);

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
    ctx.strokeStyle = activeRole === 'OBAC' ? '#0f172a' : '#1e1b4b'; // dark ink

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const generateVerificationCode = () => {
    const folio = report.correlativoCompania || report.fullFolio.replace(/[^0-9]/g, '') || '001';
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = activeRole === 'OBAC' ? 'SIG-OBAC-4CIA' : 'SIG-VB-4CIA';
    return `${prefix}-${folio}-${rand}`;
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
      role: activeRole,
      signedBy: signerName.trim() || (activeRole === 'OBAC' ? report.officerInChargeName : 'Capitán de Compañía'),
      signedByRank: signerRank.trim() || (activeRole === 'OBAC' ? report.officerInChargeRank : 'Capitán'),
      signedAt: formattedDate,
      signatureDataUrl,
      verificationCode,
    });

    onClose();
  };

  if (!isOpen) return null;

  // Officers list from padrón
  const officersList = volunteers.filter(v => 
    v.rank.includes('Capitán') || 
    v.rank.includes('Ayudante') ||
    v.rank.includes('Teniente') || 
    v.rank.includes('Director') || 
    v.rank.includes('Secretario') ||
    v.rank.includes('Tesorero') ||
    v.rank.includes('Comandante')
  );
  const joseVargas = volunteers.find(v => v.fullName.toLowerCase().includes('josé vargas') || v.fullName.toLowerCase().includes('jose vargas'));
  if (joseVargas && !officersList.some(o => o.id === joseVargas.id)) {
    officersList.unshift({ ...joseVargas, rank: 'Capitán' });
  }
  officersList.sort((a, b) => {
    if (a.rank.toLowerCase().includes('capitán')) return -1;
    if (b.rank.toLowerCase().includes('capitán')) return 1;
    return a.fullName.localeCompare(b.fullName);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 ${
              activeRole === 'OBAC' ? 'bg-gradient-to-br from-blue-700 to-indigo-800' : 'bg-gradient-to-br from-red-700 to-red-800'
            }`}>
              {activeRole === 'OBAC' ? <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" /> : <Award className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black text-white truncate">
                {activeRole === 'OBAC' ? 'Firma Digital Oficial a Cargo (OBAC)' : 'Firma Digital & V°B° de Mando'}
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

        {/* Role Selector Tabs (OBAC vs Verificador) */}
        <div className="bg-slate-100 dark:bg-slate-950/80 p-2 border-b border-slate-200 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveRole('OBAC')}
            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition ${
              activeRole === 'OBAC'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>1. Firma OBAC (Mando en Terreno)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole('REVISOR')}
            className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center space-x-2 transition ${
              activeRole === 'REVISOR'
                ? 'bg-red-700 text-white shadow-md'
                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>2. Firma Verificador / V°B°</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto space-y-3.5 text-xs text-slate-800 dark:text-slate-200">
          
          {/* Active Role Info Box */}
          <div className={`p-3 rounded-2xl border ${
            activeRole === 'OBAC'
              ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60'
              : 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-900/60'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-wider ${
                activeRole === 'OBAC' ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'
              }`}>
                {activeRole === 'OBAC' ? 'Firma de Responsabilidad Operativa' : 'Firma de Aprobación Institucional'}
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                4ª Cía. Bomberos Calle Larga
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">{signerName}</p>
                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  {signerRank} • {activeRole === 'OBAC' ? 'Oficial a Cargo' : 'Revisor Oficial'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-white/80 dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  {activeRole === 'OBAC' ? 'OBAC' : 'V°B° CAPITÁN'}
                </span>
              </div>
            </div>
          </div>

          {/* Signer Customization Inputs */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-900 dark:text-white">
                Datos del Oficial Firmante:
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
                  Usar mi usuario ({currentUser.fullName.split(' ')[0]})
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                  Nombre del Oficial:
                </label>
                {activeRole === 'OBAC' ? (
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
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <option value={report.officerInChargeName}>
                      {report.officerInChargeRank} - {report.officerInChargeName} (OBAC Designado)
                    </option>
                    <optgroup label="Otros Voluntarios del Padrón">
                      {volunteers.map(v => (
                        <option key={v.id} value={v.fullName}>
                          {v.rank} - {v.fullName} ({v.registrationNumber})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                ) : (
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
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
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
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                  Cargo Institucional:
                </label>
                <input
                  type="text"
                  value={signerRank}
                  onChange={(e) => setSignerRank(e.target.value)}
                  placeholder="Ej: Capitán / Oficial a Cargo"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Quick Cargo Preset Chips */}
            <div className="flex flex-wrap gap-1 pt-1">
              {[
                'Capitán de Compañía',
                'Teniente 1°',
                'Teniente 2°',
                'Teniente 3°',
                'Ayudante de Compañía',
                'Oficial a Cargo (OBAC)',
                'Director de Compañía'
              ].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSignerRank(c)}
                  className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition ${
                    signerRank === c
                      ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selector Tabs (DRAW vs SEAL) */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setSignatureMode('DRAW')}
              className={`flex-1 py-2 font-bold text-xs flex items-center justify-center space-x-1.5 border-b-2 transition ${
                signatureMode === 'DRAW'
                  ? 'border-red-700 text-red-700 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Trazar Firma Manuscrita</span>
            </button>
            <button
              type="button"
              onClick={() => setSignatureMode('SEAL')}
              className={`flex-1 py-2 font-bold text-xs flex items-center justify-center space-x-1.5 border-b-2 transition ${
                signatureMode === 'SEAL'
                  ? 'border-red-700 text-red-700 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sello Digital Criptográfico</span>
            </button>
          </div>

          {/* Mode 1: Interactive Signature Canvas */}
          {signatureMode === 'DRAW' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Dibuja la firma o rúbrica con el dedo o ratón:
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
                  height={140}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[130px] cursor-crosshair block"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 dark:text-slate-400 text-xs font-serif italic">
                    Trazar firma aquí ({activeRole === 'OBAC' ? 'Firma OBAC' : 'Firma Verificador'})
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode 2: Digital Certificate Seal Preview */}
          {signatureMode === 'SEAL' && (
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center space-y-2.5">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-700/10 text-red-700 dark:text-red-400 rounded-full border border-red-200 dark:border-red-800/60 mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-red-700 dark:text-red-400 uppercase tracking-widest">
                  Certificado de Firma Electrónica Oficial
                </p>
                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {signerName}
                </h4>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {signerRank} • 4ª Cía. Bomberos Calle Larga
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {activeRole === 'OBAC' ? 'Confección y Certificación Operativa' : 'V°B° y Validación Institucional'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
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
            className={`flex-1 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-lg transition transform active:scale-98 flex items-center justify-center space-x-2 ${
              activeRole === 'OBAC'
                ? 'bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 border border-blue-600/50'
                : 'bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 border border-red-600/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>
              {activeRole === 'OBAC' ? 'Estampar Firma de OBAC' : 'Estampar V°B° y Aprobar'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

