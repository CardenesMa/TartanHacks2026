"use client"
import { Polygon } from "../state/poyrender"
type DrawingBoardProps = {
    polygons: Polygon[];
    onPolygonClick: (id: string) => void;
}

export default function DrawingBoard({ polygons, onPolygonClick }: DrawingBoardProps) {
    return (
        <svg width="800" height="600">
            {polygons.map(p => (
                <polygon
                    key={p.id}
                    points={p.points.map(pt => `${pt.x},${pt.y}`).join(" ")}
                    fill={p.color}
                    stroke={p.highlighted ? "yellow" : "black"}
                    onClick={() => onPolygonClick(p.id)}
                />
            ))}
        </svg>
    );
}
