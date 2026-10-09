import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Shield, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Search,
  AlertTriangle,
  Mail
} from 'lucide-react';
import { Company, DEFAULT_COMPANY_ID, SUPER_ADMIN_MASTER_EMAIL } from '../types';

interface CompaniesManagerViewProps {
  companies: Company[];
  activeCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  onSaveCompany: (company: Company) => Promise<void>;
  onDeleteCompany: (companyId: string) => Promise<void>;
  onToast: (toast: { type: 'success' | 'info' | 'warning' | 'error'; title: string; message: string }) => void;
}

export const CompaniesManagerView: React.FC<CompaniesManagerViewProps> = ({
  companies,
  activeCompanyId,
  onSelectCompany,
  onSaveCompany,
  onDeleteCompany,
  onToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Company>>({
    id: '',
    code: '',
    name: '',
    fireDepartment: 'Cuerpo de Bomberos de Los Andes',
    motto: 'Honor, Disciplina y Abnegación',
    logoUrl: '/logo_4ta_calle_larga.png',
    primaryColor: '#8B0000',
    accentColor: '#DC2626',
    isActive: true,
    adminEmail: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.fireDepartment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenNewModal = () => {
    setEditingCompany(null);
    setFormData({
      id: `cia-${Date.now().toString(36)}`,
      code: 'CIA',
      name: '',
      fireDepartment: 'Cuerpo de Bomberos de Los Andes',
      motto: 'Honor, Disciplina y Abnegación',
      logoUrl: '/logo_4ta_calle_larga.png',
      primaryColor: '#8B0000',
      accentColor: '#DC2626',
      isActive: true,
      adminEmail: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (company: Company) => {
    setEditingCompany(company);
    setFormData({ ...company });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.code?.trim()) {
      onToast({
        type: 'warning',
        title: 'Campos requeridos',
        message: 'Por favor ingresa el nombre y código institucional de la compañía.',
      });
      return;
    }

    setIsSaving(true);
    try {
      const companyId = editingCompany ? editingCompany.id : (formData.id || `cia-${formData.code?.toLowerCase().replace(/\s+/g, '')}`);
      const companyToSave: Company = {
        id: companyId,
        code: formData.code?.trim().toUpperCase() || 'CIA',
        name: formData.name?.trim() || '',
        fireDepartment: formData.fireDepartment?.trim() || 'Cuerpo de Bomberos',
        motto: formData.motto?.trim() || 'Honor, Disciplina y Abnegación',
        logoUrl: formData.logoUrl?.trim() || '/logo_4ta_calle_larga.png',
        primaryColor: formData.primaryColor || '#8B0000',
        accentColor: formData.accentColor || '#DC2626',
        isActive: formData.isActive !== false,
        adminEmail: formData.adminEmail?.trim().toLowerCase() || undefined,
        createdAt: editingCompany?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveCompany(companyToSave);
      setIsModalOpen(false);
      onToast({
        type: 'success',
        title: editingCompany ? 'Compañía Actualizada' : 'Compañía Creada',
        message: `El entorno de "${companyToSave.name}" ha sido guardado exitosamente.`,
      });
    } catch (err: any) {
      onToast({
        type: 'error',
        title: 'Error al guardar',
        message: err?.message || 'No se pudo guardar la compañía.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;
    if (companyToDelete.id === DEFAULT_COMPANY_ID) {
      onToast({
        type: 'error',
        title: 'Acción no permitida',
        message: 'No se puede eliminar la Compañía principal matriz.',
      });
      setCompanyToDelete(null);
      return;
    }

    try {
      await onDeleteCompany(companyToDelete.id);
      onToast({
        type: 'info',
        title: 'Compañía Eliminada',
        message: `Se ha eliminado la compañía "${companyToDelete.name}".`,
      });
    } catch (err: any) {
      onToast({
        type: 'error',
        title: 'Error',
        message: err?.message || 'No se pudo eliminar la compañía.',
      });
    } finally {
      setCompanyToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 border border-red-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-red-700/90 text-amber-300 text-xs font-black px-3 py-1 rounded-full border border-red-500/50 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Shield className="w-3.5 h-3.5" />
                Super Administrador Central ({SUPER_ADMIN_MASTER_EMAIL})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Building2 className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />
              Gestión Multi-Compañías de Bomberos
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl font-medium leading-relaxed">
              Administración centralizada de entornos, bases de datos aisladas, cuarteles y configuración institucional para cada Compañía de Bomberos.
            </p>
          </div>

          <button
            onClick={handleOpenNewModal}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700 text-white text-xs sm:text-sm font-black px-5 py-3 rounded-2xl shadow-xl transition-all transform active:scale-95 border border-red-500/60"
          >
            <Plus className="w-5 h-5" />
            <span>Crear Nueva Compañía</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Compañías</p>
            <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{companies.length}</p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compañías Activas</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
              {companies.filter(c => c.isActive !== false).length}
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Entorno Seleccionado</p>
            <p className="text-xs sm:text-sm font-black text-amber-400 mt-1 truncate">
              {activeCompanyId === 'ALL' ? '🌐 Todas (Modo Global)' : (companies.find(c => c.id === activeCompanyId)?.code || 'Calle Larga')}
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuerpos de Bomberos</p>
            <p className="text-xl sm:text-2xl font-black text-blue-400 mt-0.5">
              {new Set(companies.map(c => c.fireDepartment)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, código o cuerpo..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-600 font-medium"
          />
        </div>

        {/* Global Switcher for Super Admin */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onSelectCompany('ALL')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold border transition ${
              activeCompanyId === 'ALL'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-md'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <span>🌐 Ver Todo el Sistema (Multi-Cía)</span>
          </button>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCompanies.map((company) => {
          const isCurrentActive = activeCompanyId === company.id;
          const isMaster = company.id === DEFAULT_COMPANY_ID;

          return (
            <div
              key={company.id}
              className={`bg-slate-900/90 dark:bg-slate-900/90 rounded-3xl border transition-all p-5 flex flex-col justify-between relative group ${
                isCurrentActive
                  ? 'border-red-600 shadow-2xl ring-2 ring-red-600/30'
                  : 'border-slate-800 hover:border-slate-700 shadow-lg'
              }`}
            >
              {/* Badges top right */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="bg-red-800/60 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-red-700/60 uppercase tracking-wider">
                  {company.code}
                </span>

                <div className="flex items-center gap-1.5">
                  {isMaster && (
                    <span className="bg-amber-950/80 text-amber-400 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-amber-700/60">
                      Matriz Predeterminada
                    </span>
                  )}
                  {company.isActive !== false ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> Activa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-950/60 border border-red-800/60 px-2 py-0.5 rounded-full">
                      <XCircle className="w-3 h-3" /> Inactiva
                    </span>
                  )}
                </div>
              </div>

              {/* Crest and Info */}
              <div className="flex items-start space-x-3.5 mb-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={company.logoUrl || '/logo_4ta_calle_larga.png'}
                    alt={company.name}
                    className="w-14 h-14 object-contain rounded-2xl bg-slate-950/80 p-1.5 border border-slate-800 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo_4ta_calle_larga.png';
                    }}
                  />
                  <div 
                    className="w-3.5 h-3.5 rounded-full absolute -bottom-1 -right-1 border-2 border-slate-900 shadow-sm"
                    style={{ backgroundColor: company.primaryColor || '#8B0000' }}
                    title="Color institucional"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-white truncate group-hover:text-amber-400 transition">
                    {company.name}
                  </h3>
                  <p className="text-[11px] font-bold text-red-400 truncate">
                    {company.fireDepartment}
                  </p>
                  <p className="text-[10px] text-slate-400 italic mt-1 line-clamp-2">
                    "{company.motto || 'Honor, Disciplina y Abnegación'}"
                  </p>
                </div>
              </div>

              {/* Admin Email details if configured */}
              {company.adminEmail && (
                <div className="mb-4 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2 flex items-center gap-2 text-[10px] text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Admin: <strong className="text-white">{company.adminEmail}</strong></span>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
                <button
                  onClick={() => onSelectCompany(company.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition active:scale-95 ${
                    isCurrentActive
                      ? 'bg-red-700 text-white shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isCurrentActive ? 'Entorno Activo' : 'Ingresar'}</span>
                </button>

                <button
                  onClick={() => handleOpenEditModal(company)}
                  className="p-2 text-slate-400 hover:text-amber-400 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition"
                  title="Editar Configuración Institucional"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {!isMaster && (
                  <button
                    onClick={() => setCompanyToDelete(company)}
                    className="p-2 text-slate-400 hover:text-red-400 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/60 transition"
                    title="Eliminar Compañía"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Create / Edit Company */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-6 h-6 text-amber-400" />
                <div>
                  <h2 className="text-base font-black text-white">
                    {editingCompany ? 'Editar Compañía de Bomberos' : 'Crear Nueva Compañía de Bomberos'}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Configura el entorno independiente para esta unidad institucional.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">
                    Nombre Oficial de la Compañía: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder='ej. 1ª Compañía "Bomba Central"'
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Código: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. 1CIA"
                    value={formData.code || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold uppercase focus:ring-2 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Cuerpo de Bomberos: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Cuerpo de Bomberos de Los Andes"
                  value={formData.fireDepartment || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, fireDepartment: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Lema Institucional:
                </label>
                <input
                  type="text"
                  placeholder="ej. Honor, Disciplina y Abnegación"
                  value={formData.motto || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, motto: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  URL del Escudo / Logo Oficial:
                </label>
                <input
                  type="text"
                  placeholder="ej. /logo_4ta_calle_larga.png o URL https://"
                  value={formData.logoUrl || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Color Primario:
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5">
                    <input
                      type="color"
                      value={formData.primaryColor || '#8B0000'}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <span className="text-[11px] font-mono text-slate-300">{formData.primaryColor || '#8B0000'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Color Secundario / Acento:
                  </label>
                  <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5">
                    <input
                      type="color"
                      value={formData.accentColor || '#DC2626'}
                      onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="w-6 h-6 rounded border-0 cursor-pointer bg-transparent"
                    />
                    <span className="text-[11px] font-mono text-slate-300">{formData.accentColor || '#DC2626'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Correo Electrónico del Administrador Inicial (Opcional):
                </label>
                <input
                  type="email"
                  placeholder="ej. capitan@primeracbla.cl"
                  value={formData.adminEmail || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-medium focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActiveCompany"
                  checked={formData.isActive !== false}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-slate-950 border-slate-700"
                />
                <label htmlFor="isActiveCompany" className="text-slate-300 font-bold text-xs cursor-pointer">
                  Compañía Habilitada y Operativa en el Sistema
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 text-white font-black rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : editingCompany ? 'Guardar Cambios' : 'Crear Compañía'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {companyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-red-900/60 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <h3 className="text-base font-black text-white">¿Confirmar Eliminación?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Estás a punto de eliminar la compañía <strong>"{companyToDelete.name}"</strong> ({companyToDelete.code}). Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setCompanyToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-black rounded-xl text-xs shadow-lg transition"
              >
                Sí, Eliminar Compañía
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
