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
    <main className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* heading message */}
      <div className="w-full max-w-2xl m-4 mx-auto flex flex-col items-center space-y-8">
        <div className="text-center">
          <h1 className="text-[10vw] font-bold mb-2 bg-gradient-to-r from-bigblue to-bigblue/80 bg-clip-text text-transparent">Welcome</h1>
          <p className="text-base text-bigblue">Upload an image to start</p>
        </div>

        <div className="w-full gap-12 p-6 flex flex-col items-center">
          {/*  blank "image"  */}
          {currentImage ?
            <canvas ref={canvasRef} className="w-64 h-64 bg-white rounded-2xl border border-bigblue" />
            :
            <label className="w-64 h-64 bg-white rounded-2xl border border-bigblue p-6 flex flex-col items-center cursor-pointer hover:bg-red transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {/* https://www.svgrepo.com/svg/491284/mountain?edit=true */}
              <svg viewBox="0 0 24 24" id="Line_Color" data-name="Line Color" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path id="primary" d="M15.24,6.63a1.09,1.09,0,0,0-2,0l-2.8,5.53v0L9,8.9a1,1,0,0,0-1.8,0L3,18H21Z" style={{ fill: "none", stroke: "#2783C5", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2px" }}></path></g></svg>
            </label>
          }

          {/* play button */}

          <button className="m-12 w-64 h-16 bg-blue-500 text-white text-xl rounded-lg" onClick={handleConfirm} disabled={!currentImage}>
            <h1> Play </h1>
          </button>
        </div>

      </div>
    </main>
  )
}

/* 

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
*/