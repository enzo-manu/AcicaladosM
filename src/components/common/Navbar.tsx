import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Scissors, ShoppingBag, Calendar, User, Menu, X, LayoutDashboard, MapPin } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeView, setActiveView, cart, setIsCartOpen, currentRole } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navLinks = [
    { view: '/', label: 'Inicio' },
    { view: '/servicios', label: 'Servicios' },
    { view: '/reservar', label: 'Reservar Online', highlight: true },
    { view: '/tienda', label: 'Tienda' },
    { view: '/vestuario', label: 'Vestuario' },
    { view: '/ubicacion', label: 'Ubicación' },
    { view: '/mi-cuenta', label: 'Mi Cuenta' },
  ];

  const handleNavClick = (view: string) => {
    setActiveView(view);
    setMobileMenuOpen(false);
  };

  const isStaffRole = currentRole === 'admin' || currentRole === 'recepcionista' || currentRole === 'empleado';

  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#C8A45C]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => handleNavClick('/')}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C8A45C] to-[#9A7B38] flex items-center justify-center text-black shadow-md group-hover:scale-105 transition">
            <Scissors className="w-5 h-5 text-black transform -rotate-45" />
          </div>
          <div>
            <span className="font-serif-luxury text-lg font-bold tracking-wider text-white flex items-center gap-1">
              ACICALADOS
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8A45C] inline-block ml-0.5"></span>
            </span>
            <span className="block text-[10px] uppercase tracking-[0.25em] text-[#C8A45C] font-semibold">
              Spa & Barber Shop
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((item) => {
            const isActive = activeView === item.view;
            if (item.highlight) {
              return (
                <button
                  key={item.view}
                  id="nav-reservar-btn"
                  onClick={() => handleNavClick(item.view)}
                  className="mx-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#C8A45C] hover:bg-[#D4AF37] text-black shadow-sm transition"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'text-[#E6C875] bg-[#1A1A1A] border border-[#C8A45C]/30'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Cart, Staff Dashboard Button & Mobile Hamburger */}
        <div className="flex items-center gap-2.5">
          {/* Shopping Cart Button */}
          <button
            id="cart-drawer-trigger-btn"
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-lg text-neutral-300 hover:text-white bg-[#141414] hover:bg-[#1E1E1E] border border-neutral-800 transition"
            title="Ver carrito de compras"
          >
            <ShoppingBag className="w-4 h-4 text-[#C8A45C]" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#C8A45C] text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                {cartCount}
              </span>
            )}
          </button>

          {/* Direct Switcher to Staff Dashboard */}
          {isStaffRole && (
            <button
              id="go-to-dashboard-btn"
              type="button"
              onClick={() => handleNavClick('/dashboard')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeView.startsWith('/dashboard')
                  ? 'bg-[#1E1E1E] text-[#E6C875] border border-[#C8A45C]/40'
                  : 'bg-[#141414] text-neutral-300 hover:text-white hover:bg-[#1A1A1A] border border-neutral-800'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#C8A45C]" />
              <span className="hidden sm:inline">Panel Staff</span>
            </button>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#111111] border-b border-[#C8A45C]/20 px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNavClick(item.view)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
                activeView === item.view
                  ? 'bg-[#1E1E1E] text-[#E6C875] border border-[#C8A45C]/30'
                  : 'text-neutral-300 hover:bg-neutral-900'
              }`}
            >
              <span>{item.label}</span>
              {item.highlight && (
                <span className="text-[10px] bg-[#C8A45C] text-black px-1.5 py-0.5 rounded font-bold">
                  25% Adelanto
                </span>
              )}
            </button>
          ))}

          {isStaffRole && (
            <button
              onClick={() => handleNavClick('/dashboard')}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold bg-[#1A1A1A] text-[#E6C875] border border-[#C8A45C]/30 flex items-center gap-2 mt-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Abrir Panel de Gestión (/dashboard)</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
