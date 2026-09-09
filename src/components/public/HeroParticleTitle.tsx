import React, { useEffect, useRef } from 'react';

/**
 * ==============================================================================
 * Tipado Estricto para el Sistema de Partículas y Canvas de Alta Definición
 * ==============================================================================
 */

/** Estado y dinámica de interacción del cursor / touch */
export interface IMouseState {
  x: number | null;
  y: number | null;
  prevX: number | null;
  prevY: number | null;
  speed: number;          // Velocidad instantánea en px/ms
  smoothedSpeed: number;  // Velocidad suavizada con inercia para onda expansiva
  radius: number;         // Radio dinámico actual expandido por velocidad
  baseRadius: number;     // Radio base configurado según viewport
  forceFactor: number;    // Multiplicador de impacto dinámico
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
 * Modela la física balística y armónica de cada partícula:
 * - Repulsión por onda de choque proporcional a la velocidad del puntero
 * - Resorte armónico amortiguado (Spring-Damping) con fricción suave para retorno elástico y fluido
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
    // Variación dinámica de masa / resistencia al impacto
    this.density = Math.random() * 16 + 12;
  }

  update(mouse: IMouseState): void {
    // 1. Repulsión balística y onda expansiva ante el cursor/touch
    if (mouse.isActive && mouse.x !== null && mouse.y !== null) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const distance = Math.hypot(dx, dy);

      if (distance < mouse.radius && distance > 0.001) {
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;

        // Caída de fuerza no-lineal: potente en el epicentro y suave hacia el perímetro
        const normalizedDist = (mouse.radius - distance) / mouse.radius;
        const powerCurve = Math.pow(normalizedDist, 1.15);

        // Fuerza base + multiplicador dinámico escalado por la velocidad del cursor (shockwave)
        const baseForce = 1.35;
        const impulse = powerCurve * this.density * baseForce * mouse.forceFactor;

        this.vx -= forceDirectionX * impulse;
        this.vy -= forceDirectionY * impulse;
      }
    }

    // 2. Retorno elástico orgánico (Spring-Damping de alta inercia)
    // Fricción ~ 0.915: permite que la partícula vuele libremente tras el impacto sin frenar en seco
    // Spring ~ 0.065: la atrae de vuelta a su posición base con un rebote suave y elegante
    const spring = 0.065;
    const friction = 0.915;

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
 * - H1 oculto semánticamente (sr-only) para SEO y accesibilidad completa.
 * - Renderizado en Alta Definición Retina (HiDPI) a 60-120 FPS mediante Batch Rendering.
 * - Física dinámica de impacto: cálculo instantáneo de velocidad en mousemove / touchmove.
 *   * Movimientos lentos generan una estela suave.
 *   * Movimientos rápidos / latigazos desatan una onda de choque expansiva.
 * - Scroll vertical no bloqueante garantizado con touch-action: pan-y y listeners pasivos.
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

    // Estado reactivo del puntero con cálculo cinético
    const mouse: IMouseState = {
      x: null,
      y: null,
      prevX: null,
      prevY: null,
      speed: 0,
      smoothedSpeed: 0,
      radius: 155,
      baseRadius: 155,
      forceFactor: 1.0,
      isActive: false,
    };

    /**
     * Configuración de tipografía e interacción adaptativa:
     * - Escritorio (>= 768px): 2 líneas, 54px a 68px, step: 2, radio base: 155px
     * - Móvil (< 768px): 3 líneas centradas, 32px a 40px, step: 3, radio base: 90px
     */
    const getResponsiveSettings = (width: number): IResponsiveRenderSettings => {
      const isMobile = width < 768;

      if (isMobile) {
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
          step: 3,
          particleSize: 1.6,
          mouseRadius: 90, // Radio base en móvil (se expande hasta ~150px con swipe rápido)
          canvasHeight: lineHeight * 3 + 70,
        };
      }

      // Escritorio
      const fontSize = Math.min(68, Math.max(54, Math.floor(width * 0.062)));
      const lineHeight = Math.floor(fontSize * 1.26);
      return {
        lines: [
          { text: 'El Arte del Buen Gusto,', isGold: false },
          { text: 'Barbería Tradicional & Spa', isGold: true },
        ],
        fontSize,
        lineHeight,
        step: 2,
        particleSize: 1.35,
        mouseRadius: 155, // Radio base en escritorio (se expande hasta ~255px en latigazos)
        canvasHeight: lineHeight * 2 + 80,
      };
    };

    /**
     * Inicializa las partículas y la malla rasterizada
     */
    const initParticles = () => {
      const rect = container.getBoundingClientRect();
      const logicalWidth = Math.floor(rect.width || 320);

      const settings = getResponsiveSettings(logicalWidth);
      const logicalHeight = settings.canvasHeight;

      mouse.baseRadius = settings.mouseRadius;
      mouse.radius = settings.mouseRadius;

      // Soporte HiDPI / Retina Display
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

      canvas.width = Math.floor(logicalWidth * dpr);
      canvas.height = Math.floor(logicalHeight * dpr);
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Canvas offscreen para rasterizar con precisión subpíxel
      const offscreen = document.createElement('canvas');
      offscreen.width = logicalWidth;
      offscreen.height = logicalHeight;
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';

      // Comprobación de seguridad contra desbordes
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

      settings.lines.forEach((line, index) => {
        const lineY = startY + index * settings.lineHeight;
        const textMetrics = offCtx.measureText(line.text);

        if (line.isGold) {
          goldBlockHalfWidth = Math.max(goldBlockHalfWidth, textMetrics.width / 2);
          offCtx.fillStyle = '#FFD700';
        } else {
          offCtx.fillStyle = '#FFFFFF';
        }

        offCtx.fillText(line.text, logicalWidth / 2, lineY);
      });

      // Crear degradado dorado metálico oficial
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

      // Muestreo denso de píxeles
      const imgData = offCtx.getImageData(0, 0, logicalWidth, logicalHeight);
      const data = imgData.data;

      const newWhite: IParticle[] = [];
      const newGold: IParticle[] = [];

      for (let y = 0; y < logicalHeight; y += settings.step) {
        for (let x = 0; x < logicalWidth; x += settings.step) {
          const index = (y * logicalWidth + x) * 4;
          const alpha = data[index + 3];

          if (alpha > 60) {
            const r = data[index];
            const b = data[index + 2];
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
     * Bucle de renderizado cinético a 60-120 FPS
     */
    const animate = () => {
      // 1. Decaimiento natural de la velocidad suavizada del cursor
      mouse.smoothedSpeed *= 0.88;
      if (mouse.smoothedSpeed < 0.02) {
        mouse.smoothedSpeed = 0;
      }

      // 2. Modulación dinámica de radio y fuerza según la velocidad del puntero
      // Expansión del radio de impacto hasta +100px en latigazos
      const speedRadiusExpansion = Math.min(mouse.smoothedSpeed * 38, 100);
      mouse.radius = mouse.baseRadius + speedRadiusExpansion;

      // Multiplicador de impacto de 1.0 (base) hasta 3.6x (alta velocidad)
      mouse.forceFactor = 1.0 + Math.min(mouse.smoothedSpeed * 1.5, 2.6);

      // Limpieza segura del lienzo físico
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // 3. Actualizar física de partículas
      const totalWhite = whiteParticles.length;
      for (let i = 0; i < totalWhite; i++) {
        whiteParticles[i].update(mouse);
      }

      const totalGold = goldParticles.length;
      for (let i = 0; i < totalGold; i++) {
        goldParticles[i].update(mouse);
      }

      // 4. Batch 1: Partículas Blanco Hueso (#FBF9F4)
      ctx.fillStyle = '#FBF9F4';
      ctx.beginPath();
      for (let i = 0; i < totalWhite; i++) {
        const p = whiteParticles[i];
        ctx.moveTo(p.x + p.size, p.y);
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      }
      ctx.fill();

      // 5. Batch 2: Partículas Oro Degradado
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

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(start);
    } else {
      start();
    }

    // ==========================================================================
    // Interacción Cinética Híbrida: Medición de Velocidad Instantánea
    // ==========================================================================

    let lastTime = performance.now();
    let lastX = 0;
    let lastY = 0;
    let hasPrevCoord = false;

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const currentX = clientX - rect.left;
      const currentY = clientY - rect.top;
      const now = performance.now();
      const dt = Math.max(now - lastTime, 10); // Milisegundos entre eventos (mín 10ms)

      if (hasPrevCoord) {
        const dx = currentX - lastX;
        const dy = currentY - lastY;
        const distance = Math.hypot(dx, dy);

        // Velocidad instantánea en px/ms
        const instantSpeed = distance / dt;
        mouse.speed = instantSpeed;

        // Suavizado exponencial para absorber picos y mantener la inercia expansiva
        mouse.smoothedSpeed = Math.max(mouse.smoothedSpeed * 0.65 + instantSpeed * 0.35, instantSpeed);
      } else {
        hasPrevCoord = true;
        mouse.speed = 0;
      }

      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      mouse.x = currentX;
      mouse.y = currentY;
      mouse.isActive = true;

      lastTime = now;
      lastX = currentX;
      lastY = currentY;
    };

    const resetPointer = () => {
      mouse.isActive = false;
      mouse.x = null;
      mouse.y = null;
      mouse.speed = 0;
      mouse.smoothedSpeed = 0;
      hasPrevCoord = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      updatePointer(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
      resetPointer();
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        hasPrevCoord = false;
        const touch = e.touches[0];
        updatePointer(touch.clientX, touch.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updatePointer(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      resetPointer();
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Listeners táctiles con passive: true y touch-action: pan-y para preservar el scroll nativo
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });

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
      className={`relative w-full max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[220px] sm:min-h-[260px] lg:min-h-[280px] overflow-hidden ${className}`}
    >
      {/* 
        H1 semántico oculto con sr-only para SEO y accesibilidad completa.
      */}
      <h1 className="sr-only">
        El Arte del Buen Gusto, Barbería Tradicional &amp; Spa
      </h1>

      {/* 
        Canvas de partículas interactivo en Alta Definición.
        - touchAction: 'pan-y' garantiza el scroll táctil vertical nativo.
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
