import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Service, formatSoles, BusinessCategory, BookingServiceItem } from '../../types';
import { PaymentQRWidget } from '../common/PaymentQRWidget';
import confetti from 'canvas-confetti';
import {
  Scissors,
  Sparkles,
  Layers,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  ArrowRight,
  ArrowLeft,
  Printer,
  ShieldCheck,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  sanitizePhone,
  sanitizeDni,
  isValidPhone,
  isValidDni,
  handleNumericKeyDown,
  PHONE_PLACEHOLDER,
  DNI_PLACEHOLDER,
  PHONE_ERROR_MESSAGE,
  DNI_ERROR_MESSAGE,
} from '../../lib/validators';

export const PublicBookingFlow: React.FC = () => {
  const { services, employees, employeeBlocks, addBooking, openTicketModal, currentUser, currentRole, setActiveView, paymentSettings } = useApp();

  // Step 1 to 5
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [selectedType, setSelectedType] = useState<BusinessCategory>('barberia');
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [bookingDate, setBookingDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string>('11:00');

  // Client Details
  const [clientName, setClientName] = useState<string>(currentUser.role === 'cliente' ? currentUser.name : '');
  const [clientPhone, setClientPhone] = useState<string>(currentUser.role === 'cliente' ? '988445566' : '');
  const [clientEmail, setClientEmail] = useState<string>(currentUser.role === 'cliente' ? currentUser.email : '');
  const [clientDni, setClientDni] = useState<string>('72891402');
  const [notes, setNotes] = useState<string>('');
  const [bookingFormError, setBookingFormError] = useState<string | null>(null);

  // Generated Booking Result
  const [createdBooking, setCreatedBooking] = useState<any | null>(null);

  // Filter services available for current type
  const availableServices = useMemo(() => {
    return services.filter((s) => {
      if (!s.active) return false;
      if (selectedType === 'mixto') return true;
      return s.category === selectedType;
    });
  }, [selectedType, services]);

  // Totals
  const totalPriceCents = selectedServices.reduce((acc, s) => acc + s.price_cents, 0);
  const totalDurationMinutes = selectedServices.reduce((acc, s) => acc + s.duration_minutes, 0);
  const minAdvanceCents = Math.round((totalPriceCents * paymentSettings.advance_percentage) / 100);

  const toggleServiceSelection = (srv: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === srv.id);
      if (exists) {
        return prev.filter((s) => s.id !== srv.id);
      } else {
        return [...prev, srv];
      }
    });
  };

  // Dynamic available time slots based on employee leaves and blocks
  const availableSlots = useMemo(() => {
    const baseSlots = [
      '09:00', '10:00', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '19:45'
    ];

    return baseSlots.map((slotTime) => {
      const [sh, sm] = slotTime.split(':').map(Number);
      const endMins = sh * 60 + sm + (totalDurationMinutes || 45);
      const endH = Math.floor(endMins / 60);
      const endM = endMins % 60;
      const slotEndTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      // Check if at least one qualified active employee is free on this slot
      const hasFreeSpecialist = (employees || []).some((emp) => {
        if (!emp.active) return false;
        const canDoService = selectedServices.length === 0 || selectedServices.some((s) => emp.skills?.includes(s.id));
        if (!canDoService) return false;

        const isBlocked = (employeeBlocks || []).some((b) => {
          if (b.employee_id !== emp.id) return false;
          const bDate = b.block_date || b.date || b.start_date;
          const bEndDate = b.end_date || bDate;
          const inDate = bDate && bEndDate ? bookingDate >= bDate && bookingDate <= bEndDate : bDate === bookingDate;
          if (!inDate) return false;
          if (b.is_full_day || (!b.start_time && !b.end_time)) return true;
          const bStart = b.start_time || '00:00';
          const bEnd = b.end_time || '23:59';
          return slotTime < bEnd && slotEndTime > bStart;
        });

        return !isBlocked;
      });

      return {
        time: slotTime,
        available: hasFreeSpecialist,
      };
    });
  }, [employees, employeeBlocks, bookingDate, selectedServices, totalDurationMinutes]);

  const handleFinishBooking = () => {
    setBookingFormError(null);
    if (!clientName.trim()) {
      setBookingFormError('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!isValidPhone(clientPhone)) {
      alert(PHONE_ERROR_MESSAGE);
      setBookingFormError(PHONE_ERROR_MESSAGE);
      return;
    }
    if (clientDni.trim() && !isValidDni(clientDni)) {
      alert(DNI_ERROR_MESSAGE);
      setBookingFormError(DNI_ERROR_MESSAGE);
      return;
    }

    // Calculate end time
    const [startH, startM] = selectedSlot.split(':').map(Number);
    const totalMinutes = startH * 60 + startM + (totalDurationMinutes || 45);
    const endH = Math.floor(totalMinutes / 60);
    const endM = totalMinutes % 60;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    // Map services to available employees (excluding those with active leave blocks)
    const mappedServices: BookingServiceItem[] = selectedServices.map((srv) => {
      const specialist =
        (employees || []).find((e) => {
          if (!e.skills?.includes(srv.id) || !e.active) return false;
          const isBlocked = (employeeBlocks || []).some((b) => {
            if (b.employee_id !== e.id) return false;
            const bDate = b.block_date || b.date || b.start_date;
            const bEndDate = b.end_date || bDate;
            const inDate = bDate && bEndDate ? bookingDate >= bDate && bookingDate <= bEndDate : bDate === bookingDate;
            if (!inDate) return false;
            if (b.is_full_day || (!b.start_time && !b.end_time)) return true;
            const bStart = b.start_time || '00:00';
            const bEnd = b.end_time || '23:59';
            return selectedSlot < bEnd && endTimeStr > bStart;
          });
          return !isBlocked;
        }) ||
        (employees || []).find((e) => e.active) ||
        employees?.[0] || {
          id: 'emp-1',
          full_name: 'Especialista de Turno',
          role: 'empleado',
          type: 'barberia',
          skills: [],
          active: true,
          phone: '+51 987 654 321',
        };
      return {
        service_id: srv.id,
        service_name: srv.name,
        employee_id: specialist.id,
        employee_name: specialist.full_name,
        price_cents: srv.price_cents,
        duration_minutes: srv.duration_minutes,
      };
    });

    const newBooking = addBooking({
      client_name: clientName,
      client_phone: clientPhone,
      client_email: clientEmail || 'cliente@acicalados.pe',
      client_dni: clientDni,
      date: bookingDate,
      start_time: selectedSlot,
      end_time: endTimeStr,
      type: selectedType,
      services: mappedServices,
      total_price_cents: totalPriceCents,
      advance_amount_cents: 0,
      status: 'pendiente',
      payment_status: 'sin_pago',
      notes,
    });

    setCreatedBooking(newBooking);
    setCurrentStep(5);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C8A45C', '#DFCA8D', '#22C55E', '#FFFFFF'],
      });
    } catch {
      // ignore
    }
  };

  const stepsLabels = [
    { num: 1, label: 'Tipo' },
    { num: 2, label: 'Servicios' },
    { num: 3, label: 'Fecha y Hora' },
    { num: 4, label: 'Datos Contacto' },
    { num: 5, label: 'Pago de Adelanto' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Step Indicator Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[#C8A45C]">
          Asistente de Reserva en 5 Pasos
        </span>
        <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white">
          Agendar Cita en Acicalados
        </h1>
      </div>

      {/* Steps Breadcrumbs */}
      <div className="flex items-center justify-between max-w-2xl mx-auto px-2">
        {stepsLabels.map((s, idx) => {
          const isDone = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          return (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    isDone
                      ? 'bg-emerald-500 text-black'
                      : isCurrent
                      ? 'bg-[#C8A45C] text-black ring-4 ring-[#C8A45C]/20'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[10px] hidden sm:block ${
                    isCurrent ? 'text-[#E6C875] font-semibold' : 'text-neutral-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < stepsLabels.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    currentStep > s.num ? 'bg-emerald-500' : 'bg-neutral-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* STEP 1: Type Selection */}
      {currentStep === 1 && (
        <div className="bg-[#141414] border border-[#C8A45C]/25 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="font-serif-luxury text-lg font-bold text-white">
              Paso 1: ¿Qué tipo de experiencia buscas hoy?
            </h3>
            <p className="text-xs text-neutral-400">
              Selecciona si deseas servicios de barbería, tratamientos de spa o combinar ambos en tu visita.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setSelectedType('barberia')}
              className={`p-5 rounded-xl text-left border transition flex flex-col justify-between space-y-4 ${
                selectedType === 'barberia'
                  ? 'bg-[#1F1C14] border-[#C8A45C] shadow-lg shadow-[#C8A45C]/10'
                  : 'bg-[#181818] border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-[#C8A45C]/15 border border-[#C8A45C]/30 flex items-center justify-center text-[#C8A45C]">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif-luxury font-bold text-sm text-white">Barbería Clásica</h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Degradados, afeitado a navaja, ritual de toalla caliente y cuidado de barba.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-[#C8A45C]">Especialistas barberos</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('spa')}
              className={`p-5 rounded-xl text-left border transition flex flex-col justify-between space-y-4 ${
                selectedType === 'spa'
                  ? 'bg-[#1F1C14] border-[#C8A45C] shadow-lg shadow-[#C8A45C]/10'
                  : 'bg-[#181818] border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-purple-900/20 border border-purple-800/40 flex items-center justify-center text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif-luxury font-bold text-sm text-white">Spa & Estética</h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Masajes descontracturantes, limpieza facial profunda, manicure y pedicure.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-purple-400">Terapeutas calificadas</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedType('mixto')}
              className={`p-5 rounded-xl text-left border transition flex flex-col justify-between space-y-4 ${
                selectedType === 'mixto'
                  ? 'bg-[#1F1C14] border-[#C8A45C] shadow-lg shadow-[#C8A45C]/10'
                  : 'bg-[#181818] border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-blue-900/20 border border-blue-800/40 flex items-center justify-center text-blue-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif-luxury font-bold text-sm text-white">Experiencia Mixta</h4>
                <p className="text-xs text-neutral-400 mt-1">
                  Combina servicios de barbería y spa en una misma cita con especialistas asignados.
                </p>
              </div>
              <span className="text-[11px] font-semibold text-blue-400">Atención coordinada</span>
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#C8A45C] hover:bg-[#D4AF37] text-black transition flex items-center gap-2"
            >
              <span>Continuar a Selección de Servicios</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Service Selection */}
      {currentStep === 2 && (
        <div className="bg-[#141414] border border-[#C8A45C]/25 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-4">
            <div>
              <h3 className="font-serif-luxury text-lg font-bold text-white">
                Paso 2: Elige tus servicios
              </h3>
              <p className="text-xs text-neutral-400">
                Puedes seleccionar uno o varios servicios para tu sesión.
              </p>
            </div>

            <div className="text-right bg-[#1A1A1A] px-3.5 py-2 rounded-xl border border-neutral-800">
              <span className="text-[11px] text-neutral-400 block">Total acumulado ({selectedServices.length} srv):</span>
              <span className="text-base font-bold text-[#E6C875]">{formatSoles(totalPriceCents)}</span>
              <span className="text-[10px] text-neutral-500 block">⏱️ {totalDurationMinutes} min</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableServices.map((service) => {
              const isSelected = selectedServices.some((s) => s.id === service.id);
              return (
                <div
                  key={service.id}
                  onClick={() => toggleServiceSelection(service)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#1C1A14] border-[#C8A45C] shadow-sm'
                      : 'bg-[#181818] border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs border ${
                          isSelected
                            ? 'bg-[#C8A45C] text-black border-[#C8A45C]'
                            : 'border-neutral-700 bg-neutral-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </span>
                      <h4 className="text-xs font-semibold text-white">{service.name}</h4>
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 pl-7">
                      {service.description}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] pl-7 pt-1 text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#C8A45C]" />
                        <span>{service.duration_minutes} min</span>
                      </span>
                      <span
                        className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          service.category === 'barberia' ? 'badge-gold' : 'bg-purple-900/30 text-purple-300'
                        }`}
                      >
                        {service.category}
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-bold text-[#E6C875] whitespace-nowrap">
                    {formatSoles(service.price_cents)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Advance calculation alert */}
          <div className="bg-[#181611] border border-[#C8A45C]/30 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-[#C8A45C]" />
              <span>Adelanto del 25% requerido para confirmar:</span>
            </div>
            <span className="font-bold text-[#E6C875]">{formatSoles(minAdvanceCents)}</span>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>

            <button
              type="button"
              disabled={selectedServices.length === 0}
              onClick={() => setCurrentStep(3)}
              className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                selectedServices.length > 0
                  ? 'bg-[#C8A45C] hover:bg-[#D4AF37] text-black shadow'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <span>Continuar a Fecha y Horario</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Date & Time Picker */}
      {currentStep === 3 && (
        <div className="bg-[#141414] border border-[#C8A45C]/25 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-1 border-b border-neutral-800 pb-4">
            <h3 className="font-serif-luxury text-lg font-bold text-white">
              Paso 3: Fecha y Horario de Atención
            </h3>
            <p className="text-xs text-neutral-400">
              Zona Horaria Oficial: America/Lima (UTC-5). Los turnos no disponibles ya han alcanzado el aforo máximo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
            {/* Date Input */}
            <div className="sm:col-span-5 space-y-2">
              <label className="text-xs font-semibold text-neutral-300 block">
                Selecciona el Día:
              </label>
              <input
                type="date"
                value={bookingDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-white text-xs rounded-xl px-4 py-3 outline-none transition"
              />
              <p className="text-[11px] text-neutral-500">
                Atención continuada de 08:30 a 21:00 hrs.
              </p>
            </div>

            {/* Time Slots */}
            <div className="sm:col-span-7 space-y-2">
              <label className="text-xs font-semibold text-neutral-300 block">
                Horarios Disponibles para {bookingDate}:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition text-center ${
                      selectedSlot === slot.time
                        ? 'bg-[#C8A45C] text-black shadow font-bold'
                        : slot.available
                        ? 'bg-[#181818] text-neutral-300 hover:bg-[#222222] border border-neutral-800'
                        : 'bg-neutral-900/60 text-neutral-600 border border-neutral-800/40 cursor-not-allowed line-through'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#C8A45C] hover:bg-[#D4AF37] text-black shadow transition flex items-center gap-2"
            >
              <span>Continuar a Datos Personales</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Contact Information */}
      {currentStep === 4 && (
        <div className="bg-[#141414] border border-[#C8A45C]/25 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="space-y-1 border-b border-neutral-800 pb-4">
            <h3 className="font-serif-luxury text-lg font-bold text-white">
              Paso 4: Datos de Contacto
            </h3>
            <p className="text-xs text-neutral-400">
              Ingresa tus datos para registrar la reserva y emitir tu comprobante.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300">Nombres y Apellidos *</label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ej: Sebastián Alarcón Peña"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-white text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-neutral-300">Teléfono WhatsApp *</label>
                <span className="text-[10px] text-neutral-500 font-mono">9 dígitos</span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{9}"
                  maxLength={9}
                  required
                  placeholder={PHONE_PLACEHOLDER}
                  value={clientPhone}
                  onKeyDown={handleNumericKeyDown}
                  onChange={(e) => {
                    setClientPhone(sanitizePhone(e.target.value));
                    if (bookingFormError) setBookingFormError(null);
                  }}
                  className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-white text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none transition font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-neutral-300">DNI / Documento</label>
                <span className="text-[10px] text-neutral-500 font-mono">8 dígitos</span>
              </div>
              <div className="relative">
                <FileText className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{8}"
                  maxLength={8}
                  placeholder={DNI_PLACEHOLDER}
                  value={clientDni}
                  onKeyDown={handleNumericKeyDown}
                  onChange={(e) => {
                    setClientDni(sanitizeDni(e.target.value));
                    if (bookingFormError) setBookingFormError(null);
                  }}
                  className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-white text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none transition font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-300">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="email"
                  placeholder="cliente@gmail.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-white text-xs rounded-xl pl-9 pr-3 py-2.5 outline-none transition"
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-neutral-300">Notas Adicionales (Opcional)</label>
              <textarea
                rows={2}
                placeholder="Indica preferencias de bebidas, requerimientos especiales o alergias..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-white text-xs rounded-xl p-3 outline-none transition"
              />
            </div>
          </div>

          {bookingFormError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 flex items-center gap-2.5 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{bookingFormError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>

            <button
              type="button"
              disabled={!clientName.trim() || !isValidPhone(clientPhone) || (Boolean(clientDni.trim()) && !isValidDni(clientDni))}
              onClick={handleFinishBooking}
              className={`px-7 py-3 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                clientName.trim() && isValidPhone(clientPhone) && (!clientDni.trim() || isValidDni(clientDni))
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#C8A45C] text-black shadow-lg hover:from-[#DFCA8D] hover:to-[#D4AF37]'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar y Ver Instrucciones de Pago</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Success & Payment QR Widget */}
      {currentStep === 5 && createdBooking && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          {/* Booking Confirmation Card */}
          <div className="bg-[#141414] border border-[#C8A45C]/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                    ¡Reserva Registrada Exitosamente!
                  </span>
                  <h3 className="font-serif-luxury text-xl font-bold text-white">
                    Código de Cita: #{createdBooking.code}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openTicketModal('booking', createdBooking)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#1F1F1F] hover:bg-[#252525] text-[#E6C875] border border-[#C8A45C]/30 flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Ver Ticket Térmico</span>
                </button>
              </div>
            </div>

            {/* Appointment Summary Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#181818] p-4 rounded-xl border border-neutral-800 text-xs">
              <div>
                <span className="text-neutral-500 block text-[11px]">Fecha y Hora:</span>
                <span className="font-bold text-white">
                  {createdBooking.date} a las {createdBooking.start_time} - {createdBooking.end_time}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Cliente:</span>
                <span className="font-bold text-white">{createdBooking.client_name}</span>
                <span className="text-neutral-400 block text-[10px]">{createdBooking.client_phone}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Presupuesto Total:</span>
                <span className="font-bold text-[#E6C875] text-sm">
                  {formatSoles(createdBooking.total_price_cents)}
                </span>
              </div>
            </div>

            {/* Selected Services Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-400">Servicios Reservados:</span>
              <div className="space-y-1.5">
                {createdBooking.services.map((s: BookingServiceItem, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-2.5 rounded-lg bg-[#181818] border border-neutral-800 text-xs"
                  >
                    <div>
                      <span className="font-medium text-white">{s.service_name}</span>
                      <span className="text-neutral-500 text-[10px] ml-2">({s.duration_minutes} min)</span>
                    </div>
                    <span className="font-bold text-[#E6C875]">{formatSoles(s.price_cents)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment QR Widget with 25% minimum advance */}
          <PaymentQRWidget
            amountCents={minAdvanceCents}
            bookingCode={createdBooking.code}
            clientName={createdBooking.client_name}
            title={`Abonar Adelanto Mínimo del 25% (${formatSoles(minAdvanceCents)})`}
          />

          <div className="text-center pt-4">
            <button
              onClick={() => setActiveView('/mi-cuenta')}
              className="text-xs text-[#C8A45C] hover:underline font-medium"
            >
              Ir a Mi Cuenta para consultar el estado de esta reserva →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
