import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const CountdownTimer = ({ targetDate, startTime = '00:00:00' }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false };

    // Combine event_date and start_time
    const targetString = `${targetDate.split('T')[0]}T${startTime}`;
    const difference = +new Date(targetString) - +new Date();

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
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#DAF1DE] text-[#051F20] font-bold text-sm tracking-wider animate-pulse shadow-md">
        <span className="w-2.5 h-2.5 rounded-full bg-[#051F20] animate-ping"></span>
        ⚡ EVENT IS LIVE NOW
      </div>
    );
  }

  const formatTwo = (num) => String(num).padStart(2, '0');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[#8EB69B] text-xs uppercase tracking-widest font-semibold">
        <Clock className="w-3.5 h-3.5 text-[#DAF1DE]" /> Event Starts In
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-[#051F20] border border-[#163832] rounded-xl p-2.5 shadow-sm">
          <span className="block text-2xl font-black font-mono text-[#DAF1DE]">{formatTwo(timeLeft.days)}</span>
          <span className="text-[10px] uppercase font-bold text-[#8EB69B]">Days</span>
        </div>
        <div className="bg-[#051F20] border border-[#163832] rounded-xl p-2.5 shadow-sm">
          <span className="block text-2xl font-black font-mono text-[#DAF1DE]">{formatTwo(timeLeft.hours)}</span>
          <span className="text-[10px] uppercase font-bold text-[#8EB69B]">Hours</span>
        </div>
        <div className="bg-[#051F20] border border-[#163832] rounded-xl p-2.5 shadow-sm">
          <span className="block text-2xl font-black font-mono text-[#DAF1DE]">{formatTwo(timeLeft.minutes)}</span>
          <span className="text-[10px] uppercase font-bold text-[#8EB69B]">Mins</span>
        </div>
        <div className="bg-[#051F20] border border-[#163832] rounded-xl p-2.5 shadow-sm">
          <span className="block text-2xl font-black font-mono text-[#DAF1DE]">{formatTwo(timeLeft.seconds)}</span>
          <span className="text-[10px] uppercase font-bold text-[#8EB69B]">Secs</span>
        </div>
      </div>
    </div>
  );
};
