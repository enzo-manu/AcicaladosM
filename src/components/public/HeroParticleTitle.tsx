import React, { useEffect, useRef } from 'react';

/**
 * ==============================================================================
 * Tipado Estricto para el Sistema de Partículas y Canvas de Alta Definición
 * ==============================================================================
 */

/** Estado y coordenadas de interacción del cursor / touch */
export interface IMouseState {
  x: number | null;
  y: number | null;
  radius: number;
  isActive: boolean;
}

/** Contrato estricto de cada partícula individual */
export interface IParticle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  isGold: boolean;
  density: number;
  update(mouse: IMouseState): void;
}

/** Configuración de cada línea de texto a renderizar */
export interface ITextLineConfig {
  text: string;
  isGold: boolean;
}

/** Parámetros de renderizado y muestreo según viewport */
export interface IResponsiveRenderSettings {
  lines: ITextLineConfig[];
  fontSize: number;
  lineHeight: number;
  step: number;
  particleSize: number;
  mouseRadius: number;
  canvasHeight: number;
}

/**
 * Clase Particle:
 * Modela la física de cada partícula individual:
 * - Repulsión elástica ante proximidad del cursor o toque táctil
 * - Resorte armónico amortiguado (Spring-Damping) hacia su posición base (baseX, baseY)
 */
class Particle implements IParticle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number = 0;
  vy: number = 0;
  size: number;
  isGold: boolean;
  density: number;

  constructor(baseX: number, baseY: number, size: number, isGold: boolean) {
    this.baseX = baseX;
    this.baseY = baseY;
    // Sutil dispersión inicial para un ensamblado orgánico al montar
    this.x = baseX + (Math.random() - 0.5) * 22;
    this.y = baseY + (Math.random() - 0.5) * 22;
    this.size = size;
    this.isGold = isGold;
    // Masa e inercia dinámica para dar variación natural a la onda de choque
    this.density = Math.random() * 16 + 10;
  }

  update(mouse: IMouseState): void {
    // 1. Repulsión física ante cursor / touch activo
    if (mouse.isActive && mouse.x !== null && mouse.y !== null) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const distance = Math.hypot(dx, dy);

      if (distance < mouse.radius && distance > 0.001) {
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        // Caída cuadrática suave: máxima repulsión al centro, 0 en el borde del radio
        const force = (mouse.radius - distance) / mouse.radius;
        const impulse = force * this.density * 0.44;

        this.vx -= forceDirectionX * impulse;
        this.vy -= forceDirectionY * impulse;
      }
    }

    // 2. Física de resorte (Hooke's Law + amortiguamiento) hacia el origen
    const spring = 0.08;
    const friction = 0.85;

    const homeDx = this.baseX - this.x;
    const homeDy = this.baseY - this.y;

    this.vx += homeDx * spring;
    this.vy += homeDy * spring;

    this.vx *= friction;
    this.vy *= friction;

    this.x += this.vx;
    this.y += this.vy;
  }
}

interface HeroParticleTitleProps {
  className?: string;
}

/**
 * Componente HeroParticleTitle
 * - Renderiza el título H1 oculto semánticamente (sr-only) para SEO óptimo.
 * - Canvas en Alta Definición (HiDPI / Retina) con muestreo de alta densidad:
 *   * Escritorio (> 768px): 54px - 68px en 2 líneas, step: 2px (texto denso y continuo).
 *   * Móvil (< 768px): 32px - 40px en 3 líneas centradas, step: 3px (legible, 60fps).
 * - Renderizado por lotes (Batch Rendering): Solo 2 llamadas fill() por frame (Blanco Hueso y Oro Degradado).
 * - Scroll vertical no bloqueante con touch-action: pan-y y listeners pasivos.
 */
export const HeroParticleTitle: React.FC<HeroParticleTitleProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animationFrameId: number;
    let whiteParticles: IParticle[] = [];
    let goldParticles: IParticle[] = [];
    let goldGradient: CanvasGradient | null = null;
    let isRunning = false;

    // Dimensiones lógicas cacheadas para evitar lecturas DOM en cada fotograma
    let currentLogicalWidth = 0;
    let currentLogicalHeight = 0;

    const mouse: IMouseState = {
      x: null,
      y: null,
      radius: 95,
      isActive: false,
    };

    /**
     * Calcula la tipografía majestuosa y los parámetros de densidad:
     * - Escritorio (>= 768px): 2 líneas, 54px a 68px, step: 2
     * - Móvil (< 768px): 3 líneas limpias, 32px a 40px, step: 3
     */
    const getResponsiveSettings = (width: number): IResponsiveRenderSettings => {
      const isMobile = width < 768;

      if (isMobile) {
        // Móvil (< 768px): 3 líneas perfectamente distribuidas
        const fontSize = Math.min(40, Math.max(31, Math.floor(width * 0.082)));
        const lineHeight = Math.floor(fontSize * 1.32);
        return {
          lines: [
            { text: 'El Arte del Buen Gusto,', isGold: false },
            { text: 'Barbería Tradicional', isGold: true },
            { text: '& Spa', isGold: true },
          ],
          fontSize,
          lineHeight,
          step: 3, // Muestreo fino para móvil: elimina el aspecto pixelado y mantiene 60fps
          particleSize: 1.6, // Diámetro ~3.2px que cubre los espacios entre partículas
          mouseRadius: 65,
          canvasHeight: lineHeight * 3 + 55,
        };
      }

      // Escritorio (>= 768px): 2 líneas imponentes de 54px a 68px
      const fontSize = Math.min(68, Math.max(54, Math.floor(width * 0.062)));
      const lineHeight = Math.floor(fontSize * 1.26);
      return {
        lines: [
          { text: 'El Arte del Buen Gusto,', isGold: false },
          { text: 'Barbería Tradicional & Spa', isGold: true },
        ],
        fontSize,
        lineHeight,
        step: 2, // Paso de 2px en escritorio: densidad ultra-alta y lectura de texto continuo
        particleSize: 1.35, // Diámetro ~2.7px con solapamiento suave que rellena los caracteres
        mouseRadius: 100,
        canvasHeight: lineHeight * 2 + 65,
      };
    };

    /**
     * Inicializa o actualiza la malla de partículas mediante un canvas offscreen
     */
    const initParticles = () => {
      const rect = container.getBoundingClientRect();
      const logicalWidth = Math.floor(rect.width || 320);

      const settings = getResponsiveSettings(logicalWidth);
      const logicalHeight = settings.canvasHeight;

      currentLogicalWidth = logicalWidth;
      currentLogicalHeight = logicalHeight;
      mouse.radius = settings.mouseRadius;

      // Soporte HiDPI / Retina Display
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

      canvas.width = Math.floor(logicalWidth * dpr);
      canvas.height = Math.floor(logicalHeight * dpr);
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Canvas offscreen para rasterizar el texto con exactitud de subpíxel
      const offscreen = document.createElement('canvas');
      offscreen.width = logicalWidth;
      offscreen.height = logicalHeight;
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';

      // Ajuste proporcional automático para evitar cualquier desborde horizontal
      let actualFontSize = settings.fontSize;
      offCtx.font = `700 ${actualFontSize}px 'Playfair Display', Georgia, serif`;

      let maxLineWidth = 0;
      settings.lines.forEach((line) => {
        const w = offCtx.measureText(line.text).width;
        if (w > maxLineWidth) maxLineWidth = w;
      });

      if (maxLineWidth > logicalWidth * 0.94) {
        const scaleFactor = (logicalWidth * 0.94) / maxLineWidth;
        actualFontSize = Math.floor(actualFontSize * scaleFactor);
        offCtx.font = `700 ${actualFontSize}px 'Playfair Display', Georgia, serif`;
      }

      const totalBlockHeight = settings.lines.length * settings.lineHeight;
      const startY = (logicalHeight - totalBlockHeight) / 2 + settings.lineHeight / 2;

      let goldBlockHalfWidth = 200;

      // Dibujar cada línea en el offscreen canvas
      settings.lines.forEach((line, index) => {
        const lineY = startY + index * settings.lineHeight;
        const textMetrics = offCtx.measureText(line.text);

        if (line.isGold) {
          goldBlockHalfWidth = Math.max(goldBlockHalfWidth, textMetrics.width / 2);
          // Máscara opaca para escaneo de píxeles
          offCtx.fillStyle = '#FFD700';
        } else {
          offCtx.fillStyle = '#FFFFFF';
        }

        offCtx.fillText(line.text, logicalWidth / 2, lineY);
      });

      // Crear el degradado dorado metálico oficial de la marca
      const grad = ctx.createLinearGradient(
        logicalWidth / 2 - goldBlockHalfWidth,
        0,
        logicalWidth / 2 + goldBlockHalfWidth,
        0
      );
      grad.addColorStop(0, '#F3E5AB');
      grad.addColorStop(0.25, '#DFCA8D');
      grad.addColorStop(0.65, '#C8A45C');
      grad.addColorStop(1, '#9A7B38');
      goldGradient = grad;

      // Muestreo denso de píxeles (step fino)
      const imgData = offCtx.getImageData(0, 0, logicalWidth, logicalHeight);
      const data = imgData.data;

      const newWhite: IParticle[] = [];
      const newGold: IParticle[] = [];

      for (let y = 0; y < logicalHeight; y += settings.step) {
        for (let x = 0; x < logicalWidth; x += settings.step) {
          const index = (y * logicalWidth + x) * 4;
          const alpha = data[index + 3];

          // Filtrar píxeles que conforman los glifos de las letras
          if (alpha > 60) {
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];

            // Si tiene componente roja alta y azul baja corresponde al color dorado
            const isGoldPixel = r > 180 && b < 100;

            if (isGoldPixel) {
              newGold.push(new Particle(x, y, settings.particleSize, true));
            } else {
              newWhite.push(new Particle(x, y, settings.particleSize, false));
            }
          }
        }
      }

      whiteParticles = newWhite;
      goldParticles = newGold;
    };

    /**
     * Bucle de animación optimizado por lotes (Batch Rendering a 60-120 FPS):
     * Actualiza posiciones y dibuja todas las partículas con solo 2 llamadas fill()
     */
    const animate = () => {
      // Limpieza segura del canvas físico
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // 1. Actualizar física de todas las partículas
      const totalWhite = whiteParticles.length;
      for (let i = 0; i < totalWhite; i++) {
        whiteParticles[i].update(mouse);
      }

      const totalGold = goldParticles.length;
      for (let i = 0; i < totalGold; i++) {
        goldParticles[i].update(mouse);
      }

      // 2. Batch 1: Partículas Blanco Hueso (#FBF9F4) en un único draw call
      ctx.fillStyle = '#FBF9F4';
      ctx.beginPath();
      for (let i = 0; i < totalWhite; i++) {
        const p = whiteParticles[i];
        ctx.moveTo(p.x + p.size, p.y);
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      }
      ctx.fill();

      // 3. Batch 2: Partículas Oro Degradado de la marca en un único draw call
      if (goldGradient) {
        ctx.fillStyle = goldGradient;
        ctx.beginPath();
        for (let i = 0; i < totalGold; i++) {
          const p = goldParticles[i];
          ctx.moveTo(p.x + p.size, p.y);
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const start = () => {
      initParticles();
      if (!isRunning) {
        isRunning = true;
        animate();
      }
    };

    // Asegurar que la tipografía Playfair Display esté lista antes de muestrear píxeles
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(start);
    } else {
      start();
    }

    // ==========================================================================
    // Interacción Híbrida: Escritorio (Mouse) y Móvil (Touch)
    // ==========================================================================

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.isActive = true;
    };

    const handleMouseLeave = () => {
      mouse.isActive = false;
      mouse.x = null;
      mouse.y = null;
    };

    // Eventos táctiles sin preventDefault: preservan al 100% el scroll vertical nativo
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.touches[0].clientX - rect.left;
        mouse.y = e.touches[0].clientY - rect.top;
        mouse.isActive = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.touches[0].clientX - rect.left;
        mouse.y = e.touches[0].clientY - rect.top;
        mouse.isActive = true;
      }
    };

    const handleTouchEnd = () => {
      mouse.isActive = false;
      mouse.x = null;
      mouse.y = null;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // { passive: true } garantiza respuesta inmediata de desplazamiento vertical
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    // Observador de redimensionamiento con debounce
    let resizeTimeout: number;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          clearTimeout(resizeTimeout);
          resizeTimeout = window.setTimeout(() => {
            initParticles();
          }, 120);
        }
      }
    });

    resizeObserver.observe(container);

    // Limpieza estricta de memoria al desmontar
    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();

      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[200px] sm:min-h-[230px] lg:min-h-[250px] overflow-hidden ${className}`}
    >
      {/* 
        H1 semántico oculto con sr-only para SEO impecable.
        Google, Bing y lectores de pantalla leen este título sin alteraciones.
      */}
      <h1 className="sr-only">
        El Arte del Buen Gusto, Barbería Tradicional &amp; Spa
      </h1>

      {/* 
        Canvas de partículas interactivo en Alta Definición.
        - touchAction: 'pan-y' garantiza el scroll táctil vertical nativo.
        - aria-hidden='true' para no duplicar el contenido con el H1 semántico.
      */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="w-full block select-none cursor-crosshair transition-opacity duration-300"
        style={{ touchAction: 'pan-y' }}
      />
    </div>
  );
};

export default HeroParticleTitle;
