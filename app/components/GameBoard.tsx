'use client';

import { _Cell } from './mosaicGen';
import { useState, useEffect } from 'react';

type GameBoardProps = {
  originalCells: _Cell[];
  scrambledCells: _Cell[];
  selectedIndex: number | null;
  showHint: boolean;
  gameState: 'intro' | 'playing';
  onCellClick: (index: number) => void;
  onHint: () => void;
  onIntroComplete: () => void;
};

export default function GameBoard({
  originalCells,
  scrambledCells,
  selectedIndex,
  showHint,
  gameState,
  onCellClick,
  onHint,
  onIntroComplete
}: GameBoardProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [showScrambled, setShowScrambled] = useState(false);
  const [cellsVisible, setCellsVisible] = useState<boolean[]>([]);

  // Animation sequence
  useEffect(() => {
    if (gameState === 'intro') {
      // Step 1: Show original mosaic with pop animation (bottom half)
      setTimeout(() => setShowOriginal(true), 100);
      
      // Step 2: Glide upwards
      setTimeout(() => {
        const elem = document.getElementById('original-mosaic');
        elem?.classList.add('glide-up');
      }, 800);
      
      // Step 3: Show scrambled mosaic fading in tile by tile
      setTimeout(() => {
        setShowScrambled(true);
        // Fade in cells one by one
        const delays = scrambledCells.map((_, i) => i * 15); // 15ms between each
        delays.forEach((delay, i) => {
          setTimeout(() => {
            setCellsVisible(prev => {
              const next = [...prev];
              next[i] = true;
              return next;
            });
          }, delay);
        });
      }, 1500);
      
      // Step 4: Complete intro
      setTimeout(() => {
        onIntroComplete();
      }, 1500 + scrambledCells.length * 15 + 500);
    }
  }, [gameState, scrambledCells.length, onIntroComplete]);

  const getDifferingCells = () => {
    return scrambledCells.map((cell, i) => 
      cell.color !== originalCells[i].color
    );
  };

  const differingCells = showHint ? getDifferingCells() : [];

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 relative overflow-hidden">
      {/* Original Mosaic - Top Half */}
      {showOriginal && (
        <div 
          id="original-mosaic"
          className="mosaic-container pop-in mb-4"
          style={{
            position: gameState === 'intro' ? 'absolute' : 'relative',
            bottom: gameState === 'intro' ? '50%' : 'auto',
            transform: gameState === 'intro' ? 'translateY(50%)' : 'none'
          }}
        >
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 200 200"
            preserveAspectRatio="xMidYMid meet"
            className="mosaic-svg"
          >
            {originalCells.map((cell, i) => (
              <polygon
                key={`orig-${i}`}
                points={cell.vertices.map(v => `${v.x},${v.y}`).join(' ')}
                fill={cell.color}
                stroke="none"
              />
            ))}
          </svg>
          <div className="text-center mt-2 text-bigblue font-semibold">Original</div>
        </div>
      )}

      {/* Scrambled Mosaic - Bottom Half */}
      {showScrambled && (
        <div className="mosaic-container fade-in">
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 200 200"
            preserveAspectRatio="xMidYMid meet"
            className="mosaic-svg"
          >
            {scrambledCells.map((cell, i) => (
              <polygon
                key={`scram-${i}`}
                points={cell.vertices.map(v => `${v.x},${v.y}`).join(' ')}
                fill={cell.color}
                stroke={
                  selectedIndex === i 
                    ? '#2783C5' 
                    : (showHint && differingCells[i]) 
                      ? '#FFD700' 
                      : 'none'
                }
                strokeWidth={selectedIndex === i ? '2' : showHint && differingCells[i] ? '1.5' : '0'}
                onClick={() => gameState === 'playing' && onCellClick(i)}
                className={`cell-polygon ${cellsVisible[i] ? 'visible' : ''} ${gameState === 'playing' ? 'interactive' : ''} ${selectedIndex === i ? 'selected' : ''}`}
                style={{
                  filter: showHint && differingCells[i] ? 'drop-shadow(0 0 4px #FFD700)' : 'none',
                  opacity: cellsVisible[i] ? 1 : 0,
                  transition: `opacity 0.3s ease ${i * 15}ms`
                }}
              />
            ))}
          </svg>
          <div className="text-center mt-2 text-bigblue font-semibold">Your Puzzle</div>
        </div>
      )}

      {/* Hint Button */}
      {gameState === 'playing' && (
        <button
          onClick={onHint}
          className="mt-4 px-6 py-3 bg-white border-2 border-bigblue text-bigblue rounded-lg font-semibold hover:bg-lightblue transition-all duration-200 active:scale-95 shadow-md"
        >
          {showHint ? 'Hide' : 'Show'} Differences
        </button>
      )}

      <style jsx>{`
        .mosaic-container {
          width: 90vw;
          max-width: 400px;
        }

        .mosaic-svg {
          width: 100%;
          height: auto;
          border: 2px solid #2783C5;
          border-radius: 12px;
          background: white;
        }

        .pop-in {
          animation: pop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        @keyframes pop {
          0% {
            transform: scale(0) translateY(50%);
            opacity: 0;
          }
          70% {
            transform: scale(1.1) translateY(50%);
          }
          100% {
            transform: scale(1) translateY(50%);
            opacity: 1;
          }
        }

        .glide-up {
          animation: glideUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes glideUp {
          from {
            bottom: 50%;
            transform: translateY(50%);
          }
          to {
            bottom: auto;
            position: relative;
            transform: translateY(0);
          }
        }

        .fade-in {
          animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .cell-polygon.interactive {
          cursor: pointer;
          transition: transform 0.15s ease;
        }

        .cell-polygon.interactive:hover {
          transform: scale(1.05);
          transform-origin: center;
        }

        .cell-polygon.interactive:active {
          transform: scale(0.95);
        }

        .cell-polygon.selected {
          animation: pulse 0.6s ease infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }
      `}</style>
    </div>
  );
}