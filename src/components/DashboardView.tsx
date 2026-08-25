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
  ComposedChart
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
  Sparkles
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

export const DashboardView: React.FC<DashboardViewProps> = ({
  reports,
  volunteers,
  keys,
  onSelectReport,
  onNewReport,
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchYear = selectedYear === 'ALL' || (r.incidentDate && r.incidentDate.startsWith(selectedYear));
      const matchCategory = selectedCategory === 'ALL' || 
        (selectedCategory === 'EMERGENCIAS' && r.category === 'Emergencias') ||
        (selectedCategory === 'ACTIVIDADES' && r.category !== 'Emergencias');
      return matchYear && matchCategory;
    });
  }, [reports, selectedYear, selectedCategory]);

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

  // Data for Chart 1: Cantidad de emergencias por tipo de emergencia (all 10-X keys)
  const keysChartData = useMemo(() => {
    const emergencyOnlyKeys = keys.filter(k => k.category === 'Emergencias');
    return emergencyOnlyKeys.map(k => {
      const count = filteredReports.filter(r => r.keyCode === k.code).length;
      return {
        code: k.code,
        shortDesc: k.description.length > 25 ? k.description.substring(0, 25) + '...' : k.description,
        fullDesc: k.description,
        count: count,
      };
    });
  }, [keys, filteredReports]);

  // Data for Chart 2: Cantidad de llamados y promedio de bomberos por clave
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

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    reports.forEach(r => {
      if (r.incidentDate) {
        years.add(r.incidentDate.substring(0, 4));
      }
    });
    return Array.from(years).sort().reverse();
  }, [reports]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-red-700 dark:text-red-400" />
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Panel de Control y Métricas</h2>
          <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-full font-bold">
            {filteredReports.length} actos analizados
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-3 w-full md:w-auto">
          {/* Year Filter */}
          <div className="flex items-center space-x-1.5 text-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Año:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-red-600 focus:outline-none"
            >
              <option value="ALL">Todos los años</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-1.5 text-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tipo:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-red-600 focus:outline-none"
            >
              <option value="ALL">Todos los Actos</option>
              <option value="EMERGENCIAS">Solo Emergencias (10-X)</option>
              <option value="ACTIVIDADES">Solo Actividades (A, ES, RC, RF, V)</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Actos */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 relative overflow-hidden group hover:border-red-400 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total de Actos</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.totalCalls}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                <span className="text-red-600 dark:text-red-400 font-bold">{stats.totalEmergencies}</span> emerg. • <span className="text-blue-600 dark:text-blue-400 font-bold">{stats.totalActivities}</span> activ.
              </p>
            </div>
            <div className="w-11 h-11 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 rounded-xl flex items-center justify-center font-bold">
              <Flame className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600" />
        </div>

        {/* Card 2: Promedio Bomberos */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 relative overflow-hidden group hover:border-blue-400 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prom. Bomberos</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.avgFirefightersPerCall}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Por acto de servicio</p>
            </div>
            <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600" />
        </div>

        {/* Card 3: Tiempo Respuesta 6-0 */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 relative overflow-hidden group hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tiempo Resp. 6-0</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.avgResponseTimeMinutes} <span className="text-sm font-semibold text-slate-500">min</span></h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Despacho a llegada</p>
            </div>
            <div className="w-11 h-11 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl flex items-center justify-center font-bold">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Card 4: Salidas de Carros */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 relative overflow-hidden group hover:border-emerald-400 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Salidas Material Mayor</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalUnitDispatches} <span className="text-sm font-semibold text-slate-500">salidas</span></h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Carros tripulados</p>
            </div>
            <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold">
              <Truck className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600" />
        </div>

        {/* Card 5: Cubre Cuartel */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 relative overflow-hidden group hover:border-purple-400 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cubre Cuartel</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCubreCuartelCount} <span className="text-sm font-semibold text-slate-500">apoyos</span></h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Personal en guardia</p>
            </div>
            <div className="w-11 h-11 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 rounded-xl flex items-center justify-center font-bold">
              <Building className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600" />
        </div>
      </div>

      {/* Chart 1: Cantidad de emergencias por tipo de emergencia (Formato Oficial) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-600" />
              Cantidad de emergencias por tipo de emergencia
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribución por clave radial (10-0-1 hasta 10-16) según estándar de Bomberos de Chile
            </p>
          </div>
          <span className="text-xs font-bold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 px-2.5 py-1 rounded-md">
            Gráfico Oficial
          </span>
        </div>

        <div className="h-80 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={keysChartData}
              margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
              <XAxis 
                dataKey="code" 
                angle={-45} 
                textAnchor="end" 
                interval={0} 
                height={60} 
                tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs max-w-xs border border-slate-700">
                        <p className="font-bold text-amber-400 text-sm">{data.code}</p>
                        <p className="text-slate-300 mt-1">{data.fullDesc}</p>
                        <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between">
                          <span className="text-slate-400">Total Emergencias:</span>
                          <span className="font-black text-white text-sm">{data.count}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey="count" 
                name="Cantidad" 
                fill="#C91414" 
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Cantidad de llamados y promedio de bomberos por emergencia */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              Cantidad de llamados y promedio de bomberos por emergencia
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Volumen de incidentes (barras) y dotación promedio de voluntarios asistentes (línea)
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300">
              <span className="w-3 h-3 bg-[#1E3A8A] rounded-sm inline-block" /> Cantidad
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
              <span className="w-3 h-1 bg-[#EA580C] inline-block" /> Promedio de bomberos
            </span>
          </div>
        </div>

        <div className="h-80 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={callsAndFirefightersData}
              margin={{ top: 20, right: 20, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
              <XAxis 
                dataKey="code" 
                angle={-45} 
                textAnchor="end" 
                interval={0} 
                height={60} 
                tick={{ fontSize: 9, fill: '#64748B', fontWeight: 600 }}
              />
              <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11, fill: '#1E3A8A' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#EA580C' }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs max-w-xs border border-slate-700">
                        <p className="font-bold text-amber-400 text-sm">Clave: {data.code}</p>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-300">Cantidad de llamados:</span>
                            <span className="font-bold text-blue-400">{data.Cantidad}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-300">Promedio de bomberos:</span>
                            <span className="font-bold text-orange-400">{data['Promedio de bomberos']}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar 
                yAxisId="left" 
                dataKey="Cantidad" 
                fill="#1E3A8A" 
                radius={[3, 3, 0, 0]} 
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="Promedio de bomberos" 
                stroke="#EA580C" 
                strokeWidth={2.5} 
                dot={{ r: 3, fill: '#EA580C' }} 
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row: Monthly Evolution & Top Volunteers Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
          <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Calendar className="w-5 h-5 text-amber-600" />
            Evolución Mensual de Llamados y Asistencia
          </h3>
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stats.callsByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11, fill: '#C91414' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#059669' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="calls" name="Llamados" fill="#C91414" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="avgFirefighters" name="Prom. Bomberos" stroke="#059669" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 Volunteers Attendance */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Ranking de Asistencia de Voluntarios
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Top 8 Compañía</span>
          </div>

          <div className="mt-4 space-y-3">
            {stats.attendancesByVolunteer.slice(0, 8).map((v, index) => (
              <div key={v.volunteerId} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                    index === 0 ? 'bg-amber-400 text-slate-900' :
                    index === 1 ? 'bg-slate-300 text-slate-900' :
                    index === 2 ? 'bg-amber-600 text-white' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="truncate">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{v.name}</p>
                    <p className="text-[10px] text-slate-400">{v.category} • {v.rank}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-red-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(v.percentage, 100)}%` }}
                    />
                  </div>
                  <span className="font-extrabold text-slate-800 dark:text-white w-12 text-right">
                    {v.percentage}%
                  </span>
                  <span className="text-slate-400 text-[10px] w-14 text-right">
                    ({v.total} actos)
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
