import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  FileText, 
  Printer, 
  Edit, 
  Trash2, 
  Users, 
  Calendar,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { EmergencyReport, EmergencyKey, AppUser } from '../types';
import { generateEmergencyReportPDF } from '../utils/pdfGenerator';
import { searchInFields } from '../utils/searchUtils';

interface ReportListViewProps {
  reports: EmergencyReport[];
  keys: EmergencyKey[];
  onNewReport: () => void;
  onEditReport: (report: EmergencyReport) => void;
  onViewReport: (report: EmergencyReport) => void;
  onDeleteReport: (reportId: string) => void;
  currentUser?: AppUser | null;
}

export const ReportListView: React.FC<ReportListViewProps> = ({
  reports,
  keys,
  onNewReport,
  onEditReport,
  onViewReport,
  onDeleteReport,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedKey, setSelectedKey] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Filter and search with normalized accent/case-insensitivity
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesSearch = searchInFields([
        r.fullFolio,
        r.correlativoCompania,
        r.correlativoComandancia,
        r.address,
        r.sector,
        r.commune,
        r.keyCode,
        r.keyDescription,
        r.officerInChargeName,
        r.summaryNotes
      ], searchTerm);

      const matchesCategory = selectedCategory === 'ALL' || r.category === selectedCategory;
      const matchesKey = selectedKey === 'ALL' || r.keyCode === selectedKey;
      const matchesStatus = selectedStatus === 'ALL' || r.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesKey && matchesStatus;
    }).sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime());
  }, [reports, searchTerm, selectedCategory, selectedKey, selectedStatus]);

  const handleDownloadPDF = async (e: React.MouseEvent, report: EmergencyReport) => {
    e.stopPropagation();
    await generateEmergencyReportPDF(report);
  };

  const canCreate = currentUser ? currentUser.permissions?.canCreateReports : true;
  const canEdit = currentUser ? currentUser.permissions?.canEditReports : true;
  const canDelete = currentUser ? currentUser.permissions?.canDeleteReports : true;

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por folio, clave, sector, oficial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-600 transition"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {canCreate && (
              <button
                onClick={onNewReport}
                className="flex items-center space-x-1.5 bg-red-700 hover:bg-red-800 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-md transition active:scale-95 border border-red-500/40"
              >
                <Plus className="w-4 h-4" />
                <span>Emitir Parte</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Clasificación:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="ALL">Todas las clasificaciones</option>
              <option value="Emergencias">🚨 Emergencias (10-X)</option>
              <option value="Academias">📚 Academias (A)</option>
              <option value="Entrenamiento Estandar">🏋️ Entrenamiento Estándar (ES)</option>
              <option value="Reuniones de Compañía">🏛️ Reuniones de Compañía (RC)</option>
              <option value="Reuniones de Fundacion">🎖️ Reuniones de Fundación (RF)</option>
              <option value="Citaciones Varias">📋 Citaciones Varias (V)</option>
            </select>
          </div>

          {/* Key Code Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Clave de Acto:
            </label>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="ALL">Todas las claves</option>
              {keys.map((k) => (
                <option key={k.code} value={k.code}>
                  {k.code} - {k.description}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
              Estado Administrativo:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-bold focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="ALL">Todos los estados</option>
              <option value="APROBADO">Aprobado</option>
              <option value="ENVIADO">Enviado</option>
              <option value="BORRADOR">Borrador</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Cards View (Visible on mobile/tablet) */}
      <div className="block md:hidden space-y-3">
        {filteredReports.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-800">
            No se encontraron partes de asistencia con los filtros seleccionados.
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => onViewReport(report)}
              className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm active:scale-[0.99] transition space-y-2.5 cursor-pointer"
            >
              {/* Card Top: Folio, Date and Status Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-black text-red-700 dark:text-red-400 text-xs sm:text-sm bg-red-50 dark:bg-red-950/80 px-2 py-0.5 rounded-lg border border-red-200 dark:border-red-800">
                    #{report.correlativoCompania || report.fullFolio}
                  </span>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    {report.incidentDate} {report.incidentTime ? `• ${report.incidentTime} hrs` : ''}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    report.status === 'APROBADO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                    report.status === 'ENVIADO' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                  }`}>
                    {report.status === 'APROBADO' ? '✓ APROBADO' : report.status === 'ENVIADO' ? '⏳ EN REVISIÓN' : report.status}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                    {report.status === 'APROBADO' 
                      ? `V°B° ${report.digitalSignature?.signedByRank || report.captainRank || 'Mando Cía.'}` 
                      : `Revisión: ${report.captainRank || 'Mando Cía.'}`}
                  </span>
                </div>
              </div>

              {/* Clave and Description */}
              <div className="flex items-start space-x-2">
                <span className="bg-red-700 text-white font-black text-xs px-2 py-0.5 rounded shrink-0">
                  {report.keyCode}
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white text-xs leading-snug truncate">
                    {report.keyDescription}
                  </p>
                  <p className="text-[10px] text-slate-400">{report.category}</p>
                </div>
              </div>

              {/* Address and Sector */}
              <div className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-1.5">
                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                  📍 {report.address || 'Sin dirección especificada'}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>{report.sector}, {report.commune}</span>
                  <span className="font-bold text-red-600 dark:text-red-400">OBAC: {report.officerInChargeName}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-medium">
                  <span className="text-slate-400">Mando Cía (V°B°):</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400 truncate max-w-[180px]">
                    {report.digitalSignature?.signedBy || report.captainName || report.approvedBy || 'Por revisar'} 
                    {' '}({report.digitalSignature?.signedByRank || report.captainRank || 'Mando'})
                  </span>
                </div>
              </div>

              {/* Units & Dotacion & Actions Footer */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                <div className="flex items-center space-x-2">
                  {report.units && report.units.length > 0 && (
                    <div className="flex items-center space-x-1">
                      {report.units.map(u => (
                        <span key={u.unitCode} className="bg-slate-800 text-amber-300 font-black text-[10px] px-1.5 py-0.5 rounded">
                          {u.unitCode}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    <Users className="w-3 h-3 text-blue-500" />
                    <span>{report.totalFirefighters}</span>
                  </span>
                </div>

                <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleDownloadPDF(e, report)}
                    title="Descargar PDF"
                    className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => onEditReport(report)}
                      title="Editar Parte"
                      className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        if (confirm(`¿Estás seguro de eliminar el parte #${report.correlativoCompania || report.fullFolio}?`)) {
                          onDeleteReport(report.id);
                        }
                      }}
                      title="Eliminar Parte"
                      className="p-1.5 text-slate-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Reports Table (Hidden on mobile) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white dark:bg-slate-950 text-[10px] font-black uppercase tracking-wider border-b border-red-800/80">
              <tr>
                <th className="py-3 px-3.5">Folio / N°</th>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Clave & Tipo</th>
                <th className="py-3 px-3">Dirección & Sector</th>
                <th className="py-3 px-3">Mando (OBAC / V°B°)</th>
                <th className="py-3 px-3 text-center">Carros</th>
                <th className="py-3 px-3 text-center">Dotación</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No se encontraron partes de asistencia registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => onViewReport(report)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
                  >
                    {/* Folio */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="font-black text-red-700 dark:text-red-400 text-xs">
                        #{report.correlativoCompania || report.fullFolio}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Folio: {report.fullFolio}
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {report.incidentDate}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {report.incidentTime ? `${report.incidentTime} hrs` : ''}
                      </div>
                    </td>

                    {/* Clave */}
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1.5">
                        <span className="bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 font-black px-1.5 py-0.5 rounded text-[10px] border border-red-200 dark:border-red-800">
                          {report.keyCode}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px]" title={report.keyDescription}>
                          {report.keyDescription}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {report.category}
                      </span>
                    </td>

                    {/* Dirección */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                        {report.address}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {report.sector}, {report.commune}
                      </div>
                    </td>

                    {/* Mando (OBAC + V°B° Mando) */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="space-y-1">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {report.officerInChargeName}
                          </div>
                          <div className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                            {report.officerInChargeRank} <span className="text-slate-400 font-normal">• OBAC</span>
                          </div>
                        </div>
                        <div className="pt-0.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate max-w-[140px]" title={`${report.digitalSignature?.signedByRank || report.captainRank || 'V°B°'}: ${report.digitalSignature?.signedBy || report.captainName || report.approvedBy || 'Mando Cía.'}`}>
                            {report.digitalSignature?.signedByRank || report.captainRank || 'V°B°'}: {report.digitalSignature?.signedBy || report.captainName || report.approvedBy || 'Por revisar'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Carros */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {report.units && report.units.length > 0 ? (
                          report.units.map(u => (
                            <span key={u.unitCode} className="bg-slate-800 text-amber-300 font-black text-[10px] px-1.5 py-0.5 rounded">
                              {u.unitCode}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </div>
                    </td>

                    {/* Dotación */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center space-x-1 font-extrabold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                        <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>{report.totalFirefighters}</span>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          report.status === 'APROBADO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                          report.status === 'ENVIADO' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                        }`}>
                          {report.status === 'APROBADO' ? '✓ APROBADO' : report.status === 'ENVIADO' ? '⏳ EN REVISIÓN' : report.status}
                        </span>
                        {report.status === 'APROBADO' ? (
                          <span className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 truncate max-w-[125px]">
                            V°B° {report.digitalSignature?.signedByRank || report.captainRank || 'Oficial'}
                          </span>
                        ) : report.status === 'ENVIADO' ? (
                          <span className="text-[9px] font-semibold text-amber-700 dark:text-amber-400 truncate max-w-[125px]">
                            Por {report.captainRank || 'Mando Cía.'}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-3.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={(e) => handleDownloadPDF(e, report)}
                        title="Descargar PDF Oficial Firmado"
                        className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditReport(report);
                          }}
                          title="Editar Parte"
                          className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`¿Estás seguro de eliminar el parte #${report.correlativoCompania || report.fullFolio}?`)) {
                              onDeleteReport(report.id);
                            }
                          }}
                          title="Eliminar Parte"
                          className="p-1.5 text-slate-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
