import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const CountdownTimer = ({ targetDate, startTime = '00:00:00' }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false };

    let parsedDate = null;

    // Try direct parsing
    const directDate = new Date(targetDate);
    if (!isNaN(directDate.getTime())) {
      parsedDate = directDate;
    }

    // Attempt normalized combination of date and time
    if (typeof targetDate === 'string') {
      const cleanDate = targetDate.split('T')[0].trim();
      let cleanTime = String(startTime || '00:00:00').trim();

      // Normalize HH:mm to HH:mm:00
      if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
        cleanTime = `${cleanTime}:00`;
      }

      const combinedIso = new Date(`${cleanDate}T${cleanTime}`);
      if (!isNaN(combinedIso.getTime())) {
        parsedDate = combinedIso;
      } else {
        const combinedSpace = new Date(`${cleanDate} ${cleanTime}`);
        if (!isNaN(combinedSpace.getTime())) {
          parsedDate = combinedSpace;
        }
      }
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false };
    }

    const difference = parsedDate.getTime() - Date.now();

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isLive: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, startTime]);

  if (timeLeft.isLive) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40 font-bold text-xs tracking-wider animate-pulse">
        <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-ping"></span>
        ⚡ EVENT IS LIVE NOW
      </div>
    );
  }

  const formatTwo = (num) => String(num || 0).padStart(2, '0');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[#95B8C9] text-xs uppercase tracking-widest font-semibold">
        <Clock className="w-3.5 h-3.5 text-[#38bdf8]" /> Event Starts In
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-[#0B1928] border border-[#1E394E] rounded-xl p-2.5 shadow-sm">
          <span className="block text-2xl font-black font-mono text-[#E5F4F9]">{formatTwo(timeLeft.days)}</span>
          <span className="text-[10px] uppercase font-bold text-[#95B8C9]">Days</span>
        </div>
        <div className="bg-[#0B1928] border border-[#1E394E] rounded-xl p-2.5 shadow-sm">
          <span className="block text-2xl font-black font-mono text-[#E5F4F9]">{formatTwo(timeLeft.hours)}</span>
          <span className="text-[10px] uppercase font-bold text-[#95B8C9]">Hours</span>
        </div>
        <div className="bg-[#0B1928] border border-[#1E394E] rounded-xl p-2.5 shadow-sm">
          <span className="block text-2xl font-black font-mono text-[#E5F4F9]">{formatTwo(timeLeft.minutes)}</span>
          <span className="text-[10px] uppercase font-bold text-[#95B8C9]">Mins</span>
        </div>
        <div className="bg-[#0B1928] border border-[#1E394E] rounded-xl p-2.5 shadow-sm">
          <span className="block text-2xl font-black font-mono text-[#E5F4F9]">{formatTwo(timeLeft.seconds)}</span>
          <span className="text-[10px] uppercase font-bold text-[#95B8C9]">Secs</span>
        </div>
      </div>
    </div>
  );
};
