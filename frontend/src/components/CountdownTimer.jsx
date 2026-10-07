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
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black font-bold text-sm tracking-wider animate-pulse">
        <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping"></span>
        ⚡ EVENT IS LIVE NOW
      </div>
    );
  }

  const formatTwo = (num) => String(num).padStart(2, '0');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-zinc-400 text-xs uppercase tracking-widest font-semibold">
        <Clock className="w-3.5 h-3.5 text-white" /> Event Starts In
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-black border border-zinc-800 rounded-xl p-2.5">
          <span className="block text-2xl font-black font-mono text-white">{formatTwo(timeLeft.days)}</span>
          <span className="text-[10px] uppercase font-bold text-zinc-400">Days</span>
        </div>
        <div className="bg-black border border-zinc-800 rounded-xl p-2.5">
          <span className="block text-2xl font-black font-mono text-white">{formatTwo(timeLeft.hours)}</span>
          <span className="text-[10px] uppercase font-bold text-zinc-400">Hours</span>
        </div>
        <div className="bg-black border border-zinc-800 rounded-xl p-2.5">
          <span className="block text-2xl font-black font-mono text-white">{formatTwo(timeLeft.minutes)}</span>
          <span className="text-[10px] uppercase font-bold text-zinc-400">Mins</span>
        </div>
        <div className="bg-black border border-zinc-800 rounded-xl p-2.5">
          <span className="block text-2xl font-black font-mono text-white">{formatTwo(timeLeft.seconds)}</span>
          <span className="text-[10px] uppercase font-bold text-zinc-400">Secs</span>
        </div>
      </div>
    </div>
  );
};
