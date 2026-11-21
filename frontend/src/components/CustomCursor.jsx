import React, { useEffect, useState, useRef } from 'react';

/**
 * Aerodynamic Oceanic Cursor Pointer
 * - True precision arrow pointer with tip anchored at exact (x, y) coordinates
 * - Bioluminescent cyan gradient with crisp white outline and drop-shadow glow
 * - Dynamic interactive hover state: scales and highlights when hovering clickable elements
 * - Seamless input transparency: automatically hides over text inputs so the native I-beam cursor operates naturally
 * - Smooth lerp-physics follower aura trailing behind the pointer
 */
export const CustomCursor = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [followerPos, setFollowerPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isTextInput, setIsTextInput] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const requestRef = useRef();
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    // Check if device is a touch screen (disable custom cursor on mobile/touch)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const onMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      const target = e.target;

      // Check if hovering text inputs or editable elements
      const isInput = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.getAttribute('contenteditable') === 'true'
      );
      setIsTextInput(!!isInput);

      // Check if hovering clickable/interactive elements
      const isInteractive = !isInput && target && (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'SELECT' ||
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

  // Smooth lerp physics for trailing outer aura
  useEffect(() => {
    const animateFollower = () => {
      setFollowerPos((prev) => {
        if (prefersReducedMotion.current) {
          return { x: position.x, y: position.y };
        }
        const dx = position.x - prev.x;
        const dy = position.y - prev.y;
        return {
          x: prev.x + dx * 0.2,
          y: prev.y + dy * 0.2
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
      {/* Precision Arrow Pointer (Exact 0,0 Tip Anchor) */}
      <div
        className={`fixed top-0 left-0 pointer-events-none transition-opacity duration-150 will-change-transform ${
          isTextInput ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${
            isMouseDown ? 0.88 : isHovered ? 1.15 : 1
          })`,
          transition: 'transform 0.12s ease-out, opacity 0.15s ease-out'
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="oceanic-cursor-grad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#00f2fe" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <filter id="oceanic-cursor-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#00f2fe" floodOpacity="0.75" />
              <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#ffffff" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* Aerodynamic Cursor Pointer Arrow (Hotspot Tip at 0, 0) */}
          <path
            d="M0 0L6 18.5L10 13.5L17.5 13.5L0 0Z"
            fill="url(#oceanic-cursor-grad)"
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeLinejoin="round"
            filter="url(#oceanic-cursor-glow)"
          />

          {/* Precision Center Pin at Hotspot Tip */}
          <circle cx="1.2" cy="1.2" r="1.2" fill="#ffffff" />
        </svg>
      </div>

      {/* Trailing Oceanic Follower Ring (Centered on Tip) */}
      <div
        className={`fixed top-0 left-0 pointer-events-none will-change-transform flex items-center justify-center transition-opacity duration-200 ${
          isTextInput ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          transform: `translate3d(${followerPos.x}px, ${followerPos.y}px, 0) translate(-50%, -50%)`
        }}
      >
        <div
          className={`rounded-full transition-all duration-300 ease-out ${
            isHovered
              ? 'w-12 h-12 border border-[#38bdf8]/80 bg-[#00f2fe]/10 shadow-[0_0_20px_rgba(0,242,254,0.35)] backdrop-blur-[0.5px] scale-110'
              : isMouseDown
              ? 'w-6 h-6 border-2 border-[#00f2fe] bg-[#00f2fe]/30 scale-90'
              : 'w-8 h-8 border border-[#38bdf8]/40 bg-[#38bdf8]/5'
          }`}
        />
      </div>
    </div>
  );
};
