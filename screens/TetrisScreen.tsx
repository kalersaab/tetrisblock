import {useCallback, useEffect, useMemo, useRef} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Board, {
  BOARD_CELL_SPACING,
  BOARD_COLS,
  BOARD_FRAME_SIZE,
  BOARD_ROWS,
  getBoardSize,
  renderBoard,
} from '../components/tetris/Board';
import {CELL_SIZE} from '../components/tetris/Block';
import NextPiece from '../components/tetris/NextPiece';
import {buildPlayfield, getPieceShape} from '../components/tetris/playfield';
import {toPieceType} from '../components/tetris/pieces';
import useTetrisGame from '../hooks/useTetrisGame';

const SCREEN_PADDING = 20;
const TITLE_BLOCK_HEIGHT = 54;
const CONTENT_GAP = 16;
const SIDE_PANEL_MIN_WIDTH = 96;
const SIDE_PANEL_MAX_WIDTH = 136;
const STAT_BOX_MIN_HEIGHT = 64;
const SIDE_PANEL_BOXES = 5;
const SIDE_PANEL_GAP = 10;
const CONTROL_HEIGHT = 52;
const CONTROL_ROWS = 2;
const CONTROL_GAP = 10;
const REPEAT_DELAY_MS = 180;
const REPEAT_RATE_MS = 60;

type ControlButtonProps = {
  label: string;
  onPress: () => void;
  autoRepeat?: boolean;
};

function ControlButton({
  label,
  onPress,
  autoRepeat = false,
}: ControlButtonProps) {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
    if (interval.current) {
      clearInterval(interval.current);
      interval.current = null;
    }
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(() => {
    onPress();
    if (!autoRepeat) {
      return;
    }
    timeout.current = setTimeout(() => {
      interval.current = setInterval(onPress, REPEAT_RATE_MS);
    }, REPEAT_DELAY_MS);
  }, [autoRepeat, onPress]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={autoRepeat ? undefined : onPress}
      onPressIn={autoRepeat ? start : undefined}
      onPressOut={autoRepeat ? stop : undefined}
      style={({pressed}) => [styles.control, pressed && styles.controlPressed]}
    >
      <Text style={styles.controlLabel}>{label}</Text>
    </Pressable>
  );
}

export default function TetrisScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
  const {
    snapshot,
    shapes,
    moveLeft,
    moveRight,
    softDrop,
    rotateClockwise,
    rotateCounterClockwise,
    hardDrop,
    hold,
    togglePause,
    restart,
  } = useTetrisGame();

  const contentWidth = Math.max(1, width - SCREEN_PADDING * 2);
  const controlsHeight = CONTROL_HEIGHT * CONTROL_ROWS + CONTROL_GAP;
  const availableHeight = Math.max(
    1,
    height -
      safeAreaInsets.top -
      safeAreaInsets.bottom -
      TITLE_BLOCK_HEIGHT -
      SCREEN_PADDING -
      controlsHeight,
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
  const sidePanelHeight =
    SIDE_PANEL_BOXES * STAT_BOX_MIN_HEIGHT +
    2 * (cellSize + 24) +
    (SIDE_PANEL_BOXES - 1) * SIDE_PANEL_GAP;
  const contentFits =
    Math.max(boardSize.height, sidePanelHeight) <= availableHeight;

  const matrix = useMemo(
    () => (snapshot ? buildPlayfield(snapshot, shapes) : renderBoard()),
    [snapshot, shapes],
  );

  const nextPiece = toPieceType(snapshot?.next[0] ?? null);
  const holdPiece = toPieceType(snapshot?.hold ?? null);
  const state = snapshot?.state ?? 'ready';
  const overlay =
    state === 'gameOver'
      ? {title: 'GAME OVER', hint: 'Tap to play again', action: restart}
      : state === 'paused'
        ? {title: 'PAUSED', hint: 'Tap to resume', action: togglePause}
        : null;

  const stats = [
    {label: 'Score', value: `${snapshot?.score ?? 0}`},
    {label: 'Level', value: `${snapshot?.level ?? 1}`},
    {label: 'Lines', value: `${snapshot?.lines ?? 0}`},
  ];

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
            <Board matrix={matrix} cellSize={cellSize} />
            {overlay ? (
              <Pressable
                accessibilityRole="button"
                style={styles.overlay}
                onPress={overlay.action}
              >
                <Text style={styles.overlayTitle}>{overlay.title}</Text>
                <Text style={styles.overlayHint}>{overlay.hint}</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={[styles.sidePanel, {width: sidePanelWidth}]}>
            {stats.map(stat => (
              <View key={stat.label} style={styles.statBox}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            ))}
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Hold</Text>
              {holdPiece ? (
                <NextPiece
                  piece={holdPiece}
                  shape={getPieceShape(shapes, snapshot?.hold ?? 0, 0)}
                  cellSize={cellSize}
                />
              ) : null}
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Next</Text>
              {nextPiece ? (
                <NextPiece
                  piece={nextPiece}
                  shape={getPieceShape(shapes, snapshot?.next[0] ?? 0, 0)}
                  cellSize={cellSize}
                />
              ) : null}
            </View>
          </View>
        </View>
        <View style={styles.controls}>
          <View style={styles.controlRow}>
            <ControlButton label="↺" onPress={rotateCounterClockwise} />
            <ControlButton label="←" onPress={moveLeft} autoRepeat />
            <ControlButton label="↓" onPress={softDrop} autoRepeat />
            <ControlButton label="→" onPress={moveRight} autoRepeat />
            <ControlButton label="↻" onPress={rotateClockwise} />
          </View>
          <View style={styles.controlRow}>
            <ControlButton label="HOLD" onPress={hold} />
            <ControlButton label="DROP" onPress={hardDrop} />
            <ControlButton label={state === 'paused' ? 'RESUME' : 'PAUSE'} onPress={togglePause} />
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
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 18, 32, 0.82)',
    borderRadius: 10,
  },
  overlayTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 2,
  },
  overlayHint: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sidePanel: {
    alignItems: 'stretch',
    gap: SIDE_PANEL_GAP,
  },
  statBox: {
    width: '100%',
    minHeight: STAT_BOX_MIN_HEIGHT,
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
  controls: {
    width: '100%',
    marginTop: CONTENT_GAP,
    gap: CONTROL_GAP,
  },
  controlRow: {
    flexDirection: 'row',
    gap: CONTROL_GAP,
  },
  control: {
    flex: 1,
    height: CONTROL_HEIGHT,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlPressed: {
    backgroundColor: '#334155',
  },
  controlLabel: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
