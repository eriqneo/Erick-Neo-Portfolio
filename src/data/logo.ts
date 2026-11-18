import grid from './logo-grid.json';

export interface LogoDot {
  x: number;
  y: number;
  accent: boolean;
  /** Column index across the whole monogram (0 = leftmost) — drives the hover ripple. */
  col: number;
}

/**
 * Dot-matrix "EN" monogram geometry. `small` uses fatter dots so the letterforms stay
 * solid at favicon / nav sizes; the regular cut is for display sizes.
 */
export function logoGeometry(small = false) {
  const { step, letterGap } = grid;
  const r = small ? grid.radiusSmall : grid.radius;
  const pad = r.accent;
  const dots: LogoDot[] = [];
  let x0 = pad;
  let colBase = 0;
  for (const rows of grid.letters) {
    const cols = rows[0].length;
    rows.forEach((row, ri) =>
      [...row].forEach((ch, ci) => {
        if (ch === '.') return;
        dots.push({ x: x0 + ci * step, y: pad + ri * step, accent: ch === 'A', col: colBase + ci });
      }),
    );
    x0 += (cols - 1) * step + letterGap;
    colBase += cols;
  }
  const width = x0 - letterGap + pad;
  const height = pad * 2 + (grid.letters[0].length - 1) * step;
  return { dots, width, height, r, columns: colBase };
}
