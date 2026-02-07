// mosaicGen.js — Voronoi mosaic generation (vanilla JS)
var MosaicGen = (function () {
    var ROUND_AMOUNT = 100;

    function random(max) { return Math.random() * max; }
    function round(num, pre) { pre = pre || 1; return Math.ceil(num * pre) / pre; }
    function randomRange(min, max) { return min + Math.random() * (max - min); }
    function constrain(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    function isFarEnough(candidate, seeds, minDist) {
        var md2 = minDist * minDist;
        for (var i = 0; i < seeds.length; i++) {
            var dx = candidate.x - seeds[i].x, dy = candidate.y - seeds[i].y;
            if (dx * dx + dy * dy < md2) return false;
        }
        return true;
    }

    function calculateImageFlowData(image) {
        var w = image.width, h = image.height, px = image.pixels;
        var edge = [];
        for (var y = 0; y < h; y++) {
            edge[y] = [];
            for (var x = 0; x < w; x++) {
                var gxv = 0, gyv = 0;
                for (var dy = -1; dy <= 1; dy++) {
                    for (var dx = -1; dx <= 1; dx++) {
                        var nx = constrain(x + dx, 0, w - 1), ny = constrain(y + dy, 0, h - 1);
                        var idx = (ny * w + nx) * 4;
                        var intensity = (px[idx] + px[idx + 1] + px[idx + 2]) / 3;
                        var wx = dx === 0 ? 0 : dy === 0 ? 2 * dx : dx;
                        var wy = dy === 0 ? 0 : dx === 0 ? 2 * dy : dy;
                        gxv += intensity * wx;
                        gyv += intensity * wy;
                    }
                }
                edge[y][x] = Math.sqrt(gxv * gxv + gyv * gyv);
            }
        }
        return { edgeStrength: edge };
    }

    function generateFlowBasedSeeds(image, flowData, numSeeds) {
        var w = image.width, h = image.height;
        var seeds = [];
        var minDistance = Math.max(w, h) / 15;

        // corners
        seeds.push({ x: 0, y: 0 }, { x: w - 1, y: 0 }, { x: 0, y: h - 1 }, { x: w - 1, y: h - 1 });

        // edge seeds
        for (var i = 1; i < 8; i++) {
            var t = i / 8;
            seeds.push({ x: t * (w - 1), y: 0 }, { x: t * (w - 1), y: h - 1 });
            seeds.push({ x: 0, y: t * (h - 1) }, { x: w - 1, y: t * (h - 1) });
        }

        var totalWeight = 0;
        for (var y = 0; y < h; y++)
            for (var x = 0; x < w; x++)
                totalWeight += flowData.edgeStrength[y][x] + 1;

        var numEdge = Math.floor(numSeeds * 0.6);
        var numUniform = numSeeds - numEdge;
        var maxAttempts = 30;

        function pickWeighted() {
            var rv = random(totalWeight), cum = 0;
            for (var y = 0; y < h; y++)
                for (var x = 0; x < w; x++) {
                    cum += flowData.edgeStrength[y][x] + 1;
                    if (cum >= rv) return { x: x, y: y };
                }
            return { x: 0, y: 0 };
        }

        for (var i = 0; i < numEdge; i++) {
            var placed = false;
            for (var a = 0; a < maxAttempts; a++) {
                var c = pickWeighted();
                if (isFarEnough(c, seeds, minDistance)) { seeds.push(c); placed = true; break; }
            }
            if (!placed && i > numEdge * 0.5) {
                for (var a = 0; a < maxAttempts; a++) {
                    var c = pickWeighted();
                    if (isFarEnough(c, seeds, minDistance * 0.7)) { seeds.push(c); break; }
                }
            }
        }

        for (var i = 0; i < numUniform; i++) {
            var placed = false;
            for (var a = 0; a < maxAttempts; a++) {
                var c = { x: randomRange(minDistance, w - minDistance), y: randomRange(minDistance, h - minDistance) };
                if (isFarEnough(c, seeds, minDistance)) { seeds.push(c); placed = true; break; }
            }
            if (!placed) {
                for (var a = 0; a < maxAttempts; a++) {
                    var c = { x: random(w), y: random(h) };
                    if (isFarEnough(c, seeds, minDistance * 0.6)) { seeds.push(c); break; }
                }
            }
        }
        return seeds;
    }

    function computeVoronoi(seeds, w, h) {
        var map = [];
        for (var y = 0; y < h; y++) {
            map[y] = [];
            for (var x = 0; x < w; x++) {
                var best = Infinity, bi = -1;
                for (var i = 0; i < seeds.length; i++) {
                    var dx = x - seeds[i].x, dy = y - seeds[i].y, d = dx * dx + dy * dy;
                    if (d < best) { best = d; bi = i; }
                }
                map[y][x] = bi;
            }
        }
        return { map: map, seeds: seeds };
    }

    function convexHull(points) {
        if (points.length < 3) return points;
        var start = points[0];
        for (var i = 1; i < points.length; i++) {
            var p = points[i];
            if (p.y < start.y || (p.y === start.y && p.x < start.x)) start = p;
        }
        var sorted = points.filter(function (p) { return p !== start; }).sort(function (a, b) {
            return Math.atan2(a.y - start.y, a.x - start.x) - Math.atan2(b.y - start.y, b.x - start.x);
        });
        sorted.unshift(start);
        var hull = [sorted[0], sorted[1]];
        for (var i = 2; i < sorted.length; i++) {
            while (hull.length >= 2) {
                var a = hull[hull.length - 2], b = hull[hull.length - 1], c = sorted[i];
                if ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) <= 0) hull.pop(); else break;
            }
            hull.push(sorted[i]);
        }
        return hull;
    }

    function extractCellBoundary(map, seedIdx, w, h) {
        var boundary = new Set();
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                if (map[y][x] !== seedIdx) continue;
                var isB = x === 0 || x === w - 1 || y === 0 || y === h - 1;
                if (!isB) {
                    for (var dy = -1; dy <= 1 && !isB; dy++)
                        for (var dx = -1; dx <= 1 && !isB; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            var nx = x + dx, ny = y + dy;
                            if (nx >= 0 && nx < w && ny >= 0 && ny < h && map[ny][nx] !== seedIdx) isB = true;
                        }
                }
                if (isB) boundary.add(x + ',' + y);
            }
        }
        if (boundary.size === 0) return [];
        var pixels = [];
        boundary.forEach(function (p) { var c = p.split(','); pixels.push({ x: +c[0], y: +c[1] }); });
        return convexHull(pixels);
    }

    function calculateCellColor(map, seedIdx, image) {
        var sR = 0, sG = 0, sB = 0, cnt = 0, px = image.pixels, w = image.width;
        for (var y = 0; y < image.height; y++) {
            for (var x = 0; x < w; x++) {
                if (map[y][x] === seedIdx) {
                    var idx = (y * w + x) * 4;
                    sR += px[idx]; sG += px[idx + 1]; sB += px[idx + 2]; cnt++;
                }
            }
        }
        if (cnt === 0) return 'rgb(128,128,128)';
        return 'rgb(' + round(sR / cnt, ROUND_AMOUNT) + ',' + round(sG / cnt, ROUND_AMOUNT) + ',' + round(sB / cnt, ROUND_AMOUNT) + ')';
    }

    function extractVoronoiCells(vd, image) {
        var cells = [];
        for (var i = 0; i < vd.seeds.length; i++) {
            var boundary = extractCellBoundary(vd.map, i, image.width, image.height);
            if (boundary.length < 3) continue;
            cells.push({ vertices: boundary, color: calculateCellColor(vd.map, i, image) });
        }
        return cells;
    }

    // Public API
    return {
        generateVoronoiMosaic: function (image, numSeeds) {
            var flowData = calculateImageFlowData(image);
            var seeds = generateFlowBasedSeeds(image, flowData, numSeeds);
            var vd = computeVoronoi(seeds, image.width, image.height);
            return extractVoronoiCells(vd, image);
        }
    };
})();
