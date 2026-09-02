import React, { useState } from 'react';
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
  CheckCircle2
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
    signedBy: string;
    signedByRank: string;
    signedAt: string;
    signatureDataUrl?: string;
    verificationCode: string;
  }) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  onEdit,
  volunteers = [],
  currentUser,
  onSign,
}) => {
  const [isSignModalOpen, setIsSignModalOpen] = useState<boolean>(false);

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

  const defaultOfficer = volunteers.find(v => v.rank === 'Capitán') || volunteers.find(v => v.rank.includes('Teniente')) || volunteers[0];
  const defaultOfficerName = defaultOfficer ? defaultOfficer.fullName : 'Capitán de Compañía';
  const defaultOfficerRank = defaultOfficer ? defaultOfficer.rank : 'Capitán de Compañía';
  const displayCaptainName = report.digitalSignature?.signedBy || report.captainName || report.approvedBy || defaultOfficerName;
  const displayCaptainRank = report.digitalSignature?.signedByRank || report.captainRank || (report.approvedBy ? 'Oficial de Compañía' : defaultOfficerRank);

  // Authorization check: Only company officers (Capitán, Ayudante, Tenientes, Director, Secretario, Tesorero) or Admin can sign
  const officerRanks = ['Director', 'Capitán', 'Teniente', 'Ayudante', 'Secretario', 'Tesorero', 'Comandante'];
  const isAuthorizedToSign = Boolean(
    currentUser && (
      currentUser.role === 'SUPER_ADMIN' ||
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'OFICIAL' ||
      officerRanks.some(r => currentUser.rank?.toLowerCase().includes(r.toLowerCase())) ||
      volunteers.some(v => 
        (v.fullName.toLowerCase() === currentUser.fullName.toLowerCase() || (currentUser.email && v.email && v.email.toLowerCase() === currentUser.email.toLowerCase()) || (currentUser.registrationNumber && v.registrationNumber === currentUser.registrationNumber)) &&
        officerRanks.some(r => v.rank.toLowerCase().includes(r.toLowerCase()))
      )
    )
  );

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
              <button
                onClick={handleDownloadPDF}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs p-2 sm:px-3 sm:py-2 rounded-xl flex items-center space-x-1.5 transition active:scale-95 border border-slate-700 shadow-sm"
                title="Descargar PDF Oficial"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">PDF</span>
              </button>

              <button
                onClick={() => onEdit(report)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs p-2 sm:px-3 sm:py-2 rounded-xl flex items-center space-x-1.5 transition active:scale-95 border border-slate-700 shadow-sm"
                title="Editar Parte"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>

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
                    {report.units.map(u => (
                      <div key={u.unitCode} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className="bg-red-700 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                            {u.unitCode}
                          </span>
                          <div>
                            <p className="text-[10px] text-slate-400 font-semibold">Maquinista Asignado:</p>
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{u.driverName || 'No asignado'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
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
                  {report.attendees.map((att) => (
                    <div 
                      key={att.volunteerId}
                      className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs flex flex-col xs:flex-row sm:flex-row items-start sm:items-center justify-between gap-1.5"
                    >
                      <div className="truncate mr-2">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{att.volunteerName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{att.rank}</p>
                      </div>
                      <div className="shrink-0">
                        {getArrivalStatusBadge(att.arrivalStatus, att.unitCode)}
                      </div>
                    </div>
                  ))}
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

            {/* Section 7: Cuadro de Firmas y V°B° del Capitán */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-red-700 dark:text-red-400" />
                  <span>Validación Oficial & V°B° de Mando ({displayCaptainRank})</span>
                </h3>

                {!report.digitalSignature && (
                  <button
                    onClick={() => setIsSignModalOpen(true)}
                    className="bg-red-700 hover:bg-red-800 text-white font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow transition active:scale-95 border border-red-500/50"
                  >
                    <PenTool className="w-3.5 h-3.5 text-amber-300" />
                    <span>Estampar Firma Digital ({displayCaptainRank})</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center text-xs">
                {/* Signature 1: OBAC */}
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2">
                  <div className="border-b border-slate-300 dark:border-slate-600 pb-6 text-slate-400 font-serif italic text-xs">
                    Firma Oficial a Cargo
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">{report.officerInChargeName}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{report.officerInChargeRank} • Oficial a Cargo (OBAC)</p>
                  </div>
                </div>

                {/* Signature 2: Mando de Compañía (Capitán / Ayudante / Teniente) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                  {report.digitalSignature ? (
                    <div className="space-y-2 animate-in fade-in">
                      {report.digitalSignature.signatureDataUrl ? (
                        <div className="h-12 flex items-center justify-center">
                          <img 
                            src={report.digitalSignature.signatureDataUrl} 
                            alt="Firma Digital" 
                            className="max-h-12 object-contain"
                          />
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-1.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 text-[10px] font-black">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>FIRMADO DIGITALMENTE</span>
                        </div>
                      )}

                      <div className="border-b border-slate-300 dark:border-slate-600 pb-1 text-[10px] text-slate-400">
                        Código: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{report.digitalSignature.verificationCode}</span> • {report.digitalSignature.signedAt}
                      </div>

                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">{report.digitalSignature.signedBy}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{report.digitalSignature.signedByRank} • 4ª Cía. Calle Larga</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="border-b border-slate-300 dark:border-slate-600 pb-6 text-slate-400 font-serif italic text-xs">
                        V°B° Mando de Compañía ({displayCaptainRank})
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">{displayCaptainName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{displayCaptainRank} • 4ª Cía. Calle Larga</p>
                      </div>
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

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition active:scale-95 border border-slate-700 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Descargar PDF</span>
              </button>

              <button
                type="button"
                onClick={() => onEdit(report)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition active:scale-95 border border-slate-700 shadow-sm"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>

              {!report.digitalSignature && isAuthorizedToSign && (
                <button
                  type="button"
                  onClick={() => setIsSignModalOpen(true)}
                  className="bg-red-700 hover:bg-red-800 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-md transition active:scale-95 border border-red-500/50"
                  title={`Cerrar y Validar Parte Oficial con Firma Digital (${displayCaptainRank})`}
                >
                  <PenTool className="w-3.5 h-3.5 text-amber-300" />
                  <span>Validar & Firmar Parte ({displayCaptainRank})</span>
                </button>
              )}

              {!report.digitalSignature && !isAuthorizedToSign && (
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2.5 py-1.5 rounded-xl">
                  ⏳ En revisión (V°B° {displayCaptainRank})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Digital Signature Modal */}
      {isSignModalOpen && (
        <DigitalSignatureModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          report={report}
          volunteers={volunteers}
          currentUser={currentUser}
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
