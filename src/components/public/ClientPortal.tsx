import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatSoles, formatLimaDate, Booking } from '../../types';
import { PaymentQRWidget } from '../common/PaymentQRWidget';
import { User, Phone, FileText, Mail, Calendar, Printer, QrCode, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export const ClientPortal: React.FC = () => {
  const { currentUser, bookings, openTicketModal } = useApp();

  // Profile fields state
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState('+51 988 445 566');
  const [dni, setDni] = useState('72389104');
  const [email, setEmail] = useState(currentUser.email);
  const [profileSaved, setProfileSaved] = useState(false);

  // Selected booking to pay pending balance
  const [payingBooking, setPayingBooking] = useState<Booking | null>(null);

  // Find bookings belonging to this client or all matching mock
  const clientBookings = bookings.filter((b) =>
    b.client_name.toLowerCase().includes(name.toLowerCase().split(' ')[0]) ||
    b.client_phone.includes('988') ||
    b.code === 'AC-8492'
  );

  const displayBookings = clientBookings.length > 0 ? clientBookings : bookings.slice(0, 3);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C8A45C]">
            Portal de Autoservicio del Cliente
          </span>
          <h1 className="font-serif-luxury text-3xl font-bold text-white">
            Mi Cuenta & Mis Reservas
          </h1>
          <p className="text-xs text-neutral-400">
            Administra tus datos personales, consulta tus citas agendadas y liquida saldos pendientes vía código QR.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#161616] border border-neutral-800 p-2.5 rounded-xl self-start sm:self-auto">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-lg object-cover border border-[#C8A45C]/40"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="text-xs font-bold text-white block">{currentUser.name}</span>
            <span className="text-[10px] text-[#C8A45C] font-semibold uppercase">Cliente Frecuente</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile Editor Card */}
        <div className="lg:col-span-4 bg-[#141414] border border-[#C8A45C]/25 rounded-2xl p-6 space-y-6 shadow-xl">
          <h3 className="font-serif-luxury text-base font-bold text-white border-b border-neutral-800 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-[#C8A45C]" />
            <span>Datos del Titular</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-neutral-400">Nombres y Apellidos</label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-white rounded-xl pl-9 pr-3 py-2 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-400">Teléfono WhatsApp</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-white rounded-xl pl-9 pr-3 py-2 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-400">DNI / Documento de Identidad</label>
              <div className="relative">
                <FileText className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-white rounded-xl pl-9 pr-3 py-2 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-neutral-400">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-white rounded-xl pl-9 pr-3 py-2 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl font-semibold bg-[#C8A45C] hover:bg-[#D4AF37] text-black shadow transition"
            >
              {profileSaved ? '✓ Datos Guardados' : 'Actualizar Mis Datos'}
            </button>
          </form>
        </div>

        {/* Bookings History & Balance Payment */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#C8A45C]" />
                <h3 className="font-serif-luxury text-base font-bold text-white">
                  Historial de Citas & Estado de Pagos
                </h3>
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                {displayBookings.length} {displayBookings.length === 1 ? 'reserva' : 'reservas'}
              </span>
            </div>

            <div className="space-y-4">
              {displayBookings.map((b) => {
                const saldoPendiente = Math.max(0, b.total_price_cents - b.advance_amount_cents);
                const hasPendingBalance = saldoPendiente > 0;

                return (
                  <div
                    key={b.id}
                    className="bg-[#181818] border border-neutral-800 hover:border-[#C8A45C]/30 rounded-xl p-4 sm:p-5 space-y-4 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-[#E6C875] bg-black/40 px-2.5 py-1 rounded border border-neutral-800">
                          #{b.code}
                        </span>
                        <div>
                          <span className="text-xs font-semibold text-white block">
                            {formatLimaDate(b.date)} a las {b.start_time} - {b.end_time}
                          </span>
                          <span className="text-[10px] text-neutral-500 uppercase">
                            Categoría: {b.type}
                          </span>
                        </div>
                      </div>

                      {/* Payment Status Badge */}
                      <div className="flex items-center gap-2">
                        {b.payment_status === 'total' ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>PAGADO COMPLETO</span>
                          </span>
                        ) : b.payment_status === 'parcial' ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>SALDO PENDIENTE</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-red-950/60 text-red-300 border border-red-800/60 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>SIN PAGO</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => openTicketModal('booking', b)}
                          className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
                          title="Imprimir Ticket"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Services Detail */}
                    <div className="space-y-1">
                      {b.services.map((srv, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-neutral-300">
                          <span>• {srv.service_name} ({srv.duration_minutes} min)</span>
                          <span className="text-neutral-400">{formatSoles(srv.price_cents)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-[#121212] p-3 rounded-lg border border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-neutral-500 block text-[10px]">Total Cita:</span>
                        <span className="font-bold text-white">{formatSoles(b.total_price_cents)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[10px]">Adelanto Cobrado:</span>
                        <span className="font-semibold text-emerald-400">
                          {formatSoles(b.advance_amount_cents)}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[10px]">Saldo por Pagar:</span>
                        <span className="font-bold text-[#E6C875]">
                          {formatSoles(saldoPendiente)}
                        </span>
                      </div>

                      {hasPendingBalance && (
                        <button
                          type="button"
                          onClick={() => setPayingBooking(payingBooking?.id === b.id ? null : b)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#C8A45C] hover:bg-[#D4AF37] text-black shadow transition flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>{payingBooking?.id === b.id ? 'Ocultar QR' : 'Liquidar Saldo con QR'}</span>
                        </button>
                      )}
                    </div>

                    {/* Payment QR Widget to pay the remaining balance */}
                    {payingBooking?.id === b.id && (
                      <div className="pt-2 animate-in fade-in duration-200">
                        <PaymentQRWidget
                          amountCents={saldoPendiente}
                          bookingCode={b.code}
                          clientName={b.client_name}
                          title={`Liquidar Saldo Pendiente de Reserva #${b.code}`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
