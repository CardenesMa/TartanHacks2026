'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useImageStore } from '@/store/useImageStore';

export default function Home() {
  const router = useRouter();
  const { setImageData } = useImageStore();
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Image = reader.result as string;
        setCurrentImage(base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (currentImage) {
      setImageData(currentImage);
      router.push('/play');
    }
  };

  const handleReset = () => {
    setCurrentImage(null);
    setSliderValue(50);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!currentImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width / 2) - (img.width / 2) * scale;
      const y = (canvas.height / 2) - (img.height / 2) * scale;

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    };
    img.src = currentImage;
  }, [currentImage, sliderValue]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-4 sm:p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Scotty Match
        </h1>
        <p className="text-slate-600 text-base">
          Upload your image to get started. Transform and play with your creation!
        </p>
      </div>


      <div className="relative w-full max-w-lg">
        {/* Glass card with transparency and shadows */}
        <div className="backdrop-blur-xl  rounded-3xl shadow-2xl shadow-blue-200/50 border border-white/50 p-8 sm:p-10">

          {currentImage ? (
            <div className="flex flex-col items-center space-y-6">
              <h2 className="text-xl font-semibold text-slate-700">Image Preview</h2>

              {/* Canvas with creative shadow */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <canvas
                  ref={canvasRef}
                  className="relative border-2 border-white/80 rounded-2xl shadow-xl bg-white/50 backdrop-blur-sm"
                />
              </div>

              {/* Slider section with glass effect */}
              <div className="w-full bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/60">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Adjust Value: <span className="text-blue-600 font-bold">{sliderValue}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                  style={{
                    background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(99 102 241) ${sliderValue}%, rgb(226 232 240) ${sliderValue}%, rgb(226 232 240) 100%)`
                  }}
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 w-full">
                <button
                  onClick={handleReset}
                  className="flex-1 px-6 py-3 bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl text-slate-700 font-semibold shadow-lg hover:shadow-xl hover:bg-white/80 transition-all duration-200 hover:scale-[1.02]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 hover:scale-[1.02]"
                >
                  Continue →
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-6 py-8">
              {/* Upload icon with glass background */}
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl"></div>
                <div className="relative w-24 h-24 bg-gradient-to-br from-blue-100/80 to-indigo-100/80 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/60 shadow-xl">
                  <svg
                    className="w-12 h-12 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-800">Upload Image</h2>

              <label className="cursor-pointer group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 group-hover:scale-[1.02]">
                  Choose File
                </div>
              </label>

              <p className="text-sm text-slate-500 bg-white/40 backdrop-blur-sm px-4 py-2 rounded-full border border-white/60">
                Supports: JPG, PNG, GIF
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}