import SmilesDrawer from 'smiles-drawer';
import { MoleculeRecord } from '../types/chemistry';

interface ParsedAtom {
  x: number;
  y: number;
  z: number;
  elem: string;
}

interface ParsedBond {
  from: number; // 0-indexed
  to: number;   // 0-indexed
  order: number;
}

const CPK_COLORS: Record<string, string> = {
  C: '#1e293b',
  O: '#dc2626',
  N: '#2563eb',
  S: '#ca8a04',
  P: '#ea580c',
  F: '#059669',
  CL: '#16a34a',
  Cl: '#16a34a',
  BR: '#9333ea',
  Br: '#9333ea',
  I: '#7e22ce',
  H: '#64748b',
};

const CPK_3D_BALL_COLORS: Record<string, { main: string; light: string; dark: string }> = {
  C: { main: '#475569', light: '#94a3b8', dark: '#0f172a' },
  O: { main: '#ef4444', light: '#fca5a5', dark: '#991b1b' },
  N: { main: '#3b82f6', light: '#93c5fd', dark: '#1e3a8a' },
  S: { main: '#eab308', light: '#fde047', dark: '#854d0e' },
  P: { main: '#f97316', light: '#fdba74', dark: '#9a3412' },
  F: { main: '#10b981', light: '#6ee7b7', dark: '#065f46' },
  Cl: { main: '#22c55e', light: '#86efac', dark: '#166534' },
  Br: { main: '#a855f7', light: '#d8b4fe', dark: '#581c87' },
  H: { main: '#e2e8f0', light: '#ffffff', dark: '#64748b' },
};

/**
 * Parses V2000 SDF block into atoms and bonds
 */
export function parseSdfV2000(sdf: string): { atoms: ParsedAtom[]; bonds: ParsedBond[] } {
  const lines = sdf.split(/\r?\n/);
  const countsIdx = lines.findIndex((l) => l.includes('V2000'));
  if (countsIdx === -1) {
    return { atoms: [], bonds: [] };
  }

  const countsLine = lines[countsIdx];
  const nAtoms = parseInt(countsLine.slice(0, 3).trim(), 10) || 0;
  const nBonds = parseInt(countsLine.slice(3, 6).trim(), 10) || 0;

  const atoms: ParsedAtom[] = [];
  for (let i = 0; i < nAtoms; i++) {
    const line = lines[countsIdx + 1 + i];
    if (!line) continue;
    const x = parseFloat(line.slice(0, 10).trim()) || 0;
    const y = parseFloat(line.slice(10, 20).trim()) || 0;
    const z = parseFloat(line.slice(20, 30).trim()) || 0;
    const elem = line.slice(31, 34).trim() || 'C';
    atoms.push({ x, y, z, elem });
  }

  const bonds: ParsedBond[] = [];
  for (let i = 0; i < nBonds; i++) {
    const line = lines[countsIdx + 1 + nAtoms + i];
    if (!line) continue;
    const a1 = (parseInt(line.slice(0, 3).trim(), 10) || 1) - 1;
    const a2 = (parseInt(line.slice(3, 6).trim(), 10) || 1) - 1;
    const order = parseInt(line.slice(6, 9).trim(), 10) || 1;
    if (a1 >= 0 && a1 < atoms.length && a2 >= 0 && a2 < atoms.length) {
      bonds.push({ from: a1, to: a2, order });
    }
  }

  return { atoms, bonds };
}

/**
 * Draws a crisp 2D Skeletal Chemical Structure directly onto an HTML5 Canvas
 * using SmilesDrawer when possible and falling back to 2D coordinate projection from SDF
 */
export function render2DStructureToCanvas(
  molecule: MoleculeRecord,
  canvas: HTMLCanvasElement,
  onComplete?: (dataUrl: string) => void
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width || 420;
  const height = canvas.height || 320;

  // Fill clean white background so exported PNGs and Dark Mode viewports are high-contrast
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Try SmilesDrawer v2 SvgDrawer -> Image -> Canvas first
  try {
    const SD: any = (SmilesDrawer as any)?.default || SmilesDrawer;
    if (SD && SD.parse && SD.SvgDrawer) {
      SD.parse(
        molecule.canonicalSmiles,
        (tree: any) => {
          try {
            const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            svgEl.setAttribute('width', String(width));
            svgEl.setAttribute('height', String(height));

            const svgDrawer = new SD.SvgDrawer({
              width,
              height,
              bondThickness: 2.0,
              bondLength: 24,
              shortBondLength: 0.82,
              bondSpacing: 5,
              fontSizeLarge: 12,
              fontSizeSmall: 8,
              padding: 28,
            });

            svgDrawer.draw(tree, svgEl, 'light', false);
            const svgString = new XMLSerializer().serializeToString(svgEl);
            const svgBlob = new Blob([svgString], {
              type: 'image/svg+xml;charset=utf-8',
            });
            const url = URL.createObjectURL(svgBlob);
            const img = new Image();
            img.onload = () => {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              URL.revokeObjectURL(url);
              if (onComplete) {
                onComplete(canvas.toDataURL('image/png'));
              }
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              draw2DFromSdfCoordinates(molecule, canvas, onComplete);
            };
            img.src = url;
            return;
          } catch {
            draw2DFromSdfCoordinates(molecule, canvas, onComplete);
          }
        },
        () => {
          draw2DFromSdfCoordinates(molecule, canvas, onComplete);
        }
      );
      return;
    }
  } catch {
    // Fallback to SDF coordinate projection
  }

  draw2DFromSdfCoordinates(molecule, canvas, onComplete);
}

/**
 * Deterministic 2D Skeletal Renderer from SDF coordinates (works 100% offline for any SMILES)
 */
export function draw2DFromSdfCoordinates(
  molecule: MoleculeRecord,
  canvas: HTMLCanvasElement,
  onComplete?: (dataUrl: string) => void
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width || 420;
  const height = canvas.height || 320;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  const { atoms: rawAtoms, bonds: rawBonds } = parseSdfV2000(molecule.sdf3D);

  // Filter out implicit/explicit hydrogens if heavy atoms >= 2 for cleaner skeletal view
  const heavyIndices = new Map<number, number>();
  const heavyAtoms: ParsedAtom[] = [];
  rawAtoms.forEach((a, idx) => {
    if (a.elem !== 'H' || rawAtoms.length <= 4) {
      heavyIndices.set(idx, heavyAtoms.length);
      heavyAtoms.push(a);
    }
  });

  const heavyBonds: ParsedBond[] = [];
  rawBonds.forEach((b) => {
    const f = heavyIndices.get(b.from);
    const t = heavyIndices.get(b.to);
    if (f !== undefined && t !== undefined) {
      heavyBonds.push({ from: f, to: t, order: b.order });
    }
  });

  if (heavyAtoms.length === 0) {
    if (onComplete) onComplete(canvas.toDataURL('image/png'));
    return;
  }

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  heavyAtoms.forEach((a) => {
    if (a.x < minX) minX = a.x;
    if (a.x > maxX) maxX = a.x;
    if (a.y < minY) minY = a.y;
    if (a.y > maxY) maxY = a.y;
  });

  const spanX = Math.max(1.5, maxX - minX);
  const spanY = Math.max(1.5, maxY - minY);
  const pad = 48;
  const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanY, 44);

  const project = (a: ParsedAtom) => ({
    cx: width / 2 + (a.x - (minX + maxX) / 2) * scale,
    cy: height / 2 - (a.y - (minY + maxY) / 2) * scale,
  });

  // Draw chemical bonds
  ctx.lineCap = 'round';
  heavyBonds.forEach((b) => {
    const p1 = project(heavyAtoms[b.from]);
    const p2 = project(heavyAtoms[b.to]);
    const dx = p2.cx - p1.cx;
    const dy = p2.cy - p1.cy;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * 3.5;
    const ny = (dx / len) * 3.5;

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.2;

    if (b.order === 2) {
      ctx.beginPath();
      ctx.moveTo(p1.cx + nx, p1.cy + ny);
      ctx.lineTo(p2.cx + nx, p2.cy + ny);
      ctx.moveTo(p1.cx - nx, p1.cy - ny);
      ctx.lineTo(p2.cx - nx, p2.cy - ny);
      ctx.stroke();
    } else if (b.order === 3) {
      ctx.beginPath();
      ctx.moveTo(p1.cx, p1.cy);
      ctx.lineTo(p2.cx, p2.cy);
      ctx.moveTo(p1.cx + nx * 1.4, p1.cy + ny * 1.4);
      ctx.lineTo(p2.cx + nx * 1.4, p2.cy + ny * 1.4);
      ctx.moveTo(p1.cx - nx * 1.4, p1.cy - ny * 1.4);
      ctx.lineTo(p2.cx - nx * 1.4, p2.cy - ny * 1.4);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(p1.cx, p1.cy);
      ctx.lineTo(p2.cx, p2.cy);
      ctx.stroke();
    }
  });

  // Draw heteroatom labels and terminal carbons
  ctx.font = 'bold 13px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  heavyAtoms.forEach((a, idx) => {
    const degree = heavyBonds.filter((b) => b.from === idx || b.to === idx).length;
    const isHetero = a.elem.toUpperCase() !== 'C';
    if (isHetero || degree <= 1 || heavyAtoms.length <= 3) {
      const { cx, cy } = project(a);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = CPK_COLORS[a.elem] || CPK_COLORS[a.elem.toUpperCase()] || '#0f172a';
      ctx.fillText(a.elem, cx, cy);
    }
  });

  if (onComplete) {
    onComplete(canvas.toDataURL('image/png'));
  }
}

/**
 * Generates a high-resolution 2D structure PNG DataURL for the PDF Report
 */
export async function generate2DSnapshotDataUrl(molecule: MoleculeRecord): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 360;
  return await new Promise<string>((resolve) => {
    let resolved = false;
    const finish = (url: string) => {
      if (!resolved) {
        resolved = true;
        resolve(url);
      }
    };
    render2DStructureToCanvas(molecule, canvas, finish);
    setTimeout(() => {
      if (!resolved) {
        draw2DFromSdfCoordinates(molecule, canvas, finish);
      }
    }, 600);
  });
}

/**
 * Generates a 3D Shaded Ball-and-Stick Conformer PNG DataURL on an offscreen canvas
 * if the live WebGL 3Dmol.js snapshot was not yet captured
 */
export function generate3DFallbackSnapshotDataUrl(molecule: MoleculeRecord): string {
  const canvas = document.createElement('canvas');
  canvas.width = 480;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Deep slate 3D viewport background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const { atoms, bonds } = parseSdfV2000(molecule.sdf3D);
  if (atoms.length === 0) return canvas.toDataURL('image/png');

  // Rotate slightly in 3D for isometric depth perception
  const rotX = 0.42;
  const rotY = -0.35;
  const cosX = Math.cos(rotX),
    sinX = Math.sin(rotX);
  const cosY = Math.cos(rotY),
    sinY = Math.sin(rotY);

  const rotated = atoms.map((a, idx) => {
    const x1 = a.x * cosY + a.z * sinY;
    const z1 = -a.x * sinY + a.z * cosY;
    const y2 = a.y * cosX - z1 * sinX;
    const z2 = a.y * sinX + z1 * cosX;
    return { idx, elem: a.elem, x: x1, y: y2, z: z2 };
  });

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  rotated.forEach((a) => {
    if (a.x < minX) minX = a.x;
    if (a.x > maxX) maxX = a.x;
    if (a.y < minY) minY = a.y;
    if (a.y > maxY) maxY = a.y;
  });

  const spanX = Math.max(2, maxX - minX);
  const spanY = Math.max(2, maxY - minY);
  const pad = 54;
  const scale = Math.min(
    (canvas.width - pad * 2) / spanX,
    (canvas.height - pad * 2) / spanY,
    42
  );

  const project = (a: { x: number; y: number; z: number }) => ({
    px: canvas.width / 2 + (a.x - (minX + maxX) / 2) * scale,
    py: canvas.height / 2 - (a.y - (minY + maxY) / 2) * scale,
  });

  // Draw 3D cylindrical sticks
  ctx.lineCap = 'round';
  bonds.forEach((b) => {
    const p1 = project(rotated[b.from]);
    const p2 = project(rotated[b.to]);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = b.order >= 2 ? 6 : 4.5;
    ctx.beginPath();
    ctx.moveTo(p1.px, p1.py);
    ctx.lineTo(p2.px, p2.py);
    ctx.stroke();
  });

  // Sort atoms back-to-front by Z for painter's algorithm 3D sphere shading
  const sortedAtoms = [...rotated].sort((a, b) => a.z - b.z);
  sortedAtoms.forEach((a) => {
    const { px, py } = project(a);
    const radius = a.elem === 'H' ? 7 : 12;
    const palette =
      CPK_3D_BALL_COLORS[a.elem] ||
      CPK_3D_BALL_COLORS[a.elem.toUpperCase()] ||
      CPK_3D_BALL_COLORS.C;

    const grad = ctx.createRadialGradient(
      px - radius * 0.35,
      py - radius * 0.35,
      radius * 0.15,
      px,
      py,
      radius
    );
    grad.addColorStop(0, palette.light);
    grad.addColorStop(0.55, palette.main);
    grad.addColorStop(1, palette.dark);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  return canvas.toDataURL('image/png');
}
