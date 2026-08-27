import * as XLSX from 'xlsx';
import { EmergencyReport, Volunteer, StatsSummary } from '../types';

export const exportReportsToExcel = (
  reports: EmergencyReport[],
  volunteers: Volunteer[],
  stats: StatsSummary,
  fileName: string = 'Reporte_Oficial_4ta_Cia_Calle_Larga.xlsx'
): void => {
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // Sheet 1: MATRIZ DE ASISTENCIAS (Formato Oficial Idéntico a Comandancia)
  // -------------------------------------------------------------
  const sortedReports = [...reports].sort((a, b) => new Date(a.incidentDate).getTime() - new Date(b.incidentDate).getTime());

  // Build matrix as an Array of Arrays (AoA) for maximum control over headers and subheaders
  const matrixAoA: any[][] = [];

  // Header 1: CLAVE / TIPO DE ACTO
  const headerClaves = ['CATEGORÍA / NÓMINA', 'N° REG', 'RUT', 'CARGO'];
  sortedReports.forEach(r => headerClaves.push(r.keyCode));
  headerClaves.push('TOTAL', '% ASIST.');
  matrixAoA.push(headerClaves);

  // Header 2: CORRELATIVO COMPAÑÍA
  const headerCorrCia = ['CORRELATIVO COMPAÑÍA', '', '', ''];
  sortedReports.forEach(r => headerCorrCia.push(r.correlativoCompania || r.fullFolio));
  headerCorrCia.push('', '');
  matrixAoA.push(headerCorrCia);

  // Header 3: CORRELATIVO COMANDANCIA
  const headerCorrCom = ['CORRELATIVO COMANDANCIA', '', '', ''];
  sortedReports.forEach(r => headerCorrCom.push(r.correlativoComandancia || '-'));
  headerCorrCom.push('', '');
  matrixAoA.push(headerCorrCom);

  // Header 4: FECHA
  const headerFecha = ['FECHA', '', '', ''];
  sortedReports.forEach(r => headerFecha.push(r.incidentDate));
  headerFecha.push('', '');
  matrixAoA.push(headerFecha);

  // Helper to add a group of volunteers
  const addVolunteerGroup = (title: string, groupVolunteers: Volunteer[]) => {
    // Section Header row
    const sectionRow = [`--- ${title.toUpperCase()} ---`, '', '', ''];
    sortedReports.forEach(() => sectionRow.push(''));
    sectionRow.push('', '');
    matrixAoA.push(sectionRow);

    groupVolunteers.forEach(v => {
      let attendedCount = 0;
      const vRow: (string | number)[] = [v.fullName, v.registrationNumber, v.rut, v.rank];
      sortedReports.forEach(r => {
        const isPresent = r.attendees.some(a => a.volunteerId === v.id);
        vRow.push(isPresent ? 1 : 0);
        if (isPresent) attendedCount++;
      });
      const pct = sortedReports.length > 0 ? Number(((attendedCount / sortedReports.length) * 100).toFixed(1)) : 0;
      vRow.push(attendedCount, `${pct}%`);
      matrixAoA.push(vRow);
    });
  };

  // Group 1: Fundadores / Insignes
  const fundadores = volunteers.filter(v => v.category === 'Fundador / Insigne');
  addVolunteerGroup('Bomberos Fundadores / Bomberos Insignes', fundadores);

  // Group 2: Honorarios
  const honorarios = volunteers.filter(v => v.category === 'Honorario');
  addVolunteerGroup('Bomberos Honorarios', honorarios);

  // Group 3: Activos
  const activos = volunteers.filter(v => v.category === 'Activo');
  addVolunteerGroup('Bomberos Activos', activos);

  // Group 4: Aspirantes
  const aspirantes = volunteers.filter(v => v.category === 'Aspirante');
  if (aspirantes.length > 0) {
    addVolunteerGroup('Aspirantes a Bombero', aspirantes);
  }

  // Summary Row: Total Asistentes por Acto
  const totalRow: (string | number)[] = ['TOTAL ASISTENTES POR ACTO', '', '', ''];
  sortedReports.forEach(r => totalRow.push(r.totalFirefighters));
  const grandTotal = sortedReports.reduce((sum, r) => sum + r.totalFirefighters, 0);
  totalRow.push(grandTotal, '100%');
  matrixAoA.push(totalRow);

  const wsMatrix = XLSX.utils.aoa_to_sheet(matrixAoA);
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Matriz de Asistencias');

  // -------------------------------------------------------------
  // Sheet 2: Libro de Partes Detallado
  // -------------------------------------------------------------
  const reportsData = reports.map(r => ({
    'N° Cía': r.correlativoCompania || r.fullFolio,
    'N° Comandancia': r.correlativoComandancia || '',
    'Fecha': r.incidentDate,
    'Hora': r.incidentTime || '14:00',
    'Clave Radial': r.keyCode,
    'Descripción': r.keyDescription,
    'Categoría': r.category,
    'Dirección': r.address,
    'Sector': r.sector,
    'Comuna': r.commune,
    'Oficial a Cargo (OBAC)': `${r.officerInChargeRank} ${r.officerInChargeName}`,
    'Carros y Maquinistas': r.units.map(u => `${u.unitCode} (${u.driverName || 'S/C'})`).join(', ') || 'Ninguno',
    'Total Bomberos Asistentes': r.totalFirefighters,
    'Inmueble / Bien': r.affectedPropertyType || '',
    'Nivel Daño': r.damageLevel || '',
    'Lesionados Civiles': r.civilianInjuredCount,
    'Lesionados Bomberos': r.firefighterInjuredCount,
    'Fallecidos': r.fatalCount,
    'Estado': r.status,
    'Relato del Servicio': r.summaryNotes,
  }));

  const wsReports = XLSX.utils.json_to_sheet(reportsData);
  XLSX.utils.book_append_sheet(wb, wsReports, 'Partes de Emergencia');

  // -------------------------------------------------------------
  // Sheet 3: Resumen por Claves Radiales
  // -------------------------------------------------------------
  const keyMap: Record<string, { description: string; count: number; totalFirefighters: number }> = {};
  reports.forEach(r => {
    if (!keyMap[r.keyCode]) {
      keyMap[r.keyCode] = {
        description: r.keyDescription,
        count: 0,
        totalFirefighters: 0,
      };
    }
    keyMap[r.keyCode].count += 1;
    keyMap[r.keyCode].totalFirefighters += r.totalFirefighters;
  });

  const keysSummaryData = Object.entries(keyMap).map(([code, data]) => ({
    'Clave Radial / Código': code,
    'Descripción': data.description,
    'Cantidad de Llamados': data.count,
    'Total Bomberos': data.totalFirefighters,
    'Promedio Bomberos / Llamado': Number((data.totalFirefighters / data.count).toFixed(2)),
  }));

  const wsKeys = XLSX.utils.json_to_sheet(keysSummaryData);
  XLSX.utils.book_append_sheet(wb, wsKeys, 'Resumen por Claves');

  // -------------------------------------------------------------
  // Sheet 4: Padrón Oficial de Voluntarios
  // -------------------------------------------------------------
  const rosterData = volunteers.map(v => ({
    'Categoría': v.category,
    'N° Registro': v.registrationNumber,
    'RUT': v.rut,
    'Nombre Completo': v.fullName,
    'Cargo': v.rank,
    'Estado': v.status,
    'Teléfono': v.phone || '',
  }));

  const wsRoster = XLSX.utils.json_to_sheet(rosterData);
  XLSX.utils.book_append_sheet(wb, wsRoster, 'Padrón de Voluntarios');

  XLSX.writeFile(wb, fileName);
};

export const exportMatrixToExcel = (
  reports: EmergencyReport[],
  volunteers: Volunteer[],
  year: number = new Date().getFullYear()
): void => {
  exportReportsToExcel(
    reports,
    volunteers,
    {
      totalCalls: reports.length,
      totalEmergencies: reports.filter(r => r.category === 'Emergencias').length,
      totalActivities: reports.filter(r => r.category !== 'Emergencias').length,
      avgFirefightersPerCall: reports.length > 0 ? Number((reports.reduce((s, r) => s + r.totalFirefighters, 0) / reports.length).toFixed(1)) : 0,
      totalPumpHours: 0,
      totalDistanceKm: 0,
      callsByKeyCode: {},
      callsByMonth: [],
      attendancesByVolunteer: [],
    },
    `Matriz_Asistencias_${year}_4taCia_CalleLarga.xlsx`
  );
};
