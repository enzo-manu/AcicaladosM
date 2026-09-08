import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  ShoppingBag, 
  User, 
  ChevronDown, 
  Calendar, 
  LogOut, 
  LayoutDashboard, 
  LogIn,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    activeView, 
    setActiveView, 
    cart, 
    setIsCartOpen, 
    currentRole, 
    currentUser,
    signOut
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K or Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setUserDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 60);
    } else {
      setSearchQuery('');
    }
  }, [searchModalOpen]);

  // Exact order required: Inicio | Servicios | Vestuario | Productos | Ubicación
  const navLinks = [
    { view: '/', label: 'Inicio' },
    { view: '/servicios', label: 'Servicios' },
    { view: '/vestuario', label: 'Vestuario' },
    { view: '/productos', label: 'Productos' },
    { view: '/ubicacion', label: 'Ubicación' },
  ];

  const handleNavClick = (view: string) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setSearchModalOpen(false);
  };

  const handleSignOut = () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    signOut();
  };

  const isStaffRole = currentRole === 'admin' || currentRole === 'recepcionista' || currentRole === 'empleado';
  const isAuthenticated = currentRole !== 'anon' && currentRole !== 'anonimo';

  // Client display name fallback
  const clientName = currentUser?.name || (isAuthenticated ? 'Cliente' : 'Mi Cuenta');

  // Search items list
  const searchItems = [
    { title: 'Corte de Cabello Premium', category: 'Servicios', view: '/servicios', desc: 'Asesoría y corte personalizado con lavado y peinado' },
    { title: 'Perfilado y Afeitado de Barba', category: 'Servicios', view: '/servicios', desc: 'Ritual clásico con toallas calientes y aceites esenciales' },
    { title: 'Tratamiento Facial y Spa', category: 'Servicios', view: '/servicios', desc: 'Limpieza profunda, exfoliación e hidratación' },
    { title: 'Trajes y Ternas Exclusivos', category: 'Vestuario', view: '/vestuario', desc: 'Alquiler y venta de alta costura para eventos' },
    { title: 'Pomadas y Ceras para Barba', category: 'Productos', view: '/productos', desc: 'Fijación y brillo de calidad profesional' },
    { title: 'Shampoo y Tónicos Capilares', category: 'Productos', view: '/productos', desc: 'Cuidado capilar anticaída y fortalecedor' },
    { title: 'Sede Pichari y Horarios', category: 'Ubicación', view: '/ubicacion', desc: 'Encuéntranos en Av. Arriba Perú Mz. K - Lt. 9, Pichari' },
  ];

  const filteredSearch = searchQuery.trim()
    ? searchItems.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchItems;

  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur-md border-b border-[#C8A45C]/30 shadow-[0_4px_25px_rgba(0,0,0,0.85)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
        
        {/* 1. LOGOTIPO (Extremo izquierdo) */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick('/')}
            className="flex items-center group cursor-pointer focus:outline-none"
            aria-label="Acicalados - Inicio"
          >
            <img
              src="/LogoAcicalados.svg"
              alt="Logo Acicalados"
              className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <div className="h-8 w-[1px] bg-[#C8A45C]/35 mx-3 sm:mx-4" />
            <div className="flex flex-col justify-center text-left select-none">
              <span
                className="font-serif-luxury font-bold text-base sm:text-lg lg:text-xl tracking-[0.2em] text-[#C8A45C] group-hover:text-[#EBDBB2] transition-colors leading-none"
              >
                ACICALADOS
              </span>
              <span
                className="tracking-[0.28em] text-[9px] sm:text-[10px] text-[#C8A45C]/80 font-semibold leading-none mt-1"
              >
                DISEÑO &amp; CALIDAD
              </span>
            </div>
          </button>
        </div>

        {/* 2. MENÚ DE NAVEGACIÓN CENTRAL */}
        {/* Orden exacto: Inicio | Servicios | Vestuario | Productos | Ubicación */}
        {/* Subrayado dorado horizontal inferior */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navLinks.map((item) => {
            const isActive =
              item.view === '/'
                ? activeView === '/'
                : item.view === '/productos'
                ? activeView === '/productos' || activeView === '/tienda'
                : activeView === item.view || activeView.startsWith(item.view + '/');

            return (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`text-sm lg:text-[15px] transition-all duration-200 relative pb-1.5 pt-1 font-medium tracking-wide focus:outline-none cursor-pointer ${
                  isActive
                    ? "text-[#C8A45C] font-semibold after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2.5px] after:bg-[#C8A45C] after:rounded-full after:shadow-[0_0_8px_rgba(200,164,92,0.6)]"
                    : "text-neutral-300 hover:text-white hover:text-[#EBDBB2]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* 3. ÁREA DERECHA (Acciones y Perfil del Cliente) */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0">
          
          {/* Ícono de búsqueda (lupa) */}
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            className="p-2 rounded-lg text-neutral-300 hover:text-[#C8A45C] hover:bg-[#C8A45C]/10 transition-all duration-200 cursor-pointer flex items-center justify-center focus:outline-none"
            title="Buscar servicios, vestuario o productos (Ctrl+K)"
            aria-label="Buscar"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Barra vertical separadora tenue */}
          <div className="h-6 w-[1px] bg-[#C8A45C]/30 mx-0.5 sm:mx-1" />

          {/* Ícono de carrito de compras junto al texto "Carrito" */}
          <button
            id="cart-drawer-trigger-btn"
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="group inline-flex items-center justify-center h-9 sm:h-[38px] px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-[#C8A45C]/15 text-neutral-200 hover:text-[#C8A45C] transition-all duration-200 text-sm font-medium cursor-pointer shrink-0 gap-1.5 sm:gap-2 relative focus:outline-none"
            title="Abrir Carrito de Compras"
            aria-label="Abrir Carrito"
          >
            <ShoppingBag className="w-4 h-4 text-neutral-200 group-hover:text-[#C8A45C] transition-colors shrink-0" />
            <span className="hidden sm:inline tracking-wide select-none leading-none text-xs sm:text-sm">
              Carrito
            </span>
            {cartCount > 0 && (
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#C8A45C] text-black font-extrabold text-[10px] sm:text-xs flex items-center justify-center shrink-0 shadow-inner leading-none">
                {cartCount}
              </span>
            )}
          </button>

          {/* Perfil de usuario con ícono de silueta, nombre del cliente y flecha desplegable hacia abajo */}
          <div className="relative inline-flex items-center" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="group inline-flex items-center justify-center h-9 sm:h-[38px] px-2 sm:px-3 py-1.5 rounded-full hover:bg-[#C8A45C]/15 text-neutral-200 hover:text-[#C8A45C] transition-all duration-200 text-sm font-medium cursor-pointer shrink-0 gap-1.5 sm:gap-2 border border-transparent hover:border-[#C8A45C]/30 focus:outline-none"
              aria-expanded={userDropdownOpen}
              aria-haspopup="true"
              title="Mi Cuenta"
              aria-label="Mi Cuenta"
            >
              {/* Ícono de silueta */}
              <User className="w-4 h-4 text-[#C8A45C] group-hover:text-[#EBDBB2] transition-colors shrink-0" />

              {/* Nombre del cliente autenticado */}
              <span className="hidden md:inline max-w-[130px] truncate leading-none select-none text-neutral-200 group-hover:text-[#EBDBB2] transition-colors font-medium text-xs sm:text-sm">
                {clientName}
              </span>

              {/* Flecha desplegable hacia abajo */}
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#C8A45C]/70 group-hover:text-[#C8A45C] transition-transform duration-200 shrink-0 ${
                  userDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Menú Desplegable */}
            {userDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 sm:w-56 bg-[#111111] border border-[#C8A45C]/40 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.9)] py-2 z-50 animate-fadeIn backdrop-blur-md">
                {!isAuthenticated ? (
                  <>
                    <div className="px-4 py-2.5 border-b border-[#C8A45C]/20 mb-1">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">
                        Acceso a tu Cuenta
                      </p>
                      <p className="text-xs text-neutral-300 truncate mt-0.5">
                        Inicia sesión o regístrate
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleNavClick('/auth/login')}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-[#C8A45C] hover:text-white hover:bg-[#C8A45C]/15 transition-colors cursor-pointer group/item font-semibold"
                    >
                      <LogIn className="w-4 h-4 text-[#C8A45C] group-hover/item:scale-110 transition-transform shrink-0" />
                      <span>Iniciar Sesión / Registro</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2.5 border-b border-[#C8A45C]/20 mb-1">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">
                        {currentRole === 'admin'
                          ? 'Administrador'
                          : currentRole === 'recepcionista'
                          ? 'Recepción'
                          : 'Cliente Autenticado'}
                      </p>
                      <p className="text-sm font-semibold text-[#C8A45C] truncate mt-0.5">
                        {clientName}
                      </p>
                    </div>

                    {/* Administrador / Recepcionista: Panel de Control destacado */}
                    {isStaffRole && (
                      <button
                        type="button"
                        onClick={() => handleNavClick('/dashboard')}
                        className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-[#C8A45C] bg-[#C8A45C]/10 hover:bg-[#C8A45C]/20 hover:text-white transition-colors cursor-pointer group/item font-semibold border-b border-[#C8A45C]/20 mb-1"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#C8A45C] group-hover/item:scale-110 transition-transform shrink-0" />
                        <span>Panel de Control</span>
                      </button>
                    )}

                    {/* Mis Citas / Mis Reservas */}
                    <button
                      type="button"
                      onClick={() => handleNavClick('/mi-cuenta')}
                      className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-neutral-200 hover:text-white hover:bg-[#C8A45C]/15 transition-colors cursor-pointer group/item"
                    >
                      <Calendar className="w-4 h-4 text-[#C8A45C] group-hover/item:scale-110 transition-transform shrink-0" />
                      <span>Mis Citas / Mis Reservas</span>
                    </button>

                    {/* Mi Cuenta */}
                    <button
                      type="button"
                      onClick={() => handleNavClick('/mi-cuenta')}
                      className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-neutral-200 hover:text-white hover:bg-[#C8A45C]/15 transition-colors cursor-pointer group/item"
                    >
                      <User className="w-4 h-4 text-[#C8A45C] group-hover/item:scale-110 transition-transform shrink-0" />
                      <span>Mi Cuenta</span>
                    </button>

                    <div className="my-1 border-t border-[#C8A45C]/20" />

                    {/* Cerrar Sesión */}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer group/item"
                    >
                      <LogOut className="w-4 h-4 text-red-400 group-hover/item:scale-110 transition-transform shrink-0" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Botón de menú hamburguesa al extremo derecho para la vista móvil */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg text-[#C8A45C] hover:text-[#EBDBB2] hover:bg-[#C8A45C]/10 transition-colors flex items-center justify-center cursor-pointer shrink-0 focus:outline-none"
            title="Abrir Menú de Navegación"
            aria-label="Abrir Menú"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C8A45C"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" stroke="#C8A45C" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="3" y1="12" x2="21" y2="12" stroke="#C8A45C" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="3" y1="18" x2="21" y2="18" stroke="#C8A45C" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* MODAL DE BÚSQUEDA INTERACTIVA */}
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-fadeIn"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-[#111111] border border-[#C8A45C]/40 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.9)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center px-4 py-3.5 border-b border-[#C8A45C]/25 bg-black/60">
              <Search className="w-5 h-5 text-[#C8A45C] mr-3 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar servicios, trajes, productos o ubicación..."
                className="w-full bg-transparent text-neutral-100 placeholder-neutral-500 focus:outline-none text-sm sm:text-base"
              />
              <button
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="text-xs px-2 py-1 bg-neutral-800 text-neutral-400 rounded-md hover:bg-neutral-700 hover:text-white transition ml-2"
              >
                ESC
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2 divide-y divide-neutral-900/60">
              {filteredSearch.length > 0 ? (
                filteredSearch.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => handleNavClick(item.view)}
                    className="w-full text-left flex items-center justify-between p-3 rounded-xl hover:bg-[#C8A45C]/10 transition-colors group cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-200 group-hover:text-[#C8A45C] transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                        {item.desc}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#C8A45C] bg-[#C8A45C]/10 border border-[#C8A45C]/20 px-2 py-0.5 rounded-full shrink-0 ml-3">
                      {item.category}
                    </span>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-neutral-400">
                  <p className="text-sm">No se encontraron resultados para &quot;{searchQuery}&quot;</p>
                  <p className="text-xs text-neutral-500 mt-1">Prueba con corte, barba, trajes o productos.</p>
                </div>
              )}
            </div>

            <div className="px-4 py-2.5 bg-black/40 border-t border-[#C8A45C]/15 text-center flex justify-between items-center text-xs text-neutral-400">
              <span>Acicalados Spa &amp; Barber Shop</span>
              <span className="text-[#C8A45C] font-serif-luxury">Diseño &amp; Calidad</span>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER RESPONSIVO PARA DISPOSITIVOS MÓVILES */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-300 flex justify-end"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-full max-w-[300px] sm:max-w-[330px] h-full bg-black border-l border-[#C8A45C]/35 shadow-[-15px_0_40px_rgba(0,0,0,0.95)] p-6 sm:p-7 flex flex-col justify-between items-center text-center overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <div className="w-full flex justify-between items-center mb-4">
              <span className="text-xs text-[#C8A45C] font-semibold tracking-widest uppercase font-serif-luxury">
                Menú
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 rounded-lg border border-[#C8A45C]/40 text-[#C8A45C] hover:text-[#EBDBB2] hover:border-[#C8A45C] hover:bg-[#C8A45C]/15 flex items-center justify-center transition cursor-pointer text-lg font-bold"
                aria-label="Cerrar Menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links de Navegación Vertical Centrados */}
            <nav className="flex flex-col items-center justify-center gap-5 my-auto text-center w-full">
              {navLinks.map((item) => {
                const isActive =
                  item.view === '/'
                    ? activeView === '/'
                    : item.view === '/productos'
                    ? activeView === '/productos' || activeView === '/tienda'
                    : activeView === item.view || activeView.startsWith(item.view + '/');

                return (
                  <div key={item.label} className="w-full flex justify-center text-center">
                    <button
                      type="button"
                      onClick={() => handleNavClick(item.view)}
                      className={`text-xl font-serif-luxury tracking-wider transition-all duration-200 relative pb-1 inline-block text-center cursor-pointer ${
                        isActive
                          ? "text-[#C8A45C] font-bold after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:mx-auto after:w-full after:h-[2px] after:bg-[#C8A45C] after:rounded-full after:shadow-[0_0_12px_rgba(200,164,92,0.8)]"
                          : "text-[#C8A45C]/60 hover:text-[#C8A45C] font-medium"
                      }`}
                    >
                      {item.label}
                    </button>
                  </div>
                );
              })}

              {/* Acciones de Cuenta / Citas en Móvil */}
              <div className="w-full flex flex-col items-center gap-3.5 pt-4 border-t border-[#C8A45C]/20 mt-2 text-center">
                {!isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => handleNavClick('/auth/login')}
                    className="text-base font-serif-luxury tracking-wider text-[#C8A45C] font-bold hover:text-white transition-colors flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Iniciar Sesión / Registro</span>
                  </button>
                ) : (
                  <>
                    {isStaffRole && (
                      <button
                        type="button"
                        onClick={() => handleNavClick('/dashboard')}
                        className="w-full py-2 px-4 rounded-xl text-base font-serif-luxury tracking-wider text-[#C8A45C] bg-[#C8A45C]/15 border border-[#C8A45C]/40 hover:text-white transition-colors flex items-center justify-center gap-2 font-bold"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#C8A45C]" />
                        <span>Panel de Control</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleNavClick('/mi-cuenta')}
                      className="text-base font-serif-luxury tracking-wider text-neutral-300 hover:text-[#C8A45C] transition-colors"
                    >
                      Mis Citas / Mis Reservas
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavClick('/mi-cuenta')}
                      className="text-base font-serif-luxury tracking-wider text-neutral-300 hover:text-[#C8A45C] transition-colors"
                    >
                      Mi Cuenta
                    </button>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="text-base font-serif-luxury tracking-wider text-red-400 hover:text-red-300 transition-colors cursor-pointer mt-1"
                    >
                      Cerrar Sesión
                    </button>
                  </>
                )}
              </div>
            </nav>

            {/* Bottom Slogan */}
            <div className="w-full pt-6 border-t border-[#C8A45C]/15 text-center">
              <span className="text-[10px] text-[#C8A45C]/40 tracking-[0.28em] font-semibold block">
                ACICALADOS · DISEÑO &amp; CALIDAD
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
