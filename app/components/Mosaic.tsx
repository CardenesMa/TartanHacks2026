
import { useEffect } from "react";
import { generateVoronoiMosaic, Image as Img } from "./mosaicGen";
import { useImageStore } from "@/store/useImageStore";
import DrawingBoard from "./DrawingBoard";

function base64ToNumberArray(dataUrl: string): number[] {
    // remove data URL prefix
    const base64 = dataUrl.split(",")[1];

    // decode base64 → binary string
    const binary = atob(base64);

    // binary string → Uint8ClampedArray
    const bytes = new Uint8ClampedArray(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return Array.from(bytes);
}

// Neue Funktion: Base64 zu RGBA Pixelarray
function base64ToRGBAArray(dataUrl: string, width: number, height: number): Uint8ClampedArray {
    const base64 = dataUrl.split(",")[1];
    const binary = atob(base64);
    const expectedLength = width * height * 4;
    const bytes = new Uint8ClampedArray(expectedLength);
    for (let i = 0; i < expectedLength; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}


export default function Mosaic({ imageData }: { imageData: string }) {


    if (!imageData) {
        return <div>No image data available.</div>;
    }

    // Decode base64 to number array
    const bytes = base64ToRGBAArray(imageData, 200, 200); // Assuming 400x400, adjust as needed

    const img: Img = {
        width: 200,
        height: 200,
        pixels: bytes,
    };


    const cells = generateVoronoiMosaic(img, 150);


    return (
        <DrawingBoard polygons={cells || []} onPolygonClick={(id) => console.log("Clicked polygon:", id)} />
    );

}