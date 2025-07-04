"use client";

import { useState, useEffect } from "react";

interface RestTimerProps {
  duration: number;
  onTimerEnd: () => void;
  onSkip: () => void;
}

export default function RestTimer({ duration, onTimerEnd, onSkip }: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimerEnd();
      return;
    }
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, onTimerEnd]);

  const formatTime = (seconds: number) =>
    `${Math.floor(seconds / 60)}:${(seconds % 60)
      .toString()
      .padStart(2, "0")}`;

  return (
    <div className="p-4 rounded-xl shadow-lg mb-6 transition-all duration-300 bg-slate-700">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white">Resting...</span>
          <span className="text-4xl font-mono font-bold text-white tracking-wider">
            {formatTime(timeLeft)}
          </span>
        </div>
        <button
          onClick={onSkip}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
        >
          Skip Rest
        </button>
      </div>
    </div>
  );
} 