import {TurboModule, TurboModuleRegistry} from 'react-native';

export type NativePiece = number;

export type NativeActivePiece = {
  type: NativePiece;
  rotation: number;
  column: number;
  row: number;
};

export type TetrisSnapshot = {
  rows: number;
  cols: number;
  board: NativePiece[];
  active: NativeActivePiece | null;
  hold: NativePiece | null;
  next: NativePiece[];
  ghostRow: number;
  state: string;
  score: number;
  lines: number;
  level: number;
  combo: number;
  lastLinesCleared: number;
  fallFrames: number;
};

export type PieceShapes = {
  sizes: number[];
  rotations: NativePiece[][][];
};

export interface Spec extends TurboModule {
  reset(seed: number): void;
  start(): void;
  pause(): void;
  resume(): void;
  togglePause(): void;
  tick(): void;
  moveLeft(): boolean;
  moveRight(): boolean;
  moveDown(): boolean;
  rotateClockwise(): boolean;
  rotateCounterClockwise(): boolean;
  softDrop(): boolean;
  hardDrop(): number;
  hold(): boolean;
  getSnapshot(): Object;
  getPieceShapes(): Object;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativeTetrisModule',
);
