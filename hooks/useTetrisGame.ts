import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AppState} from 'react-native';
import Tetris from '../specs/NativeTetrisModule';
import type {PieceShapes, TetrisSnapshot} from '../specs/NativeTetrisModule';

const FRAME_INTERVAL_MS = 1000 / 60;

function readSnapshot(): TetrisSnapshot {
  return Tetris.getSnapshot() as unknown as TetrisSnapshot;
}

function readShapes(): PieceShapes {
  return Tetris.getPieceShapes() as unknown as PieceShapes;
}

function sameActive(a: TetrisSnapshot, b: TetrisSnapshot) {
  if (!a.active || !b.active) {
    return a.active === b.active;
  }
  return (
    a.active.type === b.active.type &&
    a.active.rotation === b.active.rotation &&
    a.active.column === b.active.column &&
    a.active.row === b.active.row
  );
}

function sameQueue(a: TetrisSnapshot, b: TetrisSnapshot) {
  if (a.next.length !== b.next.length) {
    return false;
  }
  return a.next.every((piece, index) => piece === b.next[index]);
}

function sameBoard(a: TetrisSnapshot, b: TetrisSnapshot) {
  if (a.board.length !== b.board.length) {
    return false;
  }
  return a.board.every((cell, index) => cell === b.board[index]);
}

function isSameSnapshot(a: TetrisSnapshot | null, b: TetrisSnapshot) {
  if (!a) {
    return false;
  }
  return (
    a.state === b.state &&
    a.score === b.score &&
    a.lines === b.lines &&
    a.level === b.level &&
    a.combo === b.combo &&
    a.lastLinesCleared === b.lastLinesCleared &&
    a.ghostRow === b.ghostRow &&
    a.hold === b.hold &&
    sameActive(a, b) &&
    sameQueue(a, b) &&
    sameBoard(a, b)
  );
}

export default function useTetrisGame() {
  const shapes = useMemo(readShapes, []);
  const [snapshot, setSnapshot] = useState<TetrisSnapshot | null>(null);
  const autoPaused = useRef(false);

  const sync = useCallback(() => {
    const next = readSnapshot();
    setSnapshot(previous =>
      isSameSnapshot(previous, next) ? previous : next,
    );
  }, []);

  const restart = useCallback(
    (seed: number = Date.now() % 0x100000000) => {
      autoPaused.current = false;
      Tetris.reset(seed);
      Tetris.start();
      sync();
    },
    [sync],
  );

  useEffect(() => {
    restart();

    const timer = setInterval(() => {
      Tetris.tick();
      sync();
    }, FRAME_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [restart, sync]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        if (autoPaused.current) {
          autoPaused.current = false;
          Tetris.resume();
          sync();
        }
        return;
      }
      autoPaused.current = true;
      Tetris.pause();
      sync();
    });

    return () => subscription.remove();
  }, [sync]);

  const actions = useMemo(
    () => ({
      moveLeft: () => {
        Tetris.moveLeft();
        sync();
      },
      moveRight: () => {
        Tetris.moveRight();
        sync();
      },
      softDrop: () => {
        Tetris.softDrop();
        sync();
      },
      rotateClockwise: () => {
        Tetris.rotateClockwise();
        sync();
      },
      rotateCounterClockwise: () => {
        Tetris.rotateCounterClockwise();
        sync();
      },
      hardDrop: () => {
        Tetris.hardDrop();
        sync();
      },
      hold: () => {
        Tetris.hold();
        sync();
      },
      togglePause: () => {
        Tetris.togglePause();
        sync();
      },
      restart: () => restart(),
    }),
    [restart, sync],
  );

  return {snapshot, shapes, ...actions};
}
