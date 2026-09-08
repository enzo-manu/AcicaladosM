import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Home,
  Calendar,
  BookOpen,
  DollarSign,
  FileText,
  TrendingDown,
  Users,
  Clock,
  Sparkles,
  Shirt,
  Package,
  LogOut,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Radio,
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const { activeView, setActiveView, currentRole, currentUser, setCurrentRole, realtimeConnected, lastSyncTimestamp } = useApp();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Menu item matrix based on Section B.2
  const menuItems = [
    {
      view: '/dashboard',
      label: 'Inicio / Recepción',
      icon: <Home className="w-4 h-4" />,
      roles: ['admin', 'recepcionista', 'empleado'],
    },
    {
      view: '/dashboard/calendario',
      label: 'Calendario y Turnos',
      icon: <Calendar className="w-4 h-4" />,
      roles: ['admin', 'recepcionista'],
    },
    {
      view: '/dashboard/reservas',
      label: 'Reservas y Caja Citas',
      icon: <BookOpen className="w-4 h-4" />,
      roles: ['admin', 'recepcionista'],
    },
    {
      view: '/dashboard/ventas',
      label: 'Ventas Mostrador (POS)',
      icon: <DollarSign className="w-4 h-4" />,
      roles: ['admin', 'recepcionista'],
    },
    {
      view: '/dashboard/reportes',
      label: currentRole === 'recepcionista' ? 'Reportes (Día Actual)' : 'Reportes y Cierre Caja',
      icon: <FileText className="w-4 h-4" />,
      roles: ['admin', 'recepcionista'],
      badge: currentRole === 'recepcionista' ? 'Hoy' : undefined,
    },
    {
      view: '/dashboard/egresos',
      label: 'Egresos y Gastos',
      icon: <TrendingDown className="w-4 h-4" />,
      roles: ['admin', 'recepcionista'],
    },
    {
      view: '/dashboard/empleados',
      label: 'Personal y Asignaciones',
      icon: <Users className="w-4 h-4" />,
      roles: ['admin', 'recepcionista'],
    },
    {
      view: '/dashboard/asistencia',
      label: 'Asistencia y Scanner QR',
      icon: <Clock className="w-4 h-4" />,
      roles: ['admin', 'recepcionista', 'empleado'],
    },
    {
      view: '/dashboard/servicios',
      label: 'Catálogo de Servicios',
      icon: <Sparkles className="w-4 h-4" />,
      roles: ['admin', 'recepcionista'],
    },
    {
      view: '/dashboard/vestuario',
      label: 'Galería de Vestuario',
      icon: <Shirt className="w-4 h-4" />,
      roles: ['admin', 'recepcionista'],
    },
    {
      view: '/dashboard/productos',
      label: 'Catálogo de Productos',
      icon: <Package className="w-4 h-4" />,
      roles: ['admin', 'recepcionista'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(currentRole)
  );

  const handleNavigate = (view: string) => {
    setActiveView(view);
    setMobileDrawerOpen(false);
  };

  const handleLogout = () => {
    setCurrentRole('anon');
    setActiveView('/');
  };

  return (
    <>
      {/* Mobile Bar for Dashboard View */}
      <div className="lg:hidden flex items-center justify-between p-3.5 bg-[#111111] border-b border-[#C8A45C]/20 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-serif-luxury font-bold text-sm text-white">ACICALADOS DASHBOARD</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('/')}
            className="text-xs text-[#C8A45C] hover:underline flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Portal Web</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Main Sidebar (Desktop fixed 260px, Mobile drawer) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[260px] bg-[#0E0E0E] border-r border-[#C8A45C]/20 flex flex-col justify-between transition-transform duration-300 ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top 3px Golden Gradient Progress Indicator */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#9A7B38] via-[#E6C875] to-[#9A7B38]" />

        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-800/80">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleNavigate('/dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C8A45C] to-[#9A7B38] flex items-center justify-center text-black font-bold shadow">
                A
              </div>
              <div>
                <span className="font-serif-luxury text-sm font-bold text-white tracking-wider block">
                  ACICALADOS
                </span>
                <span className="text-[9px] uppercase tracking-widest text-[#C8A45C] font-semibold block">
                  Panel de Gestión v2.6
                </span>
              </div>
            </button>

            {mobileDrawerOpen && (
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="lg:hidden p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Realtime Supabase Connection Badge */}
          <div className="mt-3 flex items-center justify-between px-2.5 py-1 rounded bg-[#161616] border border-neutral-800 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="text-neutral-300">Supabase Realtime</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold">En vivo</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Módulos del Sistema
          </div>

          {filteredMenuItems.map((item) => {
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                id={`sidebar-link-${item.view.replace('/dashboard/', '') || 'inicio'}`}
                onClick={() => handleNavigate(item.view)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-[#1C1A14] text-[#E6C875] border border-[#C8A45C]/40 shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-[#161616]'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isActive ? 'text-[#C8A45C]' : 'text-neutral-400'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#C8A45C]/20 text-[#E6C875] font-bold border border-[#C8A45C]/30">
                    {item.badge}
                  </span>
                )}
                {isActive && !item.badge && (
                  <ChevronRight className="w-3 h-3 text-[#C8A45C]" />
                )}
              </button>
            );
          })}

          <div className="pt-3 border-t border-neutral-800/80 my-2">
            <button
              onClick={() => setActiveView('/')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
            >
              <ExternalLink className="w-4 h-4 text-neutral-500" />
              <span>Ver Portal Público</span>
            </button>
          </div>
        </nav>

        {/* Sidebar Footer (User identification, role badge & sign out) */}
        <div className="p-3 border-t border-[#C8A45C]/20 bg-[#121212]">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-[#181818] border border-neutral-800 mb-2">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-[#C8A45C]/40 flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-bold tracking-wider ${
                    currentRole === 'admin'
                      ? 'badge-gold'
                      : currentRole === 'recepcionista'
                      ? 'bg-blue-900/30 text-blue-300 border border-blue-500/30'
                      : 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {currentRole}
                </span>
              </div>
            </div>
          </div>

          <button
            id="sidebar-logout-btn"
            type="button"
            onClick={handleLogout}
            className="w-full py-2 px-3 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};
