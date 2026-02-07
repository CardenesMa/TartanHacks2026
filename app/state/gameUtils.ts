import { _Cell, Image as Img } from '../components/mosaicGen';

// Crop and resize image to target dimensions
export async function cropAndResize(dataUrl: string, targetW: number, targetH: number): Promise<Img> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = targetW;
      canvas.height = targetH;

      // Calculate crop dimensions to maintain aspect ratio
      const srcAspect = img.width / img.height;
      const targetAspect = targetW / targetH;

      let cropX, cropY, cropW, cropH;

      if (srcAspect > targetAspect) {
        // Source is wider, crop width
        cropH = img.height;
        cropW = img.height * targetAspect;
        cropX = (img.width - cropW) / 2;
        cropY = 0;
      } else {
        // Source is taller, crop height
        cropW = img.width;
        cropH = img.width / targetAspect;
        cropX = 0;
        cropY = (img.height - cropH) / 2;
      }

      // Draw cropped and resized image
      ctx.drawImage(
        img,
        cropX, cropY, cropW, cropH,
        0, 0, targetW, targetH
      );

      // Extract RGBA pixel data
      const imageData = ctx.getImageData(0, 0, targetW, targetH);

      resolve({
        width: targetW,
        height: targetH,
        pixels: imageData.data
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = dataUrl;
  });
}

// Efficiently scramble mosaic - ensures every tile is swapped at least once
export function getScrambledVersion(cells: _Cell[]): _Cell[] {
  // Deep copy cells
  const scrambled = cells.map(cell => ({
    vertices: cell.vertices.map(v => ({ x: v.x, y: v.y })),
    color: cell.color
  }));

  const n = scrambled.length;
  const swapped = new Set<number>();

  // Fisher-Yates shuffle variant that tracks swaps
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    
    // Swap colors
    const temp = scrambled[i].color;
    scrambled[i].color = scrambled[j].color;
    scrambled[j].color = temp;
    
    // Mark as swapped
    swapped.add(i);
    swapped.add(j);
  }

  // Ensure all tiles have been swapped
  // Find any unswapped tiles and swap them
  for (let i = 0; i < n; i++) {
    if (!swapped.has(i)) {
      // Find a different tile to swap with
      let j = (i + 1) % n;
      while (j === i) {
        j = Math.floor(Math.random() * n);
      }
      
      const temp = scrambled[i].color;
      scrambled[i].color = scrambled[j].color;
      scrambled[j].color = temp;
      
      swapped.add(i);
      swapped.add(j);
    }
  }

  return scrambled;
}

// Check if puzzle is solved
export function checkIfSolved(scrambled: _Cell[], original: _Cell[]): boolean {
  if (scrambled.length !== original.length) return false;
  
  for (let i = 0; i < scrambled.length; i++) {
    if (scrambled[i].color !== original[i].color) {
      return false;
    }
  }
  
  return true;
}

// Mutating swap function for gameplay
export function swapCells(cells: _Cell[], indexA: number, indexB: number): void {
  const temp = cells[indexA].color;
  cells[indexA].color = cells[indexB].color;
  cells[indexB].color = temp;
}