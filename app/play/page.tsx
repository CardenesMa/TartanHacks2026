'use client';

import { useEffect, useRef, useState } from 'react';
import { getP2PManager } from '@/lib/p2p';

interface DrawPoint {
  x: number;
  y: number;
  color: string;
  size: number;
}

interface DrawStroke {
  points: DrawPoint[];
  from: string;
}

export default function PlayPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const p2p = getP2PManager();
    
    // Get reference image if available
    const sharedState = p2p.getSharedState();
    const refImg = sharedState.get('referenceImage');
    if (refImg) {
      setReferenceImage(refImg);
    }

    // Listen for draw messages from peers
    const unsubscribe = p2p.onMessage((message) => {
      if (message.type === 'draw') {
        const stroke = message.data as DrawStroke;
        drawStroke(stroke);
        setStrokes(prev => [...prev, stroke]);
      } else if (message.type === 'update') {
        const refImg = message.data.referenceImage;
        if (refImg) {
          setReferenceImage(refImg);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const drawStroke = (stroke: DrawStroke) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = stroke.points[0]?.color || '#000000';
    ctx.lineWidth = stroke.points[0]?.size || 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (stroke.points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }

    ctx.stroke();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    lastPointRef.current = { x, y };
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastPointRef.current = { x, y };
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    lastPointRef.current = null;

    // Send draw data to peers (simplified version)
    const p2p = getP2PManager();
    p2p.sendMessage({
      type: 'draw',
      data: {
        color: currentColor,
        size: brushSize
      }
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStrokes([]);
  };

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'];

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Drawing Canvas</h1>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Reference Image */}
          {referenceImage && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Reference Image</h2>
              <img
                src={referenceImage}
                alt="Reference"
                className="w-full h-auto rounded-lg border border-gray-300"
              />
            </div>
          )}

          {/* Canvas */}
          <div className={referenceImage ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Your Canvas</h2>
              
              {/* Tools */}
              <div className="mb-4 space-y-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Color:</label>
                    <div className="flex gap-2">
                      {colors.map(color => (
                        <button
                          key={color}
                          onClick={() => setCurrentColor(color)}
                          className={`w-8 h-8 rounded-full border-2 ${
                            currentColor === color ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Size:</label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-32"
                    />
                    <span className="text-sm">{brushSize}px</span>
                  </div>

                  <button
                    onClick={clearCanvas}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Canvas */}
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="border-2 border-gray-300 rounded-lg cursor-crosshair bg-white w-full"
                style={{ maxWidth: '100%', height: 'auto' }}
                aria-label="Drawing canvas - click and drag to draw"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
