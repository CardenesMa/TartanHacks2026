'use client';

import { useEffect } from 'react';

type WinScreenProps = {
  onDownload: () => void;
  onPlayAgain: () => void;
};

export default function WinScreen({ onDownload, onPlayAgain }: WinScreenProps) {
  useEffect(() => {
    // Lightweight confetti animation
    createConfetti();
  }, []);

  const createConfetti = () => {
    const colors = ['#2783C5', '#DCF1FF', '#FFD700', '#87CEEB'];
    const confettiCount = 50;
    const container = document.getElementById('confetti-container');
    
    if (!container) return;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = `${Math.random() * 3}s`;
      confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
      container.appendChild(confetti);

      setTimeout(() => confetti.remove(), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      <div id="confetti-container" className="absolute inset-0 pointer-events-none"></div>
      
      <div className="text-center z-10 space-y-6 p-8">
        <div className="win-badge">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-5xl font-bold text-bigblue mb-2">You Won!</h1>
          <p className="text-lg text-bigblue/80">Puzzle completed successfully</p>
        </div>

        <div className="flex flex-col gap-4 mt-8">
          <button
            onClick={onDownload}
            className="px-8 py-4 bg-bigblue text-white text-lg rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
          >
            Download Your Mosaic
          </button>
          
          <button
            onClick={onPlayAgain}
            className="px-8 py-4 bg-white border-2 border-bigblue text-bigblue text-lg rounded-lg font-semibold hover:bg-lightblue transition-all duration-200 active:scale-95"
          >
            Play Again
          </button>
        </div>
      </div>

      <style jsx>{`
        .win-badge {
          background: white;
          padding: 3rem;
          border-radius: 24px;
          border: 3px solid #2783C5;
          box-shadow: 0 10px 40px rgba(39, 131, 197, 0.2);
          animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes scaleIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          opacity: 0;
          animation: fall linear infinite;
        }

        @keyframes fall {
          0% {
            top: -10px;
            opacity: 1;
            transform: rotate(0deg);
          }
          100% {
            top: 100vh;
            opacity: 0.5;
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}