import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, formatSoles } from '../../types';
import { ShoppingBag, Plus, Minus, Trash2, Printer, Search, CheckCircle2, User, CreditCard } from 'lucide-react';

export const POSView: React.FC = () => {
  const { products, ventasMostrador, registerCounterSale, openTicketModal } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(products[0] || null);
  const [quantity, setQuantity] = useState<number>(1);
  const [clientName, setClientName] = useState<string>('Cliente de Paso');
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'yape' | 'mixto'>('efectivo');

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  const handleCompleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (quantity <= 0 || quantity > selectedProduct.stock) {
      alert('Cantidad no válida o excede el stock disponible.');
      return;
    }

    const newSale = registerCounterSale({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity,
      unit_price_cents: selectedProduct.price_cents,
      total_price_cents: selectedProduct.price_cents * quantity,
      client_name: clientName.trim() || 'Cliente Mostrador',
      payment_method: paymentMethod,
    });

    // Reset form
    setQuantity(1);
    setClientName('Cliente de Paso');

    // Automatically trigger thermal ticket preview
    openTicketModal('pos', newSale);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1">
          <h1 className="font-serif-luxury text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Terminal Punto de Venta (POS) Mostrador
          </h1>
          <p className="text-xs text-neutral-400">
            Facturación rápida de ceras, pomadas, aceites y accesorios con emisión de ticket térmico inmediato.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Product Selection Grid */}
        <div className="lg:col-span-7 bg-[#141414] border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-neutral-800 pb-4">
            <h3 className="font-serif-luxury text-base font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#C8A45C]" />
              <span>Catálogo de Stock para Despacho</span>
            </h3>

            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#181818] border border-neutral-800 focus:border-[#C8A45C] text-xs text-white rounded-lg pl-8 pr-3 py-1.5 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const isSelected = selectedProduct?.id === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                    isSelected
                      ? 'bg-[#1F1C14] border-[#C8A45C] shadow-md'
                      : 'bg-[#181818] border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-12 h-12 rounded-lg object-cover bg-neutral-900 border border-neutral-800"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-xs text-white block truncate">{p.name}</span>
                    <span className="text-[11px] font-bold text-[#E6C875] block">
                      {formatSoles(p.price_cents)}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                        p.stock > 5 ? 'badge-success' : 'badge-warning'
                      }`}
                    >
                      Stock: {p.stock} un.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Checkout Panel */}
        <div className="lg:col-span-5 bg-[#141414] border border-[#C8A45C]/35 rounded-2xl p-6 space-y-5 shadow-2xl">
          <h3 className="font-serif-luxury text-base font-bold text-white border-b border-neutral-800 pb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#C8A45C]" />
            <span>Despacho y Cobro Inmediato</span>
          </h3>

          {selectedProduct ? (
            <form onSubmit={handleCompleteSale} className="space-y-4 text-xs">
              {/* Selected product summary */}
              <div className="bg-[#181818] p-3.5 rounded-xl border border-neutral-800 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-sm text-white block">{selectedProduct.name}</span>
                    <span className="text-[11px] text-neutral-400">
                      Precio Unitario: {formatSoles(selectedProduct.price_cents)}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-[#E6C875]">
                    Subtotal: {formatSoles(selectedProduct.price_cents * quantity)}
                  </span>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-3 pt-2 border-t border-neutral-800/80">
                  <span className="text-neutral-400">Cantidad a Vender:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white disabled:opacity-40"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-white">{quantity}</span>
                    <button
                      type="button"
                      disabled={quantity >= selectedProduct.stock}
                      onClick={() => setQuantity((q) => Math.min(selectedProduct.stock, q + 1))}
                      className="w-7 h-7 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Client Name */}
              <div className="space-y-1">
                <label className="text-neutral-300 font-medium">Cliente / DNI (Opcional):</label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-[#181818] border border-neutral-800 text-white rounded-xl pl-9 pr-3 py-2 outline-none"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1">
                <label className="text-neutral-300 font-medium">Forma de Pago:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['efectivo', 'yape', 'mixto'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-lg font-semibold capitalize transition ${
                        paymentMethod === m
                          ? 'bg-[#C8A45C] text-black shadow'
                          : 'bg-[#181818] text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Card */}
              <div className="bg-[#1C1A14] border border-[#C8A45C]/40 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-neutral-400 block">TOTAL A COBRAR</span>
                  <span className="text-xs text-neutral-300">Incluye IGV 18%</span>
                </div>
                <span className="font-serif-luxury text-2xl font-bold text-[#E6C875]">
                  {formatSoles(selectedProduct.price_cents * quantity)}
                </span>
              </div>

              <button
                type="submit"
                disabled={selectedProduct.stock <= 0}
                className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 ${
                  selectedProduct.stock > 0
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#C8A45C] hover:from-[#DFCA8D] hover:to-[#D4AF37] text-black'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span>Cobrar & Emitir Ticket Térmico</span>
              </button>
            </form>
          ) : (
            <div className="text-center py-10 text-neutral-500 text-xs">
              Selecciona un producto del catálogo para despachar.
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-[#141414] border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="font-serif-luxury text-base font-bold text-white border-b border-neutral-800 pb-3">
          Historial de Ventas de Mostrador
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181818] text-neutral-400 font-semibold border-b border-neutral-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Cant.</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {ventasMostrador.map((v) => (
                <tr key={v.id} className="hover:bg-[#181818] transition">
                  <td className="py-3 px-4 font-mono font-bold text-[#E6C875]">#{v.ticket_code}</td>
                  <td className="py-3 px-4 text-white font-medium">{v.product_name}</td>
                  <td className="py-3 px-4 text-neutral-300">{v.quantity} un.</td>
                  <td className="py-3 px-4 text-neutral-300">{v.client_name}</td>
                  <td className="py-3 px-4 uppercase text-[10px] text-neutral-400">
                    {v.payment_method}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#E6C875]">
                    {formatSoles(v.total_price_cents)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openTicketModal('pos', v)}
                      className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition"
                      title="Reimprimir Ticket"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
