import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Board, {
  BOARD_CELL_SPACING,
  BOARD_COLS,
  BOARD_FRAME_SIZE,
  BOARD_ROWS,
  getBoardSize,
  placePiece,
  renderBoard,
} from '../components/tetris/Board';
import { CELL_SIZE } from '../components/tetris/Block';
import NextPiece from '../components/tetris/NextPiece';

const PLAYFIELD = renderBoard();
const BOARD_PREVIEW = placePiece(
  PLAYFIELD,
  [
    [false, true, false],
    [true, true, true],
    [false, false, false],
  ],
  'T',
  2,
  4,
).map(row => [...row]);

const STATS: Array<{ label: string; value: string }> = [
  { label: 'Score', value: '1280' },
  { label: 'Level', value: '3' },
  { label: 'Lines', value: '14' },
];

const SCREEN_PADDING = 20;
const TITLE_BLOCK_HEIGHT = 54;
const CONTENT_GAP = 16;
const SIDE_PANEL_MIN_WIDTH = 96;
const SIDE_PANEL_MAX_WIDTH = 136;

export default function TetrisScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const contentWidth = Math.max(1, width - SCREEN_PADDING * 2);
  const availableHeight = Math.max(
    1,
    height -
      safeAreaInsets.top -
      safeAreaInsets.bottom -
      TITLE_BLOCK_HEIGHT -
      SCREEN_PADDING,
  );
  const sidePanelWidth = Math.min(
    SIDE_PANEL_MAX_WIDTH,
    Math.max(SIDE_PANEL_MIN_WIDTH, Math.round(contentWidth * 0.28)),
  );
  const boardMaxWidth = Math.max(
    1,
    contentWidth - sidePanelWidth - CONTENT_GAP,
  );
  const maxCellSize = Math.min(
    (boardMaxWidth - BOARD_FRAME_SIZE) / BOARD_COLS - BOARD_CELL_SPACING,
    (availableHeight - BOARD_FRAME_SIZE) / BOARD_ROWS - BOARD_CELL_SPACING,
  );
  const cellSize = Math.max(1, Math.min(CELL_SIZE, Math.floor(maxCellSize)));
  const boardSize = getBoardSize(cellSize);
  const sidePanelHeight = 244 + cellSize * 4;
  const contentFits =
    Math.max(boardSize.height, sidePanelHeight) <= availableHeight;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: safeAreaInsets.top,
          paddingBottom: safeAreaInsets.bottom,
        },
      ]}
    >
      <Text style={styles.title}>TETRIS</Text>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          contentFits ? styles.centeredContent : styles.topAlignedContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.boardWrapper}>
            <Board matrix={BOARD_PREVIEW} cellSize={cellSize} />
          </View>
          <View style={[styles.sidePanel, { width: sidePanelWidth }]}>
            {STATS.map(stat => (
              <View key={stat.label} style={styles.statBox}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            ))}
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Next</Text>
              <NextPiece piece="I" cellSize={cellSize} />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
    alignItems: 'center',
  },
  title: {
    color: '#7dd3fc',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: 8,
    marginBottom: 18,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: SCREEN_PADDING,
  },
  centeredContent: {
    justifyContent: 'center',
  },
  topAlignedContent: {
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  content: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: CONTENT_GAP,
  },
  boardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidePanel: {
    alignItems: 'stretch',
    gap: 10,
  },
  statBox: {
    width: '100%',
    minHeight: 64,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
  },
});
