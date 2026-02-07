// mosaicGen.ts
// Übersetzung von mosaicGen.js nach TypeScript

// Hilfsfunktionen für mathematische Operationen und Typen
function random(max: number): number {
    return Math.random() * max;
}

function randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}
function floor(val: number): number {
    return Math.floor(val);
}
function min(a: number, b: number): number {
    return Math.min(a, b);
}
function max(a: number, b: number): number {
    return Math.max(a, b);
}
function sqrt(val: number): number {
    return Math.sqrt(val);
}
function atan2(y: number, x: number): number {
    return Math.atan2(y, x);
}
function constrain(val: number, minVal: number, maxVal: number): number {
    return Math.max(minVal, Math.min(maxVal, val));
}
function map(val: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return outMin + ((val - inMin) * (outMax - outMin)) / (inMax - inMin);
}

// Typen für Bild und Zellen
export interface Image {
    width: number;
    height: number;
    pixels: Uint8Array<ArrayBuffer>;
}

interface Seed {
    x: number;
    y: number;
}

export interface Cell {
    id: string;
    cell: _Cell;
    highlighted: boolean;
}

interface FlowData {
    gradientX: number[][];
    gradientY: number[][];
    magnitude: number[][];
    angle: number[][];
    edgeStrength: number[][];
}

interface VoronoiData {
    map: number[][];
    seeds: Seed[];
}

export interface _Cell {
    vertices: Seed[];
    color: any;
}

// Hauptfunktionen
export function generateVoronoiMosaic(image: Image, numSeeds: number): _Cell[] {
    const flowData = calculateImageFlowData(image);
    const seeds = generateFlowBasedSeeds(image, flowData, numSeeds);
    const voronoiData = computeVoronoi(seeds, image.width, image.height);
    const cells = extractVoronoiCells(voronoiData, image, flowData);
    return cells;
}

function generateFlowBasedSeeds(image: Image, flowData: FlowData, numSeeds: number): Seed[] {
    const seeds: Seed[] = [];
    const minDistance = max(image.width, image.height) / 15;

    seeds.push({ x: 0, y: 0 });
    seeds.push({ x: image.width - 1, y: 0 });
    seeds.push({ x: 0, y: image.height - 1 });
    seeds.push({ x: image.width - 1, y: image.height - 1 });

    const edgePoints = 8;
    for (let i = 1; i < edgePoints; i++) {
        const t = i / edgePoints;
        seeds.push({ x: t * (image.width - 1), y: 0 });
        seeds.push({ x: t * (image.width - 1), y: image.height - 1 });
        seeds.push({ x: 0, y: t * (image.height - 1) });
        seeds.push({ x: image.width - 1, y: t * (image.height - 1) });
    }

    let totalWeight = 0;
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            totalWeight += flowData.edgeStrength[y][x] + 1;
        }
    }
    const edgeSeedRatio = 0.6;
    const numEdgeSeeds = floor(numSeeds * edgeSeedRatio);
    const numUniformSeeds = numSeeds - numEdgeSeeds;
    const maxAttempts = 30;

    for (let i = 0; i < numEdgeSeeds; i++) {
        let placed = false;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const randVal = random(totalWeight);
            let cumSum = 0;
            let candidate: Seed | null = null;
            for (let y = 0; y < image.height; y++) {
                for (let x = 0; x < image.width; x++) {
                    cumSum += flowData.edgeStrength[y][x] + 1;
                    if (cumSum >= randVal) {
                        candidate = { x, y };
                        y = image.height;
                        break;
                    }
                }
            }
            if (candidate && isFarEnough(candidate, seeds, minDistance)) {
                seeds.push(candidate);
                placed = true;
                break;
            }
        }
        if (!placed && i > numEdgeSeeds * 0.5) {
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const randVal = random(totalWeight);
                let cumSum = 0;
                let candidate: Seed | null = null;
                for (let y = 0; y < image.height; y++) {
                    for (let x = 0; x < image.width; x++) {
                        cumSum += flowData.edgeStrength[y][x] + 1;
                        if (cumSum >= randVal) {
                            candidate = { x, y };
                            y = image.height;
                            break;
                        }
                    }
                }
                if (candidate && isFarEnough(candidate, seeds, minDistance * 0.7)) {
                    seeds.push(candidate);
                    break;
                }
            }
        }
    }

    for (let i = 0; i < numUniformSeeds; i++) {
        let placed = false;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const candidate: Seed = {
                x: randomRange(minDistance, image.width - minDistance),
                y: randomRange(minDistance, image.height - minDistance)
            };
            if (isFarEnough(candidate, seeds, minDistance)) {
                seeds.push(candidate);
                placed = true;
                break;
            }
        }
        if (!placed) {
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const candidate: Seed = {
                    x: random(image.width),
                    y: random(image.height)
                };
                if (isFarEnough(candidate, seeds, minDistance * 0.6)) {
                    seeds.push(candidate);
                    break;
                }
            }
        }
    }
    return seeds;
}

function isFarEnough(candidate: Seed, existingSeeds: Seed[], minDist: number): boolean {
    const minDistSq = minDist * minDist;
    for (const seed of existingSeeds) {
        const dx = candidate.x - seed.x;
        const dy = candidate.y - seed.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < minDistSq) {
            return false;
        }
    }
    return true;
}

function computeVoronoi(seeds: Seed[], width: number, height: number): VoronoiData {
    const voronoiMap: number[][] = [];
    for (let y = 0; y < height; y++) {
        voronoiMap[y] = [];
        for (let x = 0; x < width; x++) {
            voronoiMap[y][x] = -1;
        }
    }
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let minDist = Infinity;
            let closestSeed = -1;
            for (let i = 0; i < seeds.length; i++) {
                const dx = x - seeds[i].x;
                const dy = y - seeds[i].y;
                const dist = dx * dx + dy * dy;
                if (dist < minDist) {
                    minDist = dist;
                    closestSeed = i;
                }
            }
            voronoiMap[y][x] = closestSeed;
        }
    }
    return { map: voronoiMap, seeds };
}

function extractVoronoiCells(voronoiData: VoronoiData, image: Image, flowData: FlowData): _Cell[] {
    const cells: _Cell[] = [];
    const numSeeds = voronoiData.seeds.length;
    for (let seedIdx = 0; seedIdx < numSeeds; seedIdx++) {
        const boundary = extractCellBoundary(voronoiData.map, seedIdx, image.width, image.height);
        if (boundary.length < 3) continue;
        const avgColor = calculateCellColor(voronoiData.map, seedIdx, image);
        cells.push({ vertices: boundary, color: avgColor });
    }
    return cells;
}

function extractCellBoundary(voronoiMap: number[][], seedIdx: number, width: number, height: number): Seed[] {
    const boundaryPixels = new Set<string>();
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (voronoiMap[y][x] === seedIdx) {
                let isBoundary = false;
                if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                    isBoundary = true;
                } else {
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            const nx = x + dx;
                            const ny = y + dy;
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                if (voronoiMap[ny][nx] !== seedIdx) {
                                    isBoundary = true;
                                    break;
                                }
                            }
                        }
                        if (isBoundary) break;
                    }
                }
                if (isBoundary) {
                    boundaryPixels.add(`${x},${y}`);
                }
            }
        }
    }
    if (boundaryPixels.size === 0) return [];
    const pixels = Array.from(boundaryPixels).map(p => {
        const [x, y] = p.split(',').map(Number);
        return { x, y };
    });
    const hull = convexHull(pixels);
    return hull;
}

function convexHull(points: Seed[]): Seed[] {
    if (points.length < 3) return points;
    let start = points[0];
    for (const p of points) {
        if (p.y < start.y || (p.y === start.y && p.x < start.x)) {
            start = p;
        }
    }
    const sorted = points.filter(p => p !== start).sort((a, b) => {
        const angleA = atan2(a.y - start.y, a.x - start.x);
        const angleB = atan2(b.y - start.y, b.x - start.x);
        return angleA - angleB;
    });
    sorted.unshift(start);
    const hull: Seed[] = [sorted[0], sorted[1]];
    for (let i = 2; i < sorted.length; i++) {
        while (hull.length >= 2) {
            const a = hull[hull.length - 2];
            const b = hull[hull.length - 1];
            const c = sorted[i];
            const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
            if (cross <= 0) {
                hull.pop();
            } else {
                break;
            }
        }
        hull.push(sorted[i]);
    }
    return hull;
}

function calculateCellColor(voronoiMap: number[][], seedIdx: number, image: Image): any {
    let sumR = 0, sumG = 0, sumB = 0, count = 0;
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            if (voronoiMap[y][x] === seedIdx) {
                const idx = (y * image.width + x) * 4;
                sumR += image.pixels[idx];
                sumG += image.pixels[idx + 1];
                sumB += image.pixels[idx + 2];
                count++;
            }
        }
    }
    if (count === 0) return { r: 128, g: 128, b: 128 };
    return { r: sumR / count, g: sumG / count, b: sumB / count };
}

function calculateImageFlowData(image: Image): FlowData {
    const data: FlowData = {
        gradientX: [],
        gradientY: [],
        magnitude: [],
        angle: [],
        edgeStrength: []
    };
    for (let y = 0; y < image.height; y++) {
        data.gradientX[y] = [];
        data.gradientY[y] = [];
        data.magnitude[y] = [];
        data.angle[y] = [];
        data.edgeStrength[y] = [];
        for (let x = 0; x < image.width; x++) {
            let gx = 0, gy = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const nx = constrain(x + dx, 0, image.width - 1);
                    const ny = constrain(y + dy, 0, image.height - 1);
                    const nidx = (ny * image.width + nx) * 4;
                    const intensity = (image.pixels[nidx] + image.pixels[nidx + 1] + image.pixels[nidx + 2]) / 3;
                    const wx = (dx === 0) ? 0 : (dy === 0) ? 2 * dx : dx;
                    const wy = (dy === 0) ? 0 : (dx === 0) ? 2 * dy : dy;
                    gx += intensity * wx;
                    gy += intensity * wy;
                }
            }
            const mag = sqrt(gx * gx + gy * gy);
            const ang = atan2(gy, gx);
            data.gradientX[y][x] = gx;
            data.gradientY[y][x] = gy;
            data.magnitude[y][x] = mag;
            data.angle[y][x] = ang;
            data.edgeStrength[y][x] = mag;
        }
    }
    return data;
}

// cropAndResize und calculateCellEdgeProperties können analog übersetzt werden, falls benötigt.
