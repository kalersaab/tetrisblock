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