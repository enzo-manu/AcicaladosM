import React, { useEffect, useRef } from 'react';
import { Navbar } from '../common/Navbar';
import { useApp } from '../../context/AppContext';
import { MapPin, Phone, Scissors, ShieldCheck } from 'lucide-react';

interface ClientLayoutProps {
  children: React.ReactNode;
}

/**
 * ClientLayout
 * Layout envolvente principal para todo el portal público del cliente:
 * - Inicio, Servicios, Vestuario, Productos, Ubicación, Reservas y Mi Cuenta.
 * - Fondo de video responsivo persistente (/fondosistema.mp4) con reproducción ininterrumpida.
 * - Capa de oscurecimiento (overlay semitransparente) para contraste y legibilidad óptima.
 */
export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const { setActiveView } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Garantizar autoplay continuo en iOS Safari y Android Chrome
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {
        // Modo silencioso: previene bloqueos de autoplay en políticas estrictas de navegador
      });
    }
  }, []);

  return (
    <div className="relative flex-1 flex flex-col w-full max-w-full overflow-x-hidden min-h-screen">
      {/* 
        1. Fondo de Video Responsivo Fijo
        - Posicionamiento fixed inset-0 con z-[-2]
        - Cobertura completa w-full h-full object-cover (adaptable apaisado y vertical)
        - Atributos obligatorios: autoPlay, loop, muted, playsInline
      */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-[-2] pointer-events-none select-none"
        src="/fondosistema.mp4"
      >
        <source src="/fondosistema.mp4" type="video/mp4" />
      </video>

      {/* 
        2. Capa de Oscurecimiento (Overlay)
        - Posicionamiento fixed inset-0 con z-[-1]
        - bg-black/60 asegura contraste premium para los textos blancos, dorados y tarjetas
      */}
      <div
        className="fixed inset-0 bg-black/60 z-[-1] pointer-events-none"
        aria-hidden="true"
      />

      {/* Barra de navegación superior fija */}
      <Navbar />

      {/* Contenido principal dinámico según la ruta activa */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer Público Oficial de Acicalados */}
      <footer className="bg-[#0D0D0D]/90 backdrop-blur-md border-t border-neutral-900 mt-20 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Marca y Descripción */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#C8A45C] text-black flex items-center justify-center">
                  <Scissors className="w-4 h-4" />
                </div>
                <span className="font-serif-luxury font-bold text-lg text-white">
                  ACICALADOS <span className="text-[#C8A45C]">SPA &amp; BARBER</span>
                </span>
              </div>
              <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
                Club exclusivo de cuidado personal masculino y estética integral en Pichari, Cusco. Experiencia multisensorial con bebidas de cortesía y especialistas de primer nivel.
              </p>
            </div>

            {/* Enlaces Rápidos de Navegación */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Navegación</h4>
              <ul className="space-y-1.5 text-xs text-neutral-400">
                <li>
                  <button onClick={() => setActiveView('/servicios')} className="hover:text-[#C8A45C] cursor-pointer">
                    Menú de Servicios
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveView('/reservar')} className="hover:text-[#C8A45C] cursor-pointer">
                    Reservar Turno Online
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveView('/tienda')} className="hover:text-[#C8A45C] cursor-pointer">
                    Tienda Profesional
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveView('/vestuario')} className="hover:text-[#C8A45C] cursor-pointer">
                    Alquiler de Trajes
                  </button>
                </li>
              </ul>
            </div>

            {/* Ubicación y Horarios */}
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
            <span>© {new Date().getFullYear()} Acicalados Spa &amp; Barber Shop. RUC 20608912341. Todos los derechos reservados.</span>
            <span className="flex items-center gap-1.5 text-neutral-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pagos seguros vía Yape Perú &amp; Verificación Inmediata</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClientLayout;
