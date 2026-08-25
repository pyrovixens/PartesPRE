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
import { EmergencyReport, EmergencyKey } from '../types';
import { generateEmergencyReportPDF } from '../utils/pdfGenerator';

interface ReportListViewProps {
  reports: EmergencyReport[];
  keys: EmergencyKey[];
  onNewReport: () => void;
  onEditReport: (report: EmergencyReport) => void;
  onViewReport: (report: EmergencyReport) => void;
  onDeleteReport: (reportId: string) => void;
}

export const ReportListView: React.FC<ReportListViewProps> = ({
  reports,
  keys,
  onNewReport,
  onEditReport,
  onViewReport,
  onDeleteReport,
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

  return (
    <div className="space-y-4 pb-12">
      {/* Header and Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por folio, correlativo comandancia, dirección, clave radial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-red-600 focus:outline-none placeholder-slate-400"
            />
          </div>

          <button
            onClick={onNewReport}
            className="flex items-center justify-center space-x-1.5 bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition active:scale-95 border border-red-600/40"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Nuevo Parte</span>
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md px-2.5 py-1 focus:ring-1 focus:ring-red-600 focus:outline-none"
          >
            <option value="ALL">Todas las Categorías</option>
            <option value="Emergencias">Emergencias (10-X)</option>
            <option value="Academias">Academias (A)</option>
            <option value="Entrenamiento Estandar">Entrenamiento Estándar (ES)</option>
            <option value="Reuniones de Compañía">Reuniones de Cía (RC)</option>
            <option value="Reuniones de Fundacion">Reuniones Fundación (RF)</option>
            <option value="Citaciones Varias">Citaciones Varias (V)</option>
          </select>

          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md px-2.5 py-1 focus:ring-1 focus:ring-red-600 focus:outline-none max-w-xs truncate"
          >
            <option value="ALL">Todas las Claves Radiales</option>
            {keys.map(k => (
              <option key={k.code} value={k.code}>{k.code} - {k.description}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md px-2.5 py-1 focus:ring-1 focus:ring-red-600 focus:outline-none"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="ENVIADO">Enviado</option>
            <option value="APROBADO">Aprobado</option>
            <option value="CERRADO">Cerrado</option>
          </select>

          {(searchTerm || selectedCategory !== 'ALL' || selectedKey !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('ALL');
                setSelectedKey('ALL');
                setSelectedStatus('ALL');
              }}
              className="text-red-700 dark:text-red-400 hover:underline font-bold ml-auto"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 dark:bg-slate-950 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3 text-center">Folios</th>
                <th className="py-3 px-3">Fecha y Tiempos</th>
                <th className="py-3 px-3">Clave Radial</th>
                <th className="py-3 px-3">Dirección / Sector</th>
                <th className="py-3 px-3">Oficial al Mando (OBAC)</th>
                <th className="py-3 px-3 text-center">Carros</th>
                <th className="py-3 px-3 text-center">Dotación</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-800 dark:text-slate-200">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold">No se encontraron partes de emergencia registrados.</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr 
                    key={report.id}
                    onClick={() => onViewReport(report)}
                    className="hover:bg-red-50/40 dark:hover:bg-slate-800/60 transition cursor-pointer group"
                  >
                    {/* Folios */}
                    <td className="py-3 px-3 text-center">
                      <div className="font-black text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 px-2 py-0.5 rounded text-[11px]">
                        Cía: #{report.correlativoCompania || report.fullFolio}
                      </div>
                      {report.correlativoComandancia && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Com: {report.correlativoComandancia}
                        </div>
                      )}
                    </td>

                    {/* Fecha y Tiempos */}
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-white">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{report.incidentDate}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>Desp: {report.alertTime}</span>
                        <span>•</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">6-0: {report.time6_0}</span>
                      </div>
                    </td>

                    {/* Clave Radial */}
                    <td className="py-3 px-3 max-w-[200px]">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="bg-slate-800 text-amber-300 font-black px-1.5 py-0.5 rounded text-[10px]">
                          {report.keyCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5" title={report.keyDescription}>
                        {report.keyDescription}
                      </p>
                    </td>

                    {/* Dirección */}
                    <td className="py-3 px-3 max-w-[220px]">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={report.address}>
                        {report.address}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {report.sector ? `${report.sector}, ` : ''}{report.commune || 'Calle Larga'}
                      </p>
                    </td>

                    {/* Oficial al Mando */}
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{report.officerInChargeName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{report.officerInChargeRank}</p>
                    </td>

                    {/* Material Mayor */}
                    <td className="py-3 px-3 text-center">
                      {report.units.length > 0 ? (
                        <div className="flex items-center justify-center flex-wrap gap-1">
                          {report.units.map(u => (
                            <span key={u.unitCode} className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold px-1.5 py-0.5 rounded text-[10px] border border-slate-300 dark:border-slate-700">
                              {u.unitCode}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Sin Carros</span>
                      )}
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
                        title="Descargar PDF Oficial"
                        className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditReport(report);
                        }}
                        title="Editar Parte"
                        className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`¿Estás seguro de eliminar el parte #${report.fullFolio}?`)) {
                            onDeleteReport(report.id);
                          }
                        }}
                        title="Eliminar Parte"
                        className="p-1.5 text-slate-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
