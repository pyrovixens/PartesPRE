import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ComposedChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Flame, 
  Users, 
  Clock, 
  Truck, 
  Building, 
  TrendingUp, 
  Filter, 
  Award,
  Calendar,
  Layers,
  Sparkles,
  MapPin,
  FileText,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Shield,
  Activity
} from 'lucide-react';
import { EmergencyReport, Volunteer, EmergencyKey, StatsSummary } from '../types';
import { calculateStats } from '../utils/statsCalculator';

interface DashboardViewProps {
  reports: EmergencyReport[];
  volunteers: Volunteer[];
  keys: EmergencyKey[];
  onSelectReport: (report: EmergencyReport) => void;
  onNewReport: () => void;
}

const SECTOR_COLORS = ['#DC2626', '#EA580C', '#D97706', '#2563EB', '#7C3AED', '#059669', '#64748B'];
const UNIT_COLORS = ['#B91C1C', '#C2410C', '#1D4ED8', '#047857', '#6D28D9', '#475569'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  reports,
  volunteers,
  keys,
  onSelectReport,
  onNewReport,
}) => {
  // Slicers / Segmentadores States
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedKey, setSelectedKey] = useState<string>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [rightPanelTab, setRightPanelTab] = useState<'ranking' | 'bitacora'>('ranking');

  // Available Years from data
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    reports.forEach(r => {
      if (r.incidentDate) {
        years.add(r.incidentDate.substring(0, 4));
      }
    });
    return Array.from(years).sort().reverse();
  }, [reports]);

  // Available Sectors from data
  const availableSectors = useMemo(() => {
    const sectors = new Set<string>();
    reports.forEach(r => {
      if (r.sector && r.sector.trim()) {
        sectors.add(r.sector.trim());
      }
    });
    return Array.from(sectors).sort();
  }, [reports]);

  // Filter reports using active segmenters
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchYear = selectedYear === 'ALL' || (r.incidentDate && r.incidentDate.startsWith(selectedYear));
      const matchCategory = selectedCategory === 'ALL' || r.category === selectedCategory;
      const matchKey = selectedKey === 'ALL' || r.keyCode === selectedKey;
      const matchSector = selectedSector === 'ALL' || r.sector === selectedSector;
      return matchYear && matchCategory && matchKey && matchSector;
    }).sort((a, b) => new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime());
  }, [reports, selectedYear, selectedCategory, selectedKey, selectedSector]);

  // Calculated KPI Stats
  const stats: StatsSummary = useMemo(() => {
    return calculateStats(filteredReports, volunteers, keys);
  }, [filteredReports, volunteers, keys]);

  // Total unit dispatches count
  const totalUnitDispatches = useMemo(() => {
    return filteredReports.reduce((sum, r) => sum + (r.units ? r.units.length : 0), 0);
  }, [filteredReports]);

  // Total cubre cuartel count
  const totalCubreCuartelCount = useMemo(() => {
    return filteredReports.reduce((sum, r) => {
      return sum + (r.attendees ? r.attendees.filter(a => a.arrivalStatus === 'CUBRE_CUARTEL').length : 0);
    }, 0);
  }, [filteredReports]);

  // Chart 1: Emergencias por Tipo / Clave (10-X)
  const keysChartData = useMemo(() => {
    const emergencyOnlyKeys = keys.filter(k => k.category === 'Emergencias');
    return emergencyOnlyKeys.map(k => {
      const count = filteredReports.filter(r => r.keyCode === k.code).length;
      return {
        code: k.code,
        shortDesc: k.description.length > 22 ? k.description.substring(0, 22) + '...' : k.description,
        fullDesc: k.description,
        count: count,
      };
    });
  }, [keys, filteredReports]);

  // Chart 2: Evolución Mensual de Llamados y Asistencia
  const monthlyChartData = useMemo(() => {
    return stats.callsByMonth;
  }, [stats.callsByMonth]);

  // Chart 3: Cantidad de llamados y promedio de bomberos por clave
  const callsAndFirefightersData = useMemo(() => {
    const emergencyOnlyKeys = keys.filter(k => k.category === 'Emergencias');
    return emergencyOnlyKeys.map(k => {
      const matching = filteredReports.filter(r => r.keyCode === k.code);
      const count = matching.length;
      const totalF = matching.reduce((sum, r) => sum + (r.totalFirefighters || 0), 0);
      const avgF = count > 0 ? Number((totalF / count).toFixed(1)) : 0;
      return {
        code: k.code,
        Cantidad: count,
        'Promedio de bomberos': avgF,
      };
    });
  }, [keys, filteredReports]);

  // Chart 4: Distribución por Sectores
  const sectorsChartData = useMemo(() => {
    const sectorMap = new Map<string, number>();
    filteredReports.forEach(r => {
      const s = r.sector || 'Calle Larga';
      sectorMap.set(s, (sectorMap.get(s) || 0) + 1);
    });

    return Array.from(sectorMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [filteredReports]);

  // Chart 5: Salidas por Carro / Material Mayor
  const unitsDispatchesData = useMemo(() => {
    const unitCountMap = new Map<string, number>();
    filteredReports.forEach(r => {
      if (r.units && Array.isArray(r.units)) {
        r.units.forEach(u => {
          const code = u.unitCode || 'Unidad';
          unitCountMap.set(code, (unitCountMap.get(code) || 0) + 1);
        });
      }
    });

    return Array.from(unitCountMap.entries())
      .map(([unitCode, count]) => ({ unitCode, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredReports]);

  // Reset Slicers
  const handleResetFilters = () => {
    setSelectedYear('ALL');
    setSelectedCategory('ALL');
    setSelectedKey('ALL');
    setSelectedSector('ALL');
  };

  const isFiltered = selectedYear !== 'ALL' || selectedCategory !== 'ALL' || selectedKey !== 'ALL' || selectedSector !== 'ALL';

  return (
    <div className="space-y-4 sm:space-y-5 pb-16">
      
      {/* ========================================================= */}
      {/* 1. TOP ROW: 5 HORIZONTAL KPI CARDS (Tarjeta KPI 1 to 5)  */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-3.5">
        
        {/* KPI 1: Total Actos */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 relative overflow-hidden group hover:border-red-500/80 transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-500 dark:text-slate-400 block">
                Total de Actos
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {stats.totalCalls}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                <span className="text-red-600 dark:text-red-400 font-bold">{stats.totalEmergencies}</span> emerg. • <span className="text-blue-600 dark:text-blue-400 font-bold">{stats.totalActivities}</span> activ.
              </p>
            </div>
            <div className="w-11 h-11 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700 to-red-500" />
        </div>

        {/* KPI 2: Promedio Bomberos */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 relative overflow-hidden group hover:border-blue-500/80 transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-500 dark:text-slate-400 block">
                Prom. Bomberos
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {stats.avgFirefightersPerCall}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                Por acto de servicio
              </p>
            </div>
            <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700 to-blue-500" />
        </div>

        {/* KPI 3: Dotación de Padrón */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 relative overflow-hidden group hover:border-amber-500/80 transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-500 dark:text-slate-400 block">
                Dotación Padrón
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {volunteers.length}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                Voluntarios 4ª Cía.
              </p>
            </div>
            <div className="w-11 h-11 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 to-amber-400" />
        </div>

        {/* KPI 4: Salidas Material Mayor */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 relative overflow-hidden group hover:border-emerald-500/80 transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-500 dark:text-slate-400 block">
                Material Mayor
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {totalUnitDispatches}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                Carros despachados
              </p>
            </div>
            <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-emerald-400" />
        </div>

        {/* KPI 5: Cubre Cuartel */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 relative overflow-hidden group hover:border-purple-500/80 transition-all">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] font-black tracking-wider uppercase text-slate-500 dark:text-slate-400 block">
                Cubre Cuartel
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {totalCubreCuartelCount}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                Personal en guardia
              </p>
            </div>
            <div className="w-11 h-11 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-purple-400" />
        </div>

      </div>

      {/* ========================================================= */}
      {/* 2. PANEL SUPERIOR DE SEGMENTADORES PANORÁMICOS (FULL WIDTH) */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5 transition-colors">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Slicers Left Header */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 rounded-xl flex items-center justify-center font-bold">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Segmentadores & Filtros de Análisis</span>
                {isFiltered && (
                  <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    Filtro Activo
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Segmenta el libro de partes por año, código radial, sector y tipo de servicio
              </p>
            </div>
          </div>

          {/* Slicers Controls Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1 max-w-4xl">
            
            {/* Year Selector */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                📅 Año:
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-600 focus:outline-none"
              >
                <option value="ALL">Todos los Años</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                🏷️ Clasificación:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-600 focus:outline-none"
              >
                <option value="ALL">Todas las Clasificaciones</option>
                <option value="Emergencias">🚨 Emergencias (10-X)</option>
                <option value="Academias">📚 Academias (A)</option>
                <option value="Entrenamiento Estandar">🏋️ Entrenamiento (ES)</option>
                <option value="Reuniones de Compañía">🏛️ Reuniones Cía. (RC)</option>
                <option value="Reuniones de Fundacion">🎖️ Reuniones Fund. (RF)</option>
                <option value="Citaciones Varias">📋 Citaciones Varias (V)</option>
              </select>
            </div>

            {/* Key Selector */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                🚒 Clave Radial:
              </label>
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-600 focus:outline-none"
              >
                <option value="ALL">Todas las Claves</option>
                {keys.map(k => (
                  <option key={k.code} value={k.code}>
                    {k.code} - {k.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Sector Selector */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                📍 Sector:
              </label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-600 focus:outline-none"
              >
                <option value="ALL">Todos los Sectores</option>
                {availableSectors.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Slicers Actions */}
          <div className="flex items-center gap-2">
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="flex items-center space-x-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/60 px-3 py-2 rounded-xl border border-red-200 dark:border-red-800 transition active:scale-95 shrink-0"
                title="Restablecer filtros"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer</span>
              </button>
            )}

            <button
              onClick={onNewReport}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 border border-red-500/40 shrink-0"
            >
              <Flame className="w-4 h-4" />
              <span>Emitir Parte</span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SECTOR 1: OPERACIONES POR CLAVE RADIAL (ANCHO COMPLETO) */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-600" />
              <span>Sector 1: Distribución Oficial de Emergencias por Clave Radial</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Volumen total de incidentes según estándar de Bomberos de Chile (Claves 10-0-1 hasta 10-16)
            </p>
          </div>
          <span className="text-xs font-black bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-3 py-1 rounded-lg border border-red-200 dark:border-red-800 shrink-0">
            📊 Gráfico Panorámico Oficial
          </span>
        </div>

        <div className="h-[400px] sm:h-[440px] w-full mt-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={keysChartData} margin={{ top: 20, right: 20, left: 0, bottom: 65 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
              <XAxis 
                dataKey="code" 
                angle={-40} 
                textAnchor="end" 
                interval={0} 
                height={70} 
                tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-950 text-white p-3.5 rounded-xl shadow-2xl text-xs border border-slate-800 max-w-sm">
                        <p className="font-black text-amber-400 text-sm">{data.code}</p>
                        <p className="text-slate-300 text-xs mt-1">{data.fullDesc}</p>
                        <div className="mt-2.5 pt-2.5 border-t border-slate-800 flex justify-between items-center">
                          <span className="text-slate-400">Total de llamados:</span>
                          <span className="text-red-400 text-base font-black">{data.count} emergencias</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="#DC2626" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. SECTOR 2: EVOLUCIÓN TEMPORAL Y ASISTENCIA (2 GRÁFICOS)  */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 2: Evolución Mensual */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between transition-colors">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                <span>Sector 2A: Evolución Mensual de Llamados</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Llamados (barras rojas) vs Promedio de bomberos por acto (línea verde)
              </p>
            </div>
            <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800 shrink-0">
              Mes a Mes
            </span>
          </div>

          <div className="h-[360px] sm:h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyChartData} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 12, fill: '#DC2626', fontWeight: 600 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#059669', fontWeight: 600 }} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                <Bar yAxisId="left" dataKey="calls" name="Llamados Registrados" fill="#DC2626" radius={[5, 5, 0, 0]} maxBarSize={44} />
                <Line yAxisId="right" type="monotone" dataKey="avgFirefighters" name="Prom. Bomberos Asistentes" stroke="#059669" strokeWidth={3.5} dot={{ r: 4, fill: '#059669' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 3: Llamados vs Dotación Promedio */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between transition-colors">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Sector 2B: Volumen de Llamados vs Dotación</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Volumen de incidentes (barras) y asistencia promedio de voluntarios (línea)
              </p>
            </div>
            <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800 shrink-0">
              Mix Operativo
            </span>
          </div>

          <div className="h-[360px] sm:h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={callsAndFirefightersData} margin={{ top: 20, right: 20, left: -10, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                <XAxis 
                  dataKey="code" 
                  angle={-40} 
                  textAnchor="end" 
                  interval={0} 
                  height={55} 
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }}
                />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 12, fill: '#1E3A8A', fontWeight: 600 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#EA580C', fontWeight: 600 }} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                <Bar yAxisId="left" dataKey="Cantidad" name="Cantidad de Llamados" fill="#1E3A8A" radius={[5, 5, 0, 0]} maxBarSize={44} />
                <Line yAxisId="right" type="monotone" dataKey="Promedio de bomberos" name="Promedio Bomberos" stroke="#EA580C" strokeWidth={3.5} dot={{ r: 4, fill: '#EA580C' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 5. SECTOR 3: COBERTURA TERRITORIAL Y MATERIAL MAYOR (2 GRÁFICOS) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 4: Distribución por Sectores */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between transition-colors">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span>Sector 3A: Top Sectores con Mayor Frecuencia</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Localidades y poblaciones de la jurisdicción con más llamados
              </p>
            </div>
            <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0">
              Jurisdicción
            </span>
          </div>

          <div className="h-[360px] sm:h-[400px] w-full mt-4">
            {sectorsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorsChartData} layout="vertical" margin={{ top: 15, right: 30, left: 35, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.25} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} />
                  <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 700 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Actos Registrados" fill="#059669" radius={[0, 8, 8, 0]} maxBarSize={36}>
                    {sectorsChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                Sin datos de sectores para los filtros activos
              </div>
            )}
          </div>
        </div>

        {/* Gráfico 5: Despachos de Unidades de Material Mayor */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between transition-colors">
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600" />
                <span>Sector 3B: Salidas de Unidades de Material Mayor</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Despachos operativos por carro de la 4ª Compañía (B-4, R-4, etc.)
              </p>
            </div>
            <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 shrink-0">
              Material Mayor
            </span>
          </div>

          <div className="h-[360px] sm:h-[400px] w-full mt-4">
            {unitsDispatchesData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitsDispatchesData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                  <XAxis dataKey="unitCode" tick={{ fontSize: 13, fill: '#64748B', fontWeight: 800 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B', fontWeight: 600 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800">
                            <p className="font-black text-amber-400 text-sm">Unidad {data.unitCode}</p>
                            <p className="font-bold text-white mt-1 pt-1 border-t border-slate-800 flex justify-between gap-4">
                              <span>Salidas al servicio:</span>
                              <span className="text-indigo-400 font-black">{data.count} despachos</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" name="Despachos" fill="#4F46E5" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {unitsDispatchesData.map((entry, index) => (
                      <Cell key={`cell-unit-${index}`} fill={UNIT_COLORS[index % UNIT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                Sin despachos de unidades para los filtros activos
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* 6. SECTOR 4: RANKING DE ASISTENCIA Y BITÁCORA EN VIVO      */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Columna 1: Ranking de Asistencia Oficial */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 rounded-xl flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Sector 4A: Ranking Oficial de Asistencia
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Voluntarios con mayor porcentaje de cumplimiento en el período
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
              Top Compañía
            </span>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {stats.attendancesByVolunteer.slice(0, 15).map((v, index) => (
              <div key={v.volunteerId} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                <div className="flex items-center space-x-3 min-w-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                    index === 0 ? 'bg-amber-400 text-slate-950 shadow-md font-black' :
                    index === 1 ? 'bg-slate-300 text-slate-900 font-black' :
                    index === 2 ? 'bg-amber-600 text-white font-black' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="truncate min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm">{v.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{v.category} • {v.rank}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <div className="w-24 sm:w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(v.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-right w-14 sm:w-16">
                    <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm block">
                      {v.percentage}%
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {v.total} actos
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna 2: Bitácora en Vivo de Partes */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-400 rounded-xl flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Sector 4B: Bitácora en Vivo de Actos de Servicio
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Últimos partes de emergencia y actividades registrados
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-red-600 bg-red-50 dark:bg-red-950/60 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800">
              Feed en Vivo
            </span>
          </div>

          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
            {filteredReports.slice(0, 10).map(rep => (
              <div
                key={rep.id}
                onClick={() => onSelectReport(rep)}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-red-50/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl cursor-pointer transition active:scale-[0.99] space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded text-xs">
                      #{rep.correlativoCompania || rep.fullFolio}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-bold">
                      {rep.incidentDate} • {rep.incidentTime || '12:00'} hrs
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    rep.status === 'APROBADO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                    rep.status === 'ENVIADO' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-800'
                  }`}>
                    {rep.status}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {rep.keyCode} - {rep.keyDescription}
                  </p>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate max-w-[140px] shrink-0">
                    📍 {rep.sector}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    OBAC: <strong className="text-red-600 dark:text-red-400">{rep.officerInChargeName}</strong>
                  </span>
                  <span className="text-blue-500 font-bold flex items-center hover:underline">
                    Ver detalle <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

