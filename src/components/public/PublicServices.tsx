import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatSoles } from '../../types';
import { Scissors, Sparkles, Clock, Calendar, Check, ArrowRight, Maximize2 } from 'lucide-react';

export const PublicServices: React.FC = () => {
  const { services, setActiveView, openLightbox } = useApp();
  const [filterCategory, setFilterCategory] = useState<'all' | 'barberia' | 'spa'>('all');

  const filtered = services.filter((s) => {
    if (!s.active) return false;
    if (filterCategory === 'all') return true;
    return s.category === filterCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-[#C8A45C]">
          Menú de Tratamientos
        </span>
        <h1 className="font-serif-luxury text-3xl sm:text-4xl font-bold text-white">
          Carta de Servicios & Terapias
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Precios oficiales en Soles Peruanos. Reserva en línea asegurando tu turno con solo el 25% de adelanto mediante Yape.
        </p>

        {/* Category Filters */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              filterCategory === 'all'
                ? 'bg-[#C8A45C] text-black shadow'
                : 'bg-[#181818] text-neutral-300 hover:text-white border border-neutral-800'
            }`}
          >
            Todos ({services.filter((s) => s.active).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('barberia')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              filterCategory === 'barberia'
                ? 'bg-[#C8A45C] text-black shadow'
                : 'bg-[#181818] text-neutral-300 hover:text-white border border-neutral-800'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Barbería</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('spa')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              filterCategory === 'spa'
                ? 'bg-[#C8A45C] text-black shadow'
                : 'bg-[#181818] text-neutral-300 hover:text-white border border-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Spa & Facial</span>
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((service) => (
          <div
            key={service.id}
            className="bg-[#141414] border border-neutral-800 hover:border-[#C8A45C]/40 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group transition duration-300"
          >
            <div
              onClick={() =>
                openLightbox({
                  url: service.image_url,
                  title: service.name,
                  description: service.description,
                  category: service.category === 'barberia' ? 'Barbería' : 'Spa',
                  price: formatSoles(service.price_cents),
                  metadata: `${service.duration_minutes} min`,
                })
              }
              className="relative h-48 w-full overflow-hidden bg-neutral-900 cursor-zoom-in group/img"
              title="Clic para ampliar imagen"
            >
              <img
                src={service.image_url}
                alt={service.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                <span className="px-3 py-1.5 rounded-xl bg-black/80 border border-[#C8A45C]/60 text-[#E6C875] text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Ver imagen</span>
                </span>
              </div>
              <div className="absolute top-3 left-3">
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md shadow ${
                    service.category === 'barberia' ? 'badge-gold' : 'bg-purple-950/80 text-purple-200 border border-purple-800/60'
                  }`}
                >
                  {service.category === 'barberia' ? 'Barbería' : 'Spa'}
                </span>
              </div>
              <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-neutral-800 flex items-center gap-1.5 text-xs text-neutral-300">
                <Clock className="w-3 h-3 text-[#C8A45C]" />
                <span>{service.duration_minutes} min</span>
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="font-serif-luxury text-base font-bold text-white group-hover:text-[#E6C875] transition">
                  {service.name}
                </h3>
                <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">
                  {service.description}
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 block">Tarifa Oficial</span>
                  <span className="text-lg font-bold text-[#E6C875]">{formatSoles(service.price_cents)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveView('/reservar')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#C8A45C] hover:bg-[#D4AF37] text-black transition flex items-center gap-1.5 shadow"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Reservar</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
