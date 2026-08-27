import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Star, 
  Award, 
  Shield, 
  Sparkles, 
  Search,
  CheckCircle2,
  Wrench,
  UserCheck,
  Zap,
  X
} from 'lucide-react';
import { Volunteer, VolunteerRank, VolunteerCategory } from '../types';

interface VolunteersManagerViewProps {
  volunteers: Volunteer[];
  onSaveVolunteer: (volunteer: Volunteer) => void;
  onDeleteVolunteer: (volunteerId: string) => void;
}

const ALL_RANKS: VolunteerRank[] = [
  'Director',
  'Capitán',
  'Teniente 1°',
  'Teniente 2°',
  'Teniente 3°',
  'Ayudante',
  'Tesorero',
  'Secretario',
  'Maquinista General',
  'Maquinista',
  'Bombero Activo',
  'Bombero Honorario',
  'Bombero Insigne',
  'Bombero Fundador',
  'Aspirante',
];

const ALL_CATEGORIES: VolunteerCategory[] = [
  'Fundador / Insigne',
  'Honorario',
  'Activo',
  'Aspirante',
];

export const VolunteersManagerView: React.FC<VolunteersManagerViewProps> = ({
  volunteers,
  onSaveVolunteer,
  onDeleteVolunteer,
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [quickFeedbackId, setQuickFeedbackId] = useState<string | null>(null);

  // Form states for full edit modal
  const [rut, setRut] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [shortName, setShortName] = useState('');
  const [category, setCategory] = useState<VolunteerCategory>('Activo');
  const [rank, setRank] = useState<VolunteerRank>('Bombero Activo');
  const [status, setStatus] = useState<'Activo' | 'Honorario' | 'Insigne' | 'Licencia' | 'Suspendido'>('Activo');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Summary counts
  const stats = useMemo(() => {
    const total = volunteers.length;
    const fundadores = volunteers.filter(v => v.category === 'Fundador / Insigne').length;
    const honorarios = volunteers.filter(v => v.category === 'Honorario').length;
    const activos = volunteers.filter(v => v.category === 'Activo').length;
    const aspirantes = volunteers.filter(v => v.category === 'Aspirante').length;
    const maquinistas = volunteers.filter(v => v.rank === 'Maquinista General' || v.rank === 'Maquinista').length;

    return { total, fundadores, honorarios, activos, aspirantes, maquinistas };
  }, [volunteers]);

  // Filtered List
  const filteredList = useMemo(() => {
    return volunteers.filter(v => {
      const matchCat = 
        selectedCategory === 'ALL' ? true :
        selectedCategory === 'MAQUINISTAS' ? (v.rank === 'Maquinista General' || v.rank === 'Maquinista') :
        v.category === selectedCategory;

      const q = search.toLowerCase();
      const matchQuery = 
        v.fullName.toLowerCase().includes(q) ||
        v.rut.toLowerCase().includes(q) ||
        v.registrationNumber.toLowerCase().includes(q) ||
        v.rank.toLowerCase().includes(q) ||
        (v.phone && v.phone.includes(q));

      return matchCat && matchQuery;
    });
  }, [volunteers, selectedCategory, search]);

  // Fast Inline Updates
  const handleQuickRankChange = (volunteer: Volunteer, newRank: VolunteerRank) => {
    let newCategory = volunteer.category;
    if (newRank === 'Aspirante') {
      newCategory = 'Aspirante';
    } else if (newRank === 'Bombero Honorario') {
      newCategory = 'Honorario';
    } else if (newRank === 'Bombero Insigne' || newRank === 'Bombero Fundador') {
      newCategory = 'Fundador / Insigne';
    } else if (volunteer.category === 'Aspirante') {
      newCategory = 'Activo';
    }

    const updated: Volunteer = {
      ...volunteer,
      rank: newRank,
      category: newCategory,
    };

    onSaveVolunteer(updated);
    setQuickFeedbackId(volunteer.id);
    setTimeout(() => setQuickFeedbackId(null), 1200);
  };

  const handleQuickCategoryChange = (volunteer: Volunteer, newCat: VolunteerCategory) => {
    let newRank = volunteer.rank;
    if (newCat === 'Aspirante') newRank = 'Aspirante';
    else if (newCat === 'Honorario' && volunteer.rank === 'Bombero Activo') newRank = 'Bombero Honorario';
    else if (newCat === 'Fundador / Insigne' && volunteer.rank === 'Bombero Activo') newRank = 'Bombero Insigne';
    else if (newCat === 'Activo' && (volunteer.rank === 'Aspirante' || volunteer.rank === 'Bombero Honorario' || volunteer.rank === 'Bombero Insigne')) {
      newRank = 'Bombero Activo';
    }

    const updated: Volunteer = {
      ...volunteer,
      category: newCat,
      rank: newRank,
    };

    onSaveVolunteer(updated);
    setQuickFeedbackId(volunteer.id);
    setTimeout(() => setQuickFeedbackId(null), 1200);
  };

  const handleQuickStatusChange = (volunteer: Volunteer, newStatus: any) => {
    const updated: Volunteer = {
      ...volunteer,
      status: newStatus,
    };

    onSaveVolunteer(updated);
    setQuickFeedbackId(volunteer.id);
    setTimeout(() => setQuickFeedbackId(null), 1200);
  };

  const handleOpenAdd = () => {
    setEditingVolunteer(null);
    setRut('');
    const nextNum = volunteers.length + 1;
    setRegistrationNumber(`VOL-${String(nextNum).padStart(3, '0')}`);
    setFullName('');
    setShortName('');
    setCategory('Activo');
    setRank('Bombero Activo');
    setStatus('Activo');
    setPhone('');
    setEmail('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Volunteer) => {
    setEditingVolunteer(v);
    setRut(v.rut);
    setRegistrationNumber(v.registrationNumber);
    setFullName(v.fullName);
    setShortName(v.shortName);
    setCategory(v.category || 'Activo');
    setRank(v.rank);
    setStatus(v.status);
    setPhone(v.phone || '');
    setEmail(v.email || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const volunteerToSave: Volunteer = {
      id: editingVolunteer ? editingVolunteer.id : `vol-${Date.now()}`,
      rut: rut.trim() || '11.111.111-1',
      registrationNumber: registrationNumber.trim(),
      fullName: fullName.trim(),
      shortName: shortName.trim() || fullName.trim().split(' ')[0],
      category,
      rank,
      status,
      phone: phone.trim(),
      email: email.trim(),
    };

    onSaveVolunteer(volunteerToSave);
    setIsModalOpen(false);
  };

  const getCategoryBadge = (cat: VolunteerCategory) => {
    switch (cat) {
      case 'Fundador / Insigne':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-lg text-[10px] border border-amber-300 dark:border-amber-800">
            <Star className="w-3 h-3 text-amber-500" />
            <span>Fundador</span>
          </span>
        );
      case 'Honorario':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 font-bold px-2 py-0.5 rounded-lg text-[10px] border border-purple-300 dark:border-purple-800">
            <Award className="w-3 h-3 text-purple-500" />
            <span>Honorario</span>
          </span>
        );
      case 'Aspirante':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-lg text-[10px] border border-blue-300 dark:border-blue-800">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>Aspirante</span>
          </span>
        );
      case 'Activo':
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/70 text-red-800 dark:text-red-300 font-bold px-2 py-0.5 rounded-lg text-[10px] border border-red-200 dark:border-red-800">
            <Shield className="w-3 h-3 text-red-500" />
            <span>Activo</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-700 text-white rounded-2xl flex items-center justify-center font-bold shadow-md">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>Padrón Oficial de Voluntarios</span>
              <span className="bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 text-xs font-black px-2 py-0.5 rounded-full">
                {volunteers.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Edición rápida en lista: cambia cargos, maquinistas o aspirantes en 1 clic
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-md transition active:scale-95 border border-red-500/50"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Voluntario</span>
        </button>
      </div>

      {/* Quick Filter Bar & Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`p-2.5 rounded-xl border text-left transition ${
            selectedCategory === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-red-700 dark:border-red-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
          }`}
        >
          <p className="text-[10px] font-bold uppercase opacity-80">Total</p>
          <p className="text-base font-black mt-0.5">{stats.total}</p>
        </button>

        <button
          onClick={() => setSelectedCategory('Activo')}
          className={`p-2.5 rounded-xl border text-left transition ${
            selectedCategory === 'Activo'
              ? 'bg-red-700 text-white border-red-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-red-400'
          }`}
        >
          <p className="text-[10px] font-bold uppercase opacity-80">Activos</p>
          <p className="text-base font-black text-red-600 dark:text-red-400 mt-0.5">{stats.activos}</p>
        </button>

        <button
          onClick={() => setSelectedCategory('MAQUINISTAS')}
          className={`p-2.5 rounded-xl border text-left transition ${
            selectedCategory === 'MAQUINISTAS'
              ? 'bg-blue-700 text-white border-blue-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400'
          }`}
        >
          <p className="text-[10px] font-bold uppercase opacity-80 flex items-center gap-1">
            <Wrench className="w-3 h-3" /> Maquinistas
          </p>
          <p className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">{stats.maquinistas}</p>
        </button>

        <button
          onClick={() => setSelectedCategory('Honorario')}
          className={`p-2.5 rounded-xl border text-left transition ${
            selectedCategory === 'Honorario'
              ? 'bg-purple-700 text-white border-purple-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-400'
          }`}
        >
          <p className="text-[10px] font-bold uppercase opacity-80">Honorarios</p>
          <p className="text-base font-black text-purple-600 dark:text-purple-400 mt-0.5">{stats.honorarios}</p>
        </button>

        <button
          onClick={() => setSelectedCategory('Fundador / Insigne')}
          className={`p-2.5 rounded-xl border text-left transition ${
            selectedCategory === 'Fundador / Insigne'
              ? 'bg-amber-700 text-white border-amber-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400'
          }`}
        >
          <p className="text-[10px] font-bold uppercase opacity-80">Insignes</p>
          <p className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">{stats.fundadores}</p>
        </button>

        <button
          onClick={() => setSelectedCategory('Aspirante')}
          className={`p-2.5 rounded-xl border text-left transition ${
            selectedCategory === 'Aspirante'
              ? 'bg-emerald-700 text-white border-emerald-600 shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
          }`}
        >
          <p className="text-[10px] font-bold uppercase opacity-80">Aspirantes</p>
          <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.aspirantes}</p>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-3 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar bombero por nombre, RUT, registro o cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-600"
          />
        </div>
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2 shrink-0">
          {filteredList.length} de {volunteers.length}
        </span>
      </div>

      {/* High-Efficiency Compact Table View */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Reg.</th>
                <th className="py-2.5 px-3">Nombre del Bombero</th>
                <th className="py-2.5 px-3">RUT</th>
                <th className="py-2.5 px-3">Escalafón</th>
                <th className="py-2.5 px-3">
                  <span className="flex items-center gap-1 text-red-700 dark:text-red-400">
                    <Zap className="w-3 h-3" /> Cargo / Rol Rápido
                  </span>
                </th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se encontraron voluntarios con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredList.map((v) => {
                  const isUpdatedJustNow = quickFeedbackId === v.id;

                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isUpdatedJustNow ? 'bg-emerald-50/70 dark:bg-emerald-950/40' : ''
                      }`}
                    >
                      {/* Registration */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {v.registrationNumber}
                        </span>
                      </td>

                      {/* Full Name */}
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                            {v.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 dark:text-white truncate max-w-[200px]">
                              {v.fullName}
                            </p>
                            {v.phone && (
                              <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" /> {v.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* RUT */}
                      <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {v.rut}
                      </td>

                      {/* Escalafón Dropdown */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <select
                          value={v.category}
                          onChange={(e) => handleQuickCategoryChange(v, e.target.value as VolunteerCategory)}
                          className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg px-2 py-1 focus:ring-1 focus:ring-red-600 focus:outline-none cursor-pointer"
                        >
                          {ALL_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </td>

                      {/* Fast Role / Rank Dropdown */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={v.rank}
                            onChange={(e) => handleQuickRankChange(v, e.target.value as VolunteerRank)}
                            className={`text-xs font-black rounded-lg px-2.5 py-1 border transition-all cursor-pointer focus:ring-2 focus:ring-red-600 focus:outline-none ${
                              v.rank.includes('Director') || v.rank.includes('Capitán') || v.rank.includes('Teniente')
                                ? 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-800'
                                : v.rank.includes('Maquinista')
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                                : v.rank === 'Aspirante'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <optgroup label="Oficialidad de Mando">
                              <option value="Director">Director</option>
                              <option value="Capitán">Capitán</option>
                              <option value="Teniente 1°">Teniente 1°</option>
                              <option value="Teniente 2°">Teniente 2°</option>
                              <option value="Teniente 3°">Teniente 3°</option>
                              <option value="Ayudante">Ayudante</option>
                              <option value="Tesorero">Tesorero</option>
                              <option value="Secretario">Secretario</option>
                            </optgroup>
                            <optgroup label="Material Mayor">
                              <option value="Maquinista General">Maquinista General</option>
                              <option value="Maquinista">Maquinista</option>
                            </optgroup>
                            <optgroup label="Escalafón General">
                              <option value="Bombero Activo">Bombero Activo</option>
                              <option value="Bombero Honorario">Bombero Honorario</option>
                              <option value="Bombero Insigne">Bombero Insigne</option>
                              <option value="Bombero Fundador">Bombero Fundador</option>
                              <option value="Aspirante">Aspirante</option>
                            </optgroup>
                          </select>

                          {isUpdatedJustNow && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in zoom-in shrink-0" />
                          )}
                        </div>
                      </td>

                      {/* Fast Status Dropdown */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <select
                          value={v.status}
                          onChange={(e) => handleQuickStatusChange(v, e.target.value)}
                          className={`text-[11px] font-bold rounded-lg px-2 py-1 border cursor-pointer focus:outline-none ${
                            v.status === 'Activo'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : v.status === 'Honorario' || v.status === 'Insigne'
                              ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          <option value="Activo">Activo</option>
                          <option value="Honorario">Honorario</option>
                          <option value="Insigne">Insigne</option>
                          <option value="Licencia">Licencia</option>
                          <option value="Suspendido">Suspendido</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Editar ficha completa"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar a ${v.fullName} del padrón?`)) {
                                onDeleteVolunteer(v.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-900 dark:bg-slate-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-red-800/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 bg-red-700 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {editingVolunteer ? `Editar Ficha: ${editingVolunteer.fullName}` : 'Registrar Nuevo Voluntario'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Padrón Oficial 4ª Cía. Calle Larga</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">N° Registro</label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold"
                    placeholder="ACT-033"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">RUT</label>
                  <input
                    type="text"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold"
                    placeholder="12.345.678-9"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                  placeholder="Ej. Juan Pérez González"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Escalafón / Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VolunteerCategory)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                  >
                    {ALL_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cargo / Rol</label>
                  <select
                    value={rank}
                    onChange={(e) => setRank(e.target.value as VolunteerRank)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                  >
                    {ALL_RANKS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Estado</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 font-bold"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Honorario">Honorario</option>
                    <option value="Insigne">Insigne</option>
                    <option value="Licencia">Licencia</option>
                    <option value="Suspendido">Suspendido</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-red-700 hover:bg-red-800 text-white font-black px-4 py-2 rounded-xl shadow-md transition active:scale-95"
                >
                  Guardar Ficha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
