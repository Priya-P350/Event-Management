import React, { useMemo } from 'react';

/**
 * OceanAmbient Component
 * Provides an immersive "inside the ocean" underwater atmosphere:
 * - Dynamic surface light caustics filtering down into the deep trench
 * - Bioluminescent particle shimmer
 * - Gentle floating ambient bubbles rising upwards with organic sway
 * - Non-intrusive, pointer-events-none, high performance CSS hardware acceleration
 */
export const OceanAmbient = () => {
  // Pre-generate stable pseudo-random bubble properties to prevent re-renders
  const bubbles = useMemo(() => {
    return Array.from({ length: 22 }, (_, i) => {
      const size = 6 + ((i * 7) % 18); // 6px to 24px
      const left = ((i * 17) % 96) + 2; // 2% to 98%
      const duration = 12 + ((i * 5) % 16); // 12s to 28s
      const delay = (i * 1.3) % 15; // 0s to 15s
      const opacity = 0.25 + ((i * 3) % 45) / 100; // 0.25 to 0.70
      const swayDuration = 3 + ((i * 2) % 4); // 3s to 7s

      return {
        id: i,
        size,
        left: `${left}%`,
        animationDuration: `${duration}s`,
        animationDelay: `-${delay}s`,
        swayDuration: `${swayDuration}s`,
        opacity,
      };
    });
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {/* Surface Sunlight Caustics & Depth Rays */}
      <div 
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(56, 189, 248, 0.28) 0%, transparent 70%),
            radial-gradient(circle 600px at 20% 0%, rgba(6, 182, 212, 0.22) 0%, transparent 60%),
            radial-gradient(circle 700px at 80% 5%, rgba(0, 242, 254, 0.18) 0%, transparent 60%),
            linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, transparent 40%)
          `
        }}
      />

      {/* Deep Ocean Trench Water Column */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(2, 8, 23, 0.5) 50%, rgba(2, 8, 23, 0.95) 100%)'
        }}
      />

      {/* Bioluminescent Rising Ocean Bubbles */}
      <div className="absolute inset-0">
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="ocean-bubble-track"
            style={{
              left: b.left,
              animationDuration: b.animationDuration,
              animationDelay: b.animationDelay,
            }}
          >
            <div
              className="ocean-bubble-sphere"
              style={{
                width: `${b.size}px`,
                height: `${b.size}px`,
                opacity: b.opacity,
                animationDuration: b.swayDuration,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

