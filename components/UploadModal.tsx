'use client';

import { useEffect, useRef, useState } from 'react';

interface UploadModalProps {
    imageData: string;
    onClose: () => void;
    onConfirm: () => void;
}

export function UploadModal({ imageData, onClose, onConfirm }: UploadModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [sliderValue, setSliderValue] = useState(50);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            // Set canvas size
            canvas.width = 500;
            canvas.height = 500;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Calculate dimensions to fit image
            const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
            const x = (canvas.width / 2) - (img.width / 2) * scale;
            const y = (canvas.height / 2) - (img.height / 2) * scale;

            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        };
        img.src = imageData;
    }, [imageData, sliderValue]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
                <h2 className="text-2xl font-bold mb-4">Image Preview</h2>

                <div className="mb-4">
                    <canvas
                        ref={canvasRef}
                        className="border border-gray-300 rounded-lg w-full"
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                        Adjust: {sliderValue}
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderValue}
                        onChange={(e) => setSliderValue(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="flex gap-4 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Continue to Play
                    </button>
                </div>
            </div>
        </div>
    );
}
