import React from 'react';
import { 
  X, 
  Printer, 
  Edit, 
  MapPin, 
  Clock, 
  Truck, 
  Users, 
  FileText
} from 'lucide-react';
import { EmergencyReport, AttendanceRecord } from '../types';
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

  const handleDownloadPDF = async () => {
    await generateEmergencyReportPDF(report);
  };

  const getArrivalBadge = (record: AttendanceRecord) => {
    switch (record.arrivalStatus) {
      case 'TRIPULO_CARRO':
        return (
          <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded font-bold text-[10px] border border-blue-200 dark:border-blue-800">
            🚒 Tripuló {record.unitCode ? `Carro ${record.unitCode}` : 'Carro'}
          </span>
        );
      case '6_3_LUGAR':
        return (
          <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-bold text-[10px] border border-emerald-200 dark:border-emerald-800">
            📍 6-3 Llegó al Lugar
          </span>
        );
      case 'CUBRE_CUARTEL':
        return (
          <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded font-bold text-[10px] border border-purple-200 dark:border-purple-800">
            🏢 Cubre Cuartel
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded text-[10px]">
            Presente
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
              <p className="text-[10px] font-bold text-slate-400 uppercase">Tiempo de Respuesta</p>
              <p className="font-extrabold text-red-700 dark:text-red-400 mt-0.5">{report.responseTimeMinutes} minutos</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Duración de Operaciones</p>
              <p className="font-extrabold text-blue-900 dark:text-blue-400 mt-0.5">{report.totalDurationMinutes} minutos</p>
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

          {/* Section 2: Cronometría Radial */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-800 dark:bg-slate-900 text-white px-4 py-2 font-bold text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Cronometría Radial</span>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Despacho</p>
                <p className="font-black text-slate-900 dark:text-white text-sm mt-1">{report.alertTime || '--:--'}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/60 p-2.5 rounded-lg border border-red-100 dark:border-red-900">
                <p className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase">6-0 (Llegada)</p>
                <p className="font-black text-red-700 dark:text-red-300 text-sm mt-1">{report.time6_0 || '--:--'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-bold uppercase">6-7 (Control)</p>
                <p className="font-black text-slate-900 dark:text-white text-sm mt-1">{report.time6_7 || '--:--'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-bold uppercase">6-8 (Término)</p>
                <p className="font-black text-slate-900 dark:text-white text-sm mt-1">{report.time6_8 || '--:--'}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-bold uppercase">6-10 (Cuartel)</p>
                <p className="font-black text-slate-900 dark:text-white text-sm mt-1">{report.time6_10 || '--:--'}</p>
              </div>
            </div>
          </div>

          {/* Section 3: Material Mayor (Solo Unidad + Maquinista) */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-800 dark:bg-slate-900 text-white px-4 py-2 font-bold text-xs flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Material Mayor Concurrente</span>
            </div>
            {report.units.length > 0 ? (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {report.units.map(u => (
                  <div key={u.unitCode} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-black text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded">
                      Unidad {u.unitCode}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-bold">Maquinista / Conductor:</p>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">{u.driverName}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-4 text-xs text-slate-400 italic">Sin concurrencia de material mayor.</p>
            )}
          </div>

          {/* Section 4: Nómina de Asistencia con Modalidad y Unidad */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-red-800 dark:bg-red-950 text-white px-4 py-2 font-bold text-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-300" />
                <span>4. Nómina de Asistencia ({report.totalFirefighters} Voluntarios)</span>
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase sticky top-0">
                  <tr>
                    <th className="py-2 px-3 text-center">#</th>
                    <th className="py-2 px-3">Reg.</th>
                    <th className="py-2 px-3">Nombre del Voluntario</th>
                    <th className="py-2 px-3">Escalafón / Cargo</th>
                    <th className="py-2 px-3 text-center">Modalidad / Carro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.attendees.map((a, idx) => (
                    <tr key={a.volunteerId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2 px-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{a.registrationNumber}</td>
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{a.volunteerName}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{a.category} • {a.rank}</td>
                      <td className="py-2 px-3 text-center">
                        {getArrivalBadge(a)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Relato Operativo */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-800 dark:bg-slate-900 text-white px-4 py-2 font-bold text-xs flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>5. Relato Operativo y Novedades</span>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 text-xs leading-relaxed whitespace-pre-wrap">
              {report.summaryNotes || 'Sin observaciones adicionales registradas.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
