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
      .slice(0, 6);
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
      {/* 2. MAIN 3-PANEL DASHBOARD GRID (PowerBI Layout Wireframe) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        
        {/* ======================================================= */}
        {/* PANEL IZQUIERDO: PANEL LATERAL / SEGMENTADORES (Col 3)  */}
        {/* ======================================================= */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-4.5 space-y-4 transition-colors">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">
                Segmentadores
              </h3>
            </div>
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="flex items-center space-x-1 text-[10px] font-bold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-lg border border-red-200 dark:border-red-800 transition active:scale-95"
                title="Restablecer todos los filtros"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpiar</span>
              </button>
            )}
          </div>

          {/* Segmentador 1: Año */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              📅 Año de Gestión:
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setSelectedYear('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition active:scale-95 ${
                  selectedYear === 'ALL'
                    ? 'bg-red-700 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Todos
              </button>
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition active:scale-95 ${
                    selectedYear === year
                      ? 'bg-red-700 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Segmentador 2: Clasificación de Acto */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              🏷️ Clasificación:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-600 focus:outline-none"
            >
              <option value="ALL">Todas las Clasificaciones</option>
              <option value="Emergencias">🚨 Emergencias (10-X)</option>
              <option value="Academias">📚 Academias (A)</option>
              <option value="Entrenamiento Estandar">🏋️ Entrenamiento Estándar (ES)</option>
              <option value="Reuniones de Compañía">🏛️ Reuniones de Compañía (RC)</option>
              <option value="Reuniones de Fundacion">🎖️ Reuniones de Fundación (RF)</option>
              <option value="Citaciones Varias">📋 Citaciones Varias (V)</option>
            </select>
          </div>

          {/* Segmentador 3: Clave de Emergencia */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              🚒 Clave de Acto:
            </label>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-600 focus:outline-none"
            >
              <option value="ALL">Todas las Claves Radiales</option>
              {keys.map(k => (
                <option key={k.code} value={k.code}>
                  {k.code} - {k.description}
                </option>
              ))}
            </select>
          </div>

          {/* Segmentador 4: Sector / Población */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              📍 Sector / Jurisdicción:
            </label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-600 focus:outline-none"
            >
              <option value="ALL">Todos los Sectores</option>
              {availableSectors.map(sec => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Slicer Summary Mini Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
            <span className="font-extrabold text-[10px] uppercase text-slate-500 dark:text-slate-400 block">
              Métricas del Segmento:
            </span>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Actos filtrados:</span>
                <span className="font-black text-slate-900 dark:text-white">{filteredReports.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Asistencias totales:</span>
                <span className="font-black text-red-600 dark:text-red-400">
                  {filteredReports.reduce((s, r) => s + (r.totalFirefighters || 0), 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Promedio dotación:</span>
                <span className="font-black text-blue-600 dark:text-blue-400">{stats.avgFirefightersPerCall} bom/acto</span>
              </div>
            </div>
          </div>

          <button
            onClick={onNewReport}
            className="w-full py-2.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center space-x-1.5 border border-red-500/40"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Emitir Nuevo Parte</span>
          </button>
        </div>

        {/* ======================================================= */}
        {/* PANEL CENTRAL: 2x2 GRÁFICOS 1, 2, 3, 4 (Col 6)          */}
        {/* ======================================================= */}
        <div className="xl:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* GRÁFICO 1: Cantidad de Emergencias por Clave */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between transition-colors">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-600" />
                  <span>Gráfico 1: Emergencias por Clave</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Volumen por código radial oficial (10-X) Bomberos de Chile
                </p>
              </div>
              <span className="text-[10px] font-black bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 px-2 py-1 rounded-md border border-red-200 dark:border-red-800 shrink-0">
                10-X
              </span>
            </div>

            <div className="h-80 sm:h-96 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={keysChartData} margin={{ top: 15, right: 15, left: -10, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                  <XAxis 
                    dataKey="code" 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0} 
                    height={50} 
                    tick={{ fontSize: 10, fill: '#64748B', fontWeight: 700 }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950 text-white p-3 rounded-xl shadow-2xl text-xs border border-slate-800">
                            <p className="font-black text-amber-400 text-sm">{data.code}</p>
                            <p className="text-slate-300 text-xs mt-0.5">{data.fullDesc}</p>
                            <p className="font-bold text-white mt-2 pt-2 border-t border-slate-800 flex justify-between">
                              <span>Llamados registrados:</span>
                              <span className="text-red-400 text-sm font-black">{data.count}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" fill="#DC2626" radius={[4, 4, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO 2: Evolución Mensual de Llamados y Asistencia */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between transition-colors">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <span>Gráfico 2: Evolución Mensual</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Llamados (barras rojas) vs Promedio bomberos (línea verde)
                </p>
              </div>
              <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800 shrink-0">
                Mes a Mes
              </span>
            </div>

            <div className="h-80 sm:h-96 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyChartData} margin={{ top: 15, right: 15, left: -10, bottom: 15 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} />
                  <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11, fill: '#DC2626', fontWeight: 600 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#059669', fontWeight: 600 }} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                  <Bar yAxisId="left" dataKey="calls" name="Llamados" fill="#DC2626" radius={[4, 4, 0, 0]} maxBarSize={38} />
                  <Line yAxisId="right" type="monotone" dataKey="avgFirefighters" name="Prom. Bomberos" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO 3: Cantidad de Llamados y Promedio Bomberos por Clave */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between transition-colors">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span>Gráfico 3: Llamados vs Dotación</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Respuesta operativa (barras) y asistencia promedio (línea)
                </p>
              </div>
              <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800 shrink-0">
                Mix Operativo
              </span>
            </div>

            <div className="h-80 sm:h-96 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={callsAndFirefightersData} margin={{ top: 15, right: 15, left: -10, bottom: 45 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                  <XAxis 
                    dataKey="code" 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0} 
                    height={50} 
                    tick={{ fontSize: 10, fill: '#64748B', fontWeight: 700 }}
                  />
                  <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11, fill: '#1E3A8A', fontWeight: 600 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#EA580C', fontWeight: 600 }} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                  <Bar yAxisId="left" dataKey="Cantidad" fill="#1E3A8A" radius={[4, 4, 0, 0]} maxBarSize={38} />
                  <Line yAxisId="right" type="monotone" dataKey="Promedio de bomberos" stroke="#EA580C" strokeWidth={3} dot={{ r: 4, fill: '#EA580C' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO 4: Distribución por Sectores y Jurisdicción */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between transition-colors">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span>Gráfico 4: Top Sectores de Incidentes</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Frecuencia de emergencias por sector / población
                </p>
              </div>
              <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0">
                Sectores
              </span>
            </div>

            <div className="h-80 sm:h-96 w-full mt-4">
              {sectorsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectorsChartData} layout="vertical" margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.25} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
                    <YAxis type="category" dataKey="name" width={85} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Actos Registrados" fill="#059669" radius={[0, 6, 6, 0]} maxBarSize={32}>
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

        </div>

        {/* ======================================================= */}
        {/* PANEL DERECHO: GRÁFICO 5 / PANEL VERTICAL ALTO (Col 3)  */}
        {/* ======================================================= */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 space-y-3 flex flex-col justify-between transition-colors">
          <div>
            {/* Header Tabs (Ranking vs Bitácora) */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-1">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setRightPanelTab('ranking')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                    rightPanelTab === 'ranking'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  🏆 Ranking
                </button>
                <button
                  onClick={() => setRightPanelTab('bitacora')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition ${
                    rightPanelTab === 'bitacora'
                      ? 'bg-red-700 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  📋 Bitácora
                </button>
              </div>

              <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                Gráfico 5
              </span>
            </div>

            {/* TAB 1: RANKING DE ASISTENCIA */}
            {rightPanelTab === 'ranking' && (
              <div className="mt-3 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
                {stats.attendancesByVolunteer.slice(0, 12).map((v, index) => (
                  <div key={v.volunteerId} className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                        index === 0 ? 'bg-amber-400 text-slate-950 shadow-sm' :
                        index === 1 ? 'bg-slate-300 text-slate-900' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="truncate min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate text-[11px]">{v.name}</p>
                        <p className="text-[9px] text-slate-400 truncate">{v.rank}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <div className="w-12 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-red-600 to-amber-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(v.percentage, 100)}%` }}
                        />
                      </div>
                      <span className="font-black text-slate-900 dark:text-white text-[11px]">
                        {v.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: BITÁCORA EN VIVO DE PARTES */}
            {rightPanelTab === 'bitacora' && (
              <div className="mt-3 space-y-2 max-h-[750px] overflow-y-auto pr-1">
                {filteredReports.slice(0, 10).map(rep => (
                  <div
                    key={rep.id}
                    onClick={() => onSelectReport(rep)}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-red-50/50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl cursor-pointer transition active:scale-[0.98] space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-black text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/80 px-1.5 py-0.5 rounded">
                        #{rep.correlativoCompania || rep.fullFolio}
                      </span>
                      <span className="text-slate-400 font-medium">
                        {rep.incidentDate.substring(5)} • {rep.incidentTime || '12:00'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-black text-xs text-slate-900 dark:text-white truncate">
                        {rep.keyCode}
                      </p>
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                        {rep.sector}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span>OBAC: {rep.officerInChargeName.split(' ')[0]}</span>
                      <span className="text-blue-500 font-bold flex items-center">
                        Ver parte <ChevronRight className="w-3 h-3 ml-0.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center">
            Sistema Oficial 4ª Cía. Calle Larga
          </div>
        </div>

      </div>

    </div>
  );
};

