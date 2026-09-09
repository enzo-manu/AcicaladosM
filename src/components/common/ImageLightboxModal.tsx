import React, { useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { X, ExternalLink, Tag } from 'lucide-react';

export const ImageLightboxModal: React.FC = () => {
  const { lightboxImage, closeLightbox } = useApp();

  // Cerrar al presionar la tecla Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      }
    },
    [closeLightbox]
  );

  useEffect(() => {
    if (!lightboxImage) return;

    window.addEventListener('keydown', handleKeyDown);
    // Bloquear scroll de fondo mientras el lightbox está abierto
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [lightboxImage, handleKeyDown]);

  if (!lightboxImage) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={lightboxImage.title}
      onClick={closeLightbox}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 lg:p-8 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Contenedor Principal del Lightbox con estética luxury */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl w-full max-h-[92vh] bg-[#111111] border border-[#C8A45C]/40 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.95),0_0_35px_rgba(200,164,92,0.18)] flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Línea dorada superior decorativa */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#E6C875] to-transparent shrink-0" />

        {/* Cabecera del Lightbox */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-neutral-800/80 bg-[#161616] shrink-0 gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {lightboxImage.code && (
                <span className="px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-[#C8A45C] to-[#A27F38] text-black font-extrabold text-[11px] tracking-wider shadow flex items-center gap-1 border border-[#FFE7A8]">
                  <Tag className="w-3 h-3 stroke-[2.5]" />
                  <span>{lightboxImage.code}</span>
                </span>
              )}
              {lightboxImage.category && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-800/90 text-neutral-300 border border-neutral-700/80">
                  {lightboxImage.category}
                </span>
              )}
              {lightboxImage.price && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#C8A45C]/15 text-[#E6C875] border border-[#C8A45C]/35">
                  {lightboxImage.price}
                </span>
              )}
            </div>

            <h2 className="font-serif-luxury font-bold text-base sm:text-xl text-white tracking-wide truncate">
              {lightboxImage.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Abrir imagen original en nueva pestaña */}
            <a
              href={lightboxImage.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir imagen original en alta resolución"
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-[#E6C875] hover:border-[#C8A45C]/40 transition shadow cursor-pointer hidden sm:flex items-center justify-center"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Botón de Cierre Dorado (X) */}
            <button
              type="button"
              id="btn-close-lightbox"
              onClick={closeLightbox}
              title="Cerrar visualizador (Esc)"
              className="w-9 h-9 rounded-xl bg-neutral-900/90 border border-[#C8A45C]/40 text-[#E6C875] hover:text-black hover:bg-[#C8A45C] hover:border-[#C8A45C] transition-all flex items-center justify-center shadow-lg cursor-pointer"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Área Central: Fotografía en Alta Resolución Centrada y Escalada */}
        <div className="relative flex-1 min-h-[260px] sm:min-h-[400px] bg-[#0A0A0A] flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          {/* Fondo sutil radial dorado */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(200,164,92,0.06)_0%,transparent_70%)] pointer-events-none" />

          <img
            src={lightboxImage.url}
            alt={lightboxImage.title}
            className="max-h-[64vh] sm:max-h-[72vh] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-neutral-800/80 transition-transform duration-300 select-none"
            loading="eager"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=85';
            }}
          />
        </div>

        {/* Pie del Lightbox: Detalles adicionales o descripción */}
        {(lightboxImage.description || lightboxImage.metadata) && (
          <div className="px-5 py-3 border-t border-neutral-800/80 bg-[#141414] shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            {lightboxImage.description && (
              <p className="text-neutral-300 text-[11px] sm:text-xs leading-relaxed max-w-3xl line-clamp-2 sm:line-clamp-none">
                {lightboxImage.description}
              </p>
            )}
            {lightboxImage.metadata && (
              <div className="sm:ml-auto shrink-0 flex items-center gap-1.5 text-neutral-400 text-[11px] font-mono">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C8A45C]" />
                <span>{lightboxImage.metadata}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
