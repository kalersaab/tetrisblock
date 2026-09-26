#pragma once

#include <array>
#include <cstddef>
#include <cstdint>
#include <optional>
#include <random>
#include <string>
#include <vector>

namespace tetris {

inline constexpr int kBoardCols = 10;
inline constexpr int kBoardRows = 20;
inline constexpr int kPieceCount = 7;
inline constexpr int kRotationCount = 4;
inline constexpr int kLinesPerLevel = 10;
inline constexpr std::uint32_t kDefaultSeed = 0x5eed1234u;

enum class PieceType : std::uint8_t {
  Empty = 0,
  I,
  O,
  T,
  S,
  Z,
  J,
  L,
};

enum class GameState : std::uint8_t {
  Ready,
  Running,
  Paused,
  GameOver,
};

using Row = std::array<PieceType, kBoardCols>;
using Board = std::array<Row, kBoardRows>;
using PieceGrid = std::array<std::array<bool, 4>, 4>;

struct PieceGeometry {
  int size{0};
  std::array<PieceGrid, kRotationCount> rotations{};
};

struct ActivePiece {
  PieceType type{PieceType::Empty};
  int rotation{0};
  int column{0};
  int row{0};
};

Board createEmptyBoard();
const PieceGeometry& pieceGeometry(PieceType type);
int filledCellCount(const Board& board);
int clearFullRows(Board& board);
std::string toAsciiArt(const Board& board);

class Game {
 public:
  explicit Game(std::uint32_t seed = kDefaultSeed);

  void reset(std::uint32_t seed);
  void start();
  void pause();
  void resume();
  void togglePause();
  void tick();

  bool moveLeft();
  bool moveRight();
  bool moveDown();
  bool rotateClockwise();
  bool rotateCounterClockwise();
  bool softDrop();
  int hardDrop();
  bool hold();

  const Board& board() const { return board_; }
  std::optional<ActivePiece> activePiece() const { return active_; }
  std::optional<PieceType> holdPiece() const { return hold_; }
  PieceType nextPiece() const { return next_; }
  std::vector<PieceType> previewQueue(std::size_t count) const;
  int ghostRow() const;

  GameState state() const { return state_; }
  bool isRunning() const { return state_ == GameState::Running; }
  bool isOver() const { return state_ == GameState::GameOver; }
  int score() const { return score_; }
  int lines() const { return lines_; }
  int level() const { return level_; }
  int combo() const { return combo_; }
  int lastLinesCleared() const { return lastLinesCleared_; }
  int fallFrames() const;

 private:
  bool canPlace(PieceType type, int rotation, int column, int row) const;
  bool tryMove(int dColumn, int dRow);
  bool tryRotate(int direction);
  void spawn(PieceType type);
  void lockPiece();
  PieceType drawPiece();

  Board board_{};
  std::optional<ActivePiece> active_{};
  std::optional<PieceType> hold_{};
  PieceType next_{PieceType::Empty};
  GameState state_{GameState::Ready};
  std::mt19937 rng_{0};
  std::vector<PieceType> bag_{};
  int fallCounter_{0};
  int score_{0};
  int lines_{0};
  int level_{1};
  int combo_{-1};
  int lastLinesCleared_{0};
};

} // namespace tetris
