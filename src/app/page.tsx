'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { DashboardView } from '../components/DashboardView';
import { AttendanceMatrixView } from '../components/AttendanceMatrixView';
import { ReportListView } from '../components/ReportListView';
import { VolunteersManagerView } from '../components/VolunteersManagerView';
import { UnitsManagerView } from '../components/UnitsManagerView';
import { UsersManagerView } from '../components/UsersManagerView';
import { CompaniesManagerView } from '../components/CompaniesManagerView';
import { ReportFormModal } from '../components/ReportFormModal';
import { ReportDetailModal } from '../components/ReportDetailModal';
import { LogoManagerModal } from '../components/LogoManagerModal';
import { QuickAccessFAB } from '../components/QuickAccessFAB';
import { ToastContainer } from '../components/Toast';
import { LoginScreen } from '../components/LoginScreen';
import { ScrollToTopButton } from '../components/ScrollToTopButton';

import { 
  EmergencyReport, 
  Volunteer, 
  Unit, 
  EmergencyKey, 
  AppUser, 
  CompanyBranding, 
  ToastNotification,
  ReportStatus,
  Company,
  DEFAULT_COMPANY_ID,
  SUPER_ADMIN_MASTER_EMAIL
} from '../types';
import { 
  INITIAL_VOLUNTEERS, 
  INITIAL_UNITS, 
  INITIAL_REPORTS, 
  EMERGENCY_KEYS 
} from '../data/initialData';
import { 
  fetchReports, 
  saveReportToDatabase, 
  deleteReportFromDatabase,
  fetchVolunteers,
  saveVolunteerToDatabase,
  deleteVolunteerFromDatabase,
  fetchUnits,
  saveUnitToDatabase,
  deleteUnitFromDatabase,
  fetchBranding,
  saveBrandingToDatabase,
  fetchCompanies,
  saveCompanyToDatabase,
  deleteCompanyFromDatabase,
  subscribeToRealtimeChanges
} from '../services/supabaseService';
import { 
  getStoredUnits, 
  saveUnits, 
  getStoredKeys, 
  saveKeys,
  getStoredReports,
  getStoredVolunteers
} from '../utils/storage';
import { exportMatrixToExcel } from '../utils/excelExport';
import { getActiveSession, clearActiveSession, saveAppUser, fetchAppUsers, createActiveSession } from '../services/authService';

const DEFAULT_BRANDING: CompanyBranding = {
  companyId: DEFAULT_COMPANY_ID,
  companyName: '4ª COMPAÑÍA "CALLE LARGA"',
  fireDepartment: 'Cuerpo de Bomberos de Los Andes',
  motto: 'Honor, Disciplina y Abnegación • Fundada el 21 de Agosto de 1985',
  logoUrl: '/logo_4ta_calle_larga.png',
  primaryColor: '#8F0D0D',
  accentColor: '#B8860B',
};

import { 
  Flame, 
  Table2, 
  FileText, 
  Users, 
  Truck, 
  Shield, 
  Plus,
  Building2
} from 'lucide-react';

const VALID_TABS = ['dashboard', 'matrix', 'reports', 'volunteers', 'units', 'users', 'companies'];

export default function Home() {
  const [activeTab, setActiveTabState] = useState<string>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Restore and keep tab across page refresh / browser back-forward
  useEffect(() => {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    const saved = localStorage.getItem('partes_active_tab');
    const target = VALID_TABS.includes(hash) ? hash : (saved && VALID_TABS.includes(saved) ? saved : 'dashboard');
    setActiveTabState(target);

    const handleHashChange = () => {
      const currentHash = window.location.hash.replace('#', '').toLowerCase();
      if (VALID_TABS.includes(currentHash)) {
        setActiveTabState(currentHash);
        localStorage.setItem('partes_active_tab', currentHash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('partes_active_tab', tab);
      window.history.replaceState(null, '', '#' + tab);
    }
  }, []);

  // Active Session User (Synchronous client check to prevent LoginScreen flash / autofill dialog on refresh)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    if (typeof window !== 'undefined') {
      return getActiveSession();
    }
    return null;
  });
  const [isSessionLoaded, setIsSessionLoaded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return true;
    }
    return false;
  });

  // Multi-Company Active State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('bomberos_active_company_id') || DEFAULT_COMPANY_ID;
    }
    return DEFAULT_COMPANY_ID;
  });

  const setActiveCompanyId = useCallback((companyId: string) => {
    setActiveCompanyIdState(companyId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bomberos_active_company_id', companyId);
    }
  }, []);

  // Core Data States (Pre-loaded with official data)
  const [reports, setReports] = useState<EmergencyReport[]>(() => {
    if (typeof window !== 'undefined') return getStoredReports();
    return INITIAL_REPORTS;
  });
  const [volunteers, setVolunteers] = useState<Volunteer[]>(() => {
    if (typeof window !== 'undefined') return getStoredVolunteers();
    return INITIAL_VOLUNTEERS;
  });
  const [units, setUnits] = useState<Unit[]>(() => {
    if (typeof window !== 'undefined') return getStoredUnits();
    return INITIAL_UNITS;
  });
  const [keys, setKeys] = useState<EmergencyKey[]>(() => {
    if (typeof window !== 'undefined') return getStoredKeys();
    return EMERGENCY_KEYS;
  });

  // Modals
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingReport, setEditingReport] = useState<EmergencyReport | null>(null);
  const [viewingReport, setViewingReport] = useState<EmergencyReport | null>(null);
  const [isLogoManagerOpen, setIsLogoManagerOpen] = useState<boolean>(false);

  // Branding and Toasts
  const [branding, setBranding] = useState<CompanyBranding>(DEFAULT_BRANDING);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Toast Helper
  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastNotification = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Load Data function scoped to active company
  const loadAllData = useCallback(async (targetCompanyId: string = activeCompanyId) => {
    try {
      const [fetchedReports, fetchedVolunteers, fetchedUnits, fetchedUsers, fetchedCompanies, fetchedBranding] = await Promise.all([
        fetchReports(targetCompanyId),
        fetchVolunteers(targetCompanyId),
        fetchUnits(targetCompanyId),
        fetchAppUsers(targetCompanyId),
        fetchCompanies(),
        fetchBranding(targetCompanyId),
      ]);

      if (Array.isArray(fetchedCompanies)) {
        setCompanies(fetchedCompanies);
      }

      setReports(fetchedReports !== null ? fetchedReports : getStoredReports());
      setVolunteers(fetchedVolunteers && fetchedVolunteers.length > 0 ? fetchedVolunteers : getStoredVolunteers());
      setUnits(fetchedUnits !== null ? fetchedUnits : getStoredUnits());
      setKeys(getStoredKeys());

      if (fetchedBranding) {
        setBranding(fetchedBranding);
      } else if (fetchedCompanies && fetchedCompanies.length > 0) {
        const matchingCompany = fetchedCompanies.find(c => c.id === targetCompanyId);
        if (matchingCompany) {
          setBranding({
            companyId: matchingCompany.id,
            companyName: matchingCompany.name,
            fireDepartment: matchingCompany.fireDepartment,
            motto: matchingCompany.motto,
            logoUrl: matchingCompany.logoUrl,
            primaryColor: matchingCompany.primaryColor,
            accentColor: matchingCompany.accentColor,
          });
        }
      }

      // Live Permission & Role Refresh: sync currentUser with updated server permissions
      const session = getActiveSession();
      if (session && Array.isArray(fetchedUsers)) {
        const freshUser = fetchedUsers.find(
          u => u.id === session.id || u.email.toLowerCase() === session.email.toLowerCase()
        );
        if (freshUser) {
          const isDifferent = 
            JSON.stringify(freshUser.permissions) !== JSON.stringify(session.permissions) ||
            freshUser.role !== session.role ||
            freshUser.status !== session.status ||
            freshUser.rank !== session.rank;
          if (isDifferent) {
            createActiveSession(freshUser);
            setCurrentUser(freshUser);
          }
        }
      }
    } catch (e) {
      console.warn('Fallback to local state:', e);
      setReports(getStoredReports());
      setVolunteers(getStoredVolunteers());
      setUnits(getStoredUnits());
      setKeys(getStoredKeys());
    }
  }, [activeCompanyId]);

  // Handle switching companies dynamically
  const handleSelectCompany = useCallback((companyId: string) => {
    setActiveCompanyId(companyId);
    loadAllData(companyId);
    const selected = companies.find(c => c.id === companyId);
    if (selected) {
      setBranding({
        companyId: selected.id,
        companyName: selected.name,
        fireDepartment: selected.fireDepartment,
        motto: selected.motto,
        logoUrl: selected.logoUrl,
        primaryColor: selected.primaryColor,
        accentColor: selected.accentColor,
      });
      addToast({
        type: 'info',
        title: 'Entorno de Compañía Cambiado',
        message: `Ahora estás operando en el entorno de "${selected.name}".`,
        duration: 3000,
      });
    } else if (companyId === 'ALL') {
      addToast({
        type: 'info',
        title: 'Modo Central Multi-Compañía',
        message: 'Visualizando registros de todas las Compañías de Bomberos.',
        duration: 3000,
      });
    }
  }, [companies, setActiveCompanyId, loadAllData, addToast]);

  // Initialize theme, active user session, and load data immediately on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('bomberos_theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const session = getActiveSession();
    if (session) {
      setCurrentUser(session);
      if (session.companyId && session.companyId !== 'ALL') {
        setActiveCompanyId(session.companyId);
      }
    }
    setIsSessionLoaded(true);

    const savedBranding = localStorage.getItem('bomberos_branding');
    if (savedBranding) {
      try {
        setBranding(JSON.parse(savedBranding));
      } catch {}
    }

    // Load data immediately on page mount
    loadAllData();
  }, [loadAllData, setActiveCompanyId]);

  // Realtime cloud & local sync subscription
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToRealtimeChanges(
        () => {
          fetchReports(activeCompanyId).then(reps => {
            if (Array.isArray(reps)) setReports(reps);
          });
        },
        () => {
          fetchVolunteers(activeCompanyId).then(vols => {
            if (Array.isArray(vols)) setVolunteers(vols);
          });
        },
        () => {
          fetchUnits(activeCompanyId).then(u => {
            if (Array.isArray(u)) setUnits(u);
          });
        },
        () => {
          fetchBranding(activeCompanyId).then(b => {
            if (b) setBranding(b);
          });
        },
        () => {
          fetchAppUsers(activeCompanyId).then(users => {
            const current = getActiveSession();
            if (current && Array.isArray(users)) {
              const fresh = users.find(
                u => u.id === current.id || u.email.toLowerCase() === current.email.toLowerCase()
              );
              if (fresh) {
                createActiveSession(fresh);
                setCurrentUser(fresh);
              }
            }
          });
        },
        () => {
          fetchCompanies().then(comps => {
            if (Array.isArray(comps)) setCompanies(comps);
          });
        }
      );

      return () => {
        unsubscribe();
      };
    }
  }, [currentUser?.id, activeCompanyId]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('bomberos_theme', 'dark');
        addToast({ type: 'info', title: 'Modo Guardia Nocturna', message: 'Se ha activado el contraste de guardia.' });
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('bomberos_theme', 'light');
        addToast({ type: 'info', title: 'Modo Diurno', message: 'Se ha activado el tema diurno.' });
      }
      return next;
    });
  };

  // Handlers for Reports
  const handleOpenNewReport = () => {
    if (!currentUser?.permissions?.canCreateReports) {
      addToast({
        type: 'warning',
        title: 'Permiso Denegado',
        message: 'Tu perfil actual solo cuenta con permisos de consulta.',
      });
      return;
    }
    setEditingReport(null);
    setIsFormOpen(true);
  };

  const handleOpenEditReport = (report: EmergencyReport) => {
    if (!currentUser?.permissions?.canEditReports) {
      addToast({
        type: 'warning',
        title: 'Permiso Denegado',
        message: 'No tienes autorización para editar partes ya registrados.',
      });
      return;
    }
    setEditingReport(report);
    setIsFormOpen(true);
  };

  const handleSaveReport = async (reportToSave: EmergencyReport) => {
    setIsFormOpen(false);
    setEditingReport(null);

    const targetCompanyId = reportToSave.companyId || (activeCompanyId !== 'ALL' ? activeCompanyId : DEFAULT_COMPANY_ID);
    const enrichedReport: EmergencyReport = {
      ...reportToSave,
      companyId: targetCompanyId,
    };

    // Optimistic UI update with strict deduplication
    setReports(prev => {
      const key = `${targetCompanyId}-${enrichedReport.folioYear}-${enrichedReport.correlativoCompania || enrichedReport.fullFolio}`;
      const filtered = prev.filter(r => 
        r.id !== enrichedReport.id && 
        `${r.companyId || DEFAULT_COMPANY_ID}-${r.folioYear}-${r.correlativoCompania || r.fullFolio}` !== key
      );
      return [enrichedReport, ...filtered];
    });

    const isDraft = enrichedReport.status === 'BORRADOR';
    addToast({
      type: isDraft ? 'info' : 'success',
      title: isDraft ? 'Borrador Guardado' : 'Parte Ingresado',
      message: isDraft 
        ? `Borrador del Parte #${enrichedReport.correlativoCompania || enrichedReport.fullFolio} guardado exitosamente.`
        : `Parte #${enrichedReport.correlativoCompania || enrichedReport.fullFolio} ingresado exitosamente.`,
      duration: 2500,
    });

    try {
      await saveReportToDatabase(enrichedReport);
      const updated = await fetchReports(activeCompanyId);
      if (Array.isArray(updated)) {
        setReports(updated);
      }
    } catch (e) {
      console.error('Error saving report to DB:', e);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!currentUser?.permissions?.canDeleteReports) {
      addToast({
        type: 'warning',
        title: 'Permiso Denegado',
        message: 'Solo el Mando Oficial tiene facultades para anular partes.',
      });
      return;
    }

    setReports(prev => prev.filter(r => r.id !== reportId));
    if (viewingReport?.id === reportId) {
      setViewingReport(null);
    }

    try {
      await deleteReportFromDatabase(reportId);
      const updated = await fetchReports(activeCompanyId);
      if (Array.isArray(updated)) {
        setReports(updated);
      }
      addToast({
        type: 'warning',
        title: 'Parte Anulado',
        message: 'El registro ha sido eliminado del libro de novedades.',
        duration: 2500,
      });
    } catch (e) {
      console.error('Error deleting report:', e);
    }
  };

  const handleSignReport = async (
    reportId: string, 
    signatureData: any, 
    targetStatus: ReportStatus = 'APROBADO',
    isObac: boolean = false
  ) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    let signedReport: EmergencyReport = { ...report };

    if (isObac) {
      signedReport.obacSignature = {
        ...signatureData,
        role: 'OBAC',
      };
      signedReport.status = targetStatus;
      signedReport.updatedAt = new Date().toISOString();
    } else {
      signedReport.reviewerSignature = {
        ...signatureData,
        role: 'REVISOR',
      };
      signedReport.digitalSignature = {
        ...signatureData,
        role: 'REVISOR',
      };
      signedReport.captainName = signatureData.signedBy;
      signedReport.captainRank = signatureData.signedByRank;
      signedReport.approvedBy = signatureData.signedBy;
      signedReport.approvedAt = signatureData.signedAt;
      signedReport.status = targetStatus;
      signedReport.updatedAt = new Date().toISOString();
    }

    // Optimistic local state update
    setReports(prev => prev.map(r => r.id === reportId ? signedReport : r));
    setViewingReport(signedReport);

    await saveReportToDatabase(signedReport);
    const updated = await fetchReports(activeCompanyId);
    if (Array.isArray(updated)) {
      setReports(updated);
      const freshSigned = updated.find(r => r.id === reportId);
      if (freshSigned) {
        setViewingReport(freshSigned);
      }
    }

    const statusLabels: Record<ReportStatus, string> = {
      'APROBADO': 'Aprobado (V°B°)',
      'ENVIADO': 'En Revisión',
      'BORRADOR': 'Borrador',
      'CERRADO': 'Cerrado/Archivado'
    };

    addToast({
      type: 'success',
      title: isObac ? 'Firma de OBAC Registrada' : `Estado: ${statusLabels[targetStatus] || targetStatus}`,
      message: isObac 
        ? `Firma operativa estampada por ${signatureData.signedBy} (${signatureData.signedByRank}). Estado: ${statusLabels[targetStatus] || targetStatus}.`
        : `Firma digital y estado "${statusLabels[targetStatus] || targetStatus}" registrados por ${signatureData.signedBy} (${signatureData.signedByRank}).`,
      duration: 3500,
    });
  };

  // Handlers for Volunteers (Only SUPER_ADMIN and ADMIN can edit/manage)
  const handleSaveVolunteer = async (vol: Volunteer) => {
    const canEdit = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';
    if (!canEdit) {
      addToast({
        type: 'warning',
        title: 'Permiso Denegado',
        message: 'Solo Administradores y Super Administradores pueden modificar el padrón y maquinistas.',
      });
      return;
    }

    const targetCompanyId = vol.companyId || (activeCompanyId !== 'ALL' ? activeCompanyId : DEFAULT_COMPANY_ID);
    const cleanVol: Volunteer = { ...vol, companyId: targetCompanyId };

    // Optimistic state update across all views
    setVolunteers(prev => {
      const idx = prev.findIndex(v => v.id === cleanVol.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = cleanVol;
        return next;
      }
      return [...prev, cleanVol];
    });

    await saveVolunteerToDatabase(cleanVol);
    const updated = await fetchVolunteers(activeCompanyId);
    if (Array.isArray(updated)) {
      setVolunteers(updated);
    }
    addToast({
      type: 'success',
      title: 'Padrón Actualizado',
      message: `Datos del voluntario ${cleanVol.fullName} guardados con éxito.`,
      duration: 2500,
    });
  };

  const handleDeleteVolunteer = async (volId: string) => {
    const canEdit = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';
    if (!canEdit) {
      addToast({
        type: 'warning',
        title: 'Permiso Denegado',
        message: 'Solo Administradores y Super Administradores pueden remover voluntarios del padrón.',
      });
      return;
    }
    setVolunteers(prev => prev.filter(v => v.id !== volId));
    await deleteVolunteerFromDatabase(volId);
    const updated = await fetchVolunteers(activeCompanyId);
    if (Array.isArray(updated)) {
      setVolunteers(updated);
    }
    addToast({
      type: 'warning',
      title: 'Voluntario Removido',
      message: 'El registro ha sido retirado del padrón.',
      duration: 2500,
    });
  };

  // Handlers for Units
  const handleSaveUnit = async (unit: Unit) => {
    if (!currentUser?.permissions?.canManageUnits) {
      addToast({
        type: 'warning',
        title: 'Permiso Denegado',
        message: 'No tienes autorización para modificar unidades bomberiles.',
      });
      return;
    }
    const targetCompanyId = unit.companyId || (activeCompanyId !== 'ALL' ? activeCompanyId : DEFAULT_COMPANY_ID);
    const cleanUnit: Unit = { ...unit, companyId: targetCompanyId };

    setUnits(prev => {
      const idx = prev.findIndex(u => u.code === cleanUnit.code);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = cleanUnit;
        return next;
      }
      return [...prev, cleanUnit];
    });

    await saveUnitToDatabase(cleanUnit);
    const updated = await fetchUnits(activeCompanyId);
    if (Array.isArray(updated)) {
      setUnits(updated);
    }
    addToast({
      type: 'success',
      title: 'Material Mayor Actualizado',
      message: `Unidad ${cleanUnit.code} actualizada.`,
      duration: 2500,
    });
  };

  const handleDeleteUnit = async (unitCode: string) => {
    if (!currentUser?.permissions?.canManageUnits) {
      addToast({
        type: 'warning',
        title: 'Permiso Denegado',
        message: 'No tienes autorización para eliminar unidades de la flota.',
      });
      return;
    }
    setUnits(prev => prev.filter(u => u.code !== unitCode));
    await deleteUnitFromDatabase(unitCode);
    const updated = await fetchUnits(activeCompanyId);
    if (Array.isArray(updated)) {
      setUnits(updated);
    }
    addToast({
      type: 'warning',
      title: 'Unidad Eliminada',
      message: 'La unidad ha sido retirada del inventario.',
      duration: 2500,
    });
  };

  // Handlers for Multi-Company Management (SUPER_ADMIN only)
  const handleSaveCompany = async (company: Company) => {
    if (currentUser?.email.toLowerCase() !== SUPER_ADMIN_MASTER_EMAIL.toLowerCase() && currentUser?.role !== 'SUPER_ADMIN') {
      addToast({
        type: 'warning',
        title: 'Permiso Denegado',
        message: 'Solo el Super Administrador Central puede gestionar Compañías de Bomberos.',
      });
      return;
    }

    setCompanies(prev => {
      const idx = prev.findIndex(c => c.id === company.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = company;
        return next;
      }
      return [...prev, company];
    });

    await saveCompanyToDatabase(company);
    const fresh = await fetchCompanies();
    if (Array.isArray(fresh)) {
      setCompanies(fresh);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (currentUser?.email.toLowerCase() !== SUPER_ADMIN_MASTER_EMAIL.toLowerCase() && currentUser?.role !== 'SUPER_ADMIN') {
      addToast({
        type: 'warning',
        title: 'Permiso Denegado',
        message: 'Solo el Super Administrador Central puede eliminar Compañías.',
      });
      return;
    }

    if (companyId === DEFAULT_COMPANY_ID) {
      addToast({
        type: 'error',
        title: 'Acción Bloqueada',
        message: 'No se puede eliminar la Compañía matriz por defecto.',
      });
      return;
    }

    setCompanies(prev => prev.filter(c => c.id !== companyId));
    if (activeCompanyId === companyId) {
      handleSelectCompany(DEFAULT_COMPANY_ID);
    }

    await deleteCompanyFromDatabase(companyId);
    const fresh = await fetchCompanies();
    if (Array.isArray(fresh)) {
      setCompanies(fresh);
    }
  };

  // Branding handler
  const handleSaveBranding = async (newBranding: CompanyBranding) => {
    const targetCompanyId = newBranding.companyId || (activeCompanyId !== 'ALL' ? activeCompanyId : DEFAULT_COMPANY_ID);
    const enriched: CompanyBranding = { ...newBranding, companyId: targetCompanyId };
    setBranding(enriched);
    localStorage.setItem('bomberos_branding', JSON.stringify(enriched));
    await saveBrandingToDatabase(enriched);
    addToast({
      type: 'success',
      title: 'Identidad Institucional Guardada',
      message: 'El escudo y membrete oficial han sido actualizados en la nube.',
      duration: 3000,
    });
  };

  // Auth Handlers
  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    if (user.companyId && user.companyId !== 'ALL') {
      setActiveCompanyId(user.companyId);
      loadAllData(user.companyId);
    } else {
      loadAllData();
    }
    addToast({
      type: 'success',
      title: 'Sesión Iniciada',
      message: `Bienvenido(a), ${user.fullName}. Rango: ${user.rank}.`,
      duration: 3000,
    });
  };

  const handleLogout = () => {
    clearActiveSession();
    setCurrentUser(null);
    addToast({
      type: 'info',
      title: 'Sesión Cerrada',
      message: 'Has salido del sistema de partes.',
      duration: 2500,
    });
  };

  // Render LoginScreen if not authenticated
  if (isSessionLoaded && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
        <LoginScreen 
          onLogin={handleLogin} 
          branding={branding} 
          companies={companies}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  // Prevent flash while session is validating
  if (!isSessionLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.email.toLowerCase() === SUPER_ADMIN_MASTER_EMAIL.toLowerCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-red-600 selection:text-white pb-20 sm:pb-0">
      <div className="flex-1 flex flex-col">
        {/* Navigation & Header with Multi-Company switcher */}
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          currentUser={currentUser}
          onLogout={handleLogout}
          onNewReport={handleOpenNewReport}
          onOpenLogoManager={() => setIsLogoManagerOpen(true)}
          reports={reports}
          volunteers={volunteers}
          branding={branding}
          companies={companies}
          activeCompanyId={activeCompanyId}
          onSelectCompany={handleSelectCompany}
        />

        {/* Global Multi-Company Notice for Super Admin */}
        {isSuperAdmin && activeCompanyId === 'ALL' && (
          <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-2 text-center text-xs font-bold text-amber-300 flex items-center justify-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Modo Super Administrador Activo: Visualizando información consolidada de todas las Compañías.</span>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardView 
              reports={reports} 
              volunteers={volunteers} 
              keys={keys}
              onSelectReport={(report) => setViewingReport(report)}
              onNewReport={handleOpenNewReport}
            />
          )}

          {activeTab === 'matrix' && (
            <AttendanceMatrixView 
              reports={reports} 
              volunteers={volunteers} 
              keys={keys}
              onSelectReport={(report) => setViewingReport(report)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportListView 
              reports={reports} 
              keys={keys}
              onNewReport={handleOpenNewReport}
              onEditReport={handleOpenEditReport}
              onViewReport={(report) => setViewingReport(report)}
              onDeleteReport={handleDeleteReport}
              onSaveReport={handleSaveReport}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'volunteers' && (
            <VolunteersManagerView 
              volunteers={volunteers} 
              onSaveVolunteer={handleSaveVolunteer}
              onDeleteVolunteer={handleDeleteVolunteer}
              currentUser={currentUser || undefined}
            />
          )}

          {activeTab === 'units' && (
            <UnitsManagerView 
              units={units} 
              onSaveUnit={handleSaveUnit}
              onDeleteUnit={handleDeleteUnit}
              currentUser={currentUser || undefined}
            />
          )}

          {activeTab === 'users' && currentUser?.permissions?.canManageUsers && (
            <UsersManagerView 
              volunteers={volunteers}
              currentUser={currentUser}
              onNotify={(type, title, message) => addToast({ type, title, message })}
            />
          )}

          {activeTab === 'companies' && isSuperAdmin && (
            <CompaniesManagerView
              companies={companies}
              activeCompanyId={activeCompanyId}
              onSelectCompany={handleSelectCompany}
              onSaveCompany={handleSaveCompany}
              onDeleteCompany={handleDeleteCompany}
              onToast={addToast}
            />
          )}
        </main>
      </div>

      {/* Report Creation / Edition Modal */}
      {isFormOpen && (
        <ReportFormModal 
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setEditingReport(null);
          }}
          onSave={handleSaveReport}
          editingReport={editingReport}
          volunteers={volunteers}
          units={units}
          keys={keys}
          nextFolioNumber={reports.length + 1}
          currentUser={currentUser}
        />
      )}

      {/* Report Detail Modal (with Official Print, PDF, and Digital Signatures) */}
      {viewingReport && (
        <ReportDetailModal 
          report={viewingReport}
          onClose={() => setViewingReport(null)}
          onEdit={handleOpenEditReport}
          volunteers={volunteers}
          currentUser={currentUser}
          onSign={(reportId, signatureData) => handleSignReport(reportId, signatureData, signatureData.targetStatus, signatureData.role === 'OBAC')}
          onSave={handleSaveReport}
        />
      )}

      {/* Branding & Crest Modal */}
      {isLogoManagerOpen && (
        <LogoManagerModal 
          isOpen={isLogoManagerOpen}
          onClose={() => setIsLogoManagerOpen(false)}
          branding={branding}
          onSaveBranding={handleSaveBranding}
        />
      )}

      {/* Floating Action Button for Emergency Report */}
      {currentUser && (
        <QuickAccessFAB 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNewReport={handleOpenNewReport}
          onExportExcel={() => exportMatrixToExcel(reports, volunteers, new Date().getFullYear())}
          onLogout={handleLogout}
          onOpenLogoManager={() => setIsLogoManagerOpen(true)}
          currentUser={currentUser}
        />
      )}

      {/* Back to top helper */}
      <ScrollToTopButton />

      {/* Floating System Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
