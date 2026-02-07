
//need to call generate on input image, i suggest numSeeds = 150 but we can change this.




function generateVoronoiMosaic(image, numSeeds) {
  image.loadPixels();

  let flowData = calculateImageFlowData(image);
  let seeds = generateFlowBasedSeeds(image, flowData, numSeeds);
  let voronoiData = computeVoronoi(seeds, image.width, image.height);
  let cells = extractVoronoiCells(voronoiData, image, flowData);

  return cells;
}

function generateFlowBasedSeeds(image, flowData, numSeeds) {
  let seeds = [];
  let minDistance = max(image.width, image.height) / 15;

  seeds.push({ x: 0, y: 0 });
  seeds.push({ x: image.width - 1, y: 0 });
  seeds.push({ x: 0, y: image.height - 1 });
  seeds.push({ x: image.width - 1, y: image.height - 1 });

  let edgePoints = 8; // Number of points per edge
  for (let i = 1; i < edgePoints; i++) {
    let t = i / edgePoints;
    // Top edge
    seeds.push({ x: t * (image.width - 1), y: 0 });
    // Bottom edge
    seeds.push({ x: t * (image.width - 1), y: image.height - 1 });
    // Left edge
    seeds.push({ x: 0, y: t * (image.height - 1) });
    // Right edge
    seeds.push({ x: image.width - 1, y: t * (image.height - 1) });
  }

  let totalWeight = 0;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      totalWeight += flowData.edgeStrength[y][x] + 1;
    }
  }
  let edgeSeedRatio = 0.6;
  let numEdgeSeeds = floor(numSeeds * edgeSeedRatio);
  let numUniformSeeds = numSeeds - numEdgeSeeds;

  // poisson
  let maxAttempts = 30; // Max attempts per seed
  for (let i = 0; i < numEdgeSeeds; i++) {
    let placed = false;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let randVal = random(totalWeight);
      let cumSum = 0;
      let candidate = null;

      for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
          cumSum += flowData.edgeStrength[y][x] + 1;
          if (cumSum >= randVal) {
            candidate = { x: x, y: y };
            y = image.height;
            break;
          }
        }
      }

      // check if far
      if (candidate && isFarEnough(candidate, seeds, minDistance)) {
        seeds.push(candidate);
        placed = true;
        break;
      }
    }

    // relax constraint
    if (!placed && i > numEdgeSeeds * 0.5) {
      // Try one more time with reduced distance
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let randVal = random(totalWeight);
        let cumSum = 0;
        let candidate = null;

        for (let y = 0; y < image.height; y++) {
          for (let x = 0; x < image.width; x++) {
            cumSum += flowData.edgeStrength[y][x] + 1;
            if (cumSum >= randVal) {
              candidate = { x: x, y: y };
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
      let candidate = {
        x: random(minDistance, image.width - minDistance),
        y: random(minDistance, image.height - minDistance)
      };

      if (isFarEnough(candidate, seeds, minDistance)) {
        seeds.push(candidate);
        placed = true;
        break;
      }
    }

    if (!placed) {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let candidate = {
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

// Efficient distance check using spatial hashing
function isFarEnough(candidate, existingSeeds, minDist) {
  let minDistSq = minDist * minDist;

  // Only check seeds within potential range (optimization)
  for (let seed of existingSeeds) {
    let dx = candidate.x - seed.x;
    let dy = candidate.y - seed.y;
    let distSq = dx * dx + dy * dy;

    if (distSq < minDistSq) {
      return false;
    }
  }

  return true;
}

function computeVoronoi(seeds, width, height) {

  let voronoiMap = [];

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
        let dx = x - seeds[i].x;
        let dy = y - seeds[i].y;
        let dist = dx * dx + dy * dy; // skip sqrt for speed

        if (dist < minDist) {
          minDist = dist;
          closestSeed = i;
        }
      }

      voronoiMap[y][x] = closestSeed;
    }
  }

  return {
    map: voronoiMap,
    seeds: seeds
  };
}

function extractVoronoiCells(voronoiData, image, flowData) {
  let cells = [];
  let numSeeds = voronoiData.seeds.length;

  for (let seedIdx = 0; seedIdx < numSeeds; seedIdx++) {
    let boundary = extractCellBoundary(voronoiData.map, seedIdx, image.width, image.height);

    if (boundary.length < 3) continue; // Skip degenerate cells

    let avgColor = calculateCellColor(voronoiData.map, seedIdx, image);

    cells.push({
      vertices: boundary,
      color: avgColor
    });
  }

  return cells;
}

function extractCellBoundary(voronoiMap, seedIdx, width, height) {
  // Find boundary pixels using marching squares-like approach
  let boundaryPixels = new Set();

  // Find all pixels belonging to this cell that are adjacent to other cells OR edges
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (voronoiMap[y][x] === seedIdx) {
        // Check if this pixel is on boundary (next to different cell or image edge)
        let isBoundary = false;

        // Check if at image edge
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          isBoundary = true;
        } else {
          // Check if adjacent to other cells
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              let nx = x + dx;
              let ny = y + dy;
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

  // Convert to array and create simplified polygon
  let pixels = Array.from(boundaryPixels).map(p => {
    let [x, y] = p.split(',').map(Number);
    return { x, y };
  });

  // Find convex hull for simplified boundary
  let hull = convexHull(pixels);

  return hull;
}

function convexHull(points) {
  if (points.length < 3) return points;

  // Graham scan algorithm
  // Find lowest point
  let start = points[0];
  for (let p of points) {
    if (p.y < start.y || (p.y === start.y && p.x < start.x)) {
      start = p;
    }
  }

  // Sort by polar angle
  let sorted = points.filter(p => p !== start).sort((a, b) => {
    let angleA = atan2(a.y - start.y, a.x - start.x);
    let angleB = atan2(b.y - start.y, b.x - start.x);
    return angleA - angleB;
  });

  sorted.unshift(start);

  let hull = [sorted[0], sorted[1]];

  for (let i = 2; i < sorted.length; i++) {
    while (hull.length >= 2) {
      let a = hull[hull.length - 2];
      let b = hull[hull.length - 1];
      let c = sorted[i];

      let cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

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

function calculateCellColor(voronoiMap, seedIdx, image) {
  let sumR = 0, sumG = 0, sumB = 0, count = 0;

  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      if (voronoiMap[y][x] === seedIdx) {
        let idx = (y * image.width + x) * 4;
        sumR += image.pixels[idx];
        sumG += image.pixels[idx + 1];
        sumB += image.pixels[idx + 2];
        count++;
      }
    }
  }

  if (count === 0) return color(128);

  return color(sumR / count, sumG / count, sumB / count);
}

function calculateCellEdgeProperties(voronoiMap, seedIdx, flowData) {
  // Calculate average edge strength along cell boundary
  let sumEdge = 0, count = 0;

  for (let y = 0; y < flowData.edgeStrength.length; y++) {
    for (let x = 0; x < flowData.edgeStrength[0].length; x++) {
      if (voronoiMap[y][x] === seedIdx) {
        // Check if boundary pixel
        let isBoundary = false;
        for (let dy = -1; dy <= 1 && !isBoundary; dy++) {
          for (let dx = -1; dx <= 1 && !isBoundary; dx++) {
            if (dx === 0 && dy === 0) continue;
            let nx = x + dx;
            let ny = y + dy;
            if (nx >= 0 && nx < voronoiMap[0].length && ny >= 0 && ny < voronoiMap.length) {
              if (voronoiMap[ny][nx] !== seedIdx) {
                isBoundary = true;
              }
            }
          }
        }

        if (isBoundary) {
          sumEdge += flowData.edgeStrength[y][x];
          count++;
        }
      }
    }
  }

  let avgEdge = count > 0 ? sumEdge / count : 0;

  // Map edge strength to outline darkness and thickness
  let edgeIntensity = constrain(avgEdge / 50, 0, 1);
  let edgeBrightness = map(edgeIntensity, 0, 1, 200, 20);
  let edgeThickness = map(edgeIntensity, 0, 1, 0.3, 2.5);

  return {
    color: color(edgeBrightness),
    weight: edgeThickness
  };
}

function cropAndResize(srcImg, targetW, targetH) {
  srcImg.loadPixels();

  let srcW = srcImg.width;
  let srcH = srcImg.height;

  // Calculate crop dimensions to maintain aspect ratio
  let srcAspect = srcW / srcH;
  let targetAspect = targetW / targetH;

  let cropX, cropY, cropW, cropH;

  if (srcAspect > targetAspect) {
    // Source is wider, crop width
    cropH = srcH;
    cropW = srcH * targetAspect;
    cropX = (srcW - cropW) / 2;
    cropY = 0;
  } else {
    // Source is taller, crop height
    cropW = srcW;
    cropH = srcW / targetAspect;
    cropX = 0;
    cropY = (srcH - cropH) / 2;
  }

  // Create new image with target dimensions
  let result = createImage(targetW, targetH);
  result.loadPixels();

  // Perform resize with bilinear interpolation
  for (let y = 0; y < targetH; y++) {
    for (let x = 0; x < targetW; x++) {
      // Map target pixel to source pixel
      let srcX = cropX + (x / targetW) * cropW;
      let srcY = cropY + (y / targetH) * cropH;

      // Bilinear interpolation
      let x1 = floor(srcX);
      let y1 = floor(srcY);
      let x2 = min(x1 + 1, srcW - 1);
      let y2 = min(y1 + 1, srcH - 1);

      let fx = srcX - x1;
      let fy = srcY - y1;

      // Get four surrounding pixels
      let idx11 = (y1 * srcW + x1) * 4;
      let idx21 = (y1 * srcW + x2) * 4;
      let idx12 = (y2 * srcW + x1) * 4;
      let idx22 = (y2 * srcW + x2) * 4;

      let targetIdx = (y * targetW + x) * 4;

      // Interpolate each channel
      for (let c = 0; c < 3; c++) {
        let v11 = srcImg.pixels[idx11 + c];
        let v21 = srcImg.pixels[idx21 + c];
        let v12 = srcImg.pixels[idx12 + c];
        let v22 = srcImg.pixels[idx22 + c];

        let v1 = v11 * (1 - fx) + v21 * fx;
        let v2 = v12 * (1 - fx) + v22 * fx;
        let v = v1 * (1 - fy) + v2 * fy;

        result.pixels[targetIdx + c] = v;
      }
      result.pixels[targetIdx + 3] = 255; // Alpha
    }
  }

  result.updatePixels();
  return result;
}

function calculateImageFlowData(image) {
  let data = {
    gradientX: [],
    gradientY: [],
    magnitude: [],
    angle: [],
    edgeStrength: []
  };

  // Calculate gradients using Sobel
  for (let y = 0; y < image.height; y++) {
    data.gradientX[y] = [];
    data.gradientY[y] = [];
    data.magnitude[y] = [];
    data.angle[y] = [];
    data.edgeStrength[y] = [];

    for (let x = 0; x < image.width; x++) {
      let gx = 0, gy = 0;

      // Sobel kernels
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          let nx = constrain(x + dx, 0, image.width - 1);
          let ny = constrain(y + dy, 0, image.height - 1);
          let nidx = (ny * image.width + nx) * 4;

          let intensity = (image.pixels[nidx] + image.pixels[nidx + 1] + image.pixels[nidx + 2]) / 3;

          // Sobel weights
          let wx = (dx === 0) ? 0 : (dy === 0) ? 2 * dx : dx;
          let wy = (dy === 0) ? 0 : (dx === 0) ? 2 * dy : dy;

          gx += intensity * wx;
          gy += intensity * wy;
        }
      }

      let mag = sqrt(gx * gx + gy * gy);
      let ang = atan2(gy, gx);

      data.gradientX[y][x] = gx;
      data.gradientY[y][x] = gy;
      data.magnitude[y][x] = mag;
      data.angle[y][x] = ang;
      data.edgeStrength[y][x] = mag;
    }
  }

  return data;
}
