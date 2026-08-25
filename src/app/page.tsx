'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header';
import { DashboardView } from '../components/DashboardView';
import { AttendanceMatrixView } from '../components/AttendanceMatrixView';
import { ReportListView } from '../components/ReportListView';
import { VolunteersManagerView } from '../components/VolunteersManagerView';
import { UnitsManagerView } from '../components/UnitsManagerView';
import { ReportFormModal } from '../components/ReportFormModal';
import { ReportDetailModal } from '../components/ReportDetailModal';
import { BackupModal } from '../components/BackupModal';
import { AuthModal } from '../components/AuthModal';

import { EmergencyReport, Volunteer, Unit, EmergencyKey, UserProfile } from '../types';
import { 
  fetchReports, 
  saveReportToDatabase, 
  deleteReportFromDatabase,
  fetchVolunteers,
  saveVolunteerToDatabase,
  deleteVolunteerFromDatabase,
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

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Core Data States
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [keys, setKeys] = useState<EmergencyKey[]>([]);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingReport, setEditingReport] = useState<EmergencyReport | null>(null);
  const [viewingReport, setViewingReport] = useState<EmergencyReport | null>(null);
  const [isBackupOpen, setIsBackupOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('bomberos_theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const savedUser = localStorage.getItem('bomberos_current_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {}
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('bomberos_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('bomberos_theme', 'light');
      }
      return next;
    });
  };

  // Load Data
  const loadAllData = useCallback(async () => {
    const [fetchedReports, fetchedVolunteers] = await Promise.all([
      fetchReports(),
      fetchVolunteers(),
    ]);

    setReports(fetchedReports);
    setVolunteers(fetchedVolunteers);
    setUnits(getStoredUnits());
    setKeys(getStoredKeys());
  }, []);

  useEffect(() => {
    loadAllData();

    // Subscribe to Realtime cloud sync
    const unsubscribe = subscribeToRealtimeChanges(
      () => {
        fetchReports().then(setReports);
      },
      () => {
        fetchVolunteers().then(setVolunteers);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [loadAllData]);

  // Handlers for Reports
  const handleOpenNewReport = () => {
    setEditingReport(null);
    setIsFormOpen(true);
  };

  const handleOpenEditReport = (report: EmergencyReport) => {
    setEditingReport(report);
    setIsFormOpen(true);
  };

  const handleSaveReport = async (reportToSave: EmergencyReport) => {
    await saveReportToDatabase(reportToSave);
    const updated = await fetchReports();
    setReports(updated);
    setIsFormOpen(false);
    setEditingReport(null);
  };

  const handleDeleteReport = async (reportId: string) => {
    await deleteReportFromDatabase(reportId);
    const updated = await fetchReports();
    setReports(updated);
    if (viewingReport?.id === reportId) {
      setViewingReport(null);
    }
  };

  // Handlers for Volunteers
  const handleSaveVolunteer = async (vol: Volunteer) => {
    await saveVolunteerToDatabase(vol);
    const updated = await fetchVolunteers();
    setVolunteers(updated);
  };

  const handleDeleteVolunteer = async (volId: string) => {
    await deleteVolunteerFromDatabase(volId);
    const updated = await fetchVolunteers();
    setVolunteers(updated);
  };

  // Handlers for Units
  const handleSaveUnit = (unit: Unit) => {
    const cur = getStoredUnits();
    const exists = cur.some(u => u.code === unit.code);
    const updated = exists ? cur.map(u => u.code === unit.code ? unit : u) : [...cur, unit];
    saveUnits(updated);
    setUnits(updated);
  };

  // Next Folio calculation
  const nextFolioNumber = reports.length > 0
    ? Math.max(...reports.map(r => r.folioNumber || 0)) + 1
    : 1;

  // Handle Login / Logout
  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('bomberos_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('bomberos_current_user');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewReport={handleOpenNewReport}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        reports={reports}
        volunteers={volunteers}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        currentUser={currentUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
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
          />
        )}

        {activeTab === 'volunteers' && (
          <VolunteersManagerView
            volunteers={volunteers}
            onSaveVolunteer={handleSaveVolunteer}
            onDeleteVolunteer={handleDeleteVolunteer}
          />
        )}

        {activeTab === 'units' && (
          <UnitsManagerView
            units={units}
            onSaveUnit={handleSaveUnit}
          />
        )}
      </main>

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
      />

      <ReportDetailModal
        report={viewingReport}
        onClose={() => setViewingReport(null)}
        onEdit={(rep) => {
          setViewingReport(null);
          handleOpenEditReport(rep);
        }}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onDataReload={loadAllData}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        volunteers={volunteers}
      />
    </div>
  );
}
