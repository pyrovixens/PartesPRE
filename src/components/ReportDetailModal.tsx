import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  MapPin, 
  Clock, 
  Truck, 
  Users, 
  FileText, 
  AlertTriangle, 
  ShieldCheck, 
  Check, 
  Shield, 
  Edit,
  Building,
  Award,
  Calendar,
  PenTool,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { EmergencyReport, Volunteer, AppUser } from '../types';
import { generateEmergencyReportPDF } from '../utils/pdfGenerator';
import { DigitalSignatureModal } from './DigitalSignatureModal';

interface ReportDetailModalProps {
  report: EmergencyReport | null;
  onClose: () => void;
  onEdit: (report: EmergencyReport) => void;
  volunteers?: Volunteer[];
  currentUser?: AppUser | null;
  onSign?: (reportId: string, signatureData: {
    role: 'OBAC' | 'REVISOR';
    signedBy: string;
    signedByRank: string;
    signedAt: string;
    signatureDataUrl?: string;
    verificationCode: string;
  }) => void;
  onSave?: (report: EmergencyReport) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  onEdit,
  volunteers = [],
  currentUser,
  onSign,
  onSave,
}) => {
  const [isSignModalOpen, setIsSignModalOpen] = useState<boolean>(false);
  const [signTargetRole, setSignTargetRole] = useState<'OBAC' | 'REVISOR'>('REVISOR');
  const [isChangeOfficerModalOpen, setIsChangeOfficerModalOpen] = useState<boolean>(false);
  const [changeOfficerName, setChangeOfficerName] = useState<string>('');
  const [changeOfficerRank, setChangeOfficerRank] = useState<string>('');
  const [updateSignature, setUpdateSignature] = useState<boolean>(true);

  // Officers list for reviewer / captain selection
  const officersList = useMemo(() => {
    const officerRanks = ['Director', 'Capitán', 'Teniente', 'Ayudante', 'Secretario', 'Tesorero', 'Comandante'];
    const list = volunteers.filter(v => 
      officerRanks.some(r => v.rank.toLowerCase().includes(r.toLowerCase()))
    );
    // Guarantee José Vargas Ortega is always available as Capitán
    const joseVargas = volunteers.find(v => v.fullName.toLowerCase().includes('josé vargas') || v.fullName.toLowerCase().includes('jose vargas'));
    if (joseVargas && !list.some(o => o.id === joseVargas.id)) {
      list.unshift({ ...joseVargas, rank: 'Capitán' });
    }
    return list.sort((a, b) => {
      if (a.rank.toLowerCase().includes('capitán')) return -1;
      if (b.rank.toLowerCase().includes('capitán')) return 1;
      return a.fullName.localeCompare(b.fullName);
    });
  }, [volunteers]);

  if (!report) return null;

  const handleDownloadPDF = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    generateEmergencyReportPDF(report);
  };

  const getArrivalStatusBadge = (status: string, unitCode?: string) => {
    switch (status) {
      case 'TRIPULO_CARRO':
        return (
          <span className="bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 font-black px-2 py-0.5 rounded text-[10px] border border-red-200 dark:border-red-800">
            🚒 Tripuló {unitCode || 'Carro'}
          </span>
        );
      case 'LLEGA_LUGAR':
        return (
          <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-black px-2 py-0.5 rounded text-[10px] border border-amber-200 dark:border-amber-800">
            📍 Llegó al Lugar
          </span>
        );
      case 'GUARDIA_CUARTEL':
        return (
          <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-black px-2 py-0.5 rounded text-[10px] border border-blue-200 dark:border-blue-800">
            🏢 Cuartel
          </span>
        );
      default:
        return null;
    }
  };

  const defaultOfficer = volunteers.find(v => v.rank === 'Capitán') || volunteers.find(v => v.fullName.toLowerCase().includes('josé vargas')) || volunteers.find(v => v.rank.includes('Teniente')) || volunteers[0];
  const defaultOfficerName = defaultOfficer ? defaultOfficer.fullName : 'José Vargas Ortega';
  const defaultOfficerRank = defaultOfficer ? defaultOfficer.rank : 'Capitán';
  let displayCaptainName = report.digitalSignature?.signedBy || report.captainName || report.approvedBy || defaultOfficerName;
  let displayCaptainRank = report.digitalSignature?.signedByRank || report.captainRank || (report.approvedBy ? 'Oficial de Compañía' : defaultOfficerRank);

  if (displayCaptainName.toLowerCase().includes('enrique')) {
    displayCaptainName = 'José Vargas Ortega';
    displayCaptainRank = 'Capitán';
  }

  // Granular RBAC Permissions Check:
  const isAuthorizedToSign = Boolean(
    currentUser && (
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.permissions?.canApproveReports ||
      (currentUser.role === 'ADMIN' && currentUser.permissions?.canApproveReports)
    )
  );

  const canEdit = Boolean(
    currentUser && (
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.permissions?.canEditReports
    )
  );

  const canExport = Boolean(
    currentUser && (
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.permissions?.canExportReports
    )
  );

  const handleOpenChangeOfficer = () => {
    setChangeOfficerName(displayCaptainName);
    setChangeOfficerRank(displayCaptainRank);
    setUpdateSignature(true);
    setIsChangeOfficerModalOpen(true);
  };

  const handleConfirmOfficerChange = () => {
    if (!changeOfficerName.trim()) return;
    const newName = changeOfficerName.trim();
    const newRank = changeOfficerRank.trim() || 'Capitán';

    const updatedReport: EmergencyReport = {
      ...report,
      captainName: newName,
      captainRank: newRank,
      approvedBy: report.status === 'APROBADO' ? newName : report.approvedBy,
      digitalSignature: report.digitalSignature && updateSignature ? {
        ...report.digitalSignature,
        signedBy: newName,
        signedByRank: newRank,
      } : report.digitalSignature,
      updatedAt: new Date().toISOString(),
    };

    if (onSave) {
      onSave(updatedReport);
    }
    setIsChangeOfficerModalOpen(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="bg-slate-900 dark:bg-slate-950 text-white px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center space-x-2.5 sm:space-x-3 truncate min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-700 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md flex-shrink-0">
                4ª
              </div>
              <div className="truncate min-w-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2 truncate">
                  <span className="bg-red-700/80 text-amber-300 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full border border-red-600/50 uppercase shrink-0">
                    #{report.correlativoCompania || report.fullFolio}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full border truncate ${
                    report.status === 'APROBADO'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : 'bg-amber-950 text-amber-300 border-amber-700'
                  }`}>
                    {report.status === 'APROBADO' ? `✓ APROBADO (${displayCaptainRank})` : `⏳ EN REVISIÓN (${displayCaptainRank})`}
                  </span>
                </div>
                <h2 className="text-xs sm:text-base font-black text-white truncate mt-0.5">
                  {report.keyCode} - {report.keyDescription}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2 shrink-0 ml-2">
              {canExport && (
                <button
                  onClick={handleDownloadPDF}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs p-2 sm:px-3 sm:py-2 rounded-xl flex items-center space-x-1.5 transition active:scale-95 border border-slate-700 shadow-sm"
                  title="Descargar PDF Oficial"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
              )}

              {canEdit && (
                <button
                  onClick={() => onEdit(report)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs p-2 sm:px-3 sm:py-2 rounded-xl flex items-center space-x-1.5 transition active:scale-95 border border-slate-700 shadow-sm"
                  title="Editar Parte"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Editar</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 sm:p-2 rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-xs text-slate-800 dark:text-slate-200">
            
            {/* Section 1: General Info */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl overflow-hidden">
              <div className="bg-slate-800 dark:bg-slate-900 text-white px-3 sm:px-4 py-2 font-bold text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>1. Información General del Acto / Emergencia</span>
              </div>
              <div className="p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold text-[11px]">Fecha y Hora:</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.incidentDate} - {report.incidentTime} hrs</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold text-[11px]">Dirección / Sector:</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.address} ({report.sector})</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold text-[11px]">Comuna:</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.commune}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold text-[11px]">Tipo de Acto:</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.category}</p>
                </div>
              </div>
            </div>

            {/* Section 2: Material Mayor */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <div className="bg-slate-800 dark:bg-slate-900 text-white px-4 py-2 font-bold text-xs flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Material Mayor Despachado</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40">
                {report.units && report.units.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {report.units.map(u => {
                      const isCustom = u.isExternalDriver || u.driverId === '__CUSTOM_EXTERNAL__';
                      const matchedVol = volunteers.find(v => v.id === u.driverId || v.fullName.toLowerCase() === u.driverName?.toLowerCase());
                      const driverLicense = matchedVol?.driverLicense;
                      const driverRank = u.driverRank || matchedVol?.rank || (u.driverName ? 'Maquinista' : undefined);

                      return (
                        <div key={u.unitCode} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <span className="bg-red-700 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                              {u.unitCode}
                            </span>
                            <div>
                              <p className="text-[10px] text-slate-400 font-semibold">Maquinista Asignado:</p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-slate-900 dark:text-white text-xs">{u.driverName || 'No asignado'}</p>
                                {driverRank && (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">({driverRank})</span>
                                )}
                                {isCustom ? (
                                  <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded text-[9px] border border-blue-300 dark:border-blue-800">
                                    🌐 {u.externalDriverCia || 'Préstamo de otra Cía'}
                                  </span>
                                ) : driverLicense && (
                                  <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold px-1.5 py-0.5 rounded text-[9px] border border-amber-300 dark:border-amber-800">
                                    🚒 {driverLicense}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No se despacharon unidades de material mayor para este acto.</p>
                )}
              </div>
            </div>

            {/* Section 3: Asistencia */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <div className="bg-slate-800 dark:bg-slate-900 text-white px-4 py-2 font-bold text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>3. Registro Oficial de Asistencia</span>
                </div>
                <span className="bg-red-700 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  Total: {report.attendees.length} Voluntarios
                </span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {report.attendees.map((att) => {
                    const matchedVol = volunteers.find(v => v.id === att.volunteerId || v.fullName.toLowerCase() === att.volunteerName.toLowerCase());
                    const isDriver = matchedVol 
                      ? (matchedVol.status !== 'Suspendido' && (matchedVol.rank?.includes('Maquinista') || (matchedVol.isDriver === true && !!matchedVol.driverLicense && matchedVol.driverLicense !== 'NO'))) 
                      : att.rank?.includes('Maquinista');
                    const currentRank = matchedVol?.rank || att.rank;
                    const driverLicense = matchedVol?.driverLicense;

                    return (
                      <div 
                        key={att.volunteerId}
                        className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs flex flex-col xs:flex-row sm:flex-row items-start sm:items-center justify-between gap-1.5"
                      >
                        <div className="truncate mr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{att.volunteerName}</p>
                            {isDriver && (
                              <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded text-[9px] border border-amber-300 dark:border-amber-800 shrink-0">
                                🚒 {driverLicense || 'Clase F'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{currentRank}</p>
                        </div>
                        <div className="shrink-0">
                          {getArrivalStatusBadge(att.arrivalStatus, att.unitCode)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 4: Afectados y Daños */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <div className="bg-slate-800 dark:bg-slate-900 text-white px-4 py-2 font-bold text-xs flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-400" />
                <span>4. Afectados, Daños e Inmueble</span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 font-semibold">Tipo de Inmueble / Vehículo:</p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.affectedPropertyType || 'No especificado'}</p>
                  <p className="text-slate-500 dark:text-slate-400 mt-2 font-semibold">Nivel de Daños:</p>
                  <p className="font-black text-red-700 dark:text-red-400 mt-0.5">{report.damageLevel || 'Leve'}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold">Civiles Lesionados</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{report.civilianInjuredCount || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold">Bomberos Lesionados</p>
                    <p className="text-lg font-black text-red-600 mt-1">{report.firefighterInjuredCount || 0}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-bold">Fallecidos</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{report.fatalCount || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Organismos Concurrentes */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <div className="bg-slate-800 dark:bg-slate-900 text-white px-4 py-2 font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>5. Organismos Concurrentes y Apoyos</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex flex-wrap gap-2">
                  {report.externalAgencies?.carabineros && (
                    <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800 text-xs">
                      ✓ Carabineros {report.externalAgencies.carabinerosUnit ? `(${report.externalAgencies.carabinerosUnit})` : ''}
                    </span>
                  )}
                  {report.externalAgencies?.samu && (
                    <span className="bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-bold px-2.5 py-1 rounded-lg border border-red-300 dark:border-red-800 text-xs">
                      ✓ SAMU {report.externalAgencies.samuUnit ? `(${report.externalAgencies.samuUnit})` : ''}
                    </span>
                  )}
                  {report.externalAgencies?.conaf && (
                    <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 text-xs">
                      ✓ CONAF
                    </span>
                  )}
                  {report.externalAgencies?.cgeChilquinta && (
                    <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold px-2.5 py-1 rounded-lg border border-blue-300 dark:border-blue-800 text-xs">
                      ✓ CGE / Chilquinta
                    </span>
                  )}
                  {report.externalAgencies?.municipalidad && (
                    <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold px-2.5 py-1 rounded-lg border border-purple-300 dark:border-purple-800 text-xs">
                      ✓ Municipalidad de Calle Larga
                    </span>
                  )}
                  {report.externalAgencies?.seguridadCiudadana && (
                    <span className="bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-bold px-2.5 py-1 rounded-lg border border-cyan-300 dark:border-cyan-800 text-xs">
                      ✓ Seguridad Ciudadana
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Section 6: Relato Operativo */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
              <div className="bg-slate-800 dark:bg-slate-900 text-white px-4 py-2 font-bold text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>6. Relato Operativo de los Hechos</span>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                <p className="whitespace-pre-wrap">{report.summaryNotes || 'Sin observaciones registradas.'}</p>
              </div>
            </div>

            {/* Section 7: Cuadro de Firmas Oficiales (OBAC y Verificador / Capitán) */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-red-700 dark:text-red-400" />
                  <span>Validación Oficial & Doble Firma Digital (OBAC + V°B° Mando)</span>
                </h3>

                <div className="flex items-center gap-2 flex-wrap">
                  {isAuthorizedToSign && (
                    <button
                      type="button"
                      onClick={handleOpenChangeOfficer}
                      className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 border border-slate-300 dark:border-slate-700 transition active:scale-95 shadow-sm"
                      title="Modificar Capitán u Oficial Revisor asignado al parte"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Cambiar Capitán / Revisor</span>
                    </button>
                  )}

                  {!report.obacSignature && (
                    <button
                      onClick={() => {
                        setSignTargetRole('OBAC');
                        setIsSignModalOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow transition active:scale-95 border border-blue-500/50"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-blue-200" />
                      <span>Firmar como OBAC</span>
                    </button>
                  )}

                  {!report.reviewerSignature && !report.digitalSignature && (
                    <button
                      onClick={() => {
                        setSignTargetRole('REVISOR');
                        setIsSignModalOpen(true);
                      }}
                      className="bg-red-700 hover:bg-red-800 text-white font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow transition active:scale-95 border border-red-500/50"
                    >
                      <PenTool className="w-3.5 h-3.5 text-amber-300" />
                      <span>Estampar V°B° ({displayCaptainRank})</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-center text-xs">
                {/* Signature 1: OBAC (Oficial al Mando en Terreno) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                    <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 tracking-wider flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      1. Oficial a Cargo (OBAC)
                    </span>
                    {report.obacSignature ? (
                      <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                        ✓ FIRMADO OBAC
                      </span>
                    ) : (
                      <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        PENDIENTE DE FIRMA
                      </span>
                    )}
                  </div>

                  {report.obacSignature ? (
                    <div className="space-y-2 animate-in fade-in">
                      {report.obacSignature.signatureDataUrl ? (
                        <div className="h-14 flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
                          <img 
                            src={report.obacSignature.signatureDataUrl} 
                            alt="Firma Manuscrita OBAC" 
                            className="max-h-12 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-1.5 bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-300 dark:border-blue-800 text-[10px] font-black">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>SELLO DIGITAL OBAC</span>
                        </div>
                      )}

                      <div className="border-b border-slate-200 dark:border-slate-700 pb-1 text-[10px] text-slate-400">
                        Código: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{report.obacSignature.verificationCode}</span> • {report.obacSignature.signedAt}
                      </div>

                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">{report.obacSignature.signedBy}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{report.obacSignature.signedByRank} • Mando Operativo en Terreno</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 py-2">
                      <div className="border-b border-slate-300 dark:border-slate-600 pb-4 text-slate-400 font-serif italic text-xs">
                        Pendiente de trazo o sello digital del OBAC
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">{report.officerInChargeName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{report.officerInChargeRank} • Oficial a Cargo (OBAC)</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSignTargetRole('OBAC');
                          setIsSignModalOpen(true);
                        }}
                        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-3 py-1 rounded-lg flex items-center space-x-1.5 mx-auto transition active:scale-95 shadow"
                      >
                        <PenTool className="w-3 h-3" />
                        <span>Trazar Firma OBAC</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Signature 2: Mando de Compañía (Capitán / Ayudante / Teniente) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">
                    <span className="text-[10px] font-black uppercase text-red-700 dark:text-red-400 tracking-wider flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      2. Mando de Compañía (V°B°)
                    </span>
                    {(report.reviewerSignature || report.digitalSignature) ? (
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        ✓ V°B° APROBADO
                      </span>
                    ) : (
                      <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                        PENDIENTE DE V°B°
                      </span>
                    )}
                  </div>

                  {isAuthorizedToSign && (
                    <button
                      type="button"
                      onClick={handleOpenChangeOfficer}
                      className="absolute top-2.5 right-2.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900 z-10 transition hover:bg-blue-50"
                      title="Cambiar Capitán o Revisor asignado"
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>Cambiar</span>
                    </button>
                  )}

                  {report.reviewerSignature || report.digitalSignature ? (
                    (() => {
                      const sig = report.reviewerSignature || report.digitalSignature!;
                      return (
                        <div className="space-y-2 animate-in fade-in">
                          {sig.signatureDataUrl ? (
                            <div className="h-14 flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
                              <img 
                                src={sig.signatureDataUrl} 
                                alt="Firma Digital Verificador" 
                                className="max-h-12 object-contain"
                              />
                            </div>
                          ) : (
                            <div className="inline-flex items-center space-x-1.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 text-[10px] font-black">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>FIRMADO DIGITALMENTE</span>
                            </div>
                          )}

                          <div className="border-b border-slate-200 dark:border-slate-700 pb-1 text-[10px] text-slate-400">
                            Código: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{sig.verificationCode}</span> • {sig.signedAt}
                          </div>

                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{sig.signedBy}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{sig.signedByRank} • 4ª Cía. Calle Larga</p>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="space-y-2 py-2">
                      <div className="border-b border-slate-300 dark:border-slate-600 pb-4 text-slate-400 font-serif italic text-xs">
                        Pendiente de V°B° y firma de Mando ({displayCaptainRank})
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">{displayCaptainName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{displayCaptainRank} • 4ª Cía. Calle Larga</p>
                      </div>
                      {isAuthorizedToSign && (
                        <button
                          type="button"
                          onClick={() => {
                            setSignTargetRole('REVISOR');
                            setIsSignModalOpen(true);
                          }}
                          className="mt-2 bg-red-700 hover:bg-red-800 text-white font-bold text-[10px] px-3 py-1 rounded-lg flex items-center space-x-1.5 mx-auto transition active:scale-95 shadow border border-red-600"
                        >
                          <PenTool className="w-3 h-3 text-amber-300" />
                          <span>Estampar V°B° y Firma</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal Bottom Footer Actions */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-800 transition flex items-center space-x-1.5 active:scale-95"
            >
              <X className="w-4 h-4" />
              <span>Cerrar Ventana</span>
            </button>

            <div className="flex items-center space-x-2 flex-wrap">
              {canExport && (
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition active:scale-95 border border-slate-700 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Descargar PDF</span>
                </button>
              )}

              {isAuthorizedToSign && (
                <button
                  type="button"
                  onClick={handleOpenChangeOfficer}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition active:scale-95 border border-slate-700 shadow-sm"
                  title="Modificar Capitán u Oficial Revisor"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Cambiar Capitán / Revisor</span>
                </button>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(report)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition active:scale-95 border border-slate-700 shadow-sm"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
              )}

              {!report.obacSignature && (
                <button
                  type="button"
                  onClick={() => {
                    setSignTargetRole('OBAC');
                    setIsSignModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-md transition active:scale-95 border border-blue-500/50"
                  title="Firmar digitalmente como Oficial a Cargo (OBAC)"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-200" />
                  <span>Firmar OBAC</span>
                </button>
              )}

              {!report.reviewerSignature && !report.digitalSignature && isAuthorizedToSign && (
                <button
                  type="button"
                  onClick={() => {
                    setSignTargetRole('REVISOR');
                    setIsSignModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-md transition active:scale-95 border border-red-500/50"
                  title={`Cerrar y Validar Parte Oficial con Firma Digital (${displayCaptainRank})`}
                >
                  <PenTool className="w-3.5 h-3.5 text-amber-300" />
                  <span>Validar & Firmar Parte ({displayCaptainRank})</span>
                </button>
              )}

              {!report.reviewerSignature && !report.digitalSignature && !isAuthorizedToSign && (
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2.5 py-1.5 rounded-xl">
                  ⏳ En revisión (V°B° {displayCaptainRank})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Officer / Captain Modal */}
      {isChangeOfficerModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col max-h-[96vh]">
            {/* Header */}
            <div className="bg-slate-900 dark:bg-slate-950 text-white px-4 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white">
                    Modificar Oficial Revisor / Capitán
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Parte #{report.correlativoCompania || report.fullFolio}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangeOfficerModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3.5 text-xs text-slate-800 dark:text-slate-200">
              <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-900/60">
                <p className="text-[11px] text-blue-900 dark:text-blue-200 leading-snug">
                  Selecciona el oficial responsable de la revisión y firma de este parte oficial:
                </p>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Oficial de Compañía:
                  </label>
                  <select
                    value={changeOfficerName}
                    onChange={(e) => {
                      const selected = volunteers.find(v => v.fullName === e.target.value);
                      if (selected) {
                        setChangeOfficerName(selected.fullName);
                        setChangeOfficerRank(selected.rank);
                      } else {
                        setChangeOfficerName(e.target.value);
                      }
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
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
                          {currentUser.rank || 'Oficial'} - {currentUser.fullName}
                        </option>
                      </optgroup>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Cargo Institucional:
                  </label>
                  <input
                    type="text"
                    value={changeOfficerRank}
                    onChange={(e) => setChangeOfficerRank(e.target.value)}
                    placeholder="Ej: Capitán de Compañía"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                {/* Quick Cargo Chips */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {['Capitán', 'Ayudante', 'Teniente 1°', 'Teniente 2°', 'Teniente 3°', 'Director'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setChangeOfficerRank(c)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition ${
                        changeOfficerRank === c 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {report.digitalSignature && (
                  <label className="flex items-start space-x-2 pt-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={updateSignature}
                      onChange={(e) => setUpdateSignature(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                      Actualizar firma digital estampada con el nuevo nombre y cargo del oficial
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsChangeOfficerModalOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmOfficerChange}
                disabled={!changeOfficerName.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition active:scale-95 flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Signature Modal */}
      {isSignModalOpen && (
        <DigitalSignatureModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          report={report}
          volunteers={volunteers}
          currentUser={currentUser}
          targetRole={signTargetRole}
          onSignReport={(sigData) => {
            if (onSign) {
              onSign(report.id, sigData);
            }
          }}
        />
      )}
    </>
  );
};
