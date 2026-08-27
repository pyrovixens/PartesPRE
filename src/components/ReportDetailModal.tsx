import React from 'react';
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
  Calendar
} from 'lucide-react';
import { EmergencyReport } from '../types';
import { generateEmergencyReportPDF } from '../utils/pdfGenerator';

interface ReportDetailModalProps {
  report: EmergencyReport | null;
  onClose: () => void;
  onEdit: (report: EmergencyReport) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  onEdit,
}) => {
  if (!report) return null;

  const handleDownloadPDF = () => {
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
      case '6_3_LUGAR':
        return (
          <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded text-[10px] border border-blue-200 dark:border-blue-800">
            📍 6-3 en el Lugar
          </span>
        );
      case 'CUBRE_CUARTEL':
      default:
        return (
          <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded text-[10px] border border-amber-200 dark:border-amber-800">
            🏢 Cubre Cuartel
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Header Bar */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-red-800/60">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo_4ta_calle_larga.png" 
              alt="4ta Compañía" 
              className="w-10 h-10 object-contain drop-shadow" 
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-red-700 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-wide">
                  PARTE #{report.correlativoCompania || report.fullFolio}
                </span>
                {report.correlativoComandancia && (
                  <span className="bg-slate-800 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-700">
                    COMANDANCIA: {report.correlativoComandancia}
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  report.status === 'APROBADO' ? 'bg-emerald-800 text-emerald-100' : 'bg-amber-800 text-amber-100'
                }`}>
                  {report.status}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                {report.keyCode} - {report.keyDescription}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center space-x-1 bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition"
              title="Descargar PDF oficial firmado"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar PDF</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(report);
              }}
              className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
          {/* Top Banner Info */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Fecha del Siniestro</p>
              <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{report.incidentDate}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Hora del Acto</p>
              <p className="font-extrabold text-red-700 dark:text-red-400 mt-0.5">{report.incidentTime || '14:00'} hrs</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Categoría</p>
              <p className="font-extrabold text-blue-900 dark:text-blue-400 mt-0.5">{report.category}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Dotación Total</p>
              <p className="font-extrabold text-slate-900 dark:text-white mt-0.5">{report.totalFirefighters} bomberos asistentes</p>
            </div>
          </div>

          {/* Section 1: Ubicación y Mando */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-900 dark:bg-slate-950 text-white px-4 py-2 font-bold text-xs flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Clasificación, Ubicación y Mando</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-semibold">Dirección:</p>
                <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">{report.address}</p>
                {report.cornerOrReference && (
                  <p className="text-slate-500 dark:text-slate-400 italic mt-0.5">Ref: {report.cornerOrReference}</p>
                )}
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  Sector: <span className="font-semibold">{report.sector || 'Calle Larga'}</span> • Comuna: <span className="font-semibold">{report.commune || 'Calle Larga'}</span>
                </p>
              </div>

              <div>
                <p className="text-slate-500 dark:text-slate-400 font-semibold">Oficial al Mando del Acto (OBAC):</p>
                <p className="font-black text-red-700 dark:text-red-400 text-sm mt-0.5">
                  {report.officerInChargeRank} {report.officerInChargeName}
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Categoría del Servicio:</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{report.category}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Material Mayor */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-800 dark:bg-slate-900 text-white px-4 py-2 font-bold text-xs flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Material Mayor Despachado</span>
            </div>
            <div className="p-4">
              {report.units && report.units.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.units.map(u => (
                    <div key={u.unitCode} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="bg-red-700 text-white text-xs font-black px-2.5 py-1 rounded">
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
                <p className="text-xs text-slate-400 italic">No se despacharon unidades de material mayor para esta citación/reunión.</p>
              )}
            </div>
          </div>

          {/* Section 3: Asistencia */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-800 dark:bg-slate-900 text-white px-4 py-2 font-bold text-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>3. Registro Oficial de Asistencia</span>
              </div>
              <span className="bg-red-700 text-white text-[10px] font-black px-2 py-0.5 rounded">
                Total: {report.attendees.length} Voluntarios
              </span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {report.attendees.map((att) => (
                  <div 
                    key={att.volunteerId}
                    className="p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs flex items-center justify-between"
                  >
                    <div className="truncate mr-2">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{att.volunteerName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{att.rank}</p>
                    </div>
                    <div>
                      {getArrivalStatusBadge(att.arrivalStatus, att.unitCode)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Afectados y Daños */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-800 dark:bg-slate-900 text-white px-4 py-2 font-bold text-xs flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-amber-400" />
              <span>4. Afectados, Daños e Inmueble</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500 dark:text-slate-400 font-semibold">Tipo de Inmueble / Vehículo:</p>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{report.affectedPropertyType || 'No especificado'}</p>
                <p className="text-slate-500 dark:text-slate-400 mt-2 font-semibold">Nivel de Daños:</p>
                <p className="font-black text-red-700 dark:text-red-400 mt-0.5">{report.damageLevel || 'Leve'}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 font-bold">Civiles Lesionados</p>
                  <p className="text-base font-black text-slate-900 dark:text-white mt-1">{report.civilianInjuredCount || 0}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 font-bold">Bomberos Lesionados</p>
                  <p className="text-base font-black text-slate-900 dark:text-white mt-1">{report.firefighterInjuredCount || 0}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 font-bold">Fallecidos</p>
                  <p className="text-base font-black text-red-600 mt-1">{report.fatalCount || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Organismos Concurrentes */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-800 dark:bg-slate-900 text-white px-4 py-2 font-bold text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>5. Organismos Concurrentes</span>
            </div>
            <div className="p-4">
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
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-800 dark:bg-slate-900 text-white px-4 py-2 font-bold text-xs flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>6. Relato Operativo de los Hechos</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
              <p className="whitespace-pre-wrap">{report.summaryNotes || 'Sin observaciones registradas.'}</p>
            </div>
          </div>

          {/* Signatures & Approvals */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-8 text-center text-xs">
            <div className="space-y-1">
              <div className="border-b border-slate-400 dark:border-slate-600 pb-8 font-serif italic text-slate-400">
                Firma Oficial a Cargo
              </div>
              <p className="font-bold text-slate-900 dark:text-white pt-1">{report.officerInChargeName}</p>
              <p className="text-[10px] text-slate-400">{report.officerInChargeRank} • Oficial a Cargo (OBAC)</p>
            </div>
            <div className="space-y-1">
              <div className="border-b border-slate-400 dark:border-slate-600 pb-8 font-serif italic text-slate-400">
                V°B° Comandancia / Capitán
              </div>
              <p className="font-bold text-slate-900 dark:text-white pt-1">{report.approvedBy || 'Gabriel Bianchini Frost'}</p>
              <p className="text-[10px] text-slate-400">Capitán 4ª Cía. Calle Larga</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
