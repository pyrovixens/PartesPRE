import React, { useState, useMemo } from 'react';
import { Users, Plus, Edit, Trash2, Phone, Star, Award, Shield, Sparkles, Filter } from 'lucide-react';
import { Volunteer, VolunteerRank, VolunteerCategory } from '../types';

interface VolunteersManagerViewProps {
  volunteers: Volunteer[];
  onSaveVolunteer: (volunteer: Volunteer) => void;
  onDeleteVolunteer: (volunteerId: string) => void;
}

export const VolunteersManagerView: React.FC<VolunteersManagerViewProps> = ({
  volunteers,
  onSaveVolunteer,
  onDeleteVolunteer,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Form states
  const [rut, setRut] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [shortName, setShortName] = useState('');
  const [category, setCategory] = useState<VolunteerCategory>('Activo');
  const [rank, setRank] = useState<VolunteerRank>('Bombero Activo');
  const [status, setStatus] = useState<'Activo' | 'Honorario' | 'Insigne' | 'Licencia' | 'Suspendido'>('Activo');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const filteredList = useMemo(() => {
    return volunteers.filter(v => selectedCategory === 'ALL' || v.category === selectedCategory);
  }, [volunteers, selectedCategory]);

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

  const getCategoryIcon = (cat: VolunteerCategory) => {
    switch (cat) {
      case 'Fundador / Insigne': return <Star className="w-3.5 h-3.5 text-amber-500" />;
      case 'Honorario': return <Award className="w-3.5 h-3.5 text-purple-500" />;
      case 'Activo': return <Shield className="w-3.5 h-3.5 text-red-500" />;
      case 'Aspirante': return <Sparkles className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              Padrón Oficial de la 4ª Compañía
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {volunteers.length} integrantes registrados (Fundadores, Honorarios, Activos y Aspirantes)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="ALL">Todos los Escalafones ({volunteers.length})</option>
            <option value="Fundador / Insigne">Fundadores / Insignes</option>
            <option value="Honorario">Honorarios</option>
            <option value="Activo">Activos</option>
            <option value="Aspirante">Aspirantes</option>
          </select>

          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center space-x-1.5 bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition active:scale-95 border border-red-600/40"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </div>
      </div>

      {/* Volunteers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((v) => (
          <div 
            key={v.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      {v.registrationNumber}
                    </span>
                    <span className="text-[10px] font-bold flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      {getCategoryIcon(v.category)}
                      {v.category}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm mt-1.5">{v.fullName}</h3>
                  <p className="text-xs font-bold text-red-700 dark:text-red-400 mt-0.5">{v.rank}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  v.status === 'Activo' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                  v.status === 'Insigne' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                  v.status === 'Honorario' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                  'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {v.status}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <p>RUT: <span className="font-semibold text-slate-700 dark:text-slate-300">{v.rut}</span></p>
                {v.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{v.phone}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-2 flex items-center justify-end space-x-2 border-t border-slate-50 dark:border-slate-800">
              <button
                onClick={() => handleOpenEdit(v)}
                className="text-xs text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 font-semibold px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-slate-800 transition flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" /> Editar
              </button>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar del registro a ${v.fullName}?`)) {
                    onDeleteVolunteer(v.id);
                  }
                }}
                className="text-xs text-slate-400 hover:text-red-700 dark:hover:text-red-400 font-semibold px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingVolunteer ? 'Editar Voluntario' : 'Registrar Nuevo Voluntario'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Gabriel Bianchini Frost"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Escalafón / Grupo</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                  >
                    <option value="Activo">Bombero Activo</option>
                    <option value="Honorario">Bombero Honorario</option>
                    <option value="Fundador / Insigne">Fundador / Insigne</option>
                    <option value="Aspirante">Aspirante</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">N° de Registro</label>
                  <input
                    type="text"
                    required
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Cargo / Grado</label>
                  <select
                    value={rank}
                    onChange={(e) => setRank(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-semibold"
                  >
                    <option value="Director">Director</option>
                    <option value="Capitán">Capitán</option>
                    <option value="Teniente 1°">Teniente 1°</option>
                    <option value="Teniente 2°">Teniente 2°</option>
                    <option value="Teniente 3°">Teniente 3°</option>
                    <option value="Ayudante">Ayudante</option>
                    <option value="Tesorero">Tesorero</option>
                    <option value="Secretario">Secretario</option>
                    <option value="Maquinista General">Maquinista General</option>
                    <option value="Maquinista">Maquinista</option>
                    <option value="Bombero Insigne">Bombero Insigne</option>
                    <option value="Bombero Fundador">Bombero Fundador</option>
                    <option value="Bombero Honorario">Bombero Honorario</option>
                    <option value="Bombero Activo">Bombero Activo</option>
                    <option value="Aspirante">Aspirante</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Estado</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-semibold"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Insigne">Insigne</option>
                    <option value="Honorario">Honorario</option>
                    <option value="Licencia">Licencia</option>
                    <option value="Suspendido">Suspendido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">RUT</label>
                <input
                  type="text"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="12.345.678-9"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-red-700 hover:bg-red-800 text-white font-bold px-4 py-1.5 rounded-lg shadow transition"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
