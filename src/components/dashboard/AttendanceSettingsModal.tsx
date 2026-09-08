import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Clock,
  ShieldAlert,
  Save,
  CheckCircle2,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';

interface AttendanceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AttendanceSettingsModal: React.FC<AttendanceSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentRole, attendanceSettings, updateAttendanceSettings } = useApp();

  const [entryTime, setEntryTime] = useState<string>(attendanceSettings.shift_entry_time || '09:00');
  const [exitTime, setExitTime] = useState<string>(attendanceSettings.shift_exit_time || '19:00');
  const [entryTolerance, setEntryTolerance] = useState<number>(attendanceSettings.entry_tolerance_minutes ?? 15);
  const [exitTolerance, setExitTolerance] = useState<number>(attendanceSettings.exit_tolerance_minutes ?? 15);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setEntryTime(attendanceSettings.shift_entry_time || '09:00');
      setExitTime(attendanceSettings.shift_exit_time || '19:00');
      setEntryTolerance(attendanceSettings.entry_tolerance_minutes ?? 15);
      setExitTolerance(attendanceSettings.exit_tolerance_minutes ?? 15);
      setSaveSuccess(false);
    }
  }, [isOpen, attendanceSettings]);

  // Exclusive guard: Only admin can view or interact with this modal
  if (!isOpen || currentRole !== 'admin') {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const success = await updateAttendanceSettings({
      shift_entry_time: entryTime,
      shift_exit_time: exitTime,
      entry_tolerance_minutes: Math.max(0, Number(entryTolerance) || 0),
      exit_tolerance_minutes: Math.max(0, Number(exitTolerance) || 0),
    });

    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#141414] border border-[#C8A45C]/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-800 flex items-center justify-between bg-gradient-to-r from-[#181818] to-[#141414]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C8A45C]/15 border border-[#C8A45C]/40 flex items-center justify-center text-[#E6C875]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-luxury text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <span>Configuración de Horarios y Tolerancias</span>
              </h2>
              <span className="text-[11px] text-[#C8A45C] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Panel Exclusivo de Administración</span>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3.5 text-xs text-neutral-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#C8A45C] shrink-0 mt-0.5" />
            <p leading-relaxed>
              Estos parámetros rigen el cálculo automático de puntualidad (tardanzas) y la contabilización de horas extra a favor de los colaboradores al escanear su código QR.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hora oficial de entrada */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hora Oficial de Entrada</span>
              </label>
              <input
                type="time"
                required
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 text-sm font-mono outline-none focus:border-[#C8A45C]"
              />
              <span className="text-[10px] text-neutral-500 block">Ejemplo: 09:00 AM</span>
            </div>

            {/* Tolerancia de entrada */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tolerancia de Entrada (min)</span>
              </label>
              <input
                type="number"
                min="0"
                max="180"
                required
                value={entryTolerance}
                onChange={(e) => setEntryTolerance(Number(e.target.value))}
                className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 text-sm font-mono outline-none focus:border-[#C8A45C]"
              />
              <span className="text-[10px] text-neutral-500 block">
                Hasta {entryTime} + {entryTolerance} min = Puntual
              </span>
            </div>

            {/* Hora oficial de salida */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Hora Oficial de Salida</span>
              </label>
              <input
                type="time"
                required
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 text-sm font-mono outline-none focus:border-[#C8A45C]"
              />
              <span className="text-[10px] text-neutral-500 block">Ejemplo: 07:00 PM (19:00)</span>
            </div>

            {/* Tolerancia de salida */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Tolerancia de Salida (min)</span>
              </label>
              <input
                type="number"
                min="0"
                max="180"
                required
                value={exitTolerance}
                onChange={(e) => setExitTolerance(Number(e.target.value))}
                className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 text-sm font-mono outline-none focus:border-[#C8A45C]"
              />
              <span className="text-[10px] text-neutral-500 block">
                Excedente tras {exitTime} + {exitTolerance} min = Horas extra
              </span>
            </div>
          </div>

          {/* Feedback message */}
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">
                ¡Parámetros de asistencia guardados y sincronizados correctamente!
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#C8A45C] hover:from-[#DFCA8D] hover:to-[#D4AF37] text-black shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Configuración'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
