'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { DashboardView } from '../components/DashboardView';
import { AttendanceMatrixView } from '../components/AttendanceMatrixView';
import { ReportListView } from '../components/ReportListView';
import { VolunteersManagerView } from '../components/VolunteersManagerView';
import { UnitsManagerView } from '../components/UnitsManagerView';
import { UsersManagerView } from '../components/UsersManagerView';
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
  ToastNotification 
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
import { getActiveSession, clearActiveSession, saveAppUser } from '../services/authService';

const DEFAULT_BRANDING: CompanyBranding = {
  companyName: '4ª COMPAÑÍA "CALLE LARGA"',
  fireDepartment: 'Cuerpo de Bomberos de Los Andes',
  motto: 'Unión, Lealtad y Servicio • Fundada el 21 de Agosto de 1985',
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
  Plus 
} from 'lucide-react';

const VALID_TABS = ['dashboard', 'matrix', 'reports', 'volunteers', 'units', 'users'];

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

  // Core Data States (Pre-loaded with official data)
  const [reports, setReports] = useState<EmergencyReport[]>(INITIAL_REPORTS);
  const [volunteers, setVolunteers] = useState<Volunteer[]>(INITIAL_VOLUNTEERS);
  const [units, setUnits] = useState<Unit[]>(INITIAL_UNITS);
  const [keys, setKeys] = useState<EmergencyKey[]>(EMERGENCY_KEYS);

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

  // Load Data function
  const loadAllData = useCallback(async () => {
    try {
      const [fetchedReports, fetchedVolunteers, fetchedUnits] = await Promise.all([
        fetchReports(),
        fetchVolunteers(),
        fetchUnits(),
      ]);

      setReports(fetchedReports !== null ? fetchedReports : getStoredReports());
      setVolunteers(fetchedVolunteers && fetchedVolunteers.length > 0 ? fetchedVolunteers : getStoredVolunteers());
      setUnits(fetchedUnits !== null ? fetchedUnits : getStoredUnits());
      setKeys(getStoredKeys());
    } catch (e) {
      console.warn('Fallback to initial static data:', e);
      setReports(getStoredReports());
      setVolunteers(getStoredVolunteers());
      setUnits(getStoredUnits());
      setKeys(getStoredKeys());
    }
  }, []);

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
  }, [loadAllData]);

  // Realtime cloud & local sync subscription
  useEffect(() => {
    if (currentUser) {
      const unsubscribe = subscribeToRealtimeChanges(
        () => {
          fetchReports().then(reps => {
            if (Array.isArray(reps)) setReports(reps);
          });
        },
        () => {
          fetchVolunteers().then(vols => {
            if (Array.isArray(vols)) setVolunteers(vols);
          });
        },
        () => {
          fetchUnits().then(u => {
            if (Array.isArray(u)) setUnits(u);
          });
        },
        () => {
          fetchBranding().then(b => {
            if (b) setBranding(b);
          });
        }
      );

      return () => {
        unsubscribe();
      };
    }
  }, [currentUser]);

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

    // Optimistic UI update with strict deduplication
    setReports(prev => {
      const key = `${reportToSave.folioYear}-${reportToSave.correlativoCompania || reportToSave.fullFolio}`;
      const filtered = prev.filter(r => 
        r.id !== reportToSave.id && 
        `${r.folioYear}-${r.correlativoCompania || r.fullFolio}` !== key
      );
      return [reportToSave, ...filtered];
    });

    const isDraft = reportToSave.status === 'BORRADOR';
    addToast({
      type: isDraft ? 'info' : 'success',
      title: isDraft ? 'Borrador Guardado' : 'Parte Ingresado',
      message: isDraft 
        ? `Borrador del Parte #${reportToSave.correlativoCompania || reportToSave.fullFolio} guardado exitosamente.`
        : `Parte #${reportToSave.correlativoCompania || reportToSave.fullFolio} ingresado exitosamente.`,
      duration: 2500,
    });

    // Persist to central database & server
    await saveReportToDatabase(reportToSave);
    const updated = await fetchReports();
    if (Array.isArray(updated)) {
      setReports(updated);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!currentUser?.permissions?.canDeleteReports) {
      addToast({
        type: 'error',
        title: 'Permiso Denegado',
        message: 'Solo el Mando (Super Admin / Admin) puede eliminar partes.',
      });
      return;
    }
    // Optimistic immediate removal from UI
    setReports(prev => prev.filter(r => r.id !== reportId));
    if (viewingReport?.id === reportId) {
      setViewingReport(null);
    }
    await deleteReportFromDatabase(reportId);
    const updated = await fetchReports();
    if (Array.isArray(updated)) {
      setReports(updated);
    }
    addToast({
      type: 'warning',
      title: 'Parte Eliminado',
      message: 'El parte ha sido retirado del libro de registro.',
      duration: 2500,
    });
  };

  const handleSignReport = async (reportId: string, signatureData: {
    signedBy: string;
    signedByRank: string;
    signedAt: string;
    signatureDataUrl?: string;
    verificationCode: string;
  }) => {
    const target = reports.find(r => r.id === reportId);
    if (!target) return;

    const signedReport: EmergencyReport = {
      ...target,
      status: 'APROBADO',
      approvedBy: signatureData.signedBy,
      approvedAt: signatureData.signedAt,
      captainName: signatureData.signedBy,
      captainRank: signatureData.signedByRank,
      digitalSignature: signatureData,
      updatedAt: new Date().toISOString(),
    };

    await saveReportToDatabase(signedReport);
    const updated = await fetchReports();
    if (Array.isArray(updated)) {
      setReports(updated);
    }

    const freshSigned = (Array.isArray(updated) && updated.find(r => r.id === reportId)) || signedReport;
    setViewingReport(freshSigned);

    addToast({
      type: 'success',
      title: 'Parte Firmado Digitalmente',
      message: `V°B° oficial estampado por ${signatureData.signedBy} (${signatureData.signedByRank}).`,
      duration: 3000,
    });
  };

  // Handlers for Volunteers
  const handleSaveVolunteer = async (vol: Volunteer) => {
    if (!currentUser?.permissions?.canManageVolunteers) {
      addToast({
        type: 'warning',
        title: 'Permiso Denegado',
        message: 'No tienes permisos para modificar el padrón de la compañía.',
      });
      return;
    }
    await saveVolunteerToDatabase(vol);
    const updated = await fetchVolunteers();
    if (Array.isArray(updated)) {
      setVolunteers(updated);
    }
    addToast({
      type: 'success',
      title: 'Padrón Actualizado',
      message: `Datos del voluntario ${vol.fullName} guardados con éxito.`,
      duration: 2500,
    });
  };

  const handleDeleteVolunteer = async (volId: string) => {
    if (!currentUser?.permissions?.canManageVolunteers) {
      addToast({
        type: 'warning',
        title: 'Permiso Denegado',
        message: 'Solo los administradores pueden remover voluntarios del padrón.',
      });
      return;
    }
    setVolunteers(prev => prev.filter(v => v.id !== volId));
    await deleteVolunteerFromDatabase(volId);
    const updated = await fetchVolunteers();
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
        message: 'Solo los administradores o maquinistas pueden modificar el material mayor.',
      });
      return;
    }
    await saveUnitToDatabase(unit);
    const updated = await fetchUnits();
    if (Array.isArray(updated)) {
      setUnits(updated);
    }
    addToast({
      type: 'success',
      title: 'Material Mayor Actualizado',
      message: `Unidad ${unit.code} guardada en la base de datos oficial.`,
      duration: 2500,
    });
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!currentUser?.permissions?.canManageUnits) {
      addToast({
        type: 'warning',
        title: 'Permiso Denegado',
        message: 'Solo los administradores pueden dar de baja unidades.',
      });
      return;
    }
    setUnits(prev => prev.filter(u => u.code !== unitId));
    await deleteUnitFromDatabase(unitId);
    const updated = await fetchUnits();
    if (Array.isArray(updated)) {
      setUnits(updated);
    }
    addToast({
      type: 'warning',
      title: 'Unidad Removida',
      message: 'La unidad ha sido retirada del inventario.',
      duration: 2500,
    });
  };

  // Save Custom Branding
  const handleSaveBranding = async (newBranding: CompanyBranding) => {
    setBranding(newBranding);
    await saveBrandingToDatabase(newBranding);
    addToast({
      type: 'success',
      title: 'Escudo & Marca Actualizados',
      message: 'Se ha guardado la nueva personalización visual de la Compañía.',
    });
  };

  // Handle Login & Logout
  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    addToast({
      type: 'success',
      title: 'Sesión Oficial Iniciada',
      message: `Bienvenido Oficial ${user.fullName} (${user.rank}).`,
    });
  };

  const handleLogout = () => {
    clearActiveSession();
    setCurrentUser(null);
    setActiveTab('dashboard');
    addToast({
      type: 'info',
      title: 'Sesión Finalizada',
      message: 'Has salido del sistema de forma segura.',
    });
  };

  const handleExportExcel = () => {
    if (!currentUser?.permissions?.canExportReports) return;
    exportMatrixToExcel(reports, volunteers, new Date().getFullYear());
    addToast({
      type: 'success',
      title: 'Planilla Descargada',
      message: 'El archivo Excel de asistencias ha sido generado con éxito.',
    });
  };

  // Next Folio calculation
  const nextFolioNumber = reports.length > 0
    ? Math.max(...reports.map(r => r.folioNumber || 0)) + 1
    : 1;

  // 🔒 LOGIN GATE: If not logged in, render LoginScreen only!
  if (!isSessionLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} branding={branding} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 pb-16 sm:pb-0">
      {/* Top Header Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewReport={handleOpenNewReport}
        onLogout={handleLogout}
        onOpenLogoManager={() => setIsLogoManagerOpen(true)}
        reports={reports}
        volunteers={volunteers}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        currentUser={currentUser}
        branding={branding}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-5 pb-24 sm:pb-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            reports={reports}
            volunteers={volunteers}
            keys={keys}
            onSelectReport={(rep) => setViewingReport(rep)}
            onNewReport={handleOpenNewReport}
          />
        )}

        {activeTab === 'matrix' && (
          <AttendanceMatrixView
            reports={reports}
            volunteers={volunteers}
            onSelectReport={(rep) => setViewingReport(rep)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportListView
            reports={reports}
            keys={keys}
            onNewReport={handleOpenNewReport}
            onEditReport={handleOpenEditReport}
            onViewReport={(rep) => setViewingReport(rep)}
            onDeleteReport={handleDeleteReport}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'volunteers' && (
          <VolunteersManagerView
            volunteers={volunteers}
            onSaveVolunteer={handleSaveVolunteer}
            onDeleteVolunteer={handleDeleteVolunteer}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'units' && (
          <UnitsManagerView
            units={units}
            onSaveUnit={handleSaveUnit}
            onDeleteUnit={handleDeleteUnit}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'users' && currentUser.role === 'SUPER_ADMIN' && (
          <UsersManagerView
            currentUser={currentUser}
            volunteers={volunteers}
            onNotify={(type, title, message) => addToast({ type, title, message })}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Persistent & Perfectly Centered + Button) */}
      <nav aria-label="Navegación Móvil" className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 py-1 px-1 flex items-center justify-between shadow-2xl safe-bottom">
        {/* 1. Métricas */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all ${
            activeTab === 'dashboard' ? 'text-red-500 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flame className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] truncate">Métricas</span>
        </button>

        {/* 2. Matriz */}
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all ${
            activeTab === 'matrix' ? 'text-red-500 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Table2 className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] truncate">Matriz</span>
        </button>

        {/* 3. Partes */}
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all ${
            activeTab === 'reports' ? 'text-red-500 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] truncate">Partes</span>
        </button>

        {/* CENTER '+' BUTTON */}
        {currentUser.permissions?.canCreateReports && (
          <div className="flex items-center justify-center -mt-5 shrink-0 px-1 z-10">
            <button
              onClick={handleOpenNewReport}
              className="w-12 h-12 bg-gradient-to-tr from-red-700 to-red-500 hover:from-red-800 text-white rounded-full flex items-center justify-center shadow-2xl border-2 border-slate-900 active:scale-95 transition"
              title="Crear Nuevo Parte"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* 4. Padrón */}
        <button
          onClick={() => setActiveTab('volunteers')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all ${
            activeTab === 'volunteers' ? 'text-red-500 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] truncate">Padrón</span>
        </button>

        {/* 5. Carros */}
        <button
          onClick={() => setActiveTab('units')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all ${
            activeTab === 'units' ? 'text-red-500 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] truncate">Carros</span>
        </button>

        {/* 6. Usuarios (o espacio simétrico) */}
        {currentUser.role === 'SUPER_ADMIN' ? (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all ${
              activeTab === 'users' ? 'text-amber-400 scale-105 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] truncate">Usuarios</span>
          </button>
        ) : null}
      </nav>

      {/* Quick Access Floating Action Button */}
      <QuickAccessFAB
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewReport={handleOpenNewReport}
        onExportExcel={handleExportExcel}
        onLogout={handleLogout}
        onOpenLogoManager={() => setIsLogoManagerOpen(true)}
        currentUser={currentUser}
      />

      {/* Dynamic Toast Feedback Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Floating Scroll To Top Action */}
      <ScrollToTopButton />

      {/* Modals */}
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
        nextFolioNumber={nextFolioNumber}
        currentUser={currentUser}
      />

      <ReportDetailModal
        report={viewingReport}
        onClose={() => setViewingReport(null)}
        onEdit={(rep) => {
          setViewingReport(null);
          handleOpenEditReport(rep);
        }}
        volunteers={volunteers}
        currentUser={currentUser}
        onSign={handleSignReport}
      />

      <LogoManagerModal
        isOpen={isLogoManagerOpen}
        onClose={() => setIsLogoManagerOpen(false)}
        branding={branding}
        onSaveBranding={handleSaveBranding}
      />
    </div>
  );
}
