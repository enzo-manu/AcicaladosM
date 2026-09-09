import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Service, Employee, formatSoles, BusinessCategory } from '../../types';
import { getTodayDateString } from '../../data/initialData';
import {
  checkEmployeeAvailability,
  getEligibleEmployeesForService,
  timeToMinutes,
  minutesToTime,
} from '../../lib/bookingAvailability';
import {
  sanitizePhone,
  sanitizeDni,
  handleNumericKeyDown,
  PHONE_PLACEHOLDER,
  DNI_PLACEHOLDER,
} from '../../lib/validators';
import {
  Plus,
  X,
  Search,
  Scissors,
  Sparkles,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Smartphone,
  Layers,
  Check,
  Building2,
} from 'lucide-react';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    services,
    employees,
    employeeBlocks,
    bookings,
    currentRole,
    paymentSettings,
    addBooking,
    openTicketModal,
  } = useApp();

  const todayStr = getTodayDateString();

  // 1. Datos del Cliente
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientDni, setClientDni] = useState('');
  const [nameError, setNameError] = useState(false);

  // 2. Filtros y Búsqueda de Servicios
  const [categoryFilter, setCategoryFilter] = useState<'todos' | 'barberia' | 'spa'>('todos');
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  // 3. Fecha, Hora y Asignación
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('11:00');
  const [assignmentMode, setAssignmentMode] = useState<'auto' | 'manual'>('auto');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  // 4. Modalidades y Métodos de Pago
  const [paymentType, setPaymentType] = useState<'sin_pago' | 'completo' | 'adelanto'>('sin_pago');
  const [singleMethod, setSingleMethod] = useState<'efectivo' | 'yape' | 'transferencia'>('efectivo');
  
  // Pago Mixto (solo en Pago Completo)
  const [isMixto, setIsMixto] = useState<boolean>(false);
  const [mixtoCombination, setMixtoCombination] = useState<
    'efectivo_yape' | 'efectivo_transferencia' | 'yape_transferencia'
  >('efectivo_yape');
  const [mixtoAmount1, setMixtoAmount1] = useState<string>('');
  const [mixtoAmount2, setMixtoAmount2] = useState<string>('');

  // Pago de Adelanto
  const [advanceAmountInput, setAdvanceAmountInput] = useState<string>('');

  // Estado de error general o envío
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset initial selected service when modal opens
  useEffect(() => {
    if (isOpen) {
      setNameError(false);
      setSubmitError(null);
      if (selectedServiceIds.length === 0 && services.length > 0) {
        const firstActive = services.find((s) => s.active) || services[0];
        if (firstActive) {
          setSelectedServiceIds([firstActive.id]);
        }
      }
      if (!selectedEmployeeId && employees.length > 0) {
        const firstActiveEmp = employees.find((e) => e.active && e.type !== 'recepcionista');
        if (firstActiveEmp) {
          setSelectedEmployeeId(firstActiveEmp.id);
        }
      }
    }
  }, [isOpen, services, employees]);

  // Servicios seleccionados completos
  const selectedServicesList = useMemo(() => {
    return services.filter((s) => selectedServiceIds.includes(s.id));
  }, [services, selectedServiceIds]);

  // Cálculo total de duración y precio
  const totalDurationMinutes = useMemo(() => {
    return selectedServicesList.reduce((acc, s) => acc + (s.duration_minutes || 30), 0);
  }, [selectedServicesList]);

  const totalPriceCents = useMemo(() => {
    return selectedServicesList.reduce((acc, s) => acc + (s.price_cents || 0), 0);
  }, [selectedServicesList]);

  const totalPriceSoles = totalPriceCents / 100;

  // Hora de fin calculada
  const calculatedEndTime = useMemo(() => {
    const startMin = timeToMinutes(startTime);
    const endMin = startMin + totalDurationMinutes;
    return minutesToTime(endMin);
  }, [startTime, totalDurationMinutes]);

  // Tipo de reserva (barberia, spa, mixto)
  const bookingCategoryType = useMemo((): BusinessCategory => {
    const hasBarberia = selectedServicesList.some((s) => s.category === 'barberia');
    const hasSpa = selectedServicesList.some((s) => s.category === 'spa');
    if (hasBarberia && hasSpa) return 'mixto';
    if (hasSpa) return 'spa';
    return 'barberia';
  }, [selectedServicesList]);

  // Adelanto sugerido según configuración (ej. 25%)
  const minAdvanceCents = Math.round(
    (totalPriceCents * Math.max(1, paymentSettings.advance_percentage || 25)) / 100
  );
  const minAdvanceSoles = minAdvanceCents / 100;

  // Filtrado de servicios para la lista
  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      if (!srv.active) return false;
      if (categoryFilter === 'barberia' && srv.category !== 'barberia') return false;
      if (categoryFilter === 'spa' && srv.category !== 'spa') return false;
      if (serviceSearch.trim()) {
        const q = serviceSearch.toLowerCase();
        return (
          srv.name.toLowerCase().includes(q) ||
          (srv.description && srv.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [services, categoryFilter, serviceSearch]);

  // Toggle de selección de servicio
  const toggleServiceSelection = (srvId: string) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(srvId)) {
        if (prev.length === 1) return prev; // Mantener al menos uno
        return prev.filter((id) => id !== srvId);
      } else {
        return [...prev, srvId];
      }
    });
  };

  // Colaboradores activos aptos (excluyendo recepcionistas puros)
  const availableEmployeesList = useMemo(() => {
    return employees.filter(
      (e) => e.active && e.type !== 'recepcionista' && e.role !== 'recepcionista'
    );
  }, [employees]);

  // Carga laboral de cada especialista en la fecha seleccionada
  const employeeWorkloads = useMemo(() => {
    const workloads: Record<string, number> = {};
    for (const emp of availableEmployeesList) {
      const activeCount = bookings.filter((b) => {
        if (b.date !== date) return false;
        if (b.status === 'cancelada' || b.status === 'expirada') return false;
        return (
          (b as any).assigned_employee_id === emp.id ||
          b.services?.some((s) => s.employee_id === emp.id)
        );
      }).length;
      workloads[emp.id] = activeCount;
    }
    return workloads;
  }, [availableEmployeesList, bookings, date]);

  // Evaluación de disponibilidad en tiempo real para todos los colaboradores
  const availabilityMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof checkEmployeeAvailability>> = {};
    for (const emp of availableEmployeesList) {
      map[emp.id] = checkEmployeeAvailability({
        employee: emp,
        date,
        startTime,
        durationMinutes: totalDurationMinutes > 0 ? totalDurationMinutes : 30,
        bookings,
        employeeBlocks,
      });
    }
    return map;
  }, [availableEmployeesList, date, startTime, totalDurationMinutes, bookings, employeeBlocks]);

  // Selección automática del mejor especialista
  const autoAssignedEmployee = useMemo((): Employee | null => {
    if (availableEmployeesList.length === 0) return null;

    // 1. Filtrar los aptos para la categoría de servicios
    const eligible = availableEmployeesList.filter((emp) => {
      // Si todos son barbería o todos spa, validar coincidencia
      if (bookingCategoryType === 'barberia' && emp.type !== 'barbero' && emp.type !== 'barberia') {
        return false;
      }
      if (bookingCategoryType === 'spa' && emp.type !== 'spa') {
        return false;
      }
      return true;
    });

    const candidates = eligible.length > 0 ? eligible : availableEmployeesList;

    // 2. Ordenar por disponibilidad (disponibles primero) y menor carga laboral
    const sorted = [...candidates].sort((a, b) => {
      const aAvail = availabilityMap[a.id]?.isAvailable ? 1 : 0;
      const bAvail = availabilityMap[b.id]?.isAvailable ? 1 : 0;
      if (aAvail !== bAvail) return bAvail - aAvail;

      const aLoad = employeeWorkloads[a.id] || 0;
      const bLoad = employeeWorkloads[b.id] || 0;
      return aLoad - bLoad;
    });

    return sorted[0] || null;
  }, [availableEmployeesList, bookingCategoryType, availabilityMap, employeeWorkloads]);

  // Colaborador efectivo a asignar
  const effectiveEmployee = useMemo((): Employee | null => {
    if (assignmentMode === 'auto') {
      return autoAssignedEmployee;
    }
    return availableEmployeesList.find((e) => e.id === selectedEmployeeId) || null;
  }, [assignmentMode, autoAssignedEmployee, availableEmployeesList, selectedEmployeeId]);

  // Estado de disponibilidad del colaborador seleccionado
  const effectiveAvailability = useMemo(() => {
    if (!effectiveEmployee) {
      return { isAvailable: false, message: 'No hay especialista asignado' };
    }
    return availabilityMap[effectiveEmployee.id] || { isAvailable: true };
  }, [effectiveEmployee, availabilityMap]);

  // Manejo de importes en Pago Mixto
  useEffect(() => {
    if (paymentType === 'completo' && isMixto) {
      const half = Math.floor(totalPriceSoles / 2);
      const remainder = Number((totalPriceSoles - half).toFixed(2));
      setMixtoAmount1(half.toString());
      setMixtoAmount2(remainder.toString());
    }
  }, [paymentType, isMixto, totalPriceSoles]);

  // Validación de suma en Pago Mixto
  const mixtoSum = useMemo(() => {
    const a1 = parseFloat(mixtoAmount1) || 0;
    const a2 = parseFloat(mixtoAmount2) || 0;
    return Number((a1 + a2).toFixed(2));
  }, [mixtoAmount1, mixtoAmount2]);

  const isMixtoSumValid = useMemo(() => {
    if (paymentType !== 'completo' || !isMixto) return true;
    return Math.abs(mixtoSum - totalPriceSoles) < 0.01;
  }, [paymentType, isMixto, mixtoSum, totalPriceSoles]);

  // Autocompletado del segundo monto en mixto al tipear el primero
  const handleMixtoAmount1Change = (val: string) => {
    setMixtoAmount1(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num <= totalPriceSoles) {
      const diff = Number((totalPriceSoles - num).toFixed(2));
      setMixtoAmount2(diff.toString());
    }
  };

  // Validación del monto de adelanto
  const advanceAmountNum = parseFloat(advanceAmountInput) || 0;
  const isAdvanceAmountValid = useMemo(() => {
    if (paymentType !== 'adelanto') return true;
    return advanceAmountNum > 0 && advanceAmountNum <= totalPriceSoles;
  }, [paymentType, advanceAmountNum, totalPriceSoles]);

  // Botón Submit habilitado/deshabilitado
  const canSubmit = useMemo(() => {
    if (!clientName.trim()) return false;
    if (selectedServicesList.length === 0) return false;
    if (!effectiveEmployee) return false;
    if (assignmentMode === 'manual' && !effectiveAvailability.isAvailable) return false;
    if (paymentType === 'completo' && isMixto && !isMixtoSumValid) return false;
    if (paymentType === 'adelanto' && !isAdvanceAmountValid) return false;
    return true;
  }, [
    clientName,
    selectedServicesList,
    effectiveEmployee,
    assignmentMode,
    effectiveAvailability,
    paymentType,
    isMixto,
    isMixtoSumValid,
    isAdvanceAmountValid,
  ]);

  if (!isOpen) return null;

  // Manejo del Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!clientName.trim()) {
      setNameError(true);
      setSubmitError('El nombre del cliente es obligatorio (*)');
      return;
    }

    if (selectedServicesList.length === 0) {
      setSubmitError('Debe seleccionar al menos un servicio.');
      return;
    }

    if (!effectiveEmployee) {
      setSubmitError('No se pudo asignar un especialista para este servicio.');
      return;
    }

    if (assignmentMode === 'manual' && !effectiveAvailability.isAvailable) {
      setSubmitError(
        `El colaborador seleccionado no está disponible: ${effectiveAvailability.message}`
      );
      return;
    }

    if (paymentType === 'completo' && isMixto && !isMixtoSumValid) {
      setSubmitError(
        `En pago mixto, la suma de los montos (S/ ${mixtoSum.toFixed(2)}) debe coincidir exactamente con el total de la cita (S/ ${totalPriceSoles.toFixed(2)}).`
      );
      return;
    }

    if (paymentType === 'adelanto' && !isAdvanceAmountValid) {
      setSubmitError(
        `El adelanto ingresado (S/ ${advanceAmountNum}) debe ser mayor a 0 y no exceder el total de la cita (S/ ${totalPriceSoles.toFixed(2)}).`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Determinar datos de pago
      let paidCents = 0;
      let pMethod: string | null = null;
      let cashCents = 0;
      let yapeCents = 0;
      let transferCents = 0;
      let paymentNotes = '';

      if (paymentType === 'completo') {
        paidCents = totalPriceCents;
        if (isMixto) {
          pMethod = 'mixto';
          const a1 = Math.round((parseFloat(mixtoAmount1) || 0) * 100);
          const a2 = Math.round((parseFloat(mixtoAmount2) || 0) * 100);

          if (mixtoCombination === 'efectivo_yape') {
            cashCents = a1;
            yapeCents = a2;
            paymentNotes = `Mixto (Efectivo: S/ ${(a1 / 100).toFixed(2)} + Yape: S/ ${(a2 / 100).toFixed(2)})`;
          } else if (mixtoCombination === 'efectivo_transferencia') {
            cashCents = a1;
            transferCents = a2;
            paymentNotes = `Mixto (Efectivo: S/ ${(a1 / 100).toFixed(2)} + Transferencia: S/ ${(a2 / 100).toFixed(2)})`;
          } else {
            yapeCents = a1;
            transferCents = a2;
            paymentNotes = `Mixto (Yape: S/ ${(a1 / 100).toFixed(2)} + Transferencia: S/ ${(a2 / 100).toFixed(2)})`;
          }
        } else {
          pMethod = singleMethod;
          if (singleMethod === 'efectivo') cashCents = paidCents;
          else if (singleMethod === 'yape') yapeCents = paidCents;
          else if (singleMethod === 'transferencia') transferCents = paidCents;
          paymentNotes = `Pago Total (${singleMethod.toUpperCase()})`;
        }
      } else if (paymentType === 'adelanto') {
        paidCents = Math.round(advanceAmountNum * 100);
        pMethod = singleMethod;
        if (singleMethod === 'efectivo') cashCents = paidCents;
        else if (singleMethod === 'yape') yapeCents = paidCents;
        else if (singleMethod === 'transferencia') transferCents = paidCents;
        paymentNotes = `Adelanto Recepción (${singleMethod.toUpperCase()})`;
      }

      // 2. Construir ítems de servicio
      let currentItemStartMin = timeToMinutes(startTime);
      const serviceItems = selectedServicesList.map((srv) => {
        const srvDuration = srv.duration_minutes || 30;
        const srvEndMin = currentItemStartMin + srvDuration;
        const srvStartStr = minutesToTime(currentItemStartMin);
        const srvEndStr = minutesToTime(srvEndMin);

        currentItemStartMin = srvEndMin;

        return {
          service_id: srv.id,
          service_name: srv.name,
          employee_id: effectiveEmployee.id,
          employee_name: effectiveEmployee.full_name,
          price_cents: srv.price_cents,
          duration_minutes: srvDuration,
          hora_inicio: srvStartStr,
          hora_fin: srvEndStr,
          start_time: srvStartStr,
          end_time: srvEndStr,
        };
      });

      // 3. Crear reserva
      const newBooking = addBooking({
        client_name: clientName.trim(),
        client_phone: clientPhone.trim() || '',
        client_dni: clientDni.trim() || undefined,
        client_email: 'recepcion@acicalados.pe',
        date,
        start_time: startTime,
        end_time: calculatedEndTime,
        type: bookingCategoryType,
        services: serviceItems,
        total_price_cents: totalPriceCents,
        advance_amount_cents: paidCents,
        status: paidCents >= totalPriceCents || paidCents >= minAdvanceCents ? 'confirmada' : 'pendiente',
        payment_status: paidCents >= totalPriceCents ? 'total' : paidCents > 0 ? 'parcial' : 'sin_pago',
        payment_method: pMethod || undefined,
        cash_cents: cashCents,
        yape_cents: yapeCents,
        transfer_cents: transferCents,
        payment_notes: paymentNotes || undefined,
      });

      // Limpiar formulario y cerrar
      setClientName('');
      setClientPhone('');
      setClientDni('');
      setSelectedServiceIds(services[0]?.id ? [services[0].id] : []);
      setPaymentType('sin_pago');
      setIsMixto(false);
      setAdvanceAmountInput('');

      onClose();
      if (onSuccess) onSuccess();

      // Abrir ticket térmico opcional si se registró pago
      if (paidCents > 0 && openTicketModal) {
        openTicketModal('booking', newBooking);
      }
    } catch (err: any) {
      console.error('Error al crear reserva manual:', err);
      setSubmitError(err?.message || 'Error al guardar la reserva.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-[#121212] border border-[#C8A45C]/40 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Superior del Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#C8A45C]/25 bg-gradient-to-r from-[#171717] to-[#121212] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C8A45C]/15 border border-[#C8A45C]/40 text-[#E6C875] flex items-center justify-center shadow-inner">
              <Plus className="w-5 h-5 text-[#C8A45C]" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <span>Nueva Reserva Manual</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#C8A45C]/20 border border-[#C8A45C]/40 text-[#E6C875] font-normal uppercase tracking-wider">
                  {currentRole === 'admin' ? 'Administrador' : 'Recepción'}
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                Agenda citas con verificación de disponibilidad en tiempo real y cobro de adelantos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-[#C8A45C]/50 hover:bg-[#C8A45C]/10 flex items-center justify-center transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Formulario Scrolleable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {/* Mensaje de Error General si existe */}
          {submitError && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 flex items-start gap-2.5 animate-fadeIn">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Validación requerida:</span>
                <span className="text-[11px] leading-relaxed">{submitError}</span>
              </div>
            </div>
          )}

          {/* SECCIÓN 1: DATOS DEL CLIENTE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
              <h4 className="font-serif-luxury text-sm font-bold text-[#E6C875] flex items-center gap-2">
                <User className="w-4 h-4 text-[#C8A45C]" />
                <span>1. Datos del Cliente</span>
              </h4>
              <span className="text-[10px] text-neutral-400 font-mono">
                Solo el nombre es obligatorio
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Nombre (Obligatorio) */}
              <div className="space-y-1">
                <label className="text-neutral-300 font-medium flex items-center gap-1">
                  <span>Nombre del Cliente</span>
                  <span className="text-amber-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Manuel Elías Ore..."
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if (e.target.value.trim()) setNameError(false);
                  }}
                  className={`w-full bg-[#181818] border rounded-xl p-2.5 text-white outline-none transition ${
                    nameError
                      ? 'border-red-500 focus:border-red-400 bg-red-950/20'
                      : 'border-neutral-800 focus:border-[#C8A45C]/70'
                  }`}
                />
                {nameError && (
                  <span className="text-[10px] text-red-400 block font-medium">
                    El nombre es obligatorio para registrar la reserva
                  </span>
                )}
              </div>

              {/* Teléfono WhatsApp (Completamente Opcional) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-neutral-400 font-normal">
                    Teléfono WhatsApp <span className="text-neutral-500">(Opcional)</span>
                  </label>
                  <span className="text-[9px] text-neutral-500 font-mono">9 dígitos</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={9}
                  placeholder={PHONE_PLACEHOLDER}
                  value={clientPhone}
                  onKeyDown={handleNumericKeyDown}
                  onChange={(e) => setClientPhone(sanitizePhone(e.target.value))}
                  className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C]/70 text-white rounded-xl p-2.5 outline-none font-mono"
                />
              </div>

              {/* DNI (Completamente Opcional) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-neutral-400 font-normal">
                    DNI <span className="text-neutral-500">(Opcional)</span>
                  </label>
                  <span className="text-[9px] text-neutral-500 font-mono">8 dígitos</span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder={DNI_PLACEHOLDER}
                  value={clientDni}
                  onKeyDown={handleNumericKeyDown}
                  onChange={(e) => setClientDni(sanitizeDni(e.target.value))}
                  className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C]/70 text-white rounded-xl p-2.5 outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: SELECCIÓN Y BÚSQUEDA DE SERVICIOS */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-1.5">
              <h4 className="font-serif-luxury text-sm font-bold text-[#E6C875] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C8A45C]" />
                <span>2. Servicios a Realizar</span>
                <span className="text-neutral-400 text-xs font-normal">
                  ({selectedServicesList.length} seleccionado{selectedServicesList.length === 1 ? '' : 's'})
                </span>
              </h4>

              {/* Pestañas de Categoría */}
              <div className="flex items-center gap-1 bg-[#181818] p-1 rounded-xl border border-neutral-800">
                {(['todos', 'barberia', 'spa'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition capitalize ${
                      categoryFilter === cat
                        ? 'bg-[#C8A45C] text-black shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {cat === 'todos' ? 'Todos' : cat === 'barberia' ? 'Barbería' : 'Spa'}
                  </button>
                ))}
              </div>
            </div>

            {/* Buscador de Servicios */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#C8A45C] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar servicio por nombre o palabra clave..."
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C]/70 text-white rounded-xl pl-9 pr-8 py-2 outline-none text-xs"
              />
              {serviceSearch && (
                <button
                  type="button"
                  onClick={() => setServiceSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Cuadrícula de Servicios Disponibles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1 border border-neutral-800/80 rounded-2xl bg-[#0E0E0E]">
              {filteredServices.length === 0 ? (
                <div className="col-span-full py-8 text-center text-neutral-500">
                  No se encontraron servicios con los filtros aplicados.
                </div>
              ) : (
                filteredServices.map((srv) => {
                  const isSelected = selectedServiceIds.includes(srv.id);
                  return (
                    <div
                      key={srv.id}
                      onClick={() => toggleServiceSelection(srv.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                        isSelected
                          ? 'bg-[#C8A45C]/15 border-[#C8A45C] text-white shadow-[0_0_15px_rgba(200,164,92,0.15)]'
                          : 'bg-[#161616] border-neutral-800/90 text-neutral-300 hover:border-[#C8A45C]/40 hover:bg-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-xs leading-snug line-clamp-2">
                          {srv.name}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${
                            isSelected
                              ? 'bg-[#C8A45C] border-[#C8A45C] text-black'
                              : 'border-neutral-700 bg-black/40'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800/50">
                        <span
                          className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                            srv.category === 'barberia'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {srv.category === 'barberia' ? 'Barbería' : 'Spa'}
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-neutral-400">{srv.duration_minutes}m</span>
                          <span className="font-bold text-[#E6C875]">
                            {formatSoles(srv.price_cents)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Resumen de Servicios Seleccionados */}
            {selectedServicesList.length > 0 && (
              <div className="p-3 rounded-xl bg-[#161616] border border-[#C8A45C]/30 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                    Seleccionados:
                  </span>
                  {selectedServicesList.map((srv) => (
                    <span
                      key={srv.id}
                      className="inline-flex items-center gap-1 bg-black/60 border border-neutral-700 text-neutral-200 px-2 py-0.5 rounded-md text-[11px]"
                    >
                      <span>{srv.name}</span>
                      {selectedServicesList.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleServiceSelection(srv.id);
                          }}
                          className="text-neutral-400 hover:text-red-400 ml-0.5"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-neutral-400 text-xs font-mono">
                    Duración: <strong className="text-white">{totalDurationMinutes} min</strong>
                  </span>
                  <span className="text-[#C8A45C] text-sm font-bold font-mono">
                    Total: {formatSoles(totalPriceCents)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 3: FECHA, HORA Y ASIGNACIÓN CON VERIFICACIÓN EN TIEMPO REAL */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
              <h4 className="font-serif-luxury text-sm font-bold text-[#E6C875] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C8A45C]" />
                <span>3. Horario & Asignación de Especialista</span>
              </h4>
              <span className="text-[10px] text-neutral-400 font-mono">
                {startTime} - {calculatedEndTime} ({totalDurationMinutes} min)
              </span>
            </div>

            {/* Fecha y Hora de Inicio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C8A45C]" />
                  <span>Fecha de la Cita</span>
                </label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C]/70 text-white rounded-xl p-2.5 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C8A45C]" />
                  <span>Hora de Inicio</span>
                </label>
                <input
                  type="time"
                  required
                  step="1800"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C]/70 text-white rounded-xl p-2.5 outline-none font-mono"
                />
              </div>
            </div>

            {/* Modo de Asignación */}
            <div className="space-y-2 pt-1">
              <label className="text-neutral-300 font-medium block">
                Modo de Asignación del Personal
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAssignmentMode('auto')}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
                    assignmentMode === 'auto'
                      ? 'bg-[#C8A45C]/15 border-[#C8A45C] text-white shadow-sm'
                      : 'bg-[#181818] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Sparkles
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      assignmentMode === 'auto' ? 'text-[#C8A45C]' : 'text-neutral-500'
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-xs block text-white">
                      Asignación Automática
                    </span>
                    <span className="text-[10px] text-neutral-400 leading-snug block mt-0.5">
                      Distribuye equitativamente según menor carga y disponibilidad inmediata.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setAssignmentMode('manual')}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
                    assignmentMode === 'manual'
                      ? 'bg-[#C8A45C]/15 border-[#C8A45C] text-white shadow-sm'
                      : 'bg-[#181818] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <User
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      assignmentMode === 'manual' ? 'text-[#C8A45C]' : 'text-neutral-500'
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-xs block text-white">
                      Asignación Manual
                    </span>
                    <span className="text-[10px] text-neutral-400 leading-snug block mt-0.5">
                      Selecciona directamente al colaborador preferido para esta reserva.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Selector de Especialista en Modo Manual */}
            {assignmentMode === 'manual' && (
              <div className="space-y-1.5 pt-1">
                <label className="text-neutral-300 font-medium">
                  Especialista Seleccionado
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C]/70 text-white rounded-xl p-2.5 outline-none"
                >
                  {availableEmployeesList.map((emp) => {
                    const statusInfo = availabilityMap[emp.id];
                    const isAvail = statusInfo?.isAvailable;
                    const load = employeeWorkloads[emp.id] || 0;
                    return (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.type}) — {isAvail ? '🟢 Disponible' : `🔴 Ocupado (${statusInfo?.message || 'No disponible'})`} — {load} cita{load === 1 ? '' : 's'} hoy
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* ALERTA PREVENTIVA EN TIEMPO REAL: Estado del Colaborador Asignado */}
            {effectiveEmployee && (
              <div className="pt-1">
                {effectiveAvailability.isAvailable ? (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-xs block text-emerald-200">
                          {effectiveEmployee.full_name} — Disponible
                        </span>
                        <span className="text-[10px] text-emerald-400/80 block font-mono">
                          {startTime} a {calculatedEndTime} ({totalDurationMinutes} min) · Carga del día: {employeeWorkloads[effectiveEmployee.id] || 0} cita(s)
                        </span>
                      </div>
                    </div>
                    {assignmentMode === 'auto' && (
                      <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-400/30 text-emerald-300 shrink-0">
                        Auto-Asignado
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/60 text-red-300 flex items-start gap-2.5 animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-red-200">
                          Colaborador No Disponible: {effectiveEmployee.full_name}
                        </span>
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-red-900/80 text-red-200">
                          {effectiveAvailability.reason || 'Conflicto'}
                        </span>
                      </div>
                      <p className="text-[11px] text-red-300/90 leading-relaxed">
                        {effectiveAvailability.message ||
                          'El colaborador ya cuenta con una reserva o bloqueo en este intervalo.'}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        Cambie la hora de inicio, elija otro colaborador o active la asignación automática.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECCIÓN 4: MODALIDADES Y MÉTODOS DE PAGO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
              <h4 className="font-serif-luxury text-sm font-bold text-[#E6C875] flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#C8A45C]" />
                <span>4. Modalidad y Método de Pago</span>
              </h4>
              <span className="text-xs font-bold text-[#C8A45C] font-mono">
                Total: {formatSoles(totalPriceCents)}
              </span>
            </div>

            {/* Selector de Modalidad: Sin Pago / Pago Completo / Adelanto */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentType('sin_pago');
                  setIsMixto(false);
                }}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  paymentType === 'sin_pago'
                    ? 'bg-[#C8A45C]/20 border-[#C8A45C] text-white font-bold'
                    : 'bg-[#161616] border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <span className="block text-xs">Sin Pago Ahora</span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  Pagar en el local
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentType('adelanto');
                  setIsMixto(false);
                  if (!advanceAmountInput) {
                    setAdvanceAmountInput(minAdvanceSoles.toString());
                  }
                }}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  paymentType === 'adelanto'
                    ? 'bg-[#C8A45C]/20 border-[#C8A45C] text-white font-bold'
                    : 'bg-[#161616] border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <span className="block text-xs">Pago de Adelanto</span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  Monto manual (S/.)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('completo')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  paymentType === 'completo'
                    ? 'bg-[#C8A45C]/20 border-[#C8A45C] text-white font-bold'
                    : 'bg-[#161616] border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <span className="block text-xs">Pago Completo</span>
                <span className="text-[10px] text-[#E6C875] font-normal">
                  Total: {formatSoles(totalPriceCents)}
                </span>
              </button>
            </div>

            {/* CASO A: PAGO DE ADELANTO (Efectivo, Yape, Transferencia) */}
            {paymentType === 'adelanto' && (
              <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#C8A45C]/30 space-y-3 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-white">
                      Monto del Adelanto Abonado (S/.)
                    </label>
                    <span className="text-[10px] text-neutral-400 block">
                      Admite montos enteros o con decimales libres. Mínimo sugerido: S/ {minAdvanceSoles.toFixed(2)} (25%)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAdvanceAmountInput(minAdvanceSoles.toString())}
                      className="px-2.5 py-1 rounded-lg bg-black/60 border border-neutral-700 hover:border-[#C8A45C] text-[10px] text-[#E6C875] transition"
                    >
                      Sugerir 25% (S/ {minAdvanceSoles.toFixed(2)})
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold font-mono">
                      S/
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max={totalPriceSoles}
                      required
                      placeholder="Ej. 20 ó 25.50"
                      value={advanceAmountInput}
                      onChange={(e) => setAdvanceAmountInput(e.target.value)}
                      className={`w-full bg-[#1C1C1C] border rounded-xl pl-8 pr-3 py-2 text-white font-mono text-sm outline-none ${
                        !isAdvanceAmountValid && advanceAmountInput
                          ? 'border-red-500 text-red-300'
                          : 'border-neutral-700 focus:border-[#C8A45C]'
                      }`}
                    />
                  </div>
                  <div className="text-right text-xs font-mono shrink-0">
                    <span className="text-neutral-400 block text-[10px]">Saldo por cobrar:</span>
                    <span className="text-white font-bold">
                      S/ {Math.max(0, totalPriceSoles - (parseFloat(advanceAmountInput) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Selección de Método de Pago para Adelanto: SOLO 3 OPCIONES */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-neutral-300 font-medium block">
                    Forma de Pago del Adelanto (Seleccione una):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(['efectivo', 'yape', 'transferencia'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSingleMethod(m)}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          singleMethod === m
                            ? 'bg-[#C8A45C]/20 border-[#C8A45C] text-white font-bold'
                            : 'bg-black/40 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {m === 'efectivo' && <DollarSign className="w-3.5 h-3.5 text-[#C8A45C]" />}
                        {m === 'yape' && <Smartphone className="w-3.5 h-3.5 text-[#C8A45C]" />}
                        {m === 'transferencia' && <Building2 className="w-3.5 h-3.5 text-[#C8A45C]" />}
                        <span className="capitalize text-xs">{m}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CASO B: PAGO COMPLETO (Efectivo, Yape, Transferencia, Mixto) */}
            {paymentType === 'completo' && (
              <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#C8A45C]/30 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">
                    Forma de Pago Completo (Total: {formatSoles(totalPriceCents)}):
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                    Saldo al finalizar: S/ 0.00
                  </span>
                </div>

                {/* 4 Opciones de Pago Completo */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['efectivo', 'yape', 'transferencia'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setIsMixto(false);
                        setSingleMethod(m);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        !isMixto && singleMethod === m
                          ? 'bg-[#C8A45C]/20 border-[#C8A45C] text-white font-bold shadow-sm'
                          : 'bg-black/40 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {m === 'efectivo' && <DollarSign className="w-3.5 h-3.5 text-[#C8A45C]" />}
                      {m === 'yape' && <Smartphone className="w-3.5 h-3.5 text-[#C8A45C]" />}
                      {m === 'transferencia' && <Building2 className="w-3.5 h-3.5 text-[#C8A45C]" />}
                      <span className="capitalize text-xs">{m}</span>
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setIsMixto(true)}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      isMixto
                        ? 'bg-[#C8A45C]/20 border-[#C8A45C] text-white font-bold shadow-sm'
                        : 'bg-black/40 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 text-[#C8A45C]" />
                    <span className="text-xs">Mixto</span>
                  </button>
                </div>

                {/* Desglose de Pago Mixto (Exactamente 2 métodos combinados) */}
                {isMixto && (
                  <div className="p-3 rounded-xl bg-black/60 border border-neutral-800 space-y-2.5 animate-fadeIn">
                    <div className="space-y-1">
                      <span className="text-[11px] text-neutral-300 font-medium block">
                        Combinación de 2 Métodos:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        {[
                          { id: 'efectivo_yape', label: 'Efectivo + Yape' },
                          { id: 'efectivo_transferencia', label: 'Efectivo + Transferencia' },
                          { id: 'yape_transferencia', label: 'Yape + Transferencia' },
                        ].map((combo) => (
                          <button
                            key={combo.id}
                            type="button"
                            onClick={() => setMixtoCombination(combo.id as any)}
                            className={`px-2 py-1.5 rounded-lg border text-center text-[11px] transition ${
                              mixtoCombination === combo.id
                                ? 'bg-[#C8A45C] text-black font-bold border-[#C8A45C]'
                                : 'bg-[#181818] border-neutral-800 text-neutral-400 hover:text-white'
                            }`}
                          >
                            {combo.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Inputs de los dos montos con validación de suma */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 font-medium block capitalize">
                          {mixtoCombination.split('_')[0]} (S/.)
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max={totalPriceSoles}
                          value={mixtoAmount1}
                          onChange={(e) => handleMixtoAmount1Change(e.target.value)}
                          className="w-full bg-[#181818] border border-neutral-700 text-white rounded-lg p-2 font-mono text-xs outline-none focus:border-[#C8A45C]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 font-medium block capitalize">
                          {mixtoCombination.split('_')[1]} (S/.)
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max={totalPriceSoles}
                          value={mixtoAmount2}
                          onChange={(e) => setMixtoAmount2(e.target.value)}
                          className="w-full bg-[#181818] border border-neutral-700 text-white rounded-lg p-2 font-mono text-xs outline-none focus:border-[#C8A45C]"
                        />
                      </div>
                    </div>

                    {/* Badge de Verificación de Suma */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-neutral-400">
                        Suma combinada: <strong className="text-white font-mono">S/ {mixtoSum.toFixed(2)}</strong> / S/ {totalPriceSoles.toFixed(2)}
                      </span>
                      {isMixtoSumValid ? (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Suma exacta
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {mixtoSum < totalPriceSoles
                            ? `Falta S/ ${(totalPriceSoles - mixtoSum).toFixed(2)}`
                            : `Excede por S/ ${(mixtoSum - totalPriceSoles).toFixed(2)}`}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RESUMEN FINAL & BOTONES DE ACCIÓN */}
          <div className="pt-2 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-neutral-400 space-y-0.5 text-center sm:text-left">
              <div>
                Cliente: <strong className="text-white">{clientName.trim() || '—'}</strong>
                {clientPhone && <span className="text-neutral-500 font-mono"> ({clientPhone})</span>}
              </div>
              <div>
                Especialista: <strong className="text-[#E6C875]">{effectiveEmployee?.full_name || 'Sin asignar'}</strong>
                {' · '}
                Horario: <strong className="text-white font-mono">{startTime} a {calculatedEndTime}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  canSubmit && !isSubmitting
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#C8A45C] text-black hover:brightness-110 shadow-[0_4px_20px_rgba(200,164,92,0.3)]'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Guardando Reserva...' : 'Confirmar y Crear Cita'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
