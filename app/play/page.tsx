'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useImageStore } from '@/store/useImageStore';
import { createSelectionController } from '../state/poyrender';
import { Cell } from '../components/mosaicGen';
import DrawingBoard from '../components/DrawingBoard';


export default function PlayPage() {
    const svgRef = useRef<SVGSVGElement>(null);
    const { imageData } = useImageStore();
    const router = useRouter();
    const [polygons, setPolygons] = useState<Cell[]>([]);

    const controllerRef = useRef(
        createSelectionController(polygons, setPolygons)
    )


    useEffect(() => {
        // Redirect if no image data
        if (!imageData) {
            router.push('/');
            return;
        }

        const svg = svgRef.current;
        if (!svg) return;

    }, [imageData, router]);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-8">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2 text-blue-700">Play Mode</h1>
                    <p className="text-base text-slate-600">Your image is ready to play! 🎨</p>
                </div>

                <div className="w-full bg-white rounded-2xl shadow-lg border border-slate-100 p-6 flex flex-col items-center">
                    <svg width="800" height="600">


                        <DrawingBoard
                            polygons={polygons}
                            onPolygonClick={id => controllerRef.current(id)}
                        />
                    </svg>

                </div>

                <div className="flex justify-center gap-4 w-full">
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 bg-slate-100 border border-slate-200 rounded-lg text-blue-700 font-semibold shadow hover:bg-slate-200 transition"
                    >
                        ← Back to Home
                    </button>
                    <button
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
                    >
                        Start Playing
                    </button>
                </div>
            </div>
        </main>
    );
}
