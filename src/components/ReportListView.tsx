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
  Layers
} from 'lucide-react';
import { EmergencyReport, EmergencyKey, AppUser } from '../types';
import { generateEmergencyReportPDF } from '../utils/pdfGenerator';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedKey, setSelectedKey] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Filter and search
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchesSearch = 
        r.fullFolio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.correlativoCompania && r.correlativoCompania.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.correlativoComandancia && r.correlativoComandancia.toLowerCase().includes(searchTerm.toLowerCase())) ||
        r.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.keyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.keyDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.officerInChargeName.toLowerCase().includes(searchTerm.toLowerCase());

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

      {/* Reports Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white dark:bg-slate-950 text-[10px] font-black uppercase tracking-wider border-b border-red-800/80">
              <tr>
                <th className="py-3 px-3.5">Folio / N°</th>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Clave & Tipo</th>
                <th className="py-3 px-3">Dirección & Sector</th>
                <th className="py-3 px-3">Mando a Cargo</th>
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

                    {/* Mando */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {report.officerInChargeName}
                      </div>
                      <div className="text-[10px] text-red-600 dark:text-red-400 font-medium">
                        {report.officerInChargeRank}
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
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        report.status === 'APROBADO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                        report.status === 'ENVIADO' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      }`}>
                        {report.status}
                      </span>
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
