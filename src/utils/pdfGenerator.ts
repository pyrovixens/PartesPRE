import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmergencyReport, StatsSummary } from '../types';

// Helper to convert image URL to base64
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
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

  // Try to load crest logo
  try {
    const logoBase64 = await getBase64ImageFromUrl('/logo_4ta_calle_larga.png');
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', margin, 10, 22, 22);
    }
  } catch {
    // Continue without logo if unavailable
  }

  // Header Titles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkRed);
  doc.text('CUERPO DE BOMBEROS DE LOS ANDES', margin + 26, 14);
  doc.setFontSize(13);
  doc.setTextColor(...slateDark);
  doc.text('4ª COMPAÑÍA "CALLE LARGA"', margin + 26, 20);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
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
        { content: 'Fecha / Hora:', styles: { fontStyle: 'bold', cellWidth: 26, fontSize: 8 } },
        { content: `${report.incidentDate} (${report.incidentTime || '14:00'} hrs)`, styles: { cellWidth: 50, fontSize: 8 } },
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

  // Section 2: Material Mayor (Carros y Maquinistas)
  const unitsText = report.units && report.units.length > 0
    ? report.units.map(u => `${u.unitCode} (Maquinista: ${u.driverName || 'No asignado'})`).join('  |  ')
    : 'No se despachó material mayor.';

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [[{ content: '2. MATERIAL MAYOR DESPACHADO', colSpan: 2, styles: { fillColor: slateDark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 } }]],
    body: [
      [
        { content: 'Carros y Conductores:', styles: { fontStyle: 'bold', cellWidth: 35, fontSize: 8 } },
        { content: unitsText, styles: { fontSize: 8 } },
      ],
    ],
    styles: { cellPadding: 1.5 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // Section 3: Asistencia (Material Humano)
  const attendeeRows: any[][] = [];
  const attendees = report.attendees || [];

  for (let i = 0; i < attendees.length; i += 2) {
    const a1 = attendees[i];
    const a2 = attendees[i + 1];

    const formatAtt = (a: any) => {
      if (!a) return '';
      const statusLabel = a.arrivalStatus === 'TRIPULO_CARRO' 
        ? `Tripuló ${a.unitCode || ''}` 
        : a.arrivalStatus === '6_3_LUGAR' 
        ? '6-3 en el Lugar' 
        : 'Cubre Cuartel';
      return `${a.volunteerName} (${a.rank || a.category}) - [${statusLabel}]`;
    };

    attendeeRows.push([
      { content: `${i + 1}. ${formatAtt(a1)}`, styles: { fontSize: 7.5 } },
      { content: a2 ? `${i + 2}. ${formatAtt(a2)}` : '', styles: { fontSize: 7.5 } },
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'striped',
    head: [
      [{ content: `3. REGISTRO OFICIAL DE ASISTENCIA (${attendees.length} BOMBEROS ASISTENTES)`, colSpan: 2, styles: { fillColor: darkRed, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 } }],
    ],
    body: attendeeRows.length > 0 ? attendeeRows : [[{ content: 'Sin registro de asistencia.', colSpan: 2, styles: { fontStyle: 'italic', fontSize: 8 } }]],
    styles: { cellPadding: 1.2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // Section 4: Afectados y Daños
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [[{ content: '4. AFECTADOS, DAÑOS E INMUEBLE', colSpan: 4, styles: { fillColor: slateDark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 } }]],
    body: [
      [
        { content: 'Tipo Inmueble / Vehículo:', styles: { fontStyle: 'bold', fontSize: 7.5 } },
        { content: report.affectedPropertyType || 'No especificado', styles: { fontSize: 7.5 } },
        { content: 'Nivel de Daños:', styles: { fontStyle: 'bold', fontSize: 7.5 } },
        { content: report.damageLevel || 'Leve', styles: { fontSize: 7.5, fontStyle: 'bold' } },
      ],
      [
        { content: 'Civiles Lesionados:', styles: { fontStyle: 'bold', fontSize: 7.5 } },
        { content: `${report.civilianInjuredCount || 0} personas`, styles: { fontSize: 7.5 } },
        { content: 'Bomberos Lesionados:', styles: { fontStyle: 'bold', fontSize: 7.5 } },
        { content: `${report.firefighterInjuredCount || 0} voluntarios`, styles: { fontSize: 7.5 } },
      ],
      [
        { content: 'Fallecidos:', styles: { fontStyle: 'bold', fontSize: 7.5 } },
        { content: `${report.fatalCount || 0} personas`, styles: { fontSize: 7.5, fontStyle: 'bold', textColor: report.fatalCount ? [220, 38, 38] : slateDark } },
        { content: 'Denunciante / Teléfono:', styles: { fontStyle: 'bold', fontSize: 7.5 } },
        { content: `${report.callerName || 'No registrado'} ${report.callerPhone ? `(${report.callerPhone})` : ''}`, styles: { fontSize: 7.5 } },
      ],
    ],
    styles: { cellPadding: 1.5 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // Section 5: Organismos Concurrentes
  const agencies: string[] = [];
  if (report.externalAgencies?.carabineros) agencies.push(`Carabineros ${report.externalAgencies.carabinerosUnit ? `(${report.externalAgencies.carabinerosUnit})` : ''}`);
  if (report.externalAgencies?.samu) agencies.push(`SAMU ${report.externalAgencies.samuUnit ? `(${report.externalAgencies.samuUnit})` : ''}`);
  if (report.externalAgencies?.conaf) agencies.push('CONAF');
  if (report.externalAgencies?.cgeChilquinta) agencies.push('CGE / Chilquinta');
  if (report.externalAgencies?.municipalidad) agencies.push('Municipalidad Calle Larga');
  if (report.externalAgencies?.seguridadCiudadana) agencies.push('Seguridad Ciudadana');

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    head: [[{ content: '5. ORGANISMOS CONCURRENTES Y APOYOS', colSpan: 2, styles: { fillColor: slateDark, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 } }]],
    body: [
      [
        { content: 'Instituciones en el Lugar:', styles: { fontStyle: 'bold', cellWidth: 35, fontSize: 7.5 } },
        { content: agencies.length > 0 ? agencies.join('  •  ') : 'No se registraron otros organismos.', styles: { fontSize: 7.5 } },
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

  // Signature 2: Ayudante / Capitán de Compañía
  const rightBoxX = pageWidth - margin - 10 - boxWidth;
  const captainDisplayName = report.digitalSignature?.signedBy || report.approvedBy || report.captainName || 'Capitán de Compañía';
  const captainDisplayRank = report.digitalSignature?.signedByRank || report.captainRank || (report.approvedBy ? 'V°B° Mando de Compañía' : 'Capitán 4ª Cía. Calle Larga');

  // Embed digital signature if present
  if (report.digitalSignature) {
    if (report.digitalSignature.signatureDataUrl) {
      try {
        doc.addImage(report.digitalSignature.signatureDataUrl, 'PNG', rightBoxX + (boxWidth / 2) - 20, sigY + 2, 40, 12);
      } catch (e) {
        console.warn('Could not embed signature image in PDF:', e);
      }
    } else {
      doc.setFont('helvetica', 'bolditalic');
      doc.setFontSize(6.5);
      doc.setTextColor(143, 13, 13);
      doc.text('FIRMADO DIGITALMENTE', rightBoxX + (boxWidth / 2), sigY + 10, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(100, 116, 139);
      doc.text(report.digitalSignature.verificationCode || 'VALIDADO OFICIALMENTE', rightBoxX + (boxWidth / 2), sigY + 13.5, { align: 'center' });
    }
  }

  doc.line(rightBoxX, sigY + 15, pageWidth - margin - 10, sigY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...slateDark);
  doc.text(captainDisplayName, rightBoxX + (boxWidth / 2), sigY + 19, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(captainDisplayRank, rightBoxX + (boxWidth / 2), sigY + 23, { align: 'center' });

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
        { content: `Total Asistencias Registradas: ${reports.reduce((acc, r) => acc + r.totalFirefighters, 0)}`, styles: { fontSize: 8.5 } },
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
