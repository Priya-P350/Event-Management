import React, { useEffect, useState, useRef } from 'react';

export const CustomCursor = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [followerPos, setFollowerPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const requestRef = useRef();

  useEffect(() => {
    // Check if device supports fine pointer (mouse)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

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
        target.classList.contains('interactive')
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

  // Smooth trailing follower animation (Lerp physics)
  useEffect(() => {
    const animateFollower = () => {
      setFollowerPos((prev) => {
        const dx = position.x - prev.x;
        const dy = position.y - prev.y;
        return {
          x: prev.x + dx * 0.22,
          y: prev.y + dy * 0.22
        };
      });
      requestRef.current = requestAnimationFrame(animateFollower);
    };

    requestRef.current = requestAnimationFrame(animateFollower);
    return () => cancelAnimationFrame(requestRef.current);
  }, [position]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Precision Core Dot */}
      <div
        className={`fixed top-0 left-0 w-2 h-2 rounded-full bg-white transition-transform duration-75 ease-out -translate-x-1/2 -translate-y-1/2 ${
          isMouseDown ? 'scale-150 bg-zinc-300' : isHovered ? 'scale-0' : 'scale-100'
        }`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%) scale(${
            isHovered ? 0 : isMouseDown ? 1.5 : 1
          })`
        }}
      />

      {/* Patterned Outer Target Ring with Crosshairs */}
      <div
        className={`fixed top-0 left-0 transition-all duration-200 ease-out -translate-x-1/2 -translate-y-1/2 flex items-center justify-center ${
          isHovered
            ? 'w-12 h-12 rounded-full border-2 border-white bg-white/10'
            : isMouseDown
            ? 'w-7 h-7 rounded-full border border-zinc-400 bg-white/20'
            : 'w-9 h-9 rounded-full border border-white/60 bg-transparent'
        }`}
        style={{
          transform: `translate3d(${followerPos.x}px, ${followerPos.y}px, 0) translate(-50%, -50%)`
        }}
      >
        {/* Crosshair Pattern Marks */}
        <div className="absolute -top-1.5 w-0.5 h-1.5 bg-white/80" />
        <div className="absolute -bottom-1.5 w-0.5 h-1.5 bg-white/80" />
        <div className="absolute -left-1.5 h-0.5 w-1.5 bg-white/80" />
        <div className="absolute -right-1.5 h-0.5 w-1.5 bg-white/80" />

        {/* Center Target Box on Hover */}
        {isHovered && (
          <div className="w-1.5 h-1.5 bg-white rotate-45 transition-transform animate-pulse" />
        )}
      </div>
    </div>
  );
};
