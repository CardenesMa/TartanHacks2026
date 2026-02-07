import { useEffect, useState } from "react";
import { generateVoronoiMosaic, Image as Img, _Cell } from "./mosaicGen";
import { useImageStore } from "@/store/useImageStore";
import DrawingBoard from "./DrawingBoard";

// Load image from data URL and convert to proper RGBA pixel array
async function loadImageData(dataUrl: string): Promise<Img | null> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
            // Create canvas to extract pixel data
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }
            
            // Set canvas size to 200x200
            canvas.width = 200;
            canvas.height = 200;
            
            // Draw image scaled to 200x200
            ctx.drawImage(img, 0, 0, 200, 200);
            
            // Extract RGBA pixel data
            const imageData = ctx.getImageData(0, 0, 200, 200);
            
            resolve({
                width: 200,
                height: 200,
                pixels: imageData.data // This is already a Uint8ClampedArray
            });
        };
        
        img.onerror = () => {
            reject(new Error("Failed to load image"));
        };
        
        img.src = dataUrl;
    });
}

export default function Mosaic({ imageData }: { imageData: string }) {
    const [cells, setCells] = useState<_Cell[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!imageData) {
            setError("No image data available");
            setLoading(false);
            return;
        }

        // Load and process image
        loadImageData(imageData)
            .then(img => {
                if (!img) {
                    throw new Error("Failed to load image");
                }
                
                console.log("Image loaded:", img.width, "x", img.height, "pixels:", img.pixels.length);
                
                // Generate Voronoi mosaic
                const generatedCells = generateVoronoiMosaic(img, 150);
                console.log("Generated cells:", generatedCells.length);
                
                setCells(generatedCells);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading image:", err);
                setError(err.message);
                setLoading(false);
            });
    }, [imageData]);

    if (loading) {
        return <div>Loading mosaic...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (cells.length === 0) {
        return <div>No cells generated</div>;
    }

    return (
        <DrawingBoard 
            polygons={cells} 
            onPolygonClick={(id) => console.log("Clicked polygon:", id)} 
        />
    );
}