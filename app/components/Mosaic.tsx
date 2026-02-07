
import { useEffect } from "react";
import { generateVoronoiMosaic, Image as Img } from "./mosaicGen";
import { useImageStore } from "@/store/useImageStore";
import DrawingBoard from "./DrawingBoard";

export default function Mosaic({ imageData }: { imageData: string }) {


    // Decode base64 to Uint8Array
    const binaryString = atob(imageData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const img: Img = {
        width: 400,
        height: 400,
        pixels: bytes,
    };


    const cells = generateVoronoiMosaic(img, 1000);


    return (
        <DrawingBoard polygons={cells || []} onPolygonClick={(id) => console.log("Clicked polygon:", id)} />
    );

}