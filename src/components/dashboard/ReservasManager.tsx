import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Booking, BookingStatus, formatSoles, formatLimaDate, PaymentLog, Service, Employee } from '../../types';
import { getTodayDateString } from '../../data/initialData';
import {
  BookOpen,
  Plus,
  Settings,
  Search,
  Filter,
  DollarSign,
  Printer,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertTriangle,
  Scissors,
  Sparkles,
  Shield,
  Trash2,
} from 'lucide-react';

export const ReservasManager: React.FC = () => {
  const {
    bookings,
    services,
    employees,
    paymentLogs,
    currentRole,
    paymentSettings,
    updatePaymentSettings,
    registerBookingPayment,
    voidPayment,
    updateBookingStatus,
    liberateServiceEarly,
    addBooking,
    openTicketModal,
  } = useApp();

  // Filters
  const [dateFilter, setDateFilter] = useState<'hoy' | 'manana' | 'todas' | 'custom'>('todas');
  const [customDate, setCustomDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Expandable Row State
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  // Modals
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [selectedBookingForHistory, setSelectedBookingForHistory] = useState<Booking | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Payment Form State
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'efectivo' | 'mixto'>('yape');
  const [payAmountInput, setPayAmountInput] = useState<string>('');
  const [cashAmountInput, setCashAmountInput] = useState<string>('');
  const [yapeAmountInput, setYapeAmountInput] = useState<string>('');

  // Voiding State
  const [voidReason, setVoidReason] = useState<string>('');
  const [voidingPaymentId, setVoidingPaymentId] = useState<string | null>(null);

  // Settings Form State
  const [tempAdvancePct, setTempAdvancePct] = useState<number>(paymentSettings.advance_percentage);
  const [tempYapePhone, setTempYapePhone] = useState<string>(paymentSettings.yape_phone);
  const [tempYapeHolder, setTempYapeHolder] = useState<string>(paymentSettings.yape_holder);

  // New Booking Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newDate, setNewDate] = useState(getTodayDateString());
  const [newStartTime, setNewStartTime] = useState('11:00');
  const [newType, setNewType] = useState<'barberia' | 'spa' | 'mixto'>('barberia');
  const [newSelectedServiceId, setNewSelectedServiceId] = useState<string>(services[0]?.id || '');
  const [newEmployeeId, setNewEmployeeId] = useState<string>(employees[0]?.id || '');

  const todayStr = getTodayDateString();

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Date filter
      if (dateFilter === 'hoy' && b.date !== todayStr) return false;
      if (dateFilter === 'manana') {
        const t = new Date();
        t.setDate(t.getDate() + 1);
        const mananaStr = t.toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
        if (b.date !== mananaStr) return false;
      }
      if (dateFilter === 'custom' && customDate && b.date !== customDate) return false;

      // Status filter
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && b.type !== categoryFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.client_name.toLowerCase().includes(q) ||
          b.client_phone.includes(q) ||
          b.code.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [bookings, categoryFilter, customDate, dateFilter, searchQuery, statusFilter, todayStr]);

  // Open Payment Modal
  const handleOpenPaymentModal = (b: Booking) => {
    setSelectedBookingForPayment(b);
    const saldo = Math.max(0, b.total_price_cents - b.advance_amount_cents);
    setPayAmountInput((saldo / 100).toFixed(2));
    setPaymentMethod('yape');
    setCashAmountInput('');
    setYapeAmountInput('');
    setIsPaymentModalOpen(true);
  };

  // Submit Payment
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForPayment) return;

    let amountCents = Math.round(parseFloat(payAmountInput || '0') * 100);
    let cashCents = 0;
    let yapeCents = 0;

    if (paymentMethod === 'mixto') {
      cashCents = Math.round(parseFloat(cashAmountInput || '0') * 100);
      yapeCents = Math.round(parseFloat(yapeAmountInput || '0') * 100);
      amountCents = cashCents + yapeCents;
    } else if (paymentMethod === 'efectivo') {
      cashCents = amountCents;
    } else {
      yapeCents = amountCents;
    }

    if (amountCents <= 0) return;

    registerBookingPayment(
      selectedBookingForPayment.id,
      amountCents,
      paymentMethod,
      cashCents,
      yapeCents
    );

    setIsPaymentModalOpen(false);
  };

  // Handle Void Payment (Admin only with audit reason >= 5 chars)
  const handleVoidPaymentConfirm = (paymentId: string) => {
    if (voidReason.trim().length < 5) {
      alert('Debe ingresar un motivo de auditoría de al menos 5 caracteres.');
      return;
    }
    voidPayment(paymentId, voidReason);
    setVoidingPaymentId(null);
    setVoidReason('');
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePaymentSettings({
      advance_percentage: Number(tempAdvancePct),
      yape_phone: tempYapePhone,
      yape_holder: tempYapeHolder,
    });
    setIsSettingsModalOpen(false);
  };

  // Create Manual Booking
  const handleCreateNewBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientPhone) return;

    const srv = (services || []).find((s) => s.id === newSelectedServiceId) || services?.[0];
    const emp = (employees || []).find((e) => e.id === newEmployeeId) || employees?.[0];
    if (!srv || !emp) return;

    const [h, m] = newStartTime.split(':').map(Number);
    const endMinutes = h * 60 + m + srv.duration_minutes;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    addBooking({
      client_name: newClientName,
      client_phone: newClientPhone,
      client_email: 'recepcion@acicalados.pe',
      date: newDate,
      start_time: newStartTime,
      end_time: endTimeStr,
      type: newType,
      services: [
        {
          service_id: srv.id,
          service_name: srv.name,
          employee_id: emp.id,
          employee_name: emp.full_name,
          price_cents: srv.price_cents,
          duration_minutes: srv.duration_minutes,
        },
      ],
      total_price_cents: srv.price_cents,
      advance_amount_cents: 0,
      status: 'pendiente',
      payment_status: 'sin_pago',
    });

    setIsNewBookingModalOpen(false);
    setNewClientName('');
    setNewClientPhone('');
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1">
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Tablero Maestro de Reservas & Caja
          </h1>
          <p className="text-xs text-neutral-400">
            Control de citas, cobro de adelantos (25%), liberación anticipada e impresión térmica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentRole === 'admin' && (
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-neutral-300 hover:text-white bg-[#181818] hover:bg-[#202020] border border-neutral-800 flex items-center gap-1.5 transition"
            >
              <Settings className="w-3.5 h-3.5 text-[#C8A45C]" />
              <span>Configurar Pagos Yape</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsNewBookingModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#C8A45C] hover:bg-[#D4AF37] text-black shadow transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Reserva Manual</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Fast Date Filters */}
          <div className="flex items-center gap-1.5">
            {(['todas', 'hoy', 'manana'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  dateFilter === d
                    ? 'bg-[#C8A45C] text-black font-semibold'
                    : 'bg-[#1A1A1A] text-neutral-400 hover:text-white'
                }`}
              >
                {d === 'todas' ? 'Todas' : d === 'hoy' ? 'Hoy' : 'Mañana'}
              </button>
            ))}

            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setDateFilter('custom');
              }}
              className="bg-[#1A1A1A] border border-neutral-800 text-xs text-white px-2.5 py-1.5 rounded-lg outline-none"
            />
          </div>

          {/* Status and Category Dropdowns */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1A1A1A] border border-neutral-800 text-xs text-neutral-300 px-3 py-1.5 rounded-lg outline-none"
            >
              <option value="all">Estado Cita: Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#1A1A1A] border border-neutral-800 text-xs text-neutral-300 px-3 py-1.5 rounded-lg outline-none"
            >
              <option value="all">Categoría: Todas</option>
              <option value="barberia">Barbería</option>
              <option value="spa">Spa</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>

          {/* Search Query */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar cliente, teléfono, código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-xs text-white rounded-lg pl-8 pr-3 py-1.5 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#141414] border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181818] text-neutral-400 font-semibold border-b border-neutral-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Fecha / Horario</th>
                <th className="py-3.5 px-4">Servicios</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-right">Cobrado</th>
                <th className="py-3.5 px-4 text-right">Saldo</th>
                <th className="py-3.5 px-4 text-center">Estado Cita</th>
                <th className="py-3.5 px-4 text-center">Estado Pago</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-neutral-500">
                    No se encontraron reservas con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const saldo = Math.max(0, b.total_price_cents - b.advance_amount_cents);
                  const isExpanded = expandedBookingId === b.id;

                  return (
                    <React.Fragment key={b.id}>
                      <tr className="hover:bg-[#1A1813]/40 transition group">
                        {/* Code */}
                        <td className="py-3 px-4 font-mono font-bold text-[#E6C875]">
                          <button
                            type="button"
                            onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                            className="flex items-center gap-1 hover:underline"
                          >
                            <span>#{b.code}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </td>

                        {/* Client */}
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white block">{b.client_name}</span>
                          <span className="text-[10px] text-neutral-500">{b.client_phone}</span>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3 px-4 text-neutral-300">
                          <span className="block font-medium">{formatLimaDate(b.date)}</span>
                          <span className="text-[10px] text-neutral-500">
                            {b.start_time} - {b.end_time}
                          </span>
                        </td>

                        {/* Services Count */}
                        <td className="py-3 px-4 text-neutral-300">
                          <span className="capitalize">{b.type}</span>
                          <span className="text-[10px] text-neutral-500 block">
                            {b.services.length} {b.services.length === 1 ? 'servicio' : 'servicios'}
                          </span>
                        </td>

                        {/* Total */}
                        <td className="py-3 px-4 text-right font-bold text-white">
                          {formatSoles(b.total_price_cents)}
                        </td>

                        {/* Advance Paid */}
                        <td className="py-3 px-4 text-right font-semibold text-emerald-400">
                          {formatSoles(b.advance_amount_cents)}
                        </td>

                        {/* Pending Balance */}
                        <td className="py-3 px-4 text-right font-bold text-[#E6C875]">
                          {formatSoles(saldo)}
                        </td>

                        {/* Booking Status Badge */}
                        <td className="py-3 px-4 text-center">
                          <select
                            value={b.status}
                            onChange={(e) => updateBookingStatus(b.id, e.target.value as BookingStatus)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer outline-none ${
                              b.status === 'confirmada'
                                ? 'badge-success'
                                : b.status === 'completada'
                                ? 'badge-gold'
                                : b.status === 'pendiente'
                                ? 'badge-warning'
                                : 'badge-error'
                            }`}
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="confirmada">Confirmada</option>
                            <option value="completada">Completada</option>
                            <option value="cancelada">Cancelada</option>
                          </select>
                        </td>

                        {/* Payment Status Badge */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                              b.payment_status === 'total'
                                ? 'badge-success'
                                : b.payment_status === 'parcial'
                                ? 'badge-warning'
                                : 'badge-error'
                            }`}
                          >
                            {b.payment_status === 'total'
                              ? 'PAGADO COMPLETO'
                              : b.payment_status === 'parcial'
                              ? 'SALDO PENDIENTE'
                              : 'SIN PAGO'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Pay Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(b)}
                              className="px-2.5 py-1 rounded bg-[#C8A45C] hover:bg-[#D4AF37] text-black font-semibold text-[11px] transition shadow"
                              title="Registrar cobro"
                            >
                              💳 Cobrar
                            </button>

                            {/* Payment History & Audit */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBookingForHistory(b);
                                setIsHistoryModalOpen(true);
                              }}
                              className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
                              title="Historial de pagos y auditoría"
                            >
                              📜
                            </button>

                            {/* Print Ticket */}
                            <button
                              type="button"
                              onClick={() => openTicketModal('booking', b)}
                              className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
                              title="Imprimir ticket térmico"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* WhatsApp Notification */}
                            <a
                              href={`https://wa.me/${b.client_phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                `¡Hola ${b.client_name}! Te confirmamos tu cita #${b.code} en Acicalados para el ${b.date} a las ${b.start_time}. Saldo pendiente: ${formatSoles(saldo)}.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded bg-neutral-800 hover:bg-emerald-900/50 text-emerald-400 transition"
                              title="Enviar recordatorio WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Row with Services & Early Release */}
                      {isExpanded && (
                        <tr className="bg-[#111111] border-b border-neutral-800">
                          <td colSpan={10} className="p-4 sm:p-5">
                            <div className="space-y-3 max-w-4xl mx-auto">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#E6C875] uppercase tracking-wider">
                                  Detalle de Servicios Individuales & Asignación de Especialistas
                                </span>
                                <span className="text-[11px] text-neutral-400">
                                  Puedes liberar a un especialista si concluye la atención antes del horario previsto.
                                </span>
                              </div>

                              <div className="space-y-2">
                                {b.services.map((srv, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="p-3 rounded-lg bg-[#181818] border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs"
                                  >
                                    <div>
                                      <span className="font-semibold text-white block">
                                        {srv.service_name}
                                      </span>
                                      <span className="text-[10px] text-neutral-400">
                                        Colaborador: <span className="text-neutral-200 font-medium">{srv.employee_name}</span> • Duración: {srv.duration_minutes} min
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                      <span className="font-bold text-[#E6C875]">
                                        {formatSoles(srv.price_cents)}
                                      </span>

                                      {srv.liberado_at ? (
                                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 text-[10px] font-semibold">
                                          ✓ Liberado a las {srv.liberado_at}
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => liberateServiceEarly(b.id, sIdx)}
                                          className="px-2.5 py-1 rounded text-[10px] font-semibold bg-neutral-800 hover:bg-emerald-700 text-neutral-200 hover:text-white transition"
                                        >
                                          Liberar Especialista
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Registrar Pago */}
      {isPaymentModalOpen && selectedBookingForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#C8A45C]/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-serif-luxury text-base font-bold text-white">
                  Registrar Cobro en Caja
                </h3>
                <p className="text-xs text-neutral-400">
                  Reserva #{selectedBookingForPayment.code} - {selectedBookingForPayment.client_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Summary */}
            <div className="bg-[#181818] p-3 rounded-xl border border-neutral-800 grid grid-cols-3 gap-2 text-xs text-center">
              <div>
                <span className="text-neutral-500 block text-[10px]">Total Cita:</span>
                <span className="font-bold text-white">
                  {formatSoles(selectedBookingForPayment.total_price_cents)}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">Ya Cobrado:</span>
                <span className="font-bold text-emerald-400">
                  {formatSoles(selectedBookingForPayment.advance_amount_cents)}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">Saldo Pendiente:</span>
                <span className="font-bold text-[#E6C875]">
                  {formatSoles(
                    Math.max(
                      0,
                      selectedBookingForPayment.total_price_cents -
                        selectedBookingForPayment.advance_amount_cents
                    )
                  )}
                </span>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-300 font-medium">Método de Pago:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['yape', 'efectivo', 'mixto'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-lg font-semibold capitalize transition ${
                        paymentMethod === m
                          ? 'bg-[#C8A45C] text-black shadow'
                          : 'bg-[#1E1E1E] text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'mixto' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-neutral-400">Monto en Efectivo (S/)</label>
                    <input
                      type="number"
                      step="0.10"
                      required
                      placeholder="0.00"
                      value={cashAmountInput}
                      onChange={(e) => setCashAmountInput(e.target.value)}
                      className="w-full bg-[#181818] border border-neutral-800 text-white rounded-lg p-2 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-neutral-400">Monto en Yape (S/)</label>
                    <input
                      type="number"
                      step="0.10"
                      required
                      placeholder="0.00"
                      value={yapeAmountInput}
                      onChange={(e) => setYapeAmountInput(e.target.value)}
                      className="w-full bg-[#181818] border border-neutral-800 text-white rounded-lg p-2 outline-none font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-neutral-300 font-medium">
                    Monto Recibido en {paymentMethod === 'yape' ? 'Yape' : 'Efectivo'} (S/):
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={payAmountInput}
                    onChange={(e) => setPayAmountInput(e.target.value)}
                    className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-lg font-bold text-[#E6C875] rounded-xl p-3 outline-none"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-semibold bg-[#C8A45C] hover:bg-[#D4AF37] text-black shadow"
                >
                  Guardar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Historial de Pagos & Anulación Auditada */}
      {isHistoryModalOpen && selectedBookingForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div>
                <h3 className="font-serif-luxury text-base font-bold text-white">
                  Auditoría de Pagos - Cita #{selectedBookingForHistory.code}
                </h3>
                <p className="text-xs text-neutral-400">{selectedBookingForHistory.client_name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of payments for this booking */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {paymentLogs
                .filter((p) => p.booking_id === selectedBookingForHistory.id)
                .map((p) => (
                  <div
                    key={p.id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                      p.voided
                        ? 'bg-red-950/20 border-red-900/40 text-neutral-400'
                        : 'bg-[#181818] border-neutral-800 text-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#E6C875]">
                          {formatSoles(p.amount_cents)}
                        </span>
                        <span className="uppercase text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                          {p.payment_method}
                        </span>
                        {p.voided && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-900/40 text-red-300 font-bold">
                            ANULADO
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500 block mt-0.5">
                        {p.created_at.replace('T', ' ').substring(0, 16)}
                      </span>
                      {p.voided && p.voided_reason && (
                        <span className="text-[10px] text-red-400 block mt-1">
                          Motivo: {p.voided_reason} (por {p.voided_by})
                        </span>
                      )}
                    </div>

                    {!p.voided && currentRole === 'admin' && (
                      <button
                        type="button"
                        onClick={() => setVoidingPaymentId(p.id)}
                        className="px-2.5 py-1 rounded text-[10px] font-semibold bg-red-950/40 text-red-300 hover:bg-red-900 border border-red-800/40 transition"
                      >
                        Anular Pago
                      </button>
                    )}
                  </div>
                ))}
            </div>

            {/* Voiding Reason Prompt */}
            {voidingPaymentId && (
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-900/50 space-y-2 text-xs">
                <span className="text-red-300 font-bold block">
                  Auditoría Requerida: Ingrese motivo de anulación (mínimo 5 caracteres)
                </span>
                <input
                  type="text"
                  placeholder="Ej: Error en digitación de monto por cliente..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="w-full bg-[#181818] border border-red-800 text-white rounded-lg p-2 outline-none"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setVoidingPaymentId(null);
                      setVoidReason('');
                    }}
                    className="px-3 py-1 rounded bg-neutral-800 text-neutral-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVoidPaymentConfirm(voidingPaymentId)}
                    className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white font-bold shadow"
                  >
                    Confirmar Anulación
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: Configurar Pagos Yape (Admin Only) */}
      {isSettingsModalOpen && currentRole === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#C8A45C]/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="font-serif-luxury text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#C8A45C]" />
                <span>Configuración de Pagos & Yape</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-300 font-medium">Porcentaje Mínimo de Adelanto (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={tempAdvancePct}
                  onChange={(e) => setTempAdvancePct(Number(e.target.value))}
                  className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 outline-none font-bold text-sm"
                />
                <span className="text-[10px] text-neutral-500">
                  Por regla oficial es 25%. Al recibir este monto, la cita pasa a confirmada.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-medium">Número Telefónico Yape Oficial</label>
                <input
                  type="text"
                  required
                  value={tempYapePhone}
                  onChange={(e) => setTempYapePhone(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300 font-medium">Titular de la Cuenta Yape</label>
                <input
                  type="text"
                  required
                  value={tempYapeHolder}
                  onChange={(e) => setTempYapeHolder(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-semibold bg-[#C8A45C] hover:bg-[#D4AF37] text-black shadow"
                >
                  Guardar Configuración
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Nueva Reserva Manual */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141414] border border-[#C8A45C]/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <h3 className="font-serif-luxury text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#C8A45C]" />
                <span>Crear Cita Manual en Recepción</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewBookingModalOpen(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewBooking} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-300">Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Nombre completo..."
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300">Teléfono WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="+51 987 654 321"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-neutral-300">Fecha</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-neutral-300">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300">Servicio a Realizar</label>
                <select
                  value={newSelectedServiceId}
                  onChange={(e) => setNewSelectedServiceId(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 outline-none"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatSoles(s.price_cents)} - {s.duration_minutes} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-neutral-300">Especialista Asignado</label>
                <select
                  value={newEmployeeId}
                  onChange={(e) => setNewEmployeeId(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl p-2.5 outline-none"
                >
                  {employees.filter((e) => e.active).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewBookingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-semibold bg-[#C8A45C] hover:bg-[#D4AF37] text-black shadow"
                >
                  Crear Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
