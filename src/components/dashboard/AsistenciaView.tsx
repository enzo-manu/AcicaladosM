import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Employee, formatLimaDate } from '../../types';
import { getLimaTimeString, getTodayDateString } from '../../data/initialData';
import QRCode from 'qrcode';
import {
  QrCode,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  UserX,
  Scan,
  Printer,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const AsistenciaView: React.FC = () => {
  const { employees, attendance, attendanceRecords, registerAttendancePunch } = useApp();
  const safeAttendance = attendanceRecords || attendance || [];

  // Live Lima Time Clock
  const [currentLimaTime, setCurrentLimaTime] = useState(getLimaTimeString());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLimaTime(getLimaTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || '');
  const [punchType, setPunchType] = useState<'check_in' | 'check_out'>('check_in');
  const [scanFeedback, setScanFeedback] = useState<{
    success: boolean;
    message: string;
    employeeName: string;
    time: string;
  } | null>(null);

  // QR Badge Modal for Employee
  const [badgeModalEmployee, setBadgeModalEmployee] = useState<Employee | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (badgeModalEmployee) {
      QRCode.toDataURL(`ACICALADOS-EMP-${badgeModalEmployee.id}-${badgeModalEmployee.dni}`, {
        width: 240,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      }).then(setQrCodeDataUrl);
    }
  }, [badgeModalEmployee]);

  const handleSimulateScan = () => {
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    if (!emp) return;

    registerAttendancePunch(emp.id, punchType);

    setScanFeedback({
      success: true,
      message:
        punchType === 'check_in'
          ? `Registro de ENTRADA exitoso para ${emp.full_name}`
          : `Registro de SALIDA completado para ${emp.full_name}`,
      employeeName: emp.full_name,
      time: currentLimaTime,
    });

    setTimeout(() => {
      setScanFeedback(null);
    }, 4000);
  };

  const todayStr = getTodayDateString();

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header with live clock */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1">
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Control de Asistencia por Código QR
          </h1>
          <p className="text-xs text-neutral-400">
            Reloj marcador biométrico y credencial digital para colaboradores y especialistas.
          </p>
        </div>

        {/* Lima Live Time Clock Widget */}
        <div className="bg-[#141414] border border-[#C8A45C]/35 px-4 py-2 rounded-xl flex items-center gap-3 shadow-lg self-start sm:self-auto">
          <Clock className="w-5 h-5 text-[#C8A45C] animate-spin-slow" />
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">
              Hora Oficial Lima (UTC-5)
            </span>
            <span className="font-mono text-lg font-bold text-[#E6C875] tracking-widest">
              {currentLimaTime}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: QR Scanner & Punch Simulator */}
        <div className="lg:col-span-5 bg-[#141414] border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="space-y-1 border-b border-neutral-800 pb-3">
            <h3 className="font-serif-luxury text-base font-bold text-white flex items-center gap-2">
              <Scan className="w-4 h-4 text-[#C8A45C]" />
              <span>Estación Marcadora de Turnos</span>
            </h3>
            <p className="text-xs text-neutral-400">
              El colaborador acerca su fotocheck digital al terminal para validar la jornada.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-neutral-300 font-medium">Seleccionar Colaborador:</label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 outline-none font-medium"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name} ({e.type} - DNI: {e.dni})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-300 font-medium">Tipo de Marcación:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPunchType('check_in')}
                  className={`py-2.5 rounded-xl font-semibold transition ${
                    punchType === 'check_in'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-[#181818] text-neutral-400 border border-neutral-800'
                  }`}
                >
                  🟢 Entrada (Check-In)
                </button>
                <button
                  type="button"
                  onClick={() => setPunchType('check_out')}
                  className={`py-2.5 rounded-xl font-semibold transition ${
                    punchType === 'check_out'
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-[#181818] text-neutral-400 border border-neutral-800'
                  }`}
                >
                  🔴 Salida (Check-Out)
                </button>
              </div>
            </div>

            {/* Simulate Scan Button */}
            <button
              type="button"
              onClick={handleSimulateScan}
              className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-[#D4AF37] to-[#C8A45C] hover:from-[#DFCA8D] hover:to-[#D4AF37] text-black shadow-lg transition flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Simular Escaneo de Fotocheck QR</span>
            </button>

            {/* Realtime Feedback Banner */}
            {scanFeedback && (
              <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 animate-in fade-in zoom-in-95 duration-200 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold">{scanFeedback.message}</span>
                </div>
                <span className="text-[11px] block pl-6 text-emerald-200">
                  Hora registrada: {scanFeedback.time}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Today's Attendance Board */}
        <div className="lg:col-span-7 bg-[#141414] border border-neutral-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="font-serif-luxury text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#C8A45C]" />
              <span>Colaboradores en Turno ({todayStr})</span>
            </h3>
            <span className="text-xs text-neutral-500 font-mono">
              {employees.length} activos
            </span>
          </div>

          <div className="space-y-3">
            {employees.map((emp) => {
              const record = safeAttendance.find(
                (a) => a.employee_id === emp.id && a.date === todayStr
              );

              return (
                <div
                  key={emp.id}
                  className="p-3.5 rounded-xl bg-[#181818] border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.avatar || emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={emp.full_name}
                      className="w-10 h-10 rounded-lg object-cover border border-neutral-800"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="font-semibold text-white block">{emp.full_name}</span>
                      <span className="text-[10px] text-neutral-400 capitalize">
                        {emp.type} • Horario: {emp.shift_start} - {emp.shift_end}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <div className="text-right text-[11px]">
                      {record ? (
                        <div>
                          <span className="text-emerald-400 font-medium block">
                            Entrada: {record.check_in || '--:--'}
                          </span>
                          <span className="text-neutral-400 block">
                            Salida: {record.check_out || 'En turno activo'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-500 italic">Sin marcación hoy</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setBadgeModalEmployee(emp)}
                      className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-[#C8A45C] text-neutral-300 hover:text-black transition flex items-center gap-1 text-[11px]"
                      title="Ver Fotocheck QR"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Fotocheck</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL: Employee QR Credential Badge */}
      {badgeModalEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#C8A45C]/40 rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-2xl text-center">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#C8A45C]">
                Fotocheck Digital Oficial
              </span>
              <h3 className="font-serif-luxury text-lg font-bold text-white">
                {badgeModalEmployee.full_name}
              </h3>
              <p className="text-xs text-neutral-400 capitalize">
                {badgeModalEmployee.type} • DNI: {badgeModalEmployee.dni}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl inline-block shadow-lg mx-auto">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="QR Fotocheck" className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-black">
                  Generando QR...
                </div>
              )}
            </div>

            <p className="text-[11px] text-neutral-400">
              Escanee este código en la tableta marcadora al ingresar y al retirarse del local.
            </p>

            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setBadgeModalEmployee(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#C8A45C] text-black shadow"
              >
                Imprimir Carnet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
