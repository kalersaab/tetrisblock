/**
 * @format
 */

import {
  BOARD_COLS,
  BOARD_ROWS,
  type BoardMatrix,
} from '../components/tetris/Board';
import {buildPlayfield, getPieceShape} from '../components/tetris/playfield';
import type {PieceShapes, TetrisSnapshot} from '../specs/NativeTetrisModule';

const T_SHAPE = [
  [0, 1, 0],
  [1, 1, 1],
  [0, 0, 0],
];

const O_SHAPE = [
  [1, 1],
  [1, 1],
];

const I_SHAPE = [
  [0, 0, 0, 0],
  [1, 1, 1, 1],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

const shapes: PieceShapes = {
  sizes: [0, 4, 2, 3, 3, 3, 3, 3],
  rotations: [
    [[], [], [], []],
    [I_SHAPE, I_SHAPE, I_SHAPE, I_SHAPE],
    [O_SHAPE, O_SHAPE, O_SHAPE, O_SHAPE],
    [T_SHAPE, T_SHAPE, T_SHAPE, T_SHAPE],
    [T_SHAPE, T_SHAPE, T_SHAPE, T_SHAPE],
    [T_SHAPE, T_SHAPE, T_SHAPE, T_SHAPE],
    [T_SHAPE, T_SHAPE, T_SHAPE, T_SHAPE],
    [T_SHAPE, T_SHAPE, T_SHAPE, T_SHAPE],
  ].map(piece => piece.map(rotation => rotation.flat().map(cell => (cell ? 1 : 0)))),
};

function snapshot(overrides: Partial<TetrisSnapshot> = {}): TetrisSnapshot {
  return {
    rows: BOARD_ROWS,
    cols: BOARD_COLS,
    board: new Array(BOARD_ROWS * BOARD_COLS).fill(0),
    active: null,
    hold: null,
    next: [],
    ghostRow: -1,
    state: 'running',
    score: 0,
    lines: 0,
    level: 1,
    combo: -1,
    lastLinesCleared: 0,
    fallFrames: 48,
    ...overrides,
  };
}

function cellsAt(matrix: BoardMatrix, row: number, col: number) {
  return matrix[row][col];
}

describe('getPieceShape', () => {
  it('normalizes rotation indexes', () => {
    expect(getPieceShape(shapes, 3, 5)).toEqual(getPieceShape(shapes, 3, 1));
    expect(getPieceShape(shapes, 3, -1)).toEqual(getPieceShape(shapes, 3, 3));
  });

  it('returns an empty shape for unknown pieces', () => {
    expect(getPieceShape(shapes, 0, 0)).toEqual({size: 0, cells: []});
    expect(getPieceShape(shapes, 99, 0)).toEqual({size: 0, cells: []});
  });
});

describe('buildPlayfield', () => {
  it('maps board indexes to piece letters', () => {
    const board = new Array(BOARD_ROWS * BOARD_COLS).fill(0);
    board[0] = 1;
    board[1] = 7;
    board[BOARD_ROWS * BOARD_COLS - 1] = 3;

    const matrix = buildPlayfield(snapshot({board}), shapes);

    expect(cellsAt(matrix, 0, 0)).toBe('I');
    expect(cellsAt(matrix, 0, 1)).toBe('L');
    expect(cellsAt(matrix, BOARD_ROWS - 1, BOARD_COLS - 1)).toBe('T');
  });

  it('draws the active piece over the board', () => {
    const board = new Array(BOARD_ROWS * BOARD_COLS).fill(0);
    board[5 * BOARD_COLS + 0] = 5;

    const matrix = buildPlayfield(
      snapshot({board, active: {type: 3, rotation: 0, column: 4, row: 2}}),
      shapes,
    );

    expect(cellsAt(matrix, 2, 5)).toBe('T');
    expect(cellsAt(matrix, 3, 4)).toBe('T');
    expect(cellsAt(matrix, 3, 5)).toBe('T');
    expect(cellsAt(matrix, 3, 6)).toBe('T');
    expect(cellsAt(matrix, 5, 0)).toBe('Z');
  });

  it('clips cells above the top edge', () => {
    const matrix = buildPlayfield(
      snapshot({active: {type: 3, rotation: 0, column: 0, row: -1}}),
      shapes,
    );

    expect(matrix).toHaveLength(BOARD_ROWS);
    matrix.forEach(row => expect(row).toHaveLength(BOARD_COLS));
    expect(cellsAt(matrix, 0, 0)).toBe('T');
    expect(cellsAt(matrix, 0, 1)).toBe('T');
    expect(cellsAt(matrix, 0, 2)).toBe('T');
    expect(cellsAt(matrix, 1, 0)).toBeNull();
  });

  it('clips cells past the right wall', () => {
    const matrix = buildPlayfield(
      snapshot({active: {type: 3, rotation: 0, column: 8, row: 0}}),
      shapes,
    );

    matrix.forEach(row => expect(row).toHaveLength(BOARD_COLS));
    expect(cellsAt(matrix, 0, 8)).toBeNull();
    expect(cellsAt(matrix, 0, 9)).toBe('T');
    expect(cellsAt(matrix, 1, 8)).toBe('T');
    expect(cellsAt(matrix, 1, 9)).toBe('T');
  });
});
