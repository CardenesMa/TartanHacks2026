'use client';

import { _Cell } from './mosaicGen';
import { useState, useEffect } from 'react';
import style from './gameboard.module.css';

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

      // // Step 2: Glide upwards
      // setTimeout(() => {
      //   const elem = document.getElementById(style["original-mosaic"]);
      //   // elem?.classList.add(style['glide-up']);
      // }, 800);

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
    <div className="flex-1 m-4 flex gap-4 flex-col items-center justify-start p-4 relative overflow-hidden">
      {/* Original Mosaic - Top Half */}
      {showOriginal && (
        <div
          id={style["original-mosaic"]}
          className={`${style['mosaic-container']} ${style['glide-up']} ${style['pop-in']} mb-4`}
          style={{
            width: '40vw',
            maxWidth: '400px',
            height: 'auto',
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
            className={style["mosaic-svg"]}
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
          <div className="text-center mt-2 text-primary font-semibold">Original</div>
        </div>
      )}

      {/* Scrambled Mosaic - Bottom Half */}
      {showScrambled && (
        <div className={`${style['mosaic-container']} ${style['fade-in']}`}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 200 200"
            preserveAspectRatio="xMidYMid meet"
            className={style["mosaic-svg"]}
          >
            {scrambledCells.map((cell, i) => (
              <g key={`group-${i}`}
                className={`${style['cell-polygon']} ${cellsVisible[i] ? 'visible' : ''} ${gameState === 'playing' ? style['interactive'] : ''} ${selectedIndex === i ? style['selected'] : ''}`}
              >
                <polygon
                  key={`scram-${i}`}
                  points={cell.vertices.map(v => `${v.x},${v.y}`).join(' ')}
                  fill={cell.color}
                  stroke={
                    selectedIndex === i
                      ? 'var(--color-secondary)'
                      : (showHint && differingCells[i])
                        ? '#FFD700'
                        : 'none'
                  }
                  strokeWidth={selectedIndex === i ? '2' : showHint && differingCells[i] ? '1.5' : '0'}
                  onClick={() => gameState === 'playing' && onCellClick(i)}
                  style={{
                    filter: showHint && differingCells[i] ? 'drop-shadow(0 0 4px #FFD700)' : 'none',
                    opacity: cellsVisible[i] ? 1 : 0,
                    transition: `opacity 0.3s ease ${i * 15}ms`
                  }}
                />
              </g>
            ))}
          </svg>
          <div className="text-center mt-2 text-primary font-semibold">Your Puzzle</div>
        </div>
      )}

      {/* Hint Button */}
      {gameState === 'playing' && (
        <button
          onClick={onHint}
          className="m-4 p-4 bg-white border-2 border-primary text-primary rounded-lg font-semibold hover:bg-secondary transition-all duration-200 active:scale-95 shadow-md"
        >
          {showHint ? 'Hide' : 'Show'} Differences
        </button>
      )}

      <style jsx>{`

      `}</style>
    </div>
  );
}