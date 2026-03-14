'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { ParticleConfig } from '@/data/eraBackgrounds';

// ── Internal particle state ────────────────────────────────────────────────────

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  baseSize: number;  // original size (used by shrinking types)
  phase: number;     // drives sinusoidal sway / twinkle / flicker
  life: number;      // 0→1 fraction used by smoke/mist fade
  lifeRate: number;  // how fast life progresses per normalised frame
}

interface Pool {
  particles: Particle[];
  config: ParticleConfig;
  alpha: number;   // rendered opacity multiplier (lerps toward target)
  target: number;  // 1 = active, 0 = fade out
}

// ── Particle initialisation ────────────────────────────────────────────────────

function initParticle(
  p: Particle,
  cfg: ParticleConfig,
  w: number,
  h: number,
  scatter: boolean, // true = spread randomly across canvas at startup
): void {
  const t    = Math.random();
  p.baseSize = cfg.minSize + t * (cfg.maxSize - cfg.minSize);
  p.size     = cfg.type === 'smoke' ? cfg.minSize : p.baseSize;
  p.phase    = Math.random() * Math.PI * 2;
  p.life     = scatter ? Math.random() : 0;
  p.lifeRate = 0.0015 + Math.random() * 0.003;

  const spd = cfg.speed * (0.55 + Math.random() * 0.9);

  switch (cfg.direction) {
    case 'down':
      p.x  = Math.random() * w;
      p.y  = scatter ? Math.random() * h : -p.baseSize * 3;
      p.vx = (Math.random() - 0.5) * spd * 0.4;
      p.vy = spd;
      break;
    case 'up':
      p.x  = Math.random() * w;
      p.y  = scatter ? Math.random() * h : h + p.baseSize * 3;
      p.vx = (Math.random() - 0.5) * spd * 0.4;
      p.vy = -spd;
      break;
    case 'right':
      p.x  = scatter ? Math.random() * w : -p.baseSize * 3;
      p.y  = Math.random() * h;
      p.vx = spd;
      p.vy = (Math.random() - 0.5) * spd * 0.3;
      break;
    case 'left':
      p.x  = scatter ? Math.random() * w : w + p.baseSize * 3;
      p.y  = Math.random() * h;
      p.vx = -spd;
      p.vy = (Math.random() - 0.5) * spd * 0.3;
      break;
    default: { // 'random'
      p.x  = Math.random() * w;
      p.y  = Math.random() * h;
      const a = Math.random() * Math.PI * 2;
      p.vx = Math.cos(a) * spd * 0.35;
      p.vy = Math.sin(a) * spd * 0.35;
    }
  }
}

function respawn(p: Particle, cfg: ParticleConfig, w: number, h: number): void {
  initParticle(p, cfg, w, h, false);
}

// ── Per-type update — returns effective display opacity ───────────────────────

function updateParticle(p: Particle, cfg: ParticleConfig, dt: number): number {
  switch (cfg.type) {

    case 'dust': {
      p.phase += 0.007 * dt;
      p.x += p.vx * dt + (Math.random() - 0.5) * 0.45 * dt;
      p.y += p.vy * dt - 0.06 * dt;          // gentle upward drift
      p.vx *= Math.pow(0.985, dt);
      p.vy *= Math.pow(0.985, dt);
      return cfg.opacity * (0.30 + 0.70 * Math.abs(Math.sin(p.phase)));
    }

    case 'snow': {
      p.phase += 0.022 * dt;
      p.x += Math.sin(p.phase) * 0.55 * dt + p.vx * dt;
      p.y += p.vy * dt;
      return cfg.opacity;
    }

    case 'mist': {
      p.phase += 0.0025 * dt;
      p.x += p.vx * dt;
      p.y += Math.sin(p.phase * 0.4) * 0.12 * dt;
      return cfg.opacity * (0.25 + 0.75 * Math.abs(Math.sin(p.phase)));
    }

    case 'embers': {
      p.phase += 0.10 * dt;
      p.x += Math.sin(p.phase * 0.65) * 0.75 * dt;
      p.y += p.vy * dt;
      p.size = Math.max(0.3, p.size - 0.018 * dt);
      const flicker = 0.25 + 0.75 * Math.abs(Math.sin(p.phase * 2.3 + 1.1));
      return cfg.opacity * flicker;
    }

    case 'smoke': {
      p.phase += 0.011 * dt;
      p.x += Math.sin(p.phase) * 0.5 * dt;
      p.y += p.vy * dt;
      p.life  = Math.min(1, p.life + p.lifeRate * dt);
      p.size  = Math.min(cfg.maxSize, p.size + 0.45 * dt);
      return cfg.opacity * Math.max(0, 1 - p.life * p.life * 1.3);
    }

    case 'rain': {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      return cfg.opacity;
    }

    case 'leaves': {
      p.phase += 0.038 * dt;
      p.x += Math.sin(p.phase * 0.55) * 0.85 * dt + p.vx * dt;
      p.y += p.vy * dt;
      return cfg.opacity * (0.55 + 0.45 * Math.abs(Math.sin(p.phase)));
    }

    case 'stars': {
      p.phase += (0.011 + (p.baseSize % 0.016)) * dt;
      p.x    += p.vx * dt * 0.08;
      p.y    += p.vy * dt * 0.08;
      return cfg.opacity * (0.15 + 0.85 * Math.abs(Math.sin(p.phase)));
    }

    default: {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      return cfg.opacity;
    }
  }
}

// ── Draw one particle ─────────────────────────────────────────────────────────

function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  cfg: ParticleConfig,
  opacity: number,
): void {
  if (opacity < 0.01 || p.size < 0.1) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1, opacity);

  const hasGlow     = (cfg.type === 'embers' || cfg.type === 'stars') && cfg.blur >= 0;
  const hasSoftGlow = (cfg.type === 'mist'   || cfg.type === 'smoke') && cfg.blur > 0;

  if (hasGlow) {
    ctx.shadowBlur  = p.size * 4;
    ctx.shadowColor = cfg.color;
  } else if (hasSoftGlow) {
    ctx.shadowBlur  = cfg.blur * 2.5;
    ctx.shadowColor = cfg.color;
  }

  ctx.fillStyle   = cfg.color;
  ctx.strokeStyle = cfg.color;

  if (cfg.type === 'rain') {
    ctx.lineWidth = Math.max(0.5, p.size * 0.4);
    ctx.lineCap   = 'round';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  config: ParticleConfig;
  scrollOffset: number;
  mode?: 'horizontal' | 'vertical';
}

export default function AtmosphericParticles({ config, scrollOffset, mode = 'horizontal' }: Props) {
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const rafRef        = useRef<number>(0);
  const lastTimeRef   = useRef<number>(0);
  const scrollRef     = useRef(scrollOffset);
  const prevScrollRef = useRef(scrollOffset);
  const activeRef     = useRef<Pool | null>(null);
  const fadingRef     = useRef<Pool | null>(null);

  // Keep scroll ref current without restarting the loop
  useEffect(() => { scrollRef.current = scrollOffset; }, [scrollOffset]);

  // ── Build a particle pool for a given config ──────────────────────────────
  const makePool = useCallback((cfg: ParticleConfig): Pool => {
    const canvas  = canvasRef.current;
    const w = canvas?.offsetWidth  ?? window.innerWidth;
    const h = canvas?.offsetHeight ?? window.innerHeight;
    const isMobile = window.innerWidth < 768;
    const count    = Math.max(5, Math.round(cfg.count * (isMobile ? 0.4 : 1)));
    const particles = Array.from({ length: count }, () => {
      const p = {} as Particle;
      initParticle(p, cfg, w, h, /* scatter= */ true);
      return p;
    });
    return { particles, config: cfg, alpha: 0, target: 1 };
  }, []);

  // ── React to config changes — crossfade pools ─────────────────────────────
  useEffect(() => {
    const prev = activeRef.current;
    if (prev) {
      prev.target = 0;
      fadingRef.current = prev;
    }
    activeRef.current = makePool(config);
  }, [config, makePool]);

  // ── Main animation loop (starts once, lives for component lifetime) ───────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Size canvas to viewport with DPR support
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const w   = window.innerWidth;
      const h   = window.innerHeight;
      canvas.width        = w * dpr;
      canvas.height       = h * dpr;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const animate = (ts: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) { rafRef.current = requestAnimationFrame(animate); return; }

      // Delta time, capped to prevent huge jumps after tab sleep
      const dt = lastTimeRef.current
        ? Math.min((ts - lastTimeRef.current) / 16.67, 4)
        : 1;
      lastTimeRef.current = ts;

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      // Scroll parallax delta
      const scrollDelta   = scrollRef.current - prevScrollRef.current;
      prevScrollRef.current = scrollRef.current;
      const SCROLL_FACTOR = mode === 'horizontal' ? 0.28 : 0.14;

      // Helper: update + draw one pool
      const processPool = (pool: Pool) => {
        // Lerp alpha toward target (smooth crossfade ~30 frames)
        pool.alpha += (pool.target - pool.alpha) * Math.min(1, 0.045 * dt);

        const { particles, config: cfg, alpha } = pool;
        if (alpha < 0.005) return;

        const margin = cfg.maxSize * 3;

        for (const p of particles) {
          // Scroll-driven parallax shift
          if (mode === 'horizontal') p.x -= scrollDelta * SCROLL_FACTOR;
          else                       p.y -= scrollDelta * SCROLL_FACTOR;

          const displayOpacity = updateParticle(p, cfg, dt) * alpha;

          // Respawn when off-canvas or naturally expired
          const offScreen = p.x < -margin || p.x > w + margin
                         || p.y < -margin || p.y > h + margin;
          const expired   = (cfg.type === 'smoke'  && p.life >= 1)
                         || (cfg.type === 'embers' && p.size < 0.3);
          if (offScreen || expired) respawn(p, cfg, w, h);

          drawParticle(ctx, p, cfg, displayOpacity);
        }
      };

      // Draw fading pool first (below active)
      const fading = fadingRef.current;
      if (fading) {
        processPool(fading);
        if (fading.alpha < 0.005) fadingRef.current = null;
      }

      // Draw active pool
      const active = activeRef.current;
      if (active) processPool(active);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    // Pause loop when tab is hidden (saves CPU/battery)
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
      } else {
        lastTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [mode]); // only mode matters here — everything else goes through refs

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}   // sits between gradient base (z-0) and shape layers
    />
  );
}
