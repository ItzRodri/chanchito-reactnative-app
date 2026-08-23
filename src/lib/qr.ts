/**
 * Generador del QR decorativo del mockup: 21x21 celdas, tres "finders" en las
 * esquinas y el resto derivado de un xorshift sembrado con el código.
 * No codifica datos reales — es el mismo placeholder visual del HTML.
 */
export const QR_SIZE = 21;

export function qrRows(seed: string): boolean[][] {
  let h = 7;
  for (const ch of seed || 'CHANCHITO') h = (h * 31 + ch.charCodeAt(0)) % 100003;

  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7);

  const finderOn = (r: number, c: number) => {
    const rr = r < 7 ? r : r - 14;
    const cc = c < 7 ? c : c - 14;
    const d = Math.max(Math.abs(rr - 3), Math.abs(cc - 3));
    return d === 3 || d <= 1;
  };

  const rows: boolean[][] = [];
  for (let r = 0; r < QR_SIZE; r++) {
    const cells: boolean[] = [];
    for (let c = 0; c < QR_SIZE; c++) {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      h = h | 0;
      cells.push(isFinder(r, c) ? finderOn(r, c) : ((h >>> 7) & 1) === 1);
    }
    rows.push(cells);
  }
  return rows;
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeInviteCode() {
  let code = '';
  for (let i = 0; i < 6; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return code;
}
