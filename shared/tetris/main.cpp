#include "tetris.h"

#include <array>
#include <iostream>
#include <string>

namespace {

int failures = 0;

bool check(bool condition, const std::string& message) {
  if (!condition) {
    std::cerr << "check failed: " << message << '\n';
    ++failures;
  }
  return condition;
}

tetris::Board withActivePiece(const tetris::Game& game) {
  tetris::Board board = game.board();
  const auto piece = game.activePiece();
  if (!piece.has_value()) {
    return board;
  }

  const tetris::PieceGeometry& geometry = tetris::pieceGeometry(piece->type);
  for (int row = 0; row < geometry.size; ++row) {
    for (int col = 0; col < geometry.size; ++col) {
      if (!geometry.rotations[static_cast<std::size_t>(piece->rotation)]
                              [static_cast<std::size_t>(row)]
                              [static_cast<std::size_t>(col)]) {
        continue;
      }
      const int boardRow = piece->row + row;
      const int boardCol = piece->column + col;
      if (boardRow < 0 || boardRow >= tetris::kBoardRows || boardCol < 0 ||
          boardCol >= tetris::kBoardCols) {
        continue;
      }
      board[static_cast<std::size_t>(boardRow)]
          [static_cast<std::size_t>(boardCol)] = piece->type;
    }
  }
  return board;
}

void testBoardHelpers() {
  tetris::Board board = tetris::createEmptyBoard();
  check(
      tetris::filledCellCount(board) == 0,
      "a new board has no filled cells");

  for (int col = 0; col < tetris::kBoardCols - 1; ++col) {
    board[static_cast<std::size_t>(tetris::kBoardRows - 1)]
         [static_cast<std::size_t>(col)] = tetris::PieceType::I;
  }
  check(tetris::clearFullRows(board) == 0, "a partial row is kept");
  check(
      tetris::filledCellCount(board) == tetris::kBoardCols - 1,
      "a partial row keeps its cells");

  board[static_cast<std::size_t>(tetris::kBoardRows - 1)]
       [static_cast<std::size_t>(tetris::kBoardCols - 1)] =
      tetris::PieceType::I;
  check(tetris::clearFullRows(board) == 1, "a full row is cleared");
  check(
      tetris::filledCellCount(board) == 0,
      "the board is empty after the last row is cleared");
}

void testSpawnAndBag() {
  tetris::Game game(20240607);
  check(game.state() == tetris::GameState::Ready, "the game starts ready");
  check(game.activePiece().has_value(), "the game spawns an active piece");
  check(
      game.nextPiece() != tetris::PieceType::Empty,
      "the game queues a next piece");
  check(
      tetris::filledCellCount(game.board()) == 0,
      "the board is empty when the game starts");

  const auto queue = game.previewQueue(tetris::kPieceCount - 2);
  check(
      !queue.empty() && queue.front() == game.nextPiece(),
      "the preview queue starts with the next piece");
  std::array<bool, 8> seen{};
  for (auto type : queue) {
    seen[static_cast<std::size_t>(type)] = true;
  }
  int distinct = 0;
  for (bool found : seen) {
    distinct += found ? 1 : 0;
  }
  check(
      queue.size() == static_cast<std::size_t>(tetris::kPieceCount - 2) &&
          distinct == tetris::kPieceCount - 2,
      "the bag does not repeat pieces before it is refilled");
}

void testMovementAndLocking() {
  tetris::Game game(7);
  game.start();
  check(game.isRunning(), "the game runs after start");

  const int startColumn = game.activePiece()->column;
  check(game.moveLeft(), "the piece moves left");
  check(
      game.activePiece()->column == startColumn - 1,
      "the piece column changes when moving left");
  check(game.moveRight(), "the piece moves right");
  check(
      game.activePiece()->column == startColumn,
      "the piece column changes when moving right");

  const int rotation = game.activePiece()->rotation;
  check(game.rotateClockwise(), "the piece rotates clockwise");
  check(
      game.activePiece()->rotation == (rotation + 1) % tetris::kRotationCount,
      "the rotation advances by one step");
  check(
      game.rotateCounterClockwise(), "the piece rotates counter clockwise");
  check(
      game.activePiece()->rotation == rotation,
      "the rotation returns to its previous step");

  for (int index = 0; index < 5; ++index) {
    game.moveLeft();
  }
  check(
      game.activePiece()->column == 0,
      "the piece stops at the left wall");

  const int ghost = game.ghostRow();
  check(ghost > game.activePiece()->row, "the ghost sits below the piece");
  check(ghost < tetris::kBoardRows, "the ghost stays on the board");

  const int scoreBefore = game.score();
  const int dropped = game.hardDrop();
  check(dropped > 0, "a hard drop moves the piece down");
  check(
      tetris::filledCellCount(game.board()) == 4,
      "a locked tetromino fills four cells");
  check(game.score() > scoreBefore, "a hard drop awards points");
  check(
      game.lastLinesCleared() == 0,
      "a drop into an empty board clears no lines");
  check(
      game.activePiece().has_value(),
      "a new piece spawns after locking");
}

void testSoftDropAndGravity() {
  tetris::Game game(11);
  game.start();
  const int startRow = game.activePiece()->row;
  check(game.softDrop(), "a soft drop moves the piece down");
  check(
      game.activePiece()->row == startRow + 1,
      "a soft drop moves exactly one row");

  for (int index = 0; index < 10; ++index) {
    game.moveLeft();
    game.moveRight();
  }
  check(
      game.activePiece()->row == startRow + 1,
      "moving sideways does not affect gravity");

  const int frames = game.fallFrames();
  for (int index = 0; index < frames; ++index) {
    game.tick();
  }
  check(
      game.activePiece()->row == startRow + 2,
      "gravity moves the piece after one fall interval");
}

void testPause() {
  tetris::Game game(3);
  game.start();
  game.pause();
  check(game.state() == tetris::GameState::Paused, "the game pauses");
  const int row = game.activePiece()->row;
  for (int index = 0; index < 120; ++index) {
    game.tick();
  }
  check(game.activePiece()->row == row, "gravity is frozen while paused");
  game.togglePause();
  check(game.isRunning(), "the game resumes");
}

void testHold() {
  tetris::Game game(99);
  game.start();
  const auto first = game.activePiece()->type;
  check(game.hold(), "holding succeeds");
  check(
      game.holdPiece() == first,
      "holding stores the active piece");

  const auto second = game.activePiece()->type;
  check(game.hold(), "holding twice succeeds");
  check(
      game.activePiece()->type == first,
      "holding twice swaps the stored piece back in");
  check(game.holdPiece() == second, "holding twice stores the swapped piece");
}

void testGameOver() {
  tetris::Game game(31337);
  game.start();
  for (int index = 0; index < 250 && !game.isOver(); ++index) {
    game.hardDrop();
  }
  check(game.isOver(), "stacking pieces ends the game");
  check(
      !game.moveLeft() && !game.hardDrop(),
      "input is ignored after the game is over");
}

void printDemo() {
  tetris::Game game(4242);
  game.start();
  game.rotateClockwise();
  game.moveLeft();
  game.moveLeft();
  for (int index = 0; index < 6; ++index) {
    game.tick();
  }
  game.hardDrop();
  game.moveRight();
  game.softDrop();
  for (int index = 0; index < 3; ++index) {
    game.tick();
  }

  std::cout << tetris::toAsciiArt(withActivePiece(game));
  std::cout << "state " << static_cast<int>(game.state()) << '\n';
  std::cout << "score " << game.score() << " lines " << game.lines()
            << " level " << game.level() << '\n';
  std::cout << "ghost row " << game.ghostRow() << " fall frames "
            << game.fallFrames() << '\n';
}

}

int main() {
  testBoardHelpers();
  testSpawnAndBag();
  testMovementAndLocking();
  testSoftDropAndGravity();
  testPause();
  testHold();
  testGameOver();
  printDemo();

  if (failures > 0) {
    std::cerr << failures << " check(s) failed\n";
    return 1;
  }
  std::cout << "all checks passed\n";
  return 0;
}
