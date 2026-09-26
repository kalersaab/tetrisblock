import { StyleSheet, View } from 'react-native';
import { CELL_SIZE } from './Block';
import { COLORS, PieceType } from './pieces';

export const SHAPES: Record<PieceType, boolean[][]> = {
  I: [
    [false, false, false, false],
    [true, true, true, true],
    [false, false, false, false],
    [false, false, false, false],
  ],
  O: [
    [true, true],
    [true, true],
  ],
  T: [
    [false, true, false],
    [true, true, true],
    [false, false, false],
  ],
  S: [
    [false, true, true],
    [true, true, false],
    [false, false, false],
  ],
  Z: [
    [true, true, false],
    [false, true, true],
    [false, false, false],
  ],
  J: [
    [true, false, false],
    [true, true, true],
    [false, false, false],
  ],
  L: [
    [false, false, true],
    [true, true, true],
    [false, false, false],
  ],
};

type Props = {
  piece: PieceType;
  cellSize?: number;
};

export default function NextPiece({ piece, cellSize = CELL_SIZE }: Props) {
  const shape = SHAPES[piece];
  const previewCellSize = Math.max(4, cellSize - 8);

  return (
    <View style={styles.preview}>
      {shape.map((row, r) => (
        <View key={r} style={styles.row}>
          {row.map((filled, c) =>
            filled ? (
              <View
                key={c}
                style={[
                  styles.cell,
                  {
                    width: previewCellSize,
                    height: previewCellSize,
                    borderRadius: Math.max(
                      2,
                      Math.round(previewCellSize * 0.2),
                    ),
                    backgroundColor: COLORS[piece],
                  },
                ]}
              />
            ) : (
              <View
                key={c}
                style={[
                  styles.cell,
                  { width: previewCellSize, height: previewCellSize },
                ]}
              />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    margin: 2,
    borderRadius: 5,
  },
});
