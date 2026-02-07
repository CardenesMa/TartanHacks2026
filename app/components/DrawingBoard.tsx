"use client"
import { Cell, _Cell } from "./mosaicGen";

type DrawingBoardProps = {
    polygons: _Cell[];
    onPolygonClick: (id: string) => void;
}

export default function DrawingBoard({ polygons, onPolygonClick }: DrawingBoardProps) {
    // Turn all polygons into svg polygons
    const svgPolys = polygons.map((cell, index) => ({
        id: `poly-${index}`,
        cell: cell,
        highlighted: false
    } as Cell));

    // CRITICAL FIX: Add viewBox to properly scale the 200x200 coordinate space
    return (
        <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 200 200"
            preserveAspectRatio="xMidYMid meet"
            style={{ maxWidth: '600px', maxHeight: '600px', border: '1px solid #ccc' }}
        >
            {svgPolys.map(p => (
                <polygon
                    key={p.id}
                    points={p.cell.vertices.map(pt => `${pt.x},${pt.y}`).join(" ")}
                    fill={p.cell.color}
                    stroke="none"
                    onClick={() => onPolygonClick(p.id)}
                    style={{ cursor: 'pointer' }}
                />
            ))}
        </svg>
    );
}