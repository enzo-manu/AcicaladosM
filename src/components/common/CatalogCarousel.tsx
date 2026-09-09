import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';

interface CatalogCarouselProps {
  children: React.ReactNode;
  gridClassName?: string;
  className?: string;
  itemCount: number;
}

export const CatalogCarousel: React.FC<CatalogCarouselProps> = ({
  children,
  gridClassName = 'grid grid-rows-2 grid-flow-col auto-cols-[320px] gap-6',
  className = '',
  itemCount,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const initialScrollLeftRef = useRef(0);
  const hasMovedSignificantlyRef = useRef(false);

  const [isCursorGrabbing, setIsCursorGrabbing] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Actualiza los estados de las flechas y la barra de progreso
  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < maxScroll - 6);

    if (maxScroll > 0) {
      setScrollProgress(Math.min(100, Math.max(0, (scrollLeft / maxScroll) * 100)));
    } else {
      setScrollProgress(0);
    }
  }, []);

  // Reiniciar scroll y recalcular ante cambios de tamaño o cantidad de ítems filtrados
  useEffect(() => {
    updateScrollState();
    const el = containerRef.current;
    if (!el) return;

    el.scrollTo({ left: 0, behavior: 'smooth' });

    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [itemCount, updateScrollState]);

  // 1. RUEDA DEL MOUSE (Wheel to Horizontal Scroll)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Priorizar el desplazamiento vertical de la rueda del mouse tradicional
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (maxScroll <= 0) return;

        const canScrollRightNow = e.deltaY > 0 && container.scrollLeft < maxScroll - 1;
        const canScrollLeftNow = e.deltaY < 0 && container.scrollLeft > 1;

        if (canScrollRightNow || canScrollLeftNow) {
          e.preventDefault();
          container.scrollLeft += e.deltaY;
          updateScrollState();
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [updateScrollState]);

  // 2. ARRASTRE CON CLIC (Mouse Drag-to-Scroll / Free Drag)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Solo botón izquierdo del mouse
    if (e.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;

    isDraggingRef.current = true;
    startXRef.current = e.pageX;
    initialScrollLeftRef.current = container.scrollLeft;
    hasMovedSignificantlyRef.current = false;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const container = containerRef.current;
      if (!container) return;

      const delta = e.pageX - startXRef.current;
      if (Math.abs(delta) > 5) {
        if (!hasMovedSignificantlyRef.current) {
          hasMovedSignificantlyRef.current = true;
          setIsCursorGrabbing(true);
        }
        container.scrollLeft = initialScrollLeftRef.current - delta;
        updateScrollState();
      }
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsCursorGrabbing(false);

      if (hasMovedSignificantlyRef.current) {
        // Interceptar y cancelar clics accidentales tras un arrastre evidente
        const captureClick = (clickEvent: MouseEvent) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
          window.removeEventListener('click', captureClick, true);
        };
        window.addEventListener('click', captureClick, true);
        setTimeout(() => {
          window.removeEventListener('click', captureClick, true);
          hasMovedSignificantlyRef.current = false;
        }, 80);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [updateScrollState]);

  // 4. BOTONES DE NAVEGACIÓN LATERAL
  const handleScrollBy = (direction: -1 | 1) => {
    const container = containerRef.current;
    if (!container) return;
    const distance = container.clientWidth * 0.75;
    container.scrollBy({ left: direction * distance, behavior: 'smooth' });
    setTimeout(updateScrollState, 350);
  };

  return (
    <div className={`relative group/carousel ${className}`}>
      {/* Botón Lateral Izquierdo (Oculto en móvil, visible en escritorio md+) */}
      <button
        type="button"
        onClick={() => handleScrollBy(-1)}
        disabled={!canScrollLeft}
        aria-label="Desplazar a la izquierda"
        className={`hidden md:flex absolute -left-4 lg:-left-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-[#141414]/95 border border-[#C8A45C]/40 text-[#E6C875] items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-300 ${
          canScrollLeft
            ? 'opacity-100 hover:bg-[#202020] hover:border-[#C8A45C] hover:text-white hover:scale-110 active:scale-95 cursor-pointer shadow-[#C8A45C]/20'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Botón Lateral Derecho (Oculto en móvil, visible en escritorio md+) */}
      <button
        type="button"
        onClick={() => handleScrollBy(1)}
        disabled={!canScrollRight}
        aria-label="Desplazar a la derecha"
        className={`hidden md:flex absolute -right-4 lg:-right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 lg:w-12 lg:h-12 rounded-2xl bg-[#141414]/95 border border-[#C8A45C]/40 text-[#E6C875] items-center justify-center shadow-2xl backdrop-blur-md transition-all duration-300 ${
          canScrollRight
            ? 'opacity-100 hover:bg-[#202020] hover:border-[#C8A45C] hover:text-white hover:scale-110 active:scale-95 cursor-pointer shadow-[#C8A45C]/20'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Contenedor con Scroll Libre Horizontal y Swipe Táctil Nativo */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onScroll={updateScrollState}
        onDragStart={(e) => e.preventDefault()}
        style={{
          touchAction: 'pan-x pan-y',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className={`overflow-x-auto touch-pan-x scroll-smooth overscroll-x-contain py-2 px-1 select-none scrollbar-none [&::-webkit-scrollbar]:hidden ${
          isCursorGrabbing ? 'cursor-grabbing select-none' : 'cursor-grab'
        }`}
      >
        <div className={gridClassName}>
          {children}
        </div>
      </div>

      {/* Barra de progreso y guía interactiva inferior */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 px-2 text-[11px] text-neutral-400">
        <div className="flex items-center gap-1.5 text-neutral-400">
          <MoveHorizontal className="w-3.5 h-3.5 text-[#C8A45C] animate-pulse" />
          <span className="hidden sm:inline">Gira la rueda, arrastra con el cursor o desliza para navegar</span>
          <span className="sm:hidden">Desliza horizontalmente para explorar todo el catálogo</span>
        </div>

        {/* Barra de progreso dorada */}
        <div className="w-full sm:w-48 h-1.5 rounded-full bg-neutral-900 border border-neutral-800 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-[#C8A45C] to-[#E6C875] rounded-full transition-all duration-150"
            style={{ width: `${Math.max(15, scrollProgress)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
