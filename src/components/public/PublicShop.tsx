import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatSoles, Product } from '../../types';
import { ShoppingBag, Plus, Sparkles, Check, Search } from 'lucide-react';

export const PublicShop: React.FC = () => {
  const { products, addToCart, setIsCartOpen } = useApp();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'ceras_pomadas', label: 'Ceras & Pomadas' },
    { id: 'barba_afeitado', label: 'Cuidado de Barba' },
    { id: 'shampoos', label: 'Shampoos' },
    { id: 'tratamientos', label: 'Tratamientos' },
  ];

  const filtered = products.filter((p) => {
    if (filterCategory !== 'all' && p.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-800 pb-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C8A45C]">
            Productos Profesionales de Salón
          </span>
          <h1 className="font-serif-luxury text-3xl font-bold text-white">
            Tienda Acicalados Barber & Spa
          </h1>
          <p className="text-xs text-neutral-400">
            Fórmulas importadas y artesanales para el mantenimiento capilar y facial en casa.
          </p>
        </div>

        <button
          onClick={() => setIsCartOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#222222] border border-[#C8A45C]/30 text-xs font-semibold text-[#E6C875] flex items-center gap-2 transition self-start md:self-auto"
        >
          <ShoppingBag className="w-4 h-4 text-[#C8A45C]" />
          <span>Ver Carrito de Compras</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterCategory === cat.id
                  ? 'bg-[#C8A45C] text-black font-semibold'
                  : 'bg-[#181818] text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161616] border border-neutral-800 focus:border-[#C8A45C] text-xs text-white rounded-lg pl-8 pr-3 py-2 outline-none transition"
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filtered.map((product) => (
          <div
            key={product.id}
            className="bg-[#141414] border border-neutral-800 hover:border-[#C8A45C]/40 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group transition duration-300"
          >
            <div className="relative h-48 bg-neutral-900 overflow-hidden">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2.5 right-2.5">
                <span className="text-[10px] bg-black/75 backdrop-blur-sm text-neutral-300 px-2 py-0.5 rounded border border-neutral-800 font-medium">
                  Stock: {product.stock} un.
                </span>
              </div>
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-white group-hover:text-[#E6C875] transition line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-[11px] text-neutral-400 line-clamp-2">
                  {product.description}
                </p>
              </div>

              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-sm font-bold text-[#E6C875]">
                  {formatSoles(product.price_cents)}
                </span>

                <button
                  type="button"
                  onClick={() => addToCart(product, 1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#C8A45C] hover:bg-[#D4AF37] text-black transition flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
