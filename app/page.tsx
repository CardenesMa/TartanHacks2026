'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useImageStore } from '@/store/useImageStore';

export default function Home() {
  const router = useRouter();
  const { setImageData } = useImageStore();
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl m-4 mx-auto flex flex-col items-center space-y-8">
        <div className="text-center">
          <h1 className="text-[10vw] font-bold mb-2 bg-gradient-to-r from-bigblue to-bigblue/80 bg-clip-text text-transparent">
            Welcome
          </h1>
          <p className="text-base text-bigblue">Upload an image to start</p>
        </div>

        <div className="w-full gap-12 p-6 flex flex-col items-center">
          {currentImage ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-64 h-64 rounded-2xl overflow-hidden border border-bigblue">
                <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={handleReset}
                className="px-6 py-2 text-bigblue hover:bg-lightblue rounded-lg transition-all duration-200 active:scale-95"
              >
                Change Image
              </button>
            </div>
          ) : (
            <label className="w-64 h-64 bg-white rounded-2xl border border-bigblue p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-lightblue transition-all duration-200 active:scale-95">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <svg viewBox="0 0 24 24" className="w-24 h-24">
                <path 
                  d="M15.24,6.63a1.09,1.09,0,0,0-2,0l-2.8,5.53v0L9,8.9a1,1,0,0,0-1.8,0L3,18H21Z" 
                  fill="none" 
                  stroke="#2783C5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2"
                />
              </svg>
              <p className="mt-4 text-bigblue text-sm">Click to upload</p>
            </label>
          )}

          <button 
            className="w-64 h-16 bg-bigblue text-white text-xl rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95" 
            onClick={handleConfirm} 
            disabled={!currentImage}
          >
            Play
          </button>
        </div>
      </div>
    </main>
  );
}