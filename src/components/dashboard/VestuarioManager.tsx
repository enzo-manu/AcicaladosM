import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WardrobeItem, WardrobeStatus, formatSoles } from '../../types';
import { Shirt, Plus, Edit2, Sparkles, Check, Filter } from 'lucide-react';

export const VestuarioManager: React.FC = () => {
  const { wardrobe, updateWardrobeStatus, currentRole } = useApp();
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filtered = wardrobe.filter((w) => {
    if (filterCategory === 'all') return true;
    return w.category === filterCategory;
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1">
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Control de Vestuario & Trajes de Etiqueta
          </h1>
          <p className="text-xs text-neutral-400">
            Inventario de smokings, vestidos de gala y trajes de novio con gestión de alquiler y garantía.
          </p>
        </div>
      </div>

      {/* Grid of Garments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-[#141414] border border-neutral-800 hover:border-[#C8A45C]/40 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition"
          >
            <div className="relative h-56 bg-neutral-900">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3">
                <select
                  value={item.status}
                  onChange={(e) => updateWardrobeStatus(item.id, e.target.value as WardrobeStatus)}
                  className={`text-[10px] font-bold px-2 py-1 rounded shadow outline-none cursor-pointer uppercase ${
                    item.status === 'disponible'
                      ? 'badge-success'
                      : item.status === 'reservado'
                      ? 'badge-warning'
                      : 'badge-neutral'
                  }`}
                >
                  <option value="disponible">Disponible</option>
                  <option value="reservado">Reservado</option>
                  <option value="en_uso">En Uso</option>
                  <option value="mantenimiento">Mantenimiento</option>
                </select>
              </div>

              <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-0.5 rounded text-[11px] font-bold text-[#E6C875]">
                Talla: {item.size}
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="font-serif-luxury text-sm font-bold text-white">{item.name}</h3>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{item.description}</p>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500 block">Alquiler por Cita:</span>
                  <span className="font-bold text-[#E6C875]">
                    {formatSoles(item.rental_price_cents)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block">Garantía Exigida:</span>
                  <span className="font-semibold text-neutral-300">
                    {formatSoles(item.deposit_cents)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
