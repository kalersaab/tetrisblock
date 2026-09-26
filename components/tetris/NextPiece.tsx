import { StyleSheet, View } from 'react-native';
import { CELL_SIZE } from './Block';
import type {PieceShape} from './playfield';
import {COLORS, type PieceType} from './pieces';

type Props = {
  piece: PieceType;
  shape: PieceShape;
  cellSize?: number;
};

export default function NextPiece({piece, shape, cellSize = CELL_SIZE}: Props) {
  const previewCellSize = Math.max(4, cellSize - 8);
  const {size, cells} = shape;

  return (
    <View style={styles.preview}>
      {Array.from({length: size}, (_row, row) => (
        <View key={row} style={styles.row}>
          {Array.from({length: size}, (_column, column) => {
            const filled = cells[row * size + column];
            return (
              <View
                key={column}
                style={[
                  styles.cell,
                  {
                    width: previewCellSize,
                    height: previewCellSize,
                    borderRadius: Math.max(
                      2,
                      Math.round(previewCellSize * 0.2),
                    ),
                    backgroundColor: filled ? COLORS[piece] : undefined,
                  },
                ]}
              />
            );
          })}
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
