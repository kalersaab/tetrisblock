import type {
  NativeActivePiece,
  PieceShapes,
  TetrisSnapshot,
} from '../../specs/NativeTetrisModule';
import {BOARD_COLS, BOARD_ROWS, type BoardMatrix, renderBoard} from './Board';
import {type PieceType, toPieceType} from './pieces';

export type PieceShape = {
  size: number;
  cells: number[];
};

const ROTATION_COUNT = 4;

export function getPieceShape(
  shapes: PieceShapes,
  type: number,
  rotation: number,
): PieceShape {
  const size = shapes.sizes[type] ?? 0;
  const normalized = ((rotation % ROTATION_COUNT) + ROTATION_COUNT) % ROTATION_COUNT;
  const cells = shapes.rotations[type]?.[normalized] ?? [];
  return {size, cells};
}

function stampPiece(
  matrix: BoardMatrix,
  active: NativeActivePiece,
  shapes: PieceShapes,
  piece: PieceType,
) {
  const {size, cells} = getPieceShape(shapes, active.type, active.rotation);

  for (let row = 0; row < size; row++) {
    const boardRow = active.row + row;
    if (boardRow < 0 || boardRow >= matrix.length) {
      continue;
    }
    for (let column = 0; column < size; column++) {
      const boardColumn = active.column + column;
      if (boardColumn < 0 || boardColumn >= matrix[boardRow].length) {
        continue;
      }
      if (cells[row * size + column]) {
        matrix[boardRow][boardColumn] = piece;
      }
    }
  }
}

export function buildPlayfield(
  snapshot: TetrisSnapshot,
  shapes: PieceShapes,
): BoardMatrix {
  const rows = snapshot.rows || BOARD_ROWS;
  const cols = snapshot.cols || BOARD_COLS;
  const matrix = renderBoard(rows, cols);

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < cols; column++) {
      const piece = toPieceType(snapshot.board[row * cols + column]);
      if (piece) {
        matrix[row][column] = piece;
      }
    }
  }

  if (snapshot.active) {
    const active = toPieceType(snapshot.active.type);
    if (active) {
      stampPiece(matrix, snapshot.active, shapes, active);
    }
  }

  return matrix;
}
