import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmergencyReport, StatsSummary } from '../types';

// Helper to convert image URL to base64
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn('Could not load logo for PDF:', e);
    return '';
  }
};

const formatArrivalStatus = (status: string, unitCode?: string) => {
  switch (status) {
    case 'TRIPULO_CARRO': return unitCode ? `Tripuló ${unitCode}` : 'Tripuló Carro';
    case '6_3_LUGAR': return '6-3 Llegó al Lugar';
    case 'CUBRE_CUARTEL': return 'Cubre Cuartel';
    default: return 'Presente';
  }
};

export const generateEmergencyReportPDF = async (report: EmergencyReport): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Colors
  const darkRed = [143, 13, 13] as [number, number, number];
  const gold = [184, 134, 11] as [number, number, number];
  const slateDark = [30, 41, 59] as [number, number, number];
  const grayLight = [241, 245, 249] as [number, number, number];

  // Try to load logo
  try {
    const logoBase64 = await getBase64ImageFromUrl('/logo_4ta_calle_larga.png');
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, 10, 22, 22);
    }
  } catch {
    // Continue
  }

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkRed);
  doc.text('CUERPO DE BOMBEROS DE LOS ANDES', margin + 26, 15);
  doc.setFontSize(13);
  doc.setTextColor(...slateDark);
  doc.text('CUARTA COMPAÑÍA "CALLE LARGA"', margin + 26, 21);
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Lema: "Unión, Lealtad y Servicio" • Fundada el 21 de Agosto de 1985', margin + 26, 26);
  doc.text('Calle Larga, Región de Valparaíso, Chile', margin + 26, 30);

  // Folio Box
  doc.setFillColor(...grayLight);
  doc.roundedRect(pageWidth - margin - 52, 10, 52, 22, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkRed);
  doc.text('PARTE DE ASISTENCIA', pageWidth - margin - 26, 14, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(...slateDark);
  doc.text(`CÍA: #${report.correlativoCompania || report.fullFolio}`, pageWidth - margin - 26, 19, { align: 'center' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  if (report.correlativoComandancia) {
    doc.text(`COM: ${report.correlativoComandancia}`, pageWidth - margin - 26, 24, { align: 'center' });
  }
  doc.text(`ESTADO: ${report.status}`, pageWidth - margin - 26, 28, { align: 'center' });

  // Divider line
  doc.setDrawColor(...gold);
  doc.setLineWidth(0.8);
  doc.line(margin, 35, pageWidth - margin, 35);

  let currentY = 40;

  // Section 1: Identificación y Clasificación
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [[{ content: '1. CLASIFICACIÓN Y UBICACIÓN DEL SERVICIO', colSpan: 4, styles: { fillColor: darkRed, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 } }]],
    body: [
      [
        { content: 'Fecha:', styles: { fontStyle: 'bold', cellWidth: 26, fontSize: 8 } },
        { content: report.incidentDate, styles: { cellWidth: 50, fontSize: 8 } },
        { content: 'Clave Radial:', styles: { fontStyle: 'bold', cellWidth: 30, fontSize: 8 } },
        { content: `${report.keyCode} - ${report.keyDescription}`, styles: { fontStyle: 'bold', fontSize: 8, textColor: darkRed } },
      ],
      [
        { content: 'Dirección:', styles: { fontStyle: 'bold', fontSize: 8 } },
        { content: `${report.address} ${report.cornerOrReference ? `(${report.cornerOrReference})` : ''}`, colSpan: 3, styles: { fontSize: 8 } },
      ],
      [
        { content: 'Sector / Cuadrante:', styles: { fontStyle: 'bold', fontSize: 8 } },
        { content: report.sector || 'Calle Larga', styles: { fontSize: 8 } },
        { content: 'Comuna:', styles: { fontStyle: 'bold', fontSize: 8 } },
        { content: report.commune || 'Calle Larga', styles: { fontSize: 8 } },
      ],
      [
        { content: 'Oficial al Mando (OBAC):', styles: { fontStyle: 'bold', fontSize: 8 } },
        { content: `${report.officerInChargeRank} ${report.officerInChargeName}`, colSpan: 3, styles: { fontStyle: 'bold', fontSize: 8 } },
      ],
    ],
    styles: { cellPadding: 1.5 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // Section 2: Cronometría Radial
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [[{ content: '2. CRONOMETRÍA RADIAL Y TIEMPOS OPERATIVOS', colSpan: 6, styles: { fillColor: slateDark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 } }]],
    body: [
      [
        { content: 'Despacho:', styles: { fontStyle: 'bold', fontSize: 7.5 } },
        { content: report.alertTime || '--:--', styles: { fontSize: 8, halign: 'center' } },
        { content: '6-0 (Llegada):', styles: { fontStyle: 'bold', fontSize: 7.5 } },
        { content: report.time6_0 || '--:--', styles: { fontSize: 8, halign: 'center', fontStyle: 'bold' } },
        { content: '6-7 (Control):', styles: { fontStyle: 'bold', fontSize: 7.5 } },
        { content: report.time6_7 || '--:--', styles: { fontSize: 8, halign: 'center' } },
      ],
      [
        { content: '6-8 (Término):', styles: { fontStyle: 'bold', fontSize: 7.5 } },
        { content: report.time6_8 || '--:--', styles: { fontSize: 8, halign: 'center' } },
        { content: '6-10 (Cuartel):', styles: { fontStyle: 'bold', fontSize: 7.5 } },
        { content: report.time6_10 || '--:--', styles: { fontSize: 8, halign: 'center' } },
        { content: 'Tiempo Resp. / Duración:', styles: { fontStyle: 'bold', fontSize: 7.5 } },
        { content: `${report.responseTimeMinutes} min / ${report.totalDurationMinutes} min`, styles: { fontSize: 8, halign: 'center', fontStyle: 'bold', textColor: darkRed } },
      ],
    ],
    styles: { cellPadding: 1.5 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // Section 3: Material Mayor (Carros y Maquinistas)
  const unitRows = report.units.length > 0
    ? report.units.map(u => [
        u.unitCode,
        u.driverName || 'Sin conductor asignado',
      ])
    : [['Sin concurrencia de material mayor', '']];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [
      [{ content: '3. MATERIAL MAYOR Y MAQUINISTAS', colSpan: 2, styles: { fillColor: slateDark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 } }],
      ['Unidad Despachada', 'Maquinista / Conductor a Cargo'],
    ],
    body: unitRows,
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 7.5, halign: 'center' },
    styles: { cellPadding: 1.5, fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 147 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // Section 4: Nómina de Personal Asistente con Modalidad
  const attendeeRows = report.attendees.map((a, idx) => [
    (idx + 1).toString(),
    a.registrationNumber || `VOL-${String(idx + 1).padStart(3, '0')}`,
    a.volunteerName,
    `${a.category} • ${a.rank}`,
    formatArrivalStatus(a.arrivalStatus, a.unitCode),
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    head: [
      [{ content: `4. NÓMINA DE ASISTENCIA (${report.totalFirefighters} Bomberos Asistentes)`, colSpan: 5, styles: { fillColor: darkRed, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 } }],
      ['#', 'Reg.', 'Nombre del Voluntario', 'Escalafón / Cargo', 'Modalidad de Asistencia'],
    ],
    body: attendeeRows,
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 7.5, halign: 'center' },
    styles: { cellPadding: 1.2, fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 68 },
      3: { cellWidth: 44 },
      4: { cellWidth: 40, halign: 'center', fontStyle: 'bold' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 15;
  }

  // Section 5: Organismos e Inmueble Afectado
  const agenciesList = [];
  if (report.externalAgencies.carabineros) agenciesList.push(`Carabineros (${report.externalAgencies.carabinerosUnit || 'Sí'})`);
  if (report.externalAgencies.samu) agenciesList.push(`SAMU (${report.externalAgencies.samuUnit || 'Sí'})`);
  if (report.externalAgencies.conaf) agenciesList.push('CONAF');
  if (report.externalAgencies.cgeChilquinta) agenciesList.push('CGE / Chilquinta');
  if (report.externalAgencies.municipalidad) agenciesList.push('Municipalidad');
  if (report.externalAgencies.seguridadCiudadana) agenciesList.push('Seguridad Ciudadana');

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [[{ content: '5. ANTECEDENTES DEL LUGAR Y ORGANISMOS CONCURRENTES', colSpan: 4, styles: { fillColor: slateDark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 } }]],
    body: [
      [
        { content: 'Inmueble / Bien Afectado:', styles: { fontStyle: 'bold', cellWidth: 42, fontSize: 7.5 } },
        { content: report.affectedPropertyType || 'No especificado', styles: { fontSize: 7.5 } },
        { content: 'Magnitud de Daños:', styles: { fontStyle: 'bold', cellWidth: 35, fontSize: 7.5 } },
        { content: report.damageLevel || 'Leve', styles: { fontSize: 7.5, fontStyle: 'bold' } },
      ],
      [
        { content: 'Víctimas / Lesionados:', styles: { fontStyle: 'bold', fontSize: 7.5 } },
        { content: `Lesionados Civiles: ${report.civilianInjuredCount} | Lesionados Bomberos: ${report.firefighterInjuredCount} | Fallecidos: ${report.fatalCount}`, styles: { fontSize: 7.5 } },
        { content: 'Organismos de Apoyo:', styles: { fontStyle: 'bold', fontSize: 7.5 } },
        { content: agenciesList.length > 0 ? agenciesList.join(', ') : 'Ninguno', styles: { fontSize: 7.5 } },
      ],
    ],
    styles: { cellPadding: 1.5 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // Section 6: Relato Operativo
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [[{ content: '6. RELATO OPERATIVO Y NOVEDADES DEL SERVICIO', styles: { fillColor: darkRed, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 } }]],
    body: [[{ content: report.summaryNotes || 'Sin observaciones adicionales.', styles: { fontSize: 8, cellPadding: 3, minCellHeight: 18 } }]],
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 25;
  }

  // Section 7: Cuadro de Firmas
  const boxWidth = 75;
  const sigY = currentY;

  // Signature 1: OBAC
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(margin + 10, sigY + 15, margin + 10 + boxWidth, sigY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...slateDark);
  doc.text(`${report.officerInChargeRank} ${report.officerInChargeName}`, margin + 10 + (boxWidth / 2), sigY + 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Oficial / Voluntario a Cargo (OBAC)', margin + 10 + (boxWidth / 2), sigY + 23, { align: 'center' });

  // Signature 2: Ayudante / Capitán
  doc.line(pageWidth - margin - 10 - boxWidth, sigY + 15, pageWidth - margin - 10, sigY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...slateDark);
  doc.text('Ayudantía / Capitanía de Compañía', pageWidth - margin - 10 - (boxWidth / 2), sigY + 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Revisión y Aprobación Oficial', pageWidth - margin - 10 - (boxWidth / 2), sigY + 23, { align: 'center' });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Sistema de Partes • 4ª Compañía Calle Larga - Cuerpo de Bomberos Los Andes • Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
  }

  doc.save(`Parte_${report.correlativoCompania || report.fullFolio}_4taCia_CalleLarga.pdf`);
};

export const generateMonthlyExecutivePDF = async (reports: EmergencyReport[], summary: StatsSummary, monthName: string, year: number): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const darkRed = [143, 13, 13] as [number, number, number];
  const slateDark = [30, 41, 59] as [number, number, number];

  try {
    const logoBase64 = await getBase64ImageFromUrl('/logo_4ta_calle_larga.png');
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, 10, 22, 22);
    }
  } catch {
    // Continue
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkRed);
  doc.text('CUERPO DE BOMBEROS DE LOS ANDES - 4ª COMPAÑÍA "CALLE LARGA"', margin + 26, 16);
  doc.setFontSize(14);
  doc.setTextColor(...slateDark);
  doc.text(`INFORME MENSUAL DE EMERGENCIAS Y ACTIVIDADES`, margin + 26, 23);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(`Período: ${monthName} ${year} • Generado el ${new Date().toLocaleDateString('es-CL')}`, margin + 26, 28);

  doc.setDrawColor(...darkRed);
  doc.setLineWidth(0.8);
  doc.line(margin, 35, pageWidth - margin, 35);

  let currentY = 42;

  // KPI Summary Boxes
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [[{ content: 'RESUMEN EJECUTIVO DEL PERÍODO', colSpan: 3, styles: { fillColor: darkRed, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 } }]],
    body: [
      [
        { content: 'Total Actos del Servicio:', styles: { fontStyle: 'bold', fontSize: 8.5 } },
        { content: `${reports.length} actos`, styles: { fontStyle: 'bold', fontSize: 9, textColor: darkRed } },
        { content: `Emergencias: ${summary.totalEmergencies} | Actividades: ${summary.totalActivities}`, styles: { fontSize: 8.5 } },
      ],
      [
        { content: 'Promedio Voluntarios / Acto:', styles: { fontStyle: 'bold', fontSize: 8.5 } },
        { content: `${summary.avgFirefightersPerCall.toFixed(1)} bomberos`, styles: { fontStyle: 'bold', fontSize: 9 } },
        { content: `Tiempo Respuesta Prom. (6-0): ${summary.avgResponseTimeMinutes.toFixed(1)} min`, styles: { fontSize: 8.5 } },
      ],
    ],
    styles: { cellPadding: 2 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Table of all reports
  const reportRows = reports.map(r => [
    r.correlativoCompania || r.fullFolio,
    r.correlativoComandancia || '—',
    r.incidentDate,
    r.keyCode,
    r.address,
    `${r.officerInChargeRank} ${r.officerInChargeName}`,
    r.units.map(u => `${u.unitCode} (${u.driverName})`).join(', ') || 'N/A',
    r.totalFirefighters.toString(),
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    head: [
      [{ content: 'DETALLE CRONOLÓGICO DE PARTES REGISTRADOS', colSpan: 8, styles: { fillColor: slateDark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 } }],
      ['Cía', 'Com.', 'Fecha', 'Clave', 'Dirección', 'Oficial a Cargo', 'Unidades y Maquinistas', 'Dotación'],
    ],
    body: reportRows,
    headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 7.5, halign: 'center' },
    styles: { cellPadding: 1.5, fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 14, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 14, fontStyle: 'bold', halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 40 },
      5: { cellWidth: 35 },
      6: { cellWidth: 32 },
      7: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
    },
  });

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`4ª Compañía Calle Larga - Cuerpo de Bomberos Los Andes • Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
  }

  doc.save(`Informe_Mensual_${monthName}_${year}_4taCia.pdf`);
};
