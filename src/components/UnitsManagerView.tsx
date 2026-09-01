import React, { useState } from 'react';
import { Truck, Plus, Edit, Trash2, Activity, Gauge } from 'lucide-react';
import { Unit, AppUser } from '../types';

export const FIRE_ENGINE_BRANDS = [
  'Renault / Camiva',
  'Mercedes-Benz / Magirus',
  'Iveco / Magirus',
  'MAN / Ziegler',
  'Scania',
  'Freightliner',
  'Spartan',
  'Pierce',
  'Rosenbauer',
  'E-ONE',
  'International / Navistar',
  'Ford',
  'Chevrolet / GMC',
  'Toyota',
  'Isuzu',
  'Mitsubishi Fuso',
  'Hino',
  'Otro / Personalizado',
];

interface UnitsManagerViewProps {
  units: Unit[];
  onSaveUnit: (unit: Unit) => void;
  onDeleteUnit?: (unitCode: string) => void;
  currentUser?: AppUser;
}

export const UnitsManagerView: React.FC<UnitsManagerViewProps> = ({
  units,
  onSaveUnit,
  onDeleteUnit,
  currentUser,
}) => {
  const canManage = currentUser?.role === 'SUPER_ADMIN' || (currentUser?.permissions ? currentUser.permissions.canManageUnits : true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('Renault / Camiva');
  const [customBrand, setCustomBrand] = useState('');
  const [model, setModel] = useState('');
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
    setBrand('Renault / Camiva');
    setCustomBrand('');
    setModel('');
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
    
    if (u.brand && FIRE_ENGINE_BRANDS.includes(u.brand)) {
      setBrand(u.brand);
      setCustomBrand('');
    } else if (u.brand) {
      setBrand('Otro / Personalizado');
      setCustomBrand(u.brand);
    } else {
      setBrand('Renault / Camiva');
      setCustomBrand('');
    }

    setModel(u.model || '');
    setType(u.type);
    setCurrentKm(u.currentKm || 0);
    setCurrentPumpHours(u.currentPumpHours || 0);
    setStatus(u.status);
    setIsModalOpen(true);
  };

  const handleDelete = (unitCode: string, unitName: string) => {
    if (!canManage || !onDeleteUnit) return;
    if (confirm(`¿Estás seguro de eliminar permanentemente la unidad ${unitCode} (${unitName}) del sistema?`)) {
      onDeleteUnit(unitCode);
      if (isModalOpen && editingUnit?.code === unitCode) {
        setIsModalOpen(false);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage || !code.trim()) return;

    const finalBrand = brand === 'Otro / Personalizado' ? (customBrand.trim() || 'Personalizado') : brand;

    const unitToSave: Unit = {
      code: code.trim().toUpperCase(),
      name: name.trim() || `Unidad ${code.trim().toUpperCase()}`,
      plate: plate.trim().toUpperCase(),
      brand: finalBrand,
      model: model.trim(),
      type,
      currentKm: Number(currentKm) || 0,
      currentPumpHours: Number(currentPumpHours) || 0,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {units.map((u) => (
          <div 
            key={u.code}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4.5 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-2xl font-black text-red-700 dark:text-red-400 tracking-tight">
                    {u.code}
                  </span>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{u.name}</p>
                  
                  {/* Brand & Model Display */}
                  {(u.brand || u.model) && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{u.brand || 'Chasis'}</span>
                      {u.model && <span className="font-mono text-slate-400 dark:text-slate-500">• {u.model}</span>}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
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
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{u.plate || 'S/P'}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1 text-[11px]"><Gauge className="w-3.5 h-3.5 text-slate-400" /> Odómetro:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{(u.currentKm || 0).toLocaleString('es-CL')} km</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1 text-[11px]"><Activity className="w-3.5 h-3.5 text-slate-400" /> Horas Bomba:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{u.currentPumpHours || 0} hrs</span>
                </div>
              </div>
            </div>

            {canManage && (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {onDeleteUnit ? (
                  <button
                    onClick={() => handleDelete(u.code, u.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                    title={`Eliminar unidad ${u.code}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ) : <div />}

                <button
                  onClick={() => handleOpenEdit(u)}
                  className="text-xs text-blue-700 dark:text-blue-400 hover:text-blue-900 font-bold px-2.5 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition flex items-center gap-1"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {editingUnit ? `Editar Unidad ${editingUnit.code}` : 'Registrar Nueva Unidad'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold p-1">✕</button>
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-black text-red-700 dark:text-red-400 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Patente</label>
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    placeholder="KJ-9082"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Descriptivo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bomba Urbana Mayor B-4"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              {/* Brand and Model Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Marca / Carrocero</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-semibold text-slate-900 dark:text-slate-100"
                  >
                    {FIRE_ENGINE_BRANDS.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  {brand === 'Otro / Personalizado' && (
                    <input
                      type="text"
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      placeholder="Escribe la marca personalizada"
                      className="w-full mt-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5"
                    />
                  )}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Modelo del Carro</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ej. Midlum 220, Atego 1529..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-semibold text-slate-900 dark:text-slate-100"
                  />
                </div>
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
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Estado Operativo</label>
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
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kilometraje Inicial (KM)</label>
                  <input
                    type="number"
                    value={currentKm}
                    onChange={(e) => setCurrentKm(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Horas Bomba Iniciales</label>
                  <input
                    type="number"
                    step="0.1"
                    value={currentPumpHours}
                    onChange={(e) => setCurrentPumpHours(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 font-bold font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {editingUnit && onDeleteUnit ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingUnit.code, editingUnit.name)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 px-2.5 py-1.5 rounded-lg transition font-bold text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Unidad</span>
                  </button>
                ) : <div />}

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-red-700 hover:bg-red-800 text-white font-bold px-4 py-1.5 rounded-lg shadow transition active:scale-95"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
