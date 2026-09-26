/**
 * @format
 */

const BOARD_ROWS = 20;
const BOARD_COLS = 10;

const DEFINITIONS = [
  [4, [[1, 0], [1, 1], [1, 2], [1, 3]]],
  [2, [[0, 0], [0, 1], [1, 0], [1, 1]]],
  [3, [[0, 1], [1, 0], [1, 1], [1, 2]]],
  [3, [[0, 1], [0, 2], [1, 0], [1, 1]]],
  [3, [[0, 0], [0, 1], [1, 1], [1, 2]]],
  [3, [[0, 0], [1, 0], [1, 1], [1, 2]]],
  [3, [[0, 2], [1, 0], [1, 1], [1, 2]]],
];

function rotateClockwise(grid, size) {
  const rotated = Array.from({ length: size }, () => Array(size).fill(false));
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      if (grid[row][column]) {
        rotated[column][size - 1 - row] = true;
      }
    }
  }
  return rotated;
}

function buildShapes() {
  const sizes = [0];
  const rotations = [[[], [], [], []]];

  DEFINITIONS.forEach(([size, cells]) => {
    let grid = Array.from({ length: size }, () => Array(size).fill(false));
    cells.forEach(([row, column]) => {
      grid[row][column] = true;
    });

    const pieceRotations = [grid.map(row => [...row])];
    for (let index = 1; index < 4; index++) {
      grid = rotateClockwise(grid, size);
      pieceRotations.push(grid.map(row => [...row]));
    }

    sizes.push(size);
    rotations.push(
      pieceRotations.map(rotation =>
        rotation.flatMap(row => row.map(filled => (filled ? 1 : 0))),
      ),
    );
  });

  return {sizes, rotations};
}

const shapes = buildShapes();

const state = {
  board: new Array(BOARD_ROWS * BOARD_COLS).fill(0),
  active: {type: 3, rotation: 0, column: 3, row: -1},
  hold: null,
  next: [1, 2, 3],
  state: 'running',
  score: 0,
  lines: 0,
  level: 1,
  combo: -1,
  lastLinesCleared: 0,
  fallFrames: 48,
};

const engine = {
  reset: () => {},
  start: () => {},
  pause: () => {},
  resume: () => {},
  togglePause: () => {},
  tick: () => {},
  moveLeft: () => true,
  moveRight: () => true,
  moveDown: () => true,
  rotateClockwise: () => true,
  rotateCounterClockwise: () => true,
  softDrop: () => true,
  hardDrop: () => 4,
  hold: () => true,
  getSnapshot: () => ({rows: BOARD_ROWS, cols: BOARD_COLS, ...state}),
  getPieceShapes: () => shapes,
};

jest.mock('./specs/NativeTetrisModule', () => ({
  __esModule: true,
  default: engine,
}));
