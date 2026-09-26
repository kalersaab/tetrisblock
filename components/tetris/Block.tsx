import { StyleSheet, View } from 'react-native';

const CELL = 32;
export const CELL_SIZE = CELL;

type Props = {
  color: string;
  size?: number;
};

export default function Block({ color, size = CELL_SIZE }: Props) {
  const highlightMargin = Math.max(1, Math.round(size * 0.09));
  const cellRadius = Math.max(3, Math.round(size * 0.18));
  const highlightRadius = Math.max(2, Math.round(highlightMargin * 0.7));

  return (
    <View
      style={[
        styles.cell,
        {
          width: size,
          height: size,
          borderRadius: cellRadius,
          backgroundColor: color,
        },
      ]}
    >
      <View
        style={[
          styles.highlight,
          {
            margin: highlightMargin,
            borderRadius: highlightRadius,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderWidth: 2,
    borderColor: 'rgba(15, 23, 42, 0.55)',
    overflow: 'hidden',
    margin: 1,
  },
  highlight: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
});
