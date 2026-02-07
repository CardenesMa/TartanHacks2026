"use client"
import { Cell, _Cell } from "./mosaicGen";

type DrawingBoardProps = {
    polygons: _Cell[];
    onPolygonClick: (id: string) => void;
}



export default function DrawingBoard({ polygons, onPolygonClick }: DrawingBoardProps) {
    // turn all pilygons into svg polygons
    const svgPolys = polygons.map((cell, index) => ({
        id: `poly-${index}`,
        cell: cell,
        highlighted: false
    } as Cell));

    return (
        <svg width="800" height="600">
            {svgPolys.map(p => (
                <polygon
                    key={p.id}
                    points={p.cell.vertices.map(pt => `${pt.x},${pt.y}`).join(" ")}
                    fill={p.cell.color}
                    stroke={p.highlighted ? "yellow" : "black"}
                    onClick={() => onPolygonClick(p.id)}
                />
            ))}
        </svg>
    );
}
