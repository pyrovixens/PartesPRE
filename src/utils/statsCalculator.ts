import { EmergencyReport, Volunteer, StatsSummary, EmergencyKey } from '../types';

export const calculateStats = (
  reports: EmergencyReport[],
  volunteers: Volunteer[],
  allKeys: EmergencyKey[]
): StatsSummary => {
  const totalCalls = reports.length;
  const emergencies = reports.filter(r => r.category === 'Emergencias');
  const activities = reports.filter(r => r.category !== 'Emergencias');

  // Average calculations
  const totalFirefightersSum = reports.reduce((acc, r) => acc + (r.totalFirefighters || 0), 0);
  const avgFirefightersPerCall = totalCalls > 0 ? totalFirefightersSum / totalCalls : 0;

  // Calls by key code
  const callsByKeyCode: Record<string, number> = {};
  allKeys.forEach(k => {
    callsByKeyCode[k.code] = 0;
  });
  reports.forEach(r => {
    callsByKeyCode[r.keyCode] = (callsByKeyCode[r.keyCode] || 0) + 1;
  });

  // Monthly stats (Jan to Dec)
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  const monthMap: Record<number, { count: number; totalF: number }> = {};
  for (let i = 0; i < 12; i++) {
    monthMap[i] = { count: 0, totalF: 0 };
  }

  // Aggregate pump hours and km from report units
  let totalPumpHours = 0;
  let totalDistanceKm = 0;

  reports.forEach(r => {
    if (Array.isArray(r.units)) {
      r.units.forEach(u => {
        if (u.pumpHours && typeof u.pumpHours === 'number') totalPumpHours += u.pumpHours;
        if (u.distanceKm && typeof u.distanceKm === 'number') totalDistanceKm += u.distanceKm;
        else if (u.endKm && u.startKm && u.endKm >= u.startKm) totalDistanceKm += (u.endKm - u.startKm);
      });
    }

    if (r.incidentDate) {
      // Safe parsing of YYYY-MM-DD to avoid timezone shifting
      const parts = r.incidentDate.split('-');
      let m = -1;
      if (parts.length >= 2) {
        m = parseInt(parts[1], 10) - 1;
      } else {
        const d = new Date(r.incidentDate);
        m = d.getMonth();
      }

      if (!isNaN(m) && m >= 0 && m < 12 && monthMap[m]) {
        monthMap[m].count += 1;
        monthMap[m].totalF += (r.totalFirefighters || 0);
      }
    }
  });

  const callsByMonth = monthNames.map((name, index) => {
    const data = monthMap[index];
    const avgF = data.count > 0 ? Number((data.totalF / data.count).toFixed(1)) : 0;
    return {
      month: name,
      calls: data.count,
      avgFirefighters: avgF,
    };
  });

  // Volunteer attendance calculation
  const totalReportsCount = reports.length;
  const attendancesByVolunteer = volunteers.map(v => {
    const attendedCount = reports.filter(r => 
      r.attendees && r.attendees.some(a => a.volunteerId === v.id)
    ).length;

    const percentage = totalReportsCount > 0 
      ? Number(((attendedCount / totalReportsCount) * 100).toFixed(1))
      : 0;

    return {
      volunteerId: v.id,
      name: v.fullName,
      category: v.category,
      rank: v.rank,
      total: attendedCount,
      percentage,
    };
  }).sort((a, b) => b.total - a.total);

  return {
    totalCalls,
    totalEmergencies: emergencies.length,
    totalActivities: activities.length,
    avgFirefightersPerCall: Number(avgFirefightersPerCall.toFixed(1)),
    totalPumpHours: Number(totalPumpHours.toFixed(1)),
    totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
    callsByKeyCode,
    callsByMonth,
    attendancesByVolunteer,
  };
};
