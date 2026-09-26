export type PieceType =
  | 'I'
  | 'O'
  | 'T'
  | 'S'
  | 'Z'
  | 'J'
  | 'L';

export const COLORS: Record<PieceType, string> = {
  I: '#22d3ee',
  O: '#facc15',
  T: '#a78bfa',
  S: '#4ade80',
  Z: '#f87171',
  J: '#60a5fa',
  L: '#fb923c',
};

const PIECE_BY_INDEX: Record<number, PieceType> = {
  1: 'I',
  2: 'O',
  3: 'T',
  4: 'S',
  5: 'Z',
  6: 'J',
  7: 'L',
};

export function toPieceType(
  index: number | null | undefined,
): PieceType | null {
  if (index == null) {
    return null;
  }
  return PIECE_BY_INDEX[index] ?? null;
}
