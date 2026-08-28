import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Save, 
  Clock, 
  Calendar,
  MapPin, 
  Flame, 
  Truck, 
  Users, 
  FileText, 
  Check, 
  Star,
  Award,
  Shield,
  Sparkles,
  UserCheck,
  Search,
  Radio,
  CheckCircle2
} from 'lucide-react';
import { 
  EmergencyReport, 
  Volunteer, 
  Unit, 
  EmergencyKey, 
  DispatchedUnit, 
  AttendanceRecord, 
  ReportStatus, 
  VolunteerCategory,
  ArrivalStatus,
  VolunteerRank
} from '../types';
import { searchInFields } from '../utils/searchUtils';

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: EmergencyReport) => void;
  editingReport: EmergencyReport | null;
  volunteers: Volunteer[];
  units: Unit[];
  keys: EmergencyKey[];
  nextFolioNumber: number;
}

export const ReportFormModal: React.FC<ReportFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingReport,
  volunteers,
  units,
  keys,
  nextFolioNumber,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);

  // Form State
  const [folioYear, setFolioYear] = useState<number>(new Date().getFullYear());
  const [folioNumber, setFolioNumber] = useState<number>(nextFolioNumber);
  const [correlativoCompania, setCorrelativoCompania] = useState<string>(String(nextFolioNumber).padStart(3, '0'));
  const [correlativoComandancia, setCorrelativoComandancia] = useState<string>('');
  const [incidentDate, setIncidentDate] = useState<string>(new Date().toISOString().substring(0, 10));
  
  // Hora del Acto
  const [incidentTime, setIncidentTime] = useState<string>('14:00');

  // Clasificación y Ubicación
  const [keyCode, setKeyCode] = useState<string>('10-0-1');
  const [keySearch, setKeySearch] = useState<string>('');
  const [selectedKeyFilter, setSelectedKeyFilter] = useState<string>('ALL');
  const [address, setAddress] = useState<string>('');
  const [cornerOrReference, setCornerOrReference] = useState<string>('');
  const [sector, setSector] = useState<string>('Calle Larga');
  const [commune, setCommune] = useState<string>('Calle Larga');

  // Mando (OBAC)
  const [officerInChargeId, setOfficerInChargeId] = useState<string>('');
  const [obacSearch, setObacSearch] = useState<string>('');
  const [selectedObacFilter, setSelectedObacFilter] = useState<string>('ALL');

  // Material Mayor (Solo unidad + maquinista)
  const [selectedUnits, setSelectedUnits] = useState<DispatchedUnit[]>([]);

  // Asistencia (Material Humano con Tripuló / 6-3 Lugar / Cubre Cuartel)
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
  const [volunteerSearch, setVolunteerSearch] = useState<string>('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('ALL');

  // Afectados y Daños
  const [callerName, setCallerName] = useState<string>('');
  const [callerPhone, setCallerPhone] = useState<string>('');
  const [affectedPropertyType, setAffectedPropertyType] = useState<string>('');
  const [damageLevel, setDamageLevel] = useState<'Leve' | 'Mediano' | 'Grave' | 'Total'>('Leve');
  const [civilianInjuredCount, setCivilianInjuredCount] = useState<number>(0);
  const [firefighterInjuredCount, setFirefighterInjuredCount] = useState<number>(0);
  const [fatalCount, setFatalCount] = useState<number>(0);

  // Organismos
  const [carabineros, setCarabineros] = useState<boolean>(false);
  const [carabinerosUnit, setCarabinerosUnit] = useState<string>('');
  const [samu, setSamu] = useState<boolean>(false);
  const [samuUnit, setSamuUnit] = useState<string>('');
  const [conaf, setConaf] = useState<boolean>(false);
  const [cgeChilquinta, setCgeChilquinta] = useState<boolean>(false);
  const [municipalidad, setMunicipalidad] = useState<boolean>(false);
  const [seguridadCiudadana, setSeguridadCiudadana] = useState<boolean>(false);

  // Relato y Estado
  const [summaryNotes, setSummaryNotes] = useState<string>('');
  const [status, setStatus] = useState<ReportStatus>('APROBADO');

  // Claves filtered list with normalized search & category filter
  const filteredKeys = useMemo(() => {
    return keys.filter(k => {
      if (selectedKeyFilter !== 'ALL') {
        if (selectedKeyFilter === '10-0' && !k.code.startsWith('10-0')) return false;
        if (selectedKeyFilter === '10-2' && !k.code.startsWith('10-2')) return false;
        if (selectedKeyFilter === '10-4' && !k.code.startsWith('10-4')) return false;
        if (selectedKeyFilter === '10-3' && !k.code.startsWith('10-3')) return false;
        if (selectedKeyFilter === '10-10' && !k.code.startsWith('10-10')) return false;
        if (selectedKeyFilter === 'INSTITUCIONAL' && k.category === 'Emergencias') return false;
      }
      return searchInFields([k.code, k.description, k.category], keySearch);
    });
  }, [keys, keySearch, selectedKeyFilter]);

  // OBACs filtered list with normalized search & rank filter
  const filteredOBACs = useMemo(() => {
    return volunteers.filter(v => {
      if (selectedObacFilter === 'OFICIALES') {
        const isOfficer = ['Director', 'Capitán', 'Teniente 1°', 'Teniente 2°', 'Teniente 3°', 'Ayudante', 'Secretario', 'Tesorero'].includes(v.rank);
        if (!isOfficer) return false;
      } else if (selectedObacFilter === 'MAQUINISTAS') {
        if (v.rank !== 'Maquinista General' && v.rank !== 'Maquinista') return false;
      } else if (selectedObacFilter === 'VOLUNTARIOS') {
        const isVolunteer = ['Bombero Activo', 'Bombero Honorario', 'Bombero Fundador', 'Bombero Insigne', 'Aspirante'].includes(v.rank);
        if (!isVolunteer) return false;
      }
      return searchInFields([v.fullName, v.rank, v.registrationNumber, v.shortName], obacSearch);
    });
  }, [volunteers, obacSearch, selectedObacFilter]);

  // Machinists filtered list
  const availableMachinists = useMemo(() => {
    const officialMachinists = volunteers.filter(v => 
      v.rank === 'Maquinista General' || v.rank === 'Maquinista'
    );
    const otherVolunteers = volunteers.filter(v => 
      v.rank !== 'Maquinista General' && v.rank !== 'Maquinista'
    );
    return {
      officialMachinists,
      otherVolunteers,
    };
  }, [volunteers]);

  // Available units for volunteers to ride
  const availableRidingUnits = useMemo(() => {
    if (selectedUnits.length > 0) {
      return selectedUnits.map(u => u.unitCode);
    }
    return units.map(u => u.code);
  }, [selectedUnits, units]);

  // Load existing or reset
  useEffect(() => {
    if (editingReport) {
      setFolioYear(editingReport.folioYear);
      setFolioNumber(editingReport.folioNumber);
      setCorrelativoCompania(editingReport.correlativoCompania || String(editingReport.folioNumber).padStart(3, '0'));
      setCorrelativoComandancia(editingReport.correlativoComandancia || '');
      setIncidentDate(editingReport.incidentDate);
      setIncidentTime(editingReport.incidentTime || '14:00');
      setKeyCode(editingReport.keyCode);
      setAddress(editingReport.address);
      setCornerOrReference(editingReport.cornerOrReference || '');
      setSector(editingReport.sector || 'Calle Larga');
      setCommune(editingReport.commune || 'Calle Larga');
      setOfficerInChargeId(editingReport.officerInChargeId);
      setSelectedUnits(editingReport.units || []);
      setAttendees(editingReport.attendees || []);
      setCallerName(editingReport.callerName || '');
      setCallerPhone(editingReport.callerPhone || '');
      setAffectedPropertyType(editingReport.affectedPropertyType || '');
      setDamageLevel(editingReport.damageLevel || 'Leve');
      setCivilianInjuredCount(editingReport.civilianInjuredCount || 0);
      setFirefighterInjuredCount(editingReport.firefighterInjuredCount || 0);
      setFatalCount(editingReport.fatalCount || 0);
      setCarabineros(editingReport.externalAgencies?.carabineros || false);
      setCarabinerosUnit(editingReport.externalAgencies?.carabinerosUnit || '');
      setSamu(editingReport.externalAgencies?.samu || false);
      setSamuUnit(editingReport.externalAgencies?.samuUnit || '');
      setConaf(editingReport.externalAgencies?.conaf || false);
      setCgeChilquinta(editingReport.externalAgencies?.cgeChilquinta || false);
      setMunicipalidad(editingReport.externalAgencies?.municipalidad || false);
      setSeguridadCiudadana(editingReport.externalAgencies?.seguridadCiudadana || false);
      setSummaryNotes(editingReport.summaryNotes || '');
      setStatus(editingReport.status || 'APROBADO');
    } else {
      const curYear = new Date().getFullYear();
      setFolioYear(curYear);
      setFolioNumber(nextFolioNumber);
      setCorrelativoCompania(String(nextFolioNumber).padStart(3, '0'));
      setCorrelativoComandancia('');
      setIncidentDate(new Date().toISOString().substring(0, 10));
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setIncidentTime(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
      setKeyCode('10-0-1');
      setAddress('');
      setCornerOrReference('');
      setSector('Calle Larga');
      setCommune('Calle Larga');
      const defaultOBAC = volunteers.find(v => v.rank === 'Capitán') || volunteers[0];
      setOfficerInChargeId(defaultOBAC?.id || '');
      setSelectedUnits([]);
      setAttendees([]);
      setCallerName('');
      setCallerPhone('');
      setAffectedPropertyType('');
      setDamageLevel('Leve');
      setCivilianInjuredCount(0);
      setFirefighterInjuredCount(0);
      setFatalCount(0);
      setCarabineros(false);
      setCarabinerosUnit('');
      setSamu(false);
      setSamuUnit('');
      setConaf(false);
      setCgeChilquinta(false);
      setMunicipalidad(false);
      setSeguridadCiudadana(false);
      setSummaryNotes('');
      setStatus('APROBADO');
    }
    setActiveStep(1);
  }, [editingReport, nextFolioNumber, isOpen, volunteers]);

  const selectedKeyObj = useMemo(() => {
    return keys.find(k => k.code === keyCode) || keys[0];
  }, [keys, keyCode]);

  const selectedOBAC = useMemo(() => {
    return volunteers.find(v => v.id === officerInChargeId) || volunteers[0];
  }, [volunteers, officerInChargeId]);

  // Unit toggles
  const handleToggleUnit = (unitCode: string) => {
    const exists = selectedUnits.find(u => u.unitCode === unitCode);
    if (exists) {
      const newSelected = selectedUnits.filter(u => u.unitCode !== unitCode);
      setSelectedUnits(newSelected);
    } else {
      const defaultMachinist = availableMachinists.officialMachinists[0] || volunteers[0];
      setSelectedUnits([
        ...selectedUnits,
        {
          unitCode,
          driverId: defaultMachinist?.id || '',
          driverName: defaultMachinist?.fullName || '',
        }
      ]);
    }
  };

  const handleUpdateUnitDriver = (unitCode: string, driverId: string) => {
    const driver = volunteers.find(v => v.id === driverId);
    setSelectedUnits(selectedUnits.map(u => {
      if (u.unitCode !== unitCode) return u;
      return {
        ...u,
        driverId,
        driverName: driver ? driver.fullName : '',
      };
    }));
  };

  // Volunteer Attendance Toggles (Default: TRIPULO_CARRO)
  const handleToggleVolunteer = (volunteer: Volunteer) => {
    const isAttending = attendees.some(a => a.volunteerId === volunteer.id);
    if (isAttending) {
      setAttendees(attendees.filter(a => a.volunteerId !== volunteer.id));
    } else {
      const defaultStatus: ArrivalStatus = 'TRIPULO_CARRO';
      const defaultUnit = selectedUnits.length > 0 ? selectedUnits[0].unitCode : (units[0]?.code || 'B-4');
      const newRec: AttendanceRecord = {
        volunteerId: volunteer.id,
        volunteerName: volunteer.fullName,
        category: volunteer.category,
        rank: volunteer.rank,
        registrationNumber: volunteer.registrationNumber,
        arrivalStatus: defaultStatus,
        unitCode: defaultUnit,
        roleInAction: volunteer.id === officerInChargeId ? 'Oficial a Cargo' : 'Bombero de Fila',
      };
      setAttendees([...attendees, newRec]);
    }
  };

  const handleUpdateArrivalStatus = (volunteerId: string, arrivalStatus: ArrivalStatus) => {
    const defaultUnit = selectedUnits.length > 0 ? selectedUnits[0].unitCode : (units[0]?.code || 'B-4');
    setAttendees(attendees.map(a => {
      if (a.volunteerId !== volunteerId) return a;
      return {
        ...a,
        arrivalStatus,
        unitCode: arrivalStatus === 'TRIPULO_CARRO' ? (a.unitCode || defaultUnit) : undefined,
      };
    }));
  };

  const handleUpdateAttendeeUnit = (volunteerId: string, unitCode: string) => {
    setAttendees(attendees.map(a => a.volunteerId === volunteerId ? { ...a, unitCode } : a));
  };

  const handleSelectGroup = (category: VolunteerCategory) => {
    const groupVols = volunteers.filter(v => v.category === category);
    const existingIds = new Set(attendees.map(a => a.volunteerId));
    const defaultStatus: ArrivalStatus = 'TRIPULO_CARRO';
    const defaultUnit = selectedUnits.length > 0 ? selectedUnits[0].unitCode : (units[0]?.code || 'B-4');
    
    const newRecords: AttendanceRecord[] = groupVols
      .filter(v => !existingIds.has(v.id))
      .map(v => ({
        volunteerId: v.id,
        volunteerName: v.fullName,
        category: v.category,
        rank: v.rank,
        registrationNumber: v.registrationNumber,
        arrivalStatus: defaultStatus,
        unitCode: defaultUnit,
        roleInAction: v.id === officerInChargeId ? 'Oficial a Cargo' : 'Bombero de Fila',
      }));
    setAttendees([...attendees, ...newRecords]);
  };

  const handleSelectAllVolunteers = () => {
    const defaultStatus: ArrivalStatus = 'TRIPULO_CARRO';
    const defaultUnit = selectedUnits.length > 0 ? selectedUnits[0].unitCode : (units[0]?.code || 'B-4');
    const allRecords: AttendanceRecord[] = volunteers.map(v => ({
      volunteerId: v.id,
      volunteerName: v.fullName,
      category: v.category,
      rank: v.rank,
      registrationNumber: v.registrationNumber,
      arrivalStatus: defaultStatus,
      unitCode: defaultUnit,
      roleInAction: v.id === officerInChargeId ? 'Oficial a Cargo' : 'Bombero de Fila',
    }));
    setAttendees(allRecords);
  };

  const handleClearAttendees = () => {
    setAttendees([]);
  };

  // Filtered Volunteers for step 4 (Support fast typing of code/number or name)
  const filteredVolunteers = useMemo(() => {
    const cleanSearch = volunteerSearch.trim();
    return volunteers.filter(v => {
      const regDigits = v.registrationNumber.replace(/\D/g, '');
      const matchSearch = searchInFields([
        v.fullName,
        v.shortName,
        v.rank,
        v.registrationNumber,
        regDigits,
        v.rut,
        v.category
      ], cleanSearch);
      const matchCat = selectedCategoryTab === 'ALL' || v.category === selectedCategoryTab;
      return matchSearch && matchCat;
    });
  }, [volunteers, volunteerSearch, selectedCategoryTab]);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.trim() && selectedKeyObj.category === 'Emergencias') {
      alert('Por favor indica la dirección de la emergencia.');
      setActiveStep(2);
      return;
    }

    const fullFolio = `${folioYear}-${String(folioNumber).padStart(3, '0')}`;

    const reportToSave: EmergencyReport = {
      id: editingReport ? editingReport.id : `rep-${Date.now()}`,
      folioYear,
      folioNumber,
      fullFolio,
      correlativoCompania: correlativoCompania || String(folioNumber).padStart(3, '0'),
      correlativoComandancia: correlativoComandancia.trim(),
      incidentDate,
      incidentTime,
      keyCode: selectedKeyObj.code,
      keyDescription: selectedKeyObj.description,
      category: selectedKeyObj.category,
      address: address.trim() || 'Cuartel 4ª Compañía Calle Larga',
      cornerOrReference: cornerOrReference.trim(),
      sector,
      commune,
      officerInChargeId: selectedOBAC?.id || '',
      officerInChargeName: selectedOBAC?.fullName || '',
      officerInChargeRank: selectedOBAC?.rank || 'Capitán',
      units: selectedUnits,
      attendees,
      totalFirefighters: attendees.length,
      callerName,
      callerPhone,
      affectedPropertyType,
      damageLevel,
      injuredCount: civilianInjuredCount + firefighterInjuredCount,
      fatalCount,
      civilianInjuredCount,
      firefighterInjuredCount,
      externalAgencies: {
        carabineros,
        carabinerosUnit,
        samu,
        samuUnit,
        conaf,
        cgeChilquinta,
        municipalidad,
        seguridadCiudadana,
      },
      summaryNotes: summaryNotes.trim(),
      status,
      createdAt: editingReport ? editingReport.createdAt : new Date().toISOString(),
      createdBy: editingReport ? editingReport.createdBy : (selectedOBAC?.fullName || 'Oficial de Guardia'),
      updatedAt: new Date().toISOString(),
      approvedBy: status === 'APROBADO' ? (editingReport?.approvedBy || volunteers.find(v => v.rank === 'Capitán')?.fullName || 'Capitán de Compañía') : undefined,
      approvedAt: status === 'APROBADO' ? (editingReport?.approvedAt || new Date().toISOString()) : undefined,
      captainName: editingReport?.captainName || volunteers.find(v => v.rank === 'Capitán')?.fullName || 'Capitán de Compañía',
      captainRank: editingReport?.captainRank || 'Capitán 4ª Cía. Calle Larga',
      digitalSignature: editingReport?.digitalSignature,
    };

    onSave(reportToSave);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Modal Header */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-red-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-700 rounded-lg flex items-center justify-center font-bold text-amber-300">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight flex items-center gap-2">
                {editingReport ? `Editar Parte #${editingReport.fullFolio}` : `Nuevo Parte de Asistencia`}
                <span className="text-xs font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  Cía: #{correlativoCompania} {correlativoComandancia ? `• Com: ${correlativoComandancia}` : ''}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                4ª Compañía de Bomberos Calle Larga • Cuerpo de Bomberos Los Andes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="bg-slate-100 dark:bg-slate-800/70 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center space-x-1 overflow-x-auto text-xs no-scrollbar">
          {[
            { step: 1, label: '1. Identificación & Fecha', icon: Calendar },
            { step: 2, label: '2. Clave & Ubicación', icon: MapPin },
            { step: 3, label: '3. Material Mayor (Carros)', icon: Truck },
            { step: 4, label: `4. Asistencia (${attendees.length})`, icon: Users },
            { step: 5, label: '5. Relato & Afectados', icon: FileText },
          ].map(({ step, label, icon: Icon }) => (
            <button
              key={step}
              type="button"
              onClick={() => setActiveStep(step)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                activeStep === step
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
          {/* STEP 1: FOLIOS Y FECHA */}
          {activeStep === 1 && (
            <div className="space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Año</label>
                  <input
                    type="number"
                    value={folioYear}
                    onChange={(e) => setFolioYear(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Correlativo Cía.</label>
                  <input
                    type="text"
                    value={correlativoCompania}
                    onChange={(e) => setCorrelativoCompania(e.target.value)}
                    placeholder="Ej. 001, 002..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-bold text-red-700 dark:text-red-400 focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Correlativo Comandancia</label>
                  <input
                    type="text"
                    value={correlativoComandancia}
                    onChange={(e) => setCorrelativoComandancia(e.target.value)}
                    placeholder="Ej. C-014 / 102"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha del Acto</label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hora del Acto</label>
                  <input
                    type="time"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CLAVE, UBICACIÓN Y MANDO (OBAC) - SIMPLE Y RÁPIDO PARA MÓVILES */}
          {activeStep === 2 && (
            <div className="space-y-4">

              {/* 1. CLAVE RADIAL / TIPO DE ACTO */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    <span>Clave Radial / Tipo de Acto</span>
                  </label>
                  <span className="text-[10px] font-bold text-red-700 dark:text-red-400">
                    {selectedKeyObj.category}
                  </span>
                </div>

                {/* Compact search input for Claves */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Escribe para buscar clave (ej: 10-0, 10-4, rescate, pastizal, reunión)..."
                    value={keySearch}
                    onChange={(e) => setKeySearch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                  {keySearch && (
                    <button
                      type="button"
                      onClick={() => setKeySearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Direct Select */}
                <select
                  value={keyCode}
                  onChange={(e) => setKeyCode(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                >
                  {filteredKeys.map(k => (
                    <option key={k.code} value={k.code}>
                      {k.code} - {k.description} ({k.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. UBICACIÓN */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-3">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Ubicación de la Emergencia</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Dirección / Calle / N°
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Av. Calle Larga N° 1450"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Esquina o Referencia
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Frente a Plaza / Enlace Pocuro"
                      value={cornerOrReference}
                      onChange={(e) => setCornerOrReference(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Sector / Población
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Pocuro, San Roque, Centro"
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                    />
                    {/* Compact chips */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['Pocuro', 'San Roque', 'El Callejón', 'Centro', 'San Vicente', 'La Pampilla'].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSector(s)}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition ${
                            sector === s 
                              ? 'bg-amber-600 text-white' 
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-white'
                          }`}
                        >
                          +{s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Comuna
                    </label>
                    <select
                      value={commune}
                      onChange={(e) => setCommune(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-red-600 focus:outline-none"
                    >
                      <option value="Calle Larga">Calle Larga</option>
                      <option value="Los Andes">Los Andes</option>
                      <option value="San Esteban">San Esteban</option>
                      <option value="Rinconada">Rinconada</option>
                      <option value="San Felipe">San Felipe</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. OFICIAL AL MANDO (OBAC) - MODIFICABLE EN 1 CLIC */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>Oficial o Voluntario al Mando (OBAC)</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    Modificable
                  </span>
                </div>

                {/* Quick Search for OBAC */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Escribe para buscar oficial por nombre, cargo o N° (ej: Capitán, Gabriel, 001)..."
                    value={obacSearch}
                    onChange={(e) => setObacSearch(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                  {obacSearch && (
                    <button
                      type="button"
                      onClick={() => setObacSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Direct OBAC Select */}
                <select
                  value={officerInChargeId}
                  onChange={(e) => setOfficerInChargeId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 font-bold text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                >
                  <optgroup label="Oficiales de Mando">
                    {filteredOBACs.filter(v => ['Director', 'Capitán', 'Teniente 1°', 'Teniente 2°', 'Teniente 3°', 'Ayudante', 'Tesorero', 'Secretario'].includes(v.rank)).map(v => (
                      <option key={v.id} value={v.id}>
                        {v.rank} - {v.fullName} ({v.registrationNumber})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Voluntarios y Maquinistas">
                    {filteredOBACs.filter(v => !['Director', 'Capitán', 'Teniente 1°', 'Teniente 2°', 'Teniente 3°', 'Ayudante', 'Tesorero', 'Secretario'].includes(v.rank)).map(v => (
                      <option key={v.id} value={v.id}>
                        {v.rank} - {v.fullName} ({v.registrationNumber})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

            </div>
          )}

          {/* STEP 3: MATERIAL MAYOR (CARROS - SOLO UNIDAD Y MAQUINISTA) */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Selecciona las unidades que salieron al servicio y asigna su Maquinista:
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  La lista de conductores prioriza automáticamente al personal de Maquinistas de la Compañía.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {units.map(u => {
                  const isSelected = selectedUnits.some(su => su.unitCode === u.code);
                  return (
                    <button
                      key={u.code}
                      type="button"
                      onClick={() => handleToggleUnit(u.code)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-red-50 dark:bg-red-950/40 border-red-500 shadow-sm' 
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-base font-black ${isSelected ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {u.code}
                        </span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'bg-red-700 border-red-700 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">{u.name}</p>
                    </button>
                  );
                })}
              </div>

              {selectedUnits.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                    Maquinistas Asignados por Unidad Despachada
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedUnits.map(su => (
                      <div key={su.unitCode} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col justify-between space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-red-700 dark:text-red-400 text-sm bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded">
                            Unidad {su.unitCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleUnit(su.unitCode)}
                            className="text-slate-400 hover:text-red-700 text-xs font-semibold"
                          >
                            Quitar
                          </button>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                            Maquinista / Conductor:
                          </label>
                          <select
                            value={su.driverId}
                            onChange={(e) => handleUpdateUnitDriver(su.unitCode, e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-600"
                          >
                            <optgroup label="⭐ Maquinistas de la Compañía (Filtrado Rápido)">
                              {availableMachinists.officialMachinists.map(v => (
                                <option key={v.id} value={v.id}>{v.fullName} ({v.rank})</option>
                              ))}
                            </optgroup>
                            <optgroup label="Otros Voluntarios Autorizados">
                              {availableMachinists.otherVolunteers.map(v => (
                                <option key={v.id} value={v.id}>{v.fullName} ({v.rank})</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: NÓMINA DE ASISTENCIA (TRIPULÓ [UNIDAD] / 6-3 LUGAR / CUBRE CUARTEL) */}
          {activeStep === 4 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-3 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    Total Asistentes: <span className="text-red-700 dark:text-red-400 font-extrabold text-sm">{attendees.length}</span>
                  </span>
                  <span className="text-slate-400">•</span>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">{attendees.filter(a => a.arrivalStatus === 'TRIPULO_CARRO').length} Tripuló Carro</span>
                    <span>|</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{attendees.filter(a => a.arrivalStatus === '6_3_LUGAR').length} 6-3 Lugar</span>
                    <span>|</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">{attendees.filter(a => a.arrivalStatus === 'CUBRE_CUARTEL').length} Cubre Cuartel</span>
                  </div>
                </div>

                <div className="flex items-center flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectGroup('Activo')}
                    className="text-[11px] bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 px-2 py-1 rounded font-bold transition hover:bg-red-200"
                  >
                    + Activos
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAllVolunteers}
                    className="text-[11px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded font-bold transition hover:bg-slate-300"
                  >
                    Marcar Todos
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAttendees}
                    className="text-[11px] text-red-600 dark:text-red-400 hover:text-red-800 px-2 py-1 font-bold transition"
                  >
                    Limpiar
                  </button>
                </div>
              </div>

              {/* Filter by Category Tabs & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Escribe código (ej: 001, 002) o nombre del bombero..."
                    value={volunteerSearch}
                    onChange={(e) => setVolunteerSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && filteredVolunteers.length === 1) {
                        e.preventDefault();
                        handleToggleVolunteer(filteredVolunteers[0]);
                        setVolunteerSearch('');
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-red-600 focus:outline-none font-medium"
                  />
                  {volunteerSearch && (
                    <button
                      type="button"
                      onClick={() => setVolunteerSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-1 overflow-x-auto text-[11px] no-scrollbar">
                  {['ALL', 'Activo', 'Honorario', 'Fundador / Insigne', 'Aspirante'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryTab(cat)}
                      className={`px-2 py-1 rounded-md font-bold whitespace-nowrap transition ${
                        selectedCategoryTab === cat
                          ? 'bg-red-700 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'ALL' ? 'Todos' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volunteer List */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {filteredVolunteers.map(v => {
                  const attendeeRec = attendees.find(a => a.volunteerId === v.id);
                  const isPresent = !!attendeeRec;

                  return (
                    <div 
                      key={v.id}
                      className={`p-2.5 flex items-center justify-between gap-3 text-xs transition ${
                        isPresent 
                          ? 'bg-red-50/60 dark:bg-red-950/30' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox and Name */}
                      <div 
                        onClick={() => handleToggleVolunteer(v)}
                        className="flex items-center space-x-2.5 cursor-pointer flex-1 min-w-0"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition flex-shrink-0 ${
                          isPresent ? 'bg-red-700 border-red-700 text-white' : 'border-slate-300 dark:border-slate-600'
                        }`}>
                          {isPresent && <Check className="w-3 h-3" />}
                        </div>
                        <div className="truncate">
                          <p className={`font-bold truncate ${isPresent ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                            {v.fullName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {v.registrationNumber} • {v.category} • {v.rank}
                          </p>
                        </div>
                      </div>

                      {/* Mode Selector + Unit Selector */}
                      {isPresent && (
                        <div className="flex items-center space-x-1.5 flex-shrink-0">
                          {/* Arrival Mode */}
                          <select
                            value={attendeeRec.arrivalStatus}
                            onChange={(e) => handleUpdateArrivalStatus(v.id, e.target.value as ArrivalStatus)}
                            className={`rounded text-[11px] font-bold px-2 py-1 focus:outline-none border ${
                              attendeeRec.arrivalStatus === 'TRIPULO_CARRO' 
                                ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800' 
                                : attendeeRec.arrivalStatus === '6_3_LUGAR'
                                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : 'bg-purple-50 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                            }`}
                          >
                            <option value="TRIPULO_CARRO">🚒 Tripuló Carro</option>
                            <option value="6_3_LUGAR">📍 6-3 Llegó al Lugar</option>
                            <option value="CUBRE_CUARTEL">🏢 Cubre Cuartel</option>
                          </select>

                          {/* Unit Selector if Tripuló Carro */}
                          {attendeeRec.arrivalStatus === 'TRIPULO_CARRO' && (
                            <select
                              value={attendeeRec.unitCode || availableRidingUnits[0]}
                              onChange={(e) => handleUpdateAttendeeUnit(v.id, e.target.value)}
                              className="bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 rounded text-[11px] font-extrabold px-2 py-1 focus:outline-none"
                              title="Seleccionar unidad tripulada por este voluntario"
                            >
                              {availableRidingUnits.map(uc => (
                                <option key={uc} value={uc}>Carro {uc}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: RELATO, AFECTADOS Y ORGANISMOS */}
          {activeStep === 5 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Relato Operativo y Novedades del Servicio</label>
                <textarea
                  rows={4}
                  placeholder="Describe las labores realizadas, puntos de ataque, abastecimiento, ventilación, peritaje inicial, etc..."
                  value={summaryNotes}
                  onChange={(e) => setSummaryNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-xs focus:ring-2 focus:ring-red-600 focus:outline-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Inmueble / Vehículo Afectado</label>
                  <input
                    type="text"
                    placeholder="Ej. Vivienda de 1 piso, Station Wagon, Pastizal"
                    value={affectedPropertyType}
                    onChange={(e) => setAffectedPropertyType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Magnitud del Daño</label>
                  <select
                    value={damageLevel}
                    onChange={(e) => setDamageLevel(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-red-600 focus:outline-none"
                  >
                    <option value="Leve">Leve</option>
                    <option value="Mediano">Mediano</option>
                    <option value="Grave">Grave</option>
                    <option value="Total">Total</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Lesionados Civiles</label>
                  <input
                    type="number"
                    min="0"
                    value={civilianInjuredCount}
                    onChange={(e) => setCivilianInjuredCount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Lesionados Bomberos</label>
                  <input
                    type="number"
                    min="0"
                    value={firefighterInjuredCount}
                    onChange={(e) => setFirefighterInjuredCount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Fallecidos</label>
                  <input
                    type="number"
                    min="0"
                    value={fatalCount}
                    onChange={(e) => setFatalCount(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-600"
                  />
                </div>
              </div>

              {/* Organismos Concurrentes */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Organismos Concurrentes</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={carabineros} onChange={(e) => setCarabineros(e.target.checked)} className="rounded text-red-600" />
                    <span>Carabineros</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={samu} onChange={(e) => setSamu(e.target.checked)} className="rounded text-red-600" />
                    <span>SAMU</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={conaf} onChange={(e) => setConaf(e.target.checked)} className="rounded text-red-600" />
                    <span>CONAF</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={cgeChilquinta} onChange={(e) => setCgeChilquinta(e.target.checked)} className="rounded text-red-600" />
                    <span>CGE / Chilquinta</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={municipalidad} onChange={(e) => setMunicipalidad(e.target.checked)} className="rounded text-red-600" />
                    <span>Municipalidad</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={seguridadCiudadana} onChange={(e) => setSeguridadCiudadana(e.target.checked)} className="rounded text-red-600" />
                    <span>Seguridad Ciudadana</span>
                  </label>
                </div>
              </div>

              {/* Estado del Parte */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Estado Administrativo del Parte</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-bold text-xs"
                >
                  <option value="APROBADO">Aprobado / Validado Oficialmente</option>
                  <option value="ENVIADO">Enviado para Revisión</option>
                  <option value="BORRADOR">Borrador</option>
                  <option value="CERRADO">Cerrado / Archivado</option>
                </select>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="bg-slate-50 dark:bg-slate-800/80 -mx-5 -mb-5 px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
            <div>
              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep - 1)}
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 transition active:scale-95"
                >
                  Anterior
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white px-3 py-2 rounded-xl transition"
              >
                Cancelar
              </button>

              {activeStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="bg-slate-900 dark:bg-red-700 hover:bg-slate-800 dark:hover:bg-red-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition active:scale-95"
                >
                  Siguiente paso
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-4 sm:px-5 py-2 rounded-xl shadow-md transition active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Parte Oficial</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
