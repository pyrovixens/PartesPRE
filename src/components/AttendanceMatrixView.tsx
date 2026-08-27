import React, { useState, useMemo } from 'react';
import { 
  CalendarCheck, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Award, 
  Check, 
  Users,
  Sparkles,
  Shield,
  Star,
  Layers
} from 'lucide-react';
import { EmergencyReport, Volunteer, EmergencyKey, VolunteerCategory } from '../types';
import { exportReportsToExcel } from '../utils/excelExport';
import { calculateStats } from '../utils/statsCalculator';
import { searchInFields } from '../utils/searchUtils';

interface AttendanceMatrixViewProps {
  reports: EmergencyReport[];
  volunteers: Volunteer[];
  keys?: EmergencyKey[];
  onSelectReport?: (report: EmergencyReport) => void;
}

export const AttendanceMatrixView: React.FC<AttendanceMatrixViewProps> = ({
  reports,
  volunteers,
  keys = [],
  onSelectReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  // Filter reports chronologically
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchYear = selectedYear === 'ALL' || (r.incidentDate && r.incidentDate.startsWith(selectedYear));
      const matchCategory = selectedCategory === 'ALL' || 
        (selectedCategory === 'EMERGENCIAS' && r.category === 'Emergencias') ||
        (selectedCategory === 'ACTIVIDADES' && r.category !== 'Emergencias');
      return matchYear && matchCategory;
    }).sort((a, b) => new Date(a.incidentDate).getTime() - new Date(b.incidentDate).getTime());
  }, [reports, selectedYear, selectedCategory]);

  // Filter volunteers with search and group
  const filteredVolunteers = useMemo(() => {
    return volunteers.filter(v => {
      const matchesSearch = searchInFields([
        v.fullName,
        v.rank,
        v.registrationNumber
      ], searchTerm);
      
      const matchesGroup = selectedGroup === 'ALL' || v.category === selectedGroup;

      return matchesSearch && matchesGroup;
    });
  }, [volunteers, searchTerm, selectedGroup]);

  // Grouped volunteers
  const groupedVolunteers = useMemo(() => {
    const groups: { category: VolunteerCategory; label: string; icon: any; list: Volunteer[] }[] = [
      {
        category: 'Fundador / Insigne',
        label: 'Bomberos Fundadores / Insignes',
        icon: Star,
        list: filteredVolunteers.filter(v => v.category === 'Fundador / Insigne'),
      },
      {
        category: 'Honorario',
        label: 'Bomberos Honorarios',
        icon: Award,
        list: filteredVolunteers.filter(v => v.category === 'Honorario'),
      },
      {
        category: 'Activo',
        label: 'Bomberos Activos',
        icon: Shield,
        list: filteredVolunteers.filter(v => v.category === 'Activo'),
      },
      {
        category: 'Aspirante',
        label: 'Aspirantes',
        icon: Sparkles,
        list: filteredVolunteers.filter(v => v.category === 'Aspirante'),
      },
    ];
    return groups.filter(g => g.list.length > 0);
  }, [filteredVolunteers]);

  // Available Years
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    reports.forEach(r => {
      if (r.incidentDate) years.add(r.incidentDate.substring(0, 4));
    });
    return Array.from(years).sort().reverse();
  }, [reports]);

  const handleExportExcel = () => {
    const stats = calculateStats(filteredReports, volunteers, keys);
    exportReportsToExcel(filteredReports, volunteers, stats, `Matriz_Asistencias_4taCia_${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-3 transition-colors">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 rounded-xl flex items-center justify-center font-bold">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                Matriz Oficial de Asistencias
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estructura oficial por escalafón: Fundadores, Honorarios, Activos y Aspirantes ({filteredReports.length} actos registrados)
              </p>
            </div>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition active:scale-95 border border-emerald-600/40"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Descargar Matriz en Excel</span>
          </button>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar voluntario por nombre, cargo o registro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-600 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Escalafón:</span>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
            >
              <option value="ALL">Todos los Escalafones</option>
              <option value="Fundador / Insigne">Fundadores / Insignes</option>
              <option value="Honorario">Honorarios</option>
              <option value="Activo">Activos</option>
              <option value="Aspirante">Aspirantes</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Año:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
            >
              <option value="ALL">Todos los años</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Tipo:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
            >
              <option value="ALL">Todos los Actos</option>
              <option value="EMERGENCIAS">Solo Emergencias</option>
              <option value="ACTIVIDADES">Solo Actividades</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto max-h-[75vh]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-20 shadow-md">
              {/* Header Row 1: Claves */}
              <tr className="bg-slate-950 text-white text-[11px] font-bold">
                <th className="py-2.5 px-3 sticky left-0 z-30 bg-slate-950 min-w-[200px] border-b border-slate-800">
                  CLAVE / TIPO
                </th>
                <th className="py-2.5 px-2 text-center sticky left-[200px] z-30 bg-slate-950 border-b border-slate-800">
                  N° REG
                </th>
                <th className="py-2.5 px-3 text-center sticky left-[270px] z-30 bg-slate-950 border-b border-slate-800">
                  % ASIST.
                </th>
                <th className="py-2.5 px-2 text-center sticky left-[350px] z-30 bg-slate-950 border-b border-slate-800 border-r border-slate-700">
                  TOTAL
                </th>
                {filteredReports.map(r => (
                  <th key={r.id} className="py-2 px-2 text-center border-l border-b border-slate-800 min-w-[85px] text-amber-300 font-black">
                    {r.keyCode}
                  </th>
                ))}
              </tr>

              {/* Header Row 2: Correlativo Compañía */}
              <tr className="bg-slate-900 text-slate-300 text-[10px]">
                <th className="py-1 px-3 sticky left-0 z-30 bg-slate-900 font-bold border-b border-slate-800">
                  CORRELATIVO COMPAÑÍA
                </th>
                <th className="py-1 px-2 sticky left-[200px] z-30 bg-slate-900 border-b border-slate-800"></th>
                <th className="py-1 px-3 sticky left-[270px] z-30 bg-slate-900 border-b border-slate-800"></th>
                <th className="py-1 px-2 sticky left-[350px] z-30 bg-slate-900 border-b border-slate-800 border-r border-slate-700"></th>
                {filteredReports.map(r => (
                  <th key={r.id} className="py-1 px-2 text-center border-l border-b border-slate-800 text-white font-mono">
                    #{r.correlativoCompania || r.fullFolio}
                  </th>
                ))}
              </tr>

              {/* Header Row 3: Correlativo Comandancia */}
              <tr className="bg-slate-900 text-slate-400 text-[10px]">
                <th className="py-1 px-3 sticky left-0 z-30 bg-slate-900 font-bold border-b border-slate-800">
                  CORRELATIVO COMANDANCIA
                </th>
                <th className="py-1 px-2 sticky left-[200px] z-30 bg-slate-900 border-b border-slate-800"></th>
                <th className="py-1 px-3 sticky left-[270px] z-30 bg-slate-900 border-b border-slate-800"></th>
                <th className="py-1 px-2 sticky left-[350px] z-30 bg-slate-900 border-b border-slate-800 border-r border-slate-700"></th>
                {filteredReports.map(r => (
                  <th key={r.id} className="py-1 px-2 text-center border-l border-b border-slate-800 text-slate-300 font-mono">
                    {r.correlativoComandancia || '—'}
                  </th>
                ))}
              </tr>

              {/* Header Row 4: Fecha */}
              <tr className="bg-slate-900 text-slate-400 text-[10px]">
                <th className="py-1.5 px-3 sticky left-0 z-30 bg-slate-900 font-bold border-b border-slate-700">
                  FECHA DEL ACTO
                </th>
                <th className="py-1.5 px-2 sticky left-[200px] z-30 bg-slate-900 border-b border-slate-700"></th>
                <th className="py-1.5 px-3 sticky left-[270px] z-30 bg-slate-900 border-b border-slate-700"></th>
                <th className="py-1.5 px-2 sticky left-[350px] z-30 bg-slate-900 border-b border-slate-700 border-r border-slate-700"></th>
                {filteredReports.map(r => (
                  <th key={r.id} className="py-1.5 px-2 text-center border-l border-b border-slate-700 text-slate-200">
                    {r.incidentDate.substring(5)}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {groupedVolunteers.map(group => {
                const GroupIcon = group.icon;
                return (
                  <React.Fragment key={group.category}>
                    {/* Section Header Row */}
                    <tr className="bg-slate-100 dark:bg-slate-800/80 font-black text-slate-800 dark:text-slate-100">
                      <td colSpan={4 + filteredReports.length} className="py-2 px-3 tracking-wide uppercase text-[11px] flex items-center gap-2">
                        <GroupIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span>{group.label}</span>
                        <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                          ({group.list.length} voluntarios)
                        </span>
                      </td>
                    </tr>

                    {/* Volunteers in group */}
                    {group.list.map(v => {
                      let attendedCount = 0;
                      filteredReports.forEach(r => {
                        if (r.attendees.some(a => a.volunteerId === v.id)) attendedCount++;
                      });
                      const percentage = filteredReports.length > 0
                        ? Number(((attendedCount / filteredReports.length) * 100).toFixed(1))
                        : 0;

                      return (
                        <tr key={v.id} className="hover:bg-red-50/40 dark:hover:bg-slate-800/50 transition">
                          {/* Volunteer Name */}
                          <td className="py-2 px-3 sticky left-0 z-10 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 min-w-[200px] shadow-xs">
                            <div className="truncate">{v.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{v.rank}</div>
                          </td>

                          {/* Registration */}
                          <td className="py-2 px-2 text-center sticky left-[200px] z-10 bg-white dark:bg-slate-900 font-mono text-[10px] text-slate-500 dark:text-slate-400 shadow-xs">
                            {v.registrationNumber}
                          </td>

                          {/* Percentage */}
                          <td className="py-2 px-3 text-center sticky left-[270px] z-10 bg-white dark:bg-slate-900 shadow-xs">
                            <span className={`px-2 py-0.5 rounded-full font-black text-[11px] ${
                              percentage >= 70 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              percentage >= 40 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            }`}>
                              {percentage}%
                            </span>
                          </td>

                          {/* Total */}
                          <td className="py-2 px-2 text-center sticky left-[350px] z-10 bg-white dark:bg-slate-900 font-extrabold text-slate-900 dark:text-white shadow-xs border-r border-slate-200 dark:border-slate-700">
                            {attendedCount}
                          </td>

                          {/* Call Columns */}
                          {filteredReports.map(r => {
                            const isPresent = r.attendees.some(a => a.volunteerId === v.id);
                            return (
                              <td key={r.id} className="py-2 px-2 text-center border-l border-slate-100 dark:border-slate-800">
                                {isPresent ? (
                                  <div className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-xs font-bold text-[10px]">
                                    ✓
                                  </div>
                                ) : (
                                  <span className="text-slate-200 dark:text-slate-700 text-xs font-mono">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}

              {/* Recuento Personal Total */}
              <tr className="bg-slate-900 text-white font-extrabold text-xs sticky bottom-0 z-10 shadow-lg">
                <td className="py-2.5 px-3 sticky left-0 z-30 bg-slate-900 text-amber-300 uppercase tracking-wide">
                  RECUENTO PERSONAL POR ACTO
                </td>
                <td className="py-2.5 px-2 sticky left-[200px] z-30 bg-slate-900"></td>
                <td className="py-2.5 px-3 sticky left-[270px] z-30 bg-slate-900"></td>
                <td className="py-2.5 px-2 sticky left-[350px] z-30 bg-slate-900 border-r border-slate-700"></td>
                {filteredReports.map(r => (
                  <td key={r.id} className="py-2.5 px-2 text-center border-l border-slate-800 text-amber-300 font-black text-sm">
                    {r.totalFirefighters}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
