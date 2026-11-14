import React, { useEffect, useState, useRef } from 'react';

/**
 * Sleek Minimalist Dot & Ring Cursor
 * - Immediate high-precision oceanic cyan core dot
 * - Silky smooth trailing outer follower ring with elegant expansion on interactive hover
 * - Zero clunky tick marks or crosshair clutter
 */
export const CustomCursor = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [followerPos, setFollowerPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const requestRef = useRef();
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    // Check if device supports fine pointer (mouse / trackpad)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      // Check if hovering interactive elements
      const target = e.target;
      const isInteractive = target && (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('button') ||
        target.closest('a') ||
        target.getAttribute('role') === 'button' ||
        target.classList.contains('cursor-pointer') ||
        target.classList.contains('interactive') ||
        target.closest('.interactive')
      );

      setIsHovered(!!isInteractive);
    };

    const onMouseDown = () => setIsMouseDown(true);
    const onMouseUp = () => setIsMouseDown(false);
    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [isVisible]);

  // Smooth lerp physics for outer follower ring
  useEffect(() => {
    const animateFollower = () => {
      setFollowerPos((prev) => {
        if (prefersReducedMotion.current) {
          return { x: position.x, y: position.y };
        }
        const dx = position.x - prev.x;
        const dy = position.y - prev.y;
        return {
          x: prev.x + dx * 0.18,
          y: prev.y + dy * 0.18
        };
      });
      requestRef.current = requestAnimationFrame(animateFollower);
    };

    requestRef.current = requestAnimationFrame(animateFollower);
    return () => cancelAnimationFrame(requestRef.current);
  }, [position]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {/* Precision Core Dot (Zero Latency) */}
      <div
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform duration-100 ease-out will-change-transform"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%) scale(${
            isMouseDown ? 0.75 : isHovered ? 1.4 : 1
          })`
        }}
      >
        <div
          className={`rounded-full transition-colors duration-200 ${
            isHovered
              ? 'w-2.5 h-2.5 bg-[#38bdf8] shadow-[0_0_12px_#38bdf8]'
              : isMouseDown
              ? 'w-2 h-2 bg-white shadow-[0_0_8px_#ffffff]'
              : 'w-2 h-2 bg-[#E5F4F9] shadow-[0_0_8px_rgba(74,150,186,0.9)]'
          }`}
        />
      </div>

      {/* Smooth Oceanic Follower Ring */}
      <div
        className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none will-change-transform flex items-center justify-center transition-all duration-300 ease-out"
        style={{
          transform: `translate3d(${followerPos.x}px, ${followerPos.y}px, 0) translate(-50%, -50%)`
        }}
      >
        <div
          className={`rounded-full transition-all duration-300 ease-out ${
            isHovered
              ? 'w-14 h-14 border border-[#E5F4F9]/80 bg-[#4A96BA]/15 backdrop-blur-[1px] shadow-[0_0_20px_rgba(56,189,248,0.25)]'
              : isMouseDown
              ? 'w-6 h-6 border-2 border-[#38bdf8] bg-[#38bdf8]/20'
              : 'w-8 h-8 border border-[#4A96BA]/60 bg-[#4A96BA]/5'
          }`}
        />
      </div>
    </div>
  );
};
