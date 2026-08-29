import React, { useState } from 'react';
import { Truck, Plus, Edit, Activity, Gauge } from 'lucide-react';
import { Unit, AppUser } from '../types';

interface UnitsManagerViewProps {
  units: Unit[];
  onSaveUnit: (unit: Unit) => void;
  currentUser?: AppUser;
}

export const UnitsManagerView: React.FC<UnitsManagerViewProps> = ({
  units,
  onSaveUnit,
  currentUser,
}) => {
  const canManage = currentUser?.role === 'SUPER_ADMIN' || (currentUser?.permissions ? currentUser.permissions.canManageUnits : true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [type, setType] = useState<'Bomba' | 'Forestal' | 'Rescate' | 'Transporte' | 'Aljibe'>('Bomba');
  const [currentKm, setCurrentKm] = useState(0);
  const [currentPumpHours, setCurrentPumpHours] = useState(0);
  const [status, setStatus] = useState<'Operativo' | 'En Taller' | 'Fuera de Servicio'>('Operativo');

  const handleOpenAdd = () => {
    if (!canManage) return;
    setEditingUnit(null);
    setCode('B-4');
    setName('');
    setPlate('');
    setType('Bomba');
    setCurrentKm(0);
    setCurrentPumpHours(0);
    setStatus('Operativo');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: Unit) => {
    if (!canManage) return;
    setEditingUnit(u);
    setCode(u.code);
    setName(u.name);
    setPlate(u.plate);
    setType(u.type);
    setCurrentKm(u.currentKm);
    setCurrentPumpHours(u.currentPumpHours);
    setStatus(u.status);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !code.trim()) return;

    const unitToSave: Unit = {
      code: code.trim().toUpperCase(),
      name: name.trim() || `Unidad ${code}`,
      plate: plate.trim().toUpperCase(),
      type,
      currentKm,
      currentPumpHours,
      status,
    };

    onSaveUnit(unitToSave);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-xl flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              Material Mayor (Flota de Carros)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              4ª Compañía Calle Larga • {units.length} unidades registradas
            </p>
          </div>
        </div>

        {canManage && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center space-x-1.5 bg-red-700 hover:bg-red-800 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition active:scale-95 border border-red-600/40"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Unidad</span>
          </button>
        )}
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {units.map((u) => (
          <div 
            key={u.code}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4.5 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xl font-black text-red-700 dark:text-red-400 tracking-tight">
                    {u.code}
                  </span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{u.name}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  u.status === 'Operativo' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                  u.status === 'En Taller' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                  'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                }`}>
                  {u.status}
                </span>
              </div>

              <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{u.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Patente:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{u.plate || 'S/P'}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1 text-[11px]"><Gauge className="w-3 h-3 text-slate-400" /> Odómetro:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{u.currentKm.toLocaleString('es-CL')} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1 text-[11px]"><Activity className="w-3 h-3 text-slate-400" /> Horas Bomba:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{u.currentPumpHours} hrs</span>
                </div>
              </div>
            </div>

            {canManage && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => handleOpenEdit(u)}
                  className="text-xs text-blue-700 dark:text-blue-400 hover:text-blue-900 font-bold px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-slate-800 transition flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" /> Editar Unidad
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Add/Edit Unit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingUnit ? `Editar Unidad ${editingUnit.code}` : 'Registrar Nueva Unidad'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Código (Ej. B-4)</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="B-4, BX-4, R-4..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-black text-red-700 dark:text-red-400"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Patente</label>
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    placeholder="KJ-9082"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre / Modelo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bomba Urbana Mayor (Renault Camiva)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Vehículo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-semibold"
                  >
                    <option value="Bomba">Bomba</option>
                    <option value="Forestal">Forestal / Interfaz</option>
                    <option value="Rescate">Rescate</option>
                    <option value="Transporte">Transporte / Mando</option>
                    <option value="Aljibe">Aljibe</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Estado</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-semibold"
                  >
                    <option value="Operativo">Operativo</option>
                    <option value="En Taller">En Taller</option>
                    <option value="Fuera de Servicio">Fuera de Servicio</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kilometraje Actual</label>
                  <input
                    type="number"
                    value={currentKm}
                    onChange={(e) => setCurrentKm(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Horas Bomba Actuales</label>
                  <input
                    type="number"
                    step="0.1"
                    value={currentPumpHours}
                    onChange={(e) => setCurrentPumpHours(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold"
                  />
                </div>
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
