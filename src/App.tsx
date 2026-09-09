import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { TicketTermicoModal } from './components/common/TicketTermicoModal';
import { ImageLightboxModal } from './components/common/ImageLightboxModal';
import { CartDrawer } from './components/common/CartDrawer';
import { Navbar } from './components/common/Navbar';
import { AdminSidebar } from './components/dashboard/AdminSidebar';

// Public views
import { PublicLanding } from './components/public/PublicLanding';
import { PublicServices } from './components/public/PublicServices';
import { PublicBookingFlow } from './components/public/PublicBookingFlow';
import { PublicShop } from './components/public/PublicShop';
import { PublicWardrobe } from './components/public/PublicWardrobe';
import { PublicLocation } from './components/public/PublicLocation';
import { ClientPortal } from './components/public/ClientPortal';

// Auth views
import { LoginView } from './components/auth/LoginView';
import { AuthCallback } from './components/auth/AuthCallback';

// Dashboard views
import { DashboardHome } from './components/dashboard/DashboardHome';
import { CalendarioView } from './components/dashboard/CalendarioView';
import { ReservasManager } from './components/dashboard/ReservasManager';
import { POSView } from './components/dashboard/POSView';
import { AsistenciaView } from './components/dashboard/AsistenciaView';
import { FinanzasView } from './components/dashboard/FinanzasView';
import { ColaboradoresView } from './components/dashboard/ColaboradoresView';
import { VestuarioManager } from './components/dashboard/VestuarioManager';
import { ReportesView } from './components/dashboard/ReportesView';
import { ServiciosManager } from './components/dashboard/ServiciosManager';

import { MapPin, Phone, ShieldCheck, Scissors } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeView, setActiveView, currentRole } = useApp();

  const isDashboard = activeView.startsWith('/dashboard');
  const isAuthView = activeView === '/auth/login' || activeView === '/auth/callback';

  // Check RBAC permission for dashboard
  const isPublicRole = currentRole === 'anonimo' || currentRole === 'cliente' || currentRole === 'anon';

  // Redirección inmediata: bloquear a clientes de /dashboard/* y enviarlos a /mi-cuenta
  React.useEffect(() => {
    if (isDashboard && isPublicRole) {
      setActiveView('/mi-cuenta');
    }
  }, [isDashboard, isPublicRole, setActiveView]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-neutral-200 flex flex-col font-sans selection:bg-[#C8A45C] selection:text-black w-full max-w-full overflow-x-hidden">
      {/* Global Thermal Ticket Modal */}
      <TicketTermicoModal />

      {/* Global Image Lightbox Modal */}
      <ImageLightboxModal />

      {/* Global Shopping Cart Drawer */}
      <CartDrawer />

      {isAuthView ? (
        // AUTHENTICATION LAYOUT (/auth/login & /auth/callback)
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1">
            {activeView === '/auth/login' && <LoginView />}
            {activeView === '/auth/callback' && <AuthCallback />}
          </main>
        </div>
      ) : isDashboard ? (
        // DASHBOARD LAYOUT
        <div className="flex-1 flex flex-col md:flex-row min-h-screen">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto pb-12 bg-neutral-950/70">
            {isPublicRole ? (
              <div className="max-w-md mx-auto my-20 p-6 rounded-2xl bg-[#141414] border border-red-900/40 text-center space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800/60 text-red-400 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="font-serif-luxury text-lg font-bold text-white">
                  Acceso Restringido al Personal
                </h2>
                <p className="text-xs text-neutral-400">
                  El acceso a las rutas operativas del sistema está reservado exclusivamente para Administradores y Recepción. Redirigiendo a tu portal de cliente...
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView('/mi-cuenta')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#C8A45C] text-black shadow cursor-pointer"
                >
                  Ir a Mis Citas / Mi Cuenta
                </button>
              </div>
            ) : (
              <>
                {activeView === '/dashboard' && <DashboardHome />}
                {activeView === '/dashboard/calendario' && <CalendarioView />}
                {activeView === '/dashboard/reservas' && <ReservasManager />}
                {activeView === '/dashboard/ventas' && <POSView />}
                {activeView === '/dashboard/reportes' && <ReportesView />}
                {(activeView === '/dashboard/egresos' || activeView === '/dashboard/finanzas') && <FinanzasView />}
                {(activeView === '/dashboard/empleados' || activeView === '/dashboard/colaboradores') && <ColaboradoresView />}
                {activeView === '/dashboard/asistencia' && <AsistenciaView />}
                {activeView === '/dashboard/servicios' && <ServiciosManager />}
                {activeView === '/dashboard/vestuario' && <VestuarioManager />}
                {activeView === '/dashboard/productos' && <PublicShop />}
              </>
            )}
          </main>
        </div>
      ) : (
        // PUBLIC LAYOUT
        <div className="flex-1 flex flex-col w-full max-w-full overflow-x-hidden">
          <Navbar />
          <main className="flex-1">
            {activeView === '/' && <PublicLanding />}
            {activeView === '/servicios' && <PublicServices />}
            {activeView === '/reservar' && <PublicBookingFlow />}
            {(activeView === '/tienda' || activeView === '/productos') && <PublicShop />}
            {activeView === '/vestuario' && <PublicWardrobe />}
            {activeView === '/ubicacion' && <PublicLocation />}
            {activeView === '/mi-cuenta' && <ClientPortal />}
          </main>

          {/* Public Footer */}
          <footer className="bg-[#0D0D0D] border-t border-neutral-900 mt-20 pt-12 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Brand */}
                <div className="space-y-3 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#C8A45C] text-black flex items-center justify-center">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <span className="font-serif-luxury font-bold text-lg text-white">
                      ACICALADOS <span className="text-[#C8A45C]">SPA & BARBER</span>
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
                    Club exclusivo de cuidado personal masculino y estética integral en Pichari, Cusco. Experiencia multisensorial con bebidas de cortesía y especialistas de primer nivel.
                  </p>
                </div>

                {/* Quick Links */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Navegación</h4>
                  <ul className="space-y-1.5 text-xs text-neutral-400">
                    <li>
                      <button onClick={() => setActiveView('/servicios')} className="hover:text-[#C8A45C]">
                        Menú de Servicios
                      </button>
                    </li>
                    <li>
                      <button onClick={() => setActiveView('/reservar')} className="hover:text-[#C8A45C]">
                        Reservar Turno Online
                      </button>
                    </li>
                    <li>
                      <button onClick={() => setActiveView('/tienda')} className="hover:text-[#C8A45C]">
                        Tienda Profesional
                      </button>
                    </li>
                    <li>
                      <button onClick={() => setActiveView('/vestuario')} className="hover:text-[#C8A45C]">
                        Alquiler de Trajes
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Contact & Hours */}
                <div className="space-y-2 text-xs text-neutral-400">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Sede Pichari</h4>
                  <p className="flex items-center gap-1.5 text-neutral-300">
                    <MapPin className="w-3.5 h-3.5 text-[#C8A45C]" />
                    <span>Av. Arriba Perú Mz. K - Lt. 9, Pichari</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-neutral-300">
                    <Phone className="w-3.5 h-3.5 text-[#C8A45C]" />
                    <span>+51 987 654 321</span>
                  </p>
                  <p className="text-[11px] text-neutral-500 pt-1">
                    Horario: Lun - Sáb 08:30 a 21:00 hrs. Dom 09:30 a 20:00 hrs.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
                <span>© {new Date().getFullYear()} Acicalados Spa & Barber Shop. RUC 20608912341. Todos los derechos reservados.</span>
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pagos seguros vía Yape Perú & Verificación Inmediata</span>
                </span>
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
