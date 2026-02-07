'use client';

import { useState, useEffect } from 'react';
import { useImageStore } from '@/store/useImageStore';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import GameBoard from '../components/GameBoard';
import LoadingScreen from '../components/LoadingScreen';
import WinScreen from '../components/WinScreen';
import { generateVoronoiMosaic, Image as Img, _Cell } from '../components/mosaicGen';
import { cropAndResize, getScrambledVersion, checkIfSolved } from '../state/gameUtils';


const LOADING_TIME = 2000; // Minimum loading screen time in ms
type GameState = 'loading' | 'intro' | 'playing' | 'won';
type Difficulty = 'easy' | 'medium' | 'hard';

export default async function PlayPage() {
    const router = useRouter();
    const { imageData } = useImageStore();
    const [gameState, setGameState] = useState<GameState>('loading');
    const [originalCells, setOriginalCells] = useState<_Cell[]>([]);
    const [scrambledCells, setScrambledCells] = useState<_Cell[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [showHint, setShowHint] = useState(false);

    // get the difficulty from the query params
    const searchParams = useSearchParams()

    const difficulty = searchParams.get('difficulty') as Difficulty || 'medium';

    useEffect(() => {
        if (!imageData) {
            router.push('/');
            return;
        }

        // Process image and generate mosaics
        const processImage = async () => {
            try {
                // Crop and resize to 200x200
                const processedImage = await cropAndResize(imageData, 200, 200);

                // Generate original mosaic based on difficulty
                let size = 150;
                if (difficulty === 'easy') {
                    size = 50;
                } else if (difficulty === 'hard') {
                    size = 200;
                }
                const cells = generateVoronoiMosaic(processedImage, size);
                setOriginalCells(cells);

                // Generate scrambled version (efficient - each tile swapped at least once)
                const scrambled = getScrambledVersion(cells);
                setScrambledCells(scrambled);

                // Wait a bit for loading animation, then start intro
                setTimeout(() => setGameState('intro'), LOADING_TIME);
            } catch (error) {
                console.error('Error processing image:', error);
                router.push('/');
            }
        };

        processImage();
    }, [imageData, router, difficulty]);

    const handleCellClick = (index: number) => {
        setShowHint(false); // Hide hint when user makes a move

        if (selectedIndex === null) {
            // First selection
            setSelectedIndex(index);
        } else if (selectedIndex === index) {
            // Deselect if clicking same cell
            setSelectedIndex(null);
        } else {
            // Swap the two cells
            const newCells = [...scrambledCells];
            const temp = newCells[selectedIndex].color;
            newCells[selectedIndex].color = newCells[index].color;
            newCells[index].color = temp;

            setScrambledCells(newCells);
            setSelectedIndex(null);

            // Check if solved
            if (checkIfSolved(newCells, originalCells)) {
                setTimeout(() => setGameState('won'), 500);
            }
        }
    };

    const handleHint = () => {
        setShowHint(!showHint);
    };

    const handleDownload = () => {
        // Create canvas and render mosaic
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            // Draw each cell
            originalCells.forEach(cell => {
                ctx.fillStyle = cell.color;
                ctx.beginPath();
                cell.vertices.forEach((v, i) => {
                    if (i === 0) ctx.moveTo(v.x * 3, v.y * 3); // Scale up 200->600
                    else ctx.lineTo(v.x * 3, v.y * 3);
                });
                ctx.closePath();
                ctx.fill();
            });

            // Download
            canvas.toBlob(blob => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'mosaic-puzzle.png';
                    a.click();
                    URL.revokeObjectURL(url);
                }
            });
        }
    };

    if (gameState === 'loading') {
        return <LoadingScreen />;
    }

    if (gameState === 'won') {
        return <WinScreen onDownload={handleDownload} onPlayAgain={() => router.push('/')} />;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <GameBoard
                originalCells={originalCells}
                scrambledCells={scrambledCells}
                selectedIndex={selectedIndex}
                showHint={showHint}
                gameState={gameState}
                onCellClick={handleCellClick}
                onHint={handleHint}
                onIntroComplete={() => setGameState('playing')}
            />
        </div>
    );
}