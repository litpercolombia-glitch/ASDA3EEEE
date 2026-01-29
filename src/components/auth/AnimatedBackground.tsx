/**
 * AnimatedBackground - LITPER PRO
 *
 * Fondo animado premium inspirado en Stripe, Linear y Vercel
 * Soporta múltiples variantes: gradient, mesh, aurora, waves
 */

import React, { useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  variant?: 'gradient' | 'mesh' | 'aurora' | 'waves' | 'orbs';
  intensity?: 'subtle' | 'medium' | 'vibrant';
  className?: string;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  variant = 'aurora',
  intensity = 'medium',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Intensity multipliers
  const intensityMap = {
    subtle: 0.3,
    medium: 0.6,
    vibrant: 1.0,
  };

  const multiplier = intensityMap[intensity];

  useEffect(() => {
    if (variant !== 'waves') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const drawWave = (
      yOffset: number,
      amplitude: number,
      frequency: number,
      speed: number,
      color: string,
      alpha: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);

      for (let x = 0; x <= canvas.width; x += 5) {
        const y =
          yOffset +
          Math.sin(x * frequency + time * speed) * amplitude * multiplier +
          Math.sin(x * frequency * 0.5 + time * speed * 1.5) * amplitude * 0.5 * multiplier;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fillStyle = color.replace('1)', `${alpha * multiplier})`);
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw multiple wave layers
      drawWave(canvas.height * 0.7, 50, 0.003, 0.5, 'rgba(99, 102, 241, 1)', 0.1);
      drawWave(canvas.height * 0.75, 40, 0.004, 0.7, 'rgba(139, 92, 246, 1)', 0.15);
      drawWave(canvas.height * 0.8, 60, 0.002, 0.3, 'rgba(168, 85, 247, 1)', 0.1);
      drawWave(canvas.height * 0.85, 30, 0.005, 0.9, 'rgba(236, 72, 153, 1)', 0.08);

      time += 0.02;
      animationFrameId = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [variant, multiplier]);

  // Gradient variant - CSS based
  if (variant === 'gradient') {
    return (
      <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
        {/* Base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg,
              #0f0f23 0%,
              #1a1a3e 25%,
              #0d1b2a 50%,
              #1b263b 75%,
              #0f0f23 100%)`,
          }}
        />

        {/* Animated gradient orbs */}
        <div
          className="absolute w-[800px] h-[800px] rounded-full blur-[120px]"
          style={{
            background: `radial-gradient(circle, rgba(99, 102, 241, ${0.4 * multiplier}) 0%, transparent 70%)`,
            top: '-20%',
            left: '-10%',
            animation: 'float1 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[100px]"
          style={{
            background: `radial-gradient(circle, rgba(168, 85, 247, ${0.3 * multiplier}) 0%, transparent 70%)`,
            top: '40%',
            right: '-15%',
            animation: 'float2 25s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[80px]"
          style={{
            background: `radial-gradient(circle, rgba(236, 72, 153, ${0.25 * multiplier}) 0%, transparent 70%)`,
            bottom: '-10%',
            left: '30%',
            animation: 'float3 18s ease-in-out infinite',
          }}
        />

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <style>{`
          @keyframes float1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -30px) scale(1.05); }
            66% { transform: translate(-20px, 20px) scale(0.95); }
          }
          @keyframes float2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(-40px, 30px) scale(1.08); }
            66% { transform: translate(30px, -40px) scale(0.92); }
          }
          @keyframes float3 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(20px, 40px) scale(1.03); }
            66% { transform: translate(-30px, -20px) scale(0.97); }
          }
        `}</style>
      </div>
    );
  }

  // Mesh variant - Stripe inspired
  if (variant === 'mesh') {
    return (
      <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-[#0a0a0b]" />

        {/* Mesh gradient layers */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 40% 20%, rgba(99, 102, 241, ${0.25 * multiplier}) 0px, transparent 50%),
              radial-gradient(at 80% 0%, rgba(139, 92, 246, ${0.2 * multiplier}) 0px, transparent 50%),
              radial-gradient(at 0% 50%, rgba(168, 85, 247, ${0.15 * multiplier}) 0px, transparent 50%),
              radial-gradient(at 80% 50%, rgba(236, 72, 153, ${0.15 * multiplier}) 0px, transparent 50%),
              radial-gradient(at 0% 100%, rgba(99, 102, 241, ${0.2 * multiplier}) 0px, transparent 50%),
              radial-gradient(at 80% 100%, rgba(59, 130, 246, ${0.15 * multiplier}) 0px, transparent 50%),
              radial-gradient(at 0% 0%, rgba(6, 182, 212, ${0.1 * multiplier}) 0px, transparent 50%)
            `,
            animation: 'meshMove 30s ease-in-out infinite',
          }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        <style>{`
          @keyframes meshMove {
            0%, 100% { filter: hue-rotate(0deg); }
            50% { filter: hue-rotate(30deg); }
          }
        `}</style>
      </div>
    );
  }

  // Aurora variant - Premium animated aurora
  if (variant === 'aurora') {
    return (
      <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
        {/* Dark base */}
        <div className="absolute inset-0 bg-[#030014]" />

        {/* Aurora layers */}
        <div className="absolute inset-0">
          {/* Primary aurora */}
          <div
            className="absolute w-full h-full"
            style={{
              background: `
                linear-gradient(180deg,
                  transparent 0%,
                  rgba(120, 119, 198, ${0.1 * multiplier}) 20%,
                  rgba(74, 144, 226, ${0.15 * multiplier}) 40%,
                  rgba(80, 227, 194, ${0.1 * multiplier}) 60%,
                  transparent 100%
                )
              `,
              transform: 'rotate(-12deg) scale(1.5)',
              animation: 'aurora1 15s ease-in-out infinite',
            }}
          />

          {/* Secondary aurora */}
          <div
            className="absolute w-full h-full"
            style={{
              background: `
                linear-gradient(180deg,
                  transparent 0%,
                  rgba(167, 139, 250, ${0.08 * multiplier}) 30%,
                  rgba(139, 92, 246, ${0.12 * multiplier}) 50%,
                  rgba(168, 85, 247, ${0.08 * multiplier}) 70%,
                  transparent 100%
                )
              `,
              transform: 'rotate(8deg) scale(1.5)',
              animation: 'aurora2 20s ease-in-out infinite',
            }}
          />

          {/* Tertiary aurora */}
          <div
            className="absolute w-full h-full"
            style={{
              background: `
                linear-gradient(180deg,
                  transparent 0%,
                  rgba(236, 72, 153, ${0.06 * multiplier}) 25%,
                  rgba(244, 114, 182, ${0.1 * multiplier}) 50%,
                  rgba(251, 146, 60, ${0.06 * multiplier}) 75%,
                  transparent 100%
                )
              `,
              transform: 'rotate(-5deg) scale(1.5)',
              animation: 'aurora3 25s ease-in-out infinite',
            }}
          />
        </div>

        {/* Stars */}
        <div className="absolute inset-0">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 2 + 1 + 'px',
                height: Math.random() * 2 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                opacity: Math.random() * 0.5 + 0.2,
                animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
                animationDelay: Math.random() * 2 + 's',
              }}
            />
          ))}
        </div>

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
          }}
        />

        <style>{`
          @keyframes aurora1 {
            0%, 100% { transform: rotate(-12deg) scale(1.5) translateX(0); opacity: 1; }
            50% { transform: rotate(-12deg) scale(1.5) translateX(-10%); opacity: 0.8; }
          }
          @keyframes aurora2 {
            0%, 100% { transform: rotate(8deg) scale(1.5) translateX(0); opacity: 1; }
            50% { transform: rotate(8deg) scale(1.5) translateX(10%); opacity: 0.7; }
          }
          @keyframes aurora3 {
            0%, 100% { transform: rotate(-5deg) scale(1.5) translateY(0); opacity: 1; }
            50% { transform: rotate(-5deg) scale(1.5) translateY(-5%); opacity: 0.6; }
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.2); }
          }
        `}</style>
      </div>
    );
  }

  // Orbs variant - Floating orbs like Vercel
  if (variant === 'orbs') {
    return (
      <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-[#000000]" />

        {/* Large blurred orbs */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(99, 102, 241, ${0.5 * multiplier}) 0%, transparent 70%)`,
            filter: 'blur(80px)',
            top: '-10%',
            left: '-10%',
            animation: 'orb1 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(236, 72, 153, ${0.4 * multiplier}) 0%, transparent 70%)`,
            filter: 'blur(60px)',
            top: '30%',
            right: '-5%',
            animation: 'orb2 25s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(34, 211, 238, ${0.35 * multiplier}) 0%, transparent 70%)`,
            filter: 'blur(50px)',
            bottom: '10%',
            left: '20%',
            animation: 'orb3 22s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(251, 146, 60, ${0.3 * multiplier}) 0%, transparent 70%)`,
            filter: 'blur(40px)',
            top: '50%',
            left: '50%',
            animation: 'orb4 18s ease-in-out infinite',
          }}
        />

        <style>{`
          @keyframes orb1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(50px, 30px) scale(1.1); }
            50% { transform: translate(20px, -20px) scale(0.95); }
            75% { transform: translate(-30px, 10px) scale(1.05); }
          }
          @keyframes orb2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(-40px, -30px) scale(0.9); }
            50% { transform: translate(-20px, 40px) scale(1.1); }
            75% { transform: translate(30px, -10px) scale(1); }
          }
          @keyframes orb3 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(30px, -40px) scale(1.05); }
            50% { transform: translate(-40px, -10px) scale(0.95); }
            75% { transform: translate(10px, 30px) scale(1.1); }
          }
          @keyframes orb4 {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            25% { transform: translate(-40%, -60%) scale(1.15); }
            50% { transform: translate(-60%, -40%) scale(0.9); }
            75% { transform: translate(-45%, -55%) scale(1.05); }
          }
        `}</style>
      </div>
    );
  }

  // Waves variant - Canvas based
  if (variant === 'waves') {
    return (
      <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f23] to-[#1a1a3e]" />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      </div>
    );
  }

  return null;
};

export default AnimatedBackground;
