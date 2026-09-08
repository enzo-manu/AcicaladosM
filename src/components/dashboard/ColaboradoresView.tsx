import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, EmployeeType } from '../../types';
import { Users, Plus, QrCode, Phone, Mail, Clock, Check, X, Shield } from 'lucide-react';
import QRCode from 'qrcode';

export const ColaboradoresView: React.FC = () => {
  const { employees, setEmployees, currentRole } = useApp();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState<EmployeeType>('barbero');
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('18:00');
  const [commissionPct, setCommissionPct] = useState(40);

  // QR Modal
  const [badgeEmp, setBadgeEmp] = useState<Employee | null>(null);
  const [qrUrl, setQrUrl] = useState('');

  const handleOpenBadge = (emp: Employee) => {
    setBadgeEmp(emp);
    QRCode.toDataURL(`ACICALADOS-EMP-${emp.id}-${emp.dni}`, {
      width: 240,
      margin: 1,
    }).then(setQrUrl);
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !dni.trim()) return;

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      full_name: fullName.trim(),
      dni: dni.trim(),
      phone: phone.trim() || '+51 900 000 000',
      email: email.trim() || 'colaborador@acicalados.pe',
      type,
      active: true,
      skills: ['srv-corte-clasico'],
      shift_start: shiftStart,
      shift_end: shiftEnd,
      commission_percentage: Number(commissionPct),
      avatar:
        type === 'barbero'
          ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80'
          : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
    };

    setEmployees((prev) => [...prev, newEmp]);
    setIsNewModalOpen(false);
    setFullName('');
    setDni('');
  };

  const toggleStatus = (id: string) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, active: !e.active } : e))
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1">
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Gestión de Colaboradores & Especialistas
          </h1>
          <p className="text-xs text-neutral-400">
            Plantel de barberos, terapeutas de spa, horarios de turno y credenciales biométricas QR.
          </p>
        </div>

        {currentRole === 'admin' && (
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#C8A45C] hover:bg-[#D4AF37] text-black shadow transition flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Colaborador</span>
          </button>
        )}
      </div>

      {/* Grid of Employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="bg-[#141414] border border-neutral-800 hover:border-[#C8A45C]/40 rounded-2xl p-5 space-y-4 shadow-xl transition flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={emp.avatar}
                    alt={emp.full_name}
                    className="w-14 h-14 rounded-xl object-cover border border-[#C8A45C]/30"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-serif-luxury text-sm font-bold text-white">
                      {emp.full_name}
                    </h3>
                    <span className="text-[10px] font-semibold text-[#C8A45C] uppercase block">
                      {emp.type}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">DNI: {emp.dni}</span>
                  </div>
                </div>

                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                    emp.active ? 'badge-success' : 'badge-neutral'
                  }`}
                >
                  {emp.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="space-y-2 text-xs bg-[#181818] p-3 rounded-xl border border-neutral-800">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Horario de Turno:</span>
                  <span className="font-medium text-white">
                    {emp.shift_start} - {emp.shift_end}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Teléfono:</span>
                  <span className="font-medium text-white">{emp.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Comisión por Servicio:</span>
                  <span className="font-bold text-[#E6C875]">{emp.commission_percentage}%</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => handleOpenBadge(emp)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#181818] hover:bg-[#222222] text-[#E6C875] border border-[#C8A45C]/30 flex items-center gap-1.5 transition"
              >
                <QrCode className="w-3.5 h-3.5 text-[#C8A45C]" />
                <span>Ver Fotocheck</span>
              </button>

              {currentRole === 'admin' && (
                <button
                  type="button"
                  onClick={() => toggleStatus(emp.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    emp.active
                      ? 'bg-neutral-800 text-neutral-400 hover:text-red-300'
                      : 'bg-emerald-950/40 text-emerald-300'
                  }`}
                >
                  {emp.active ? 'Desactivar' : 'Activar'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: Nuevo Colaborador */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#C8A45C]/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-serif-luxury text-base font-bold text-white border-b border-neutral-800 pb-3">
              Registrar Nuevo Colaborador
            </h3>

            <form onSubmit={handleCreateEmployee} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-300">Nombres y Apellidos *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Marcos Valdivia"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-300">DNI / Documento *</label>
                  <input
                    type="text"
                    required
                    placeholder="71234567"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-300">Tipo de Especialista</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 outline-none"
                  >
                    <option value="barbero">Barbero</option>
                    <option value="terapeuta_spa">Terapeuta Spa</option>
                    <option value="estilista">Estilista</option>
                    <option value="recepcionista">Recepcionista</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-300">Teléfono WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+51 987 654 321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-300">Comisión (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionPct}
                    onChange={(e) => setCommissionPct(Number(e.target.value))}
                    className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-300">Inicio Jornada</label>
                  <input
                    type="time"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-300">Fin Jornada</label>
                  <input
                    type="time"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2 outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-semibold bg-[#C8A45C] hover:bg-[#D4AF37] text-black shadow"
                >
                  Guardar Especialista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Credential Modal */}
      {badgeEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#C8A45C]/40 rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-2xl text-center">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#C8A45C]">
                Fotocheck Digital
              </span>
              <h3 className="font-serif-luxury text-lg font-bold text-white">
                {badgeEmp.full_name}
              </h3>
              <p className="text-xs text-neutral-400 capitalize">
                {badgeEmp.type} • DNI: {badgeEmp.dni}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl inline-block shadow-lg mx-auto">
              {qrUrl ? (
                <img src={qrUrl} alt="QR Fotocheck" className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-black">
                  Generando QR...
                </div>
              )}
            </div>

            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setBadgeEmp(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-neutral-800 text-white"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#C8A45C] text-black shadow"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
