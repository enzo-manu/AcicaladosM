import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatSoles } from '../../types';
import { BarChart3, TrendingUp, DollarSign, Users, Award, Download, FileSpreadsheet } from 'lucide-react';

export const ReportesView: React.FC = () => {
  const { kpis, bookings, ventasMostrador, expenses, employees, services } = useApp();

  // Top services analysis
  const serviceStats = services.map((srv) => {
    const timesBooked = bookings.filter((b) =>
      b.services.some((s) => s.service_id === srv.id)
    ).length;
    const revenue = timesBooked * srv.price_cents;
    return {
      name: srv.name,
      category: srv.category,
      timesBooked,
      revenue,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Specialist commission calculations
  const employeeCommissions = employees.map((emp) => {
    const completedServices = bookings
      .filter((b) => b.status === 'completada' || b.status === 'confirmada')
      .flatMap((b) => b.services)
      .filter((s) => s.employee_id === emp.id);

    const totalGenerated = completedServices.reduce((acc, s) => acc + s.price_cents, 0);
    const estimatedCommission = Math.round((totalGenerated * emp.commission_percentage) / 100);

    return {
      name: emp.full_name,
      type: emp.type,
      servicesCount: completedServices.length,
      totalGenerated,
      commissionPercentage: emp.commission_percentage,
      estimatedCommission,
    };
  });

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Modulo,Fecha,Detalle,Monto Soles\n';

    bookings.forEach((b) => {
      csvContent += `Reserva,${b.date},Cita #${b.code} - ${b.client_name},${(b.total_price_cents / 100).toFixed(2)}\n`;
    });

    ventasMostrador.forEach((v) => {
      csvContent += `POS,${v.created_at.split('T')[0]},Ticket #${v.ticket_code} - ${v.product_name},${(v.total_price_cents / 100).toFixed(2)}\n`;
    });

    expenses.forEach((e) => {
      csvContent += `Egreso,${e.created_at.split('T')[0]},${e.concept},-${(e.amount_cents / 100).toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_acicalados_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1">
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Informes & Analítica de Rendimiento
          </h1>
          <p className="text-xs text-neutral-400">
            Rendimiento por servicio, liquidación de comisiones de especialistas y balance de caja.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#181818] hover:bg-[#222222] text-[#E6C875] border border-[#C8A45C]/30 shadow transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#C8A45C]" />
          <span>Exportar Datos en CSV</span>
        </button>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-[#141414] border border-[#C8A45C]/35 rounded-2xl p-5 space-y-2 shadow-xl">
          <span className="text-xs font-semibold text-neutral-400 block">Total Facturación Cobrada</span>
          <span className="font-serif-luxury text-2xl font-bold text-[#E6C875] block">
            {formatSoles(kpis.totalIngresosCents)}
          </span>
          <span className="text-[11px] text-neutral-500 block">Citas confirmadas + ventas mostrador</span>
        </div>

        <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 space-y-2 shadow-xl">
          <span className="text-xs font-semibold text-neutral-400 block">Egresos de Caja</span>
          <span className="font-serif-luxury text-2xl font-bold text-red-400 block">
            {formatSoles(kpis.totalEgresosCents)}
          </span>
          <span className="text-[11px] text-neutral-500 block">Insumos y mantenimiento</span>
        </div>

        <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-5 space-y-2 shadow-xl">
          <span className="text-xs font-semibold text-neutral-400 block">Margen Neto Operativo</span>
          <span className="font-serif-luxury text-2xl font-bold text-emerald-400 block">
            {formatSoles(kpis.balanceNetoCents)}
          </span>
          <span className="text-[11px] text-neutral-500 block">Beneficio neto disponible</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Top Services */}
        <div className="lg:col-span-6 bg-[#141414] border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="font-serif-luxury text-base font-bold text-white border-b border-neutral-800 pb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#C8A45C]" />
            <span>Servicios de Mayor Demanda</span>
          </h3>

          <div className="space-y-3">
            {serviceStats.slice(0, 5).map((s, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#181818] border border-neutral-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-white block">{s.name}</span>
                  <span className="text-[10px] text-neutral-400">
                    {s.timesBooked} veces agendado • {s.category}
                  </span>
                </div>
                <span className="font-bold text-[#E6C875]">{formatSoles(s.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Specialist Commissions */}
        <div className="lg:col-span-6 bg-[#141414] border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="font-serif-luxury text-base font-bold text-white border-b border-neutral-800 pb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#C8A45C]" />
            <span>Liquidación Estimada de Comisiones</span>
          </h3>

          <div className="space-y-3">
            {employeeCommissions.map((emp, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#181818] border border-neutral-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-white block">{emp.name}</span>
                  <span className="text-[10px] text-neutral-400">
                    {emp.type} • {emp.servicesCount} servicios atendidos ({emp.commissionPercentage}%)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold block">
                    {formatSoles(emp.estimatedCommission)}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    de {formatSoles(emp.totalGenerated)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
