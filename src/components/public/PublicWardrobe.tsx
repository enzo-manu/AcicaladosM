import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatSoles, WardrobeItem } from '../../types';
import { Shirt, MessageSquare, Sparkles, Shield, Tag } from 'lucide-react';

export const PublicWardrobe: React.FC = () => {
  const { wardrobe } = useApp();
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'bodas', label: 'Bodas & Matrimonios' },
    { id: 'etiqueta_negra', label: 'Etiqueta Negra' },
    { id: 'graduaciones', label: 'Graduaciones & Galas' },
  ];

  const filtered = wardrobe.filter((item) => {
    if (filterCategory === 'all') return true;
    return item.category === filterCategory;
  });

  const handleInquireWhatsApp = (item: WardrobeItem) => {
    const text = encodeURIComponent(
      `¡Hola Acicalados! Quisiera consultar la disponibilidad de alquiler de la prenda:\n\n*Prenda:* ${item.name}\n*Talla:* ${item.size}\n*Tarifa Alquiler:* ${formatSoles(item.rental_price_cents)}\n*Garantía:* ${formatSoles(item.deposit_cents)}\n\n¿Para qué fechas tienen agenda de prueba?`
    );
    window.open(`https://wa.me/51987654321?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-[#C8A45C]">
          Galería de Trajes & Vestidos de Gala
        </span>
        <h1 className="font-serif-luxury text-3xl font-bold text-white">
          Alquiler de Vestuario de Alta Etiqueta
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400">
          Smokings italianos, tuxedos a medida y vestidos de noche para bodas, sesiones fotográficas y eventos corporativos en Lima.
        </p>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition ${
                filterCategory === cat.id
                  ? 'bg-[#C8A45C] text-black font-semibold'
                  : 'bg-[#181818] text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Wardrobe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-[#141414] border border-neutral-800 hover:border-[#C8A45C]/40 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group transition duration-300"
          >
            <div className="relative h-64 bg-neutral-900 overflow-hidden">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3">
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md shadow ${
                    item.status === 'disponible'
                      ? 'badge-success'
                      : item.status === 'reservado'
                      ? 'badge-warning'
                      : 'badge-neutral'
                  }`}
                >
                  {item.status.replace('_', ' ')}
                </span>
              </div>
              <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-neutral-800 text-[11px] text-[#E6C875] font-semibold">
                {item.size}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="font-serif-luxury text-base font-bold text-white group-hover:text-[#E6C875] transition">
                  {item.name}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-neutral-500 block">Alquiler por Evento:</span>
                    <span className="text-sm font-bold text-[#E6C875]">
                      {formatSoles(item.rental_price_cents)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-500 block">Garantía Reembolsable:</span>
                    <span className="text-xs font-semibold text-neutral-300">
                      {formatSoles(item.deposit_cents)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleInquireWhatsApp(item)}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-[#C8A45C] text-white hover:text-black transition flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Consultar Disponibilidad</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
