import React from 'react';
import { MapPin, Phone, Mail, Clock, MessageSquare, Navigation, ShieldCheck } from 'lucide-react';

export const PublicLocation: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-[#C8A45C]">
          Ubicación & Contacto
        </span>
        <h1 className="font-serif-luxury text-3xl font-bold text-white">
          Sede Principal San Borja
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Ubicados en una de las zonas más exclusivas de Lima, con fácil acceso y estacionamiento vigilado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact & Hours Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#141414] border border-[#C8A45C]/25 rounded-2xl p-6 space-y-6 shadow-xl">
            <h3 className="font-serif-luxury text-lg font-bold text-white border-b border-neutral-800 pb-3">
              Información del Establecimiento
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C8A45C]/15 text-[#C8A45C] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Dirección:</span>
                  <span className="font-semibold text-white">
                    Av. Javier Prado Este 2450, San Borja
                  </span>
                  <p className="text-neutral-400 text-[11px] mt-0.5">
                    (Entre Av. Aviación y Av. San Luis, frente a la torre corporativa)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C8A45C]/15 text-[#C8A45C] flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Horario de Atención (America/Lima):</span>
                  <p className="font-semibold text-white">Lunes a Sábado: 08:30 - 21:00 hrs</p>
                  <p className="font-semibold text-white">Domingos y Feriados: 09:30 - 20:00 hrs</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C8A45C]/15 text-[#C8A45C] flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Teléfono / WhatsApp de Recepción:</span>
                  <span className="font-semibold text-white">+51 987 654 321</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C8A45C]/15 text-[#C8A45C] flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Correo Institucional:</span>
                  <span className="font-semibold text-white">contacto@acicalados.pe</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="https://wa.me/51987654321?text=Hola%20Acicalados,%20quisiera%20consultar%20sobre%20sus%20servicios"
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Hablar con Recepción por WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Map Simulator / Graphic Representation */}
        <div className="lg:col-span-7 bg-[#141414] border border-neutral-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full min-h-[380px]">
          <div className="bg-[#1A1A1A] px-5 py-3 border-b border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <Navigation className="w-4 h-4 text-[#C8A45C]" />
              <span className="font-semibold">Mapa de Acceso & Estacionamiento</span>
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cochera privada para clientes</span>
            </span>
          </div>

          <div className="flex-1 bg-gradient-to-br from-neutral-900 to-neutral-950 p-8 flex flex-col items-center justify-center text-center space-y-4 relative">
            <div className="w-16 h-16 rounded-2xl bg-[#C8A45C]/15 border border-[#C8A45C]/30 flex items-center justify-center text-[#C8A45C] shadow-lg">
              <MapPin className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="font-serif-luxury font-bold text-white text-base">
                Acicalados Spa & Barber Shop
              </h4>
              <p className="text-xs text-neutral-400">
                Av. Javier Prado Este 2450, San Borja, Lima.
              </p>
            </div>
            <a
              href="https://maps.google.com/?q=San+Borja+Lima+Peru"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-[#C8A45C] text-neutral-200 hover:text-black text-xs font-semibold transition shadow"
            >
              Abrir en Google Maps / Waze
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
