import { StyleSheet, View } from 'react-native';
import Block, { CELL_SIZE } from './Block';
import { COLORS, PieceType } from './pieces';

export const BOARD_COLS = 10;
export const BOARD_ROWS = 20;
export const BOARD_CELL_SPACING = 2;
export const BOARD_FRAME_SIZE = 10;

export type Cell = PieceType | null;

export type BoardMatrix = Cell[][];

type Props = {
  matrix: BoardMatrix;
  cellSize?: number;
};

export function getBoardSize(cellSize: number = CELL_SIZE) {
  return {
    width: BOARD_COLS * (cellSize + BOARD_CELL_SPACING) + BOARD_FRAME_SIZE,
    height: BOARD_ROWS * (cellSize + BOARD_CELL_SPACING) + BOARD_FRAME_SIZE,
  };
}

export default function Board({ matrix, cellSize = CELL_SIZE }: Props) {
  const boardSize = getBoardSize(cellSize);

  return (
    <View style={[styles.board, boardSize]}>
      {matrix.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell, colIndex) => (
            <Block
              key={colIndex}
              color={cell ? COLORS[cell] : 'transparent'}
              size={cellSize}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export function renderBoard(
  rows: number = BOARD_ROWS,
  cols: number = BOARD_COLS,
): BoardMatrix {
  return Array.from({ length: rows }, () => Array<Cell>(cols).fill(null));
}

export function placePiece(
  matrix: BoardMatrix,
  shape: boolean[][],
  piece: PieceType,
  originRow: number,
  originCol: number,
): BoardMatrix {
  const next = matrix.map(row => [...row]);
  shape.forEach((row, r) =>
    row.forEach((filled, c) => {
      if (filled) {
        next[originRow + r][originCol + c] = piece;
      }
    }),
  );
  return next;
}

const styles = StyleSheet.create({
  board: {
    backgroundColor: '#0f172a',
    borderWidth: 3,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  row: {
    flexDirection: 'row',
  },
});
