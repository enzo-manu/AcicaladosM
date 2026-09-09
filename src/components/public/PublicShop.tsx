import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatSoles, Product } from '../../types';
import { ShoppingBag, Plus, Sparkles, Check, Search, Maximize2 } from 'lucide-react';
import { CatalogCarousel } from '../common/CatalogCarousel';

export const PublicShop: React.FC = () => {
  const { products, addToCart, setIsCartOpen, openLightbox } = useApp();
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

      {/* Products 2-Row Horizontal Scroll Carousel */}
      <CatalogCarousel
        itemCount={filtered.length}
        gridClassName="grid grid-rows-2 grid-flow-col auto-cols-[230px] sm:auto-cols-[260px] md:auto-cols-[280px] gap-5"
      >
        {filtered.map((product) => (
          <div
            key={product.id}
            className="h-full bg-[#141414] border border-neutral-800 hover:border-[#C8A45C]/40 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between group transition duration-300 select-none"
          >
            <div
              onClick={() =>
                openLightbox({
                  url: product.image_url,
                  title: product.name,
                  description: product.description,
                  category: categories.find((c) => c.id === product.category)?.label || product.category,
                  price: formatSoles(product.price_cents),
                  metadata: `Stock: ${product.stock} un.`,
                })
              }
              className="relative h-40 sm:h-44 bg-neutral-900 overflow-hidden cursor-zoom-in group/img"
              title="Clic para ampliar imagen"
            >
              <img
                src={product.image_url}
                alt={product.name}
                draggable={false}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500 pointer-events-none"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                <span className="px-3 py-1.5 rounded-xl bg-black/80 border border-[#C8A45C]/60 text-[#E6C875] text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Ver imagen</span>
                </span>
              </div>
              <div className="absolute top-2.5 right-2.5 pointer-events-none">
                <span className="text-[10px] bg-black/75 backdrop-blur-sm text-neutral-300 px-2 py-0.5 rounded border border-neutral-800 font-medium">
                  Stock: {product.stock} un.
                </span>
              </div>
            </div>

            <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-white group-hover:text-[#E6C875] transition line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-[11px] text-neutral-400 line-clamp-2">
                  {product.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-[#E6C875]">
                  {formatSoles(product.price_cents)}
                </span>

                <button
                  type="button"
                  onClick={() => addToCart(product, 1)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#C8A45C] hover:bg-[#D4AF37] text-black transition flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </CatalogCarousel>
    </div>
  );
};
