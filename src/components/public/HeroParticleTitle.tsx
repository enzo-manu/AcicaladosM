import React, { useEffect, useRef } from 'react';

/**
 * ==============================================================================
 * Tipado Estricto para el Sistema de Partículas y Canvas
 * ==============================================================================
 */

/** Estado y coordenadas de interacción del cursor/touch */
export interface IMouseState {
  x: number | null;
  y: number | null;
  radius: number;
  isActive: boolean;
}

/** Interfaz estricta que define el contrato de cada partícula */
export interface IParticle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  density: number;
  update(mouse: IMouseState): void;
  draw(ctx: CanvasRenderingContext2D): void;
}

/** Configuración de líneas de texto a renderizar */
export interface ITextLineConfig {
  text: string;
  isGold: boolean;
}

/** Parámetros de renderizado y rendimiento calculados según viewport */
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
 * Clase que modela la física de cada partícula individual:
 * - Repulsión ante cursor/toque
 * - Efecto resorte elástico (spring/damping) hacia su posición base (baseX, baseY)
 */
class Particle implements IParticle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number = 0;
  vy: number = 0;
  size: number;
  color: string;
  density: number;

  constructor(baseX: number, baseY: number, size: number, color: string) {
    this.baseX = baseX;
    this.baseY = baseY;
    // Ligera dispersión inicial para un ensamblado orgánico al montar
    this.x = baseX + (Math.random() - 0.5) * 20;
    this.y = baseY + (Math.random() - 0.5) * 20;
    this.size = size;
    this.color = color;
    // Masa / inercia aleatoria para darle dinamismo al movimiento
    this.density = Math.random() * 18 + 10;
  }

  update(mouse: IMouseState): void {
    // 1. Interacción de repulsión si el cursor/dedo está activo
    if (mouse.isActive && mouse.x !== null && mouse.y !== null) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const distance = Math.hypot(dx, dy);

      if (distance < mouse.radius && distance > 0.001) {
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        // Mayor fuerza en el centro, disminuyendo hacia el radio límite
        const force = (mouse.radius - distance) / mouse.radius;
        const impulse = force * this.density * 0.42;

        // Alejar la partícula en sentido contrario al cursor
        this.vx -= forceDirectionX * impulse;
        this.vy -= forceDirectionY * impulse;
      }
    }

    // 2. Modelo de resorte físico (Spring-damping) hacia su ancla original
    const spring = 0.075;
    const friction = 0.86;

    const homeDx = this.baseX - this.x;
    const homeDy = this.baseY - this.y;

    this.vx += homeDx * spring;
    this.vy += homeDy * spring;

    this.vx *= friction;
    this.vy *= friction;

    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

interface HeroParticleTitleProps {
  className?: string;
}

/**
 * Componente HeroParticleTitle
 * - Renderiza el título H1 oculto semánticamente (sr-only) para SEO óptimo.
 * - Genera un canvas de partículas interactivo en tiempo real.
 * - Adaptabilidad Mobile-First: Divide en 3 o 4 líneas en móvil y 2 líneas en escritorio.
 * - Rendimiento 60fps con muestreo selectivo (step adaptativo) y Retina DPI scaling.
 * - Scroll vertical no bloqueante (touch-action: pan-y y listeners pasivos).
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
    let particles: IParticle[] = [];

    // Estado del cursor/touch
    const mouse: IMouseState = {
      x: null,
      y: null,
      radius: 80,
      isActive: false,
    };

    /**
     * Calcula la configuración tipográfica y de partículas según el ancho del contenedor.
     * En móvil (< 768px):
     *   - Divide el texto en 3 o 4 líneas
     *   - Reduce fontSize
     *   - Incrementa el 'step' (salto de píxeles) para reducir la cantidad de partículas y garantizar 60 FPS
     * En escritorio (>= 768px):
     *   - Dibuja el texto en 2 líneas
     *   - Usa 'step' menor (mayor densidad de partículas)
     */
    const getResponsiveSettings = (width: number): IResponsiveRenderSettings => {
      const isMobile = width < 768;
      const isSmallMobile = width < 480;

      if (isSmallMobile) {
        // Móvil pequeño (320px - 479px): 4 líneas bien distribuidas
        const fontSize = Math.max(21, Math.min(26, Math.floor(width * 0.068)));
        const lineHeight = Math.floor(fontSize * 1.35);
        return {
          lines: [
            { text: 'El Arte del', isGold: false },
            { text: 'Buen Gusto,', isGold: false },
            { text: 'Barbería Tradicional', isGold: true },
            { text: '& Spa', isGold: true },
          ],
          fontSize,
          lineHeight,
          step: 4, // Salto óptimo en móvil pequeño
          particleSize: 1.8,
          mouseRadius: 55,
          canvasHeight: lineHeight * 4 + 40,
        };
      }

      if (isMobile) {
        // Móvil mediano / tablet chica (480px - 767px): 3 líneas
        const fontSize = Math.max(26, Math.min(34, Math.floor(width * 0.056)));
        const lineHeight = Math.floor(fontSize * 1.32);
        return {
          lines: [
            { text: 'El Arte del Buen Gusto,', isGold: false },
            { text: 'Barbería Tradicional', isGold: true },
            { text: '& Spa', isGold: true },
          ],
          fontSize,
          lineHeight,
          step: 4, // Salto balanceado
          particleSize: 1.8,
          mouseRadius: 65,
          canvasHeight: lineHeight * 3 + 45,
        };
      }

      // Escritorio (>= 768px): 2 líneas majestuosas
      const fontSize = Math.max(38, Math.min(56, Math.floor(width * 0.052)));
      const lineHeight = Math.floor(fontSize * 1.28);
      return {
        lines: [
          { text: 'El Arte del Buen Gusto,', isGold: false },
          { text: 'Barbería Tradicional & Spa', isGold: true },
        ],
        fontSize,
        lineHeight,
        step: 3, // Mayor densidad para máxima fidelidad visual
        particleSize: 1.6,
        mouseRadius: 90,
        canvasHeight: lineHeight * 2 + 50,
      };
    };

    /**
     * Inicializa las dimensiones del canvas y genera las partículas
     * renderizando temporalmente el texto en un canvas fuera de pantalla.
     */
    const initParticles = () => {
      const rect = container.getBoundingClientRect();
      const logicalWidth = Math.floor(rect.width || 320);

      const settings = getResponsiveSettings(logicalWidth);
      const logicalHeight = settings.canvasHeight;
      mouse.radius = settings.mouseRadius;

      // Soporte Retina / High-DPI (limitado a 2x para mantener 60fps estables)
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(logicalWidth * dpr);
      canvas.height = Math.floor(logicalHeight * dpr);
      canvas.style.width = `${logicalWidth}px`;
      canvas.style.height = `${logicalHeight}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Canvas offscreen para rasterizar y extraer píxeles
      const offscreen = document.createElement('canvas');
      offscreen.width = logicalWidth;
      offscreen.height = logicalHeight;
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.font = `700 ${settings.fontSize}px 'Playfair Display', Georgia, serif`;

      const totalBlockHeight = settings.lines.length * settings.lineHeight;
      const startY = (logicalHeight - totalBlockHeight) / 2 + settings.lineHeight / 2;

      // Dibujar cada línea en el offscreen canvas
      settings.lines.forEach((line, index) => {
        const lineY = startY + index * settings.lineHeight;

        if (line.isGold) {
          const textMetrics = offCtx.measureText(line.text);
          const textHalfWidth = textMetrics.width / 2;
          const gradient = offCtx.createLinearGradient(
            logicalWidth / 2 - textHalfWidth,
            lineY,
            logicalWidth / 2 + textHalfWidth,
            lineY
          );
          gradient.addColorStop(0, '#DFCA8D');
          gradient.addColorStop(0.5, '#C8A45C');
          gradient.addColorStop(1, '#9A7B38');
          offCtx.fillStyle = gradient;
        } else {
          offCtx.fillStyle = '#FFFFFF';
        }

        offCtx.fillText(line.text, logicalWidth / 2, lineY);
      });

      // Extraer datos de píxeles
      const imgData = offCtx.getImageData(0, 0, logicalWidth, logicalHeight);
      const data = imgData.data;
      const newParticles: IParticle[] = [];

      for (let y = 0; y < logicalHeight; y += settings.step) {
        for (let x = 0; x < logicalWidth; x += settings.step) {
          const index = (y * logicalWidth + x) * 4;
          const alpha = data[index + 3];

          // Filtrar píxeles opacos que forman las letras
          if (alpha > 70) {
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const color = `rgb(${r}, ${g}, ${b})`;

            newParticles.push(new Particle(x, y, settings.particleSize, color));
          }
        }
      }

      particles = newParticles;
    };

    /** Bucle de animación continuo a 60fps */
    const animate = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = canvas.clientHeight;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update(mouse);
        particles[i].draw(ctx);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Asegurar que la tipografía Playfair Display esté cargada antes de generar partículas
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        initParticles();
        animate();
      });
    } else {
      initParticles();
      animate();
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

    // En eventos táctiles NO se llama preventDefault() para NO bloquear el scroll vertical nativo
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

    // Configurados expresamente con passive: true para optimizar el scroll nativo
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    // Observador de cambio de tamaño (ResizeObserver) con debounce
    let resizeTimeout: number;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          clearTimeout(resizeTimeout);
          resizeTimeout = window.setTimeout(() => {
            initParticles();
          }, 150);
        }
      }
    });

    resizeObserver.observe(container);

    // Limpieza estricta de memoria y listeners
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
      className={`relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[160px] sm:min-h-[190px] lg:min-h-[210px] overflow-hidden ${className}`}
    >
      {/* 
        H1 oculto visualmente con sr-only para preservación estricta de SEO y accesibilidad.
        Los motores de búsqueda (Google, Bing) y lectores de pantalla indexan este contenido directamente.
      */}
      <h1 className="sr-only">
        El Arte del Buen Gusto, Barbería Tradicional &amp; Spa
      </h1>

      {/* 
        Canvas de partículas interactivo.
        - touchAction: 'pan-y' garantiza el scroll vertical nativo fluido en smartphones.
        - aria-hidden='true' para evitar redundancias con el H1 semántico.
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
