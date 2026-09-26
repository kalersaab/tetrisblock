#include "tetris.h"

#include <algorithm>

namespace tetris {
namespace {

struct Block {
  int row;
  int col;
};

struct Definition {
  int size;
  std::array<Block, 4> cells;
};

constexpr std::array<std::array<int, 2>, 8> kRotationKicks = {{
    {0, 0},
    {-1, 0},
    {1, 0},
    {-2, 0},
    {2, 0},
    {0, -1},
    {-1, -1},
    {1, -1},
}};

constexpr std::array<int, 5> kLineScores = {0, 100, 300, 500, 800};
constexpr int kComboBonus = 50;
constexpr int kSoftDropScore = 1;
constexpr int kHardDropScore = 2;
constexpr int kBaseFallFrames = 48;
constexpr int kFallFramesDecay = 4;
constexpr int kMinFallFrames = 2;

PieceGrid rotateClockwise(const PieceGrid& grid, int size) {
  PieceGrid rotated{};
  const std::size_t extent = static_cast<std::size_t>(size);
  for (std::size_t row = 0; row < extent; ++row) {
    for (std::size_t col = 0; col < extent; ++col) {
      if (grid[row][col]) {
        rotated[col][extent - 1 - row] = true;
      }
    }
  }
  return rotated;
}

std::array<PieceGrid, kRotationCount> buildRotations(const Definition& def) {
  PieceGrid grid{};
  for (const auto& cell : def.cells) {
    const std::size_t row = static_cast<std::size_t>(cell.row);
    const std::size_t col = static_cast<std::size_t>(cell.col);
    grid[row][col] = true;
  }

  std::array<PieceGrid, kRotationCount> rotations{};
  rotations[0] = grid;
  for (int index = 1; index < kRotationCount; ++index) {
    grid = rotateClockwise(grid, def.size);
    rotations[static_cast<std::size_t>(index)] = grid;
  }
  return rotations;
}

std::array<PieceGeometry, kPieceCount> buildGeometries() {
  const std::array<Definition, kPieceCount> definitions = {{
      {4, {{{1, 0}, {1, 1}, {1, 2}, {1, 3}}}},
      {2, {{{0, 0}, {0, 1}, {1, 0}, {1, 1}}}},
      {3, {{{0, 1}, {1, 0}, {1, 1}, {1, 2}}}},
      {3, {{{0, 1}, {0, 2}, {1, 0}, {1, 1}}}},
      {3, {{{0, 0}, {0, 1}, {1, 1}, {1, 2}}}},
      {3, {{{0, 0}, {1, 0}, {1, 1}, {1, 2}}}},
      {3, {{{0, 2}, {1, 0}, {1, 1}, {1, 2}}}},
  }};

  std::array<PieceGeometry, kPieceCount> geometries{};
  for (std::size_t index = 0; index < kPieceCount; ++index) {
    geometries[index].size = definitions[index].size;
    geometries[index].rotations = buildRotations(definitions[index]);
  }
  return geometries;
}

const std::array<PieceGeometry, kPieceCount>& geometries() {
  static const std::array<PieceGeometry, kPieceCount> table =
      buildGeometries();
  return table;
}

std::size_t geometryIndex(PieceType type) {
  const std::size_t value = static_cast<std::size_t>(type);
  if (value == 0 || value > static_cast<std::size_t>(kPieceCount)) {
    return 0;
  }
  return value - 1;
}

const PieceGrid& gridFor(PieceType type, int rotation) {
  const int normalized = ((rotation % kRotationCount) + kRotationCount) %
      kRotationCount;
  return geometries()[geometryIndex(type)]
      .rotations[static_cast<std::size_t>(normalized)];
}

int geometrySize(PieceType type) {
  return geometries()[geometryIndex(type)].size;
}

bool rowHasBlock(const PieceGrid& grid, int row, int size) {
  const std::size_t index = static_cast<std::size_t>(row);
  for (std::size_t col = 0; col < static_cast<std::size_t>(size); ++col) {
    if (grid[index][col]) {
      return true;
    }
  }
  return false;
}

void fillBag(std::vector<PieceType>& bag, std::mt19937& rng) {
  bag.clear();
  bag.reserve(kPieceCount);
  const std::size_t first = static_cast<std::size_t>(PieceType::I);
  for (std::size_t index = 0; index < static_cast<std::size_t>(kPieceCount);
       ++index) {
    bag.push_back(static_cast<PieceType>(first + index));
  }
  std::shuffle(bag.begin(), bag.end(), rng);
}

PieceType drawFromBag(std::vector<PieceType>& bag, std::mt19937& rng) {
  if (bag.empty()) {
    fillBag(bag, rng);
  }
  const PieceType type = bag.back();
  bag.pop_back();
  return type;
}

bool isFull(const Row& row) {
  return std::all_of(row.begin(), row.end(), [](PieceType cell) {
    return cell != PieceType::Empty;
  });
}

char symbolFor(PieceType type) {
  switch (type) {
    case PieceType::I:
      return 'I';
    case PieceType::O:
      return 'O';
    case PieceType::T:
      return 'T';
    case PieceType::S:
      return 'S';
    case PieceType::Z:
      return 'Z';
    case PieceType::J:
      return 'J';
    case PieceType::L:
      return 'L';
    case PieceType::Empty:
      break;
  }
  return '.';
}

}

Board createEmptyBoard() {
  Board board{};
  for (auto& row : board) {
    row.fill(PieceType::Empty);
  }
  return board;
}

const PieceGeometry& pieceGeometry(PieceType type) {
  return geometries()[geometryIndex(type)];
}

int filledCellCount(const Board& board) {
  int count = 0;
  for (const auto& row : board) {
    for (auto cell : row) {
      if (cell != PieceType::Empty) {
        ++count;
      }
    }
  }
  return count;
}

int clearFullRows(Board& board) {
  int cleared = 0;
  for (const auto& row : board) {
    if (isFull(row)) {
      ++cleared;
    }
  }
  if (cleared == 0) {
    return 0;
  }

  Board next{};
  std::size_t write = static_cast<std::size_t>(kBoardRows);
  for (std::size_t row = static_cast<std::size_t>(kBoardRows); row-- > 0;) {
    if (isFull(board[row])) {
      continue;
    }
    next[--write] = board[row];
  }
  board = next;
  return cleared;
}

std::string toAsciiArt(const Board& board) {
  std::string art;
  art.reserve(static_cast<std::size_t>(kBoardRows * (kBoardCols + 1)));
  for (const auto& row : board) {
    for (auto cell : row) {
      art.push_back(symbolFor(cell));
    }
    art.push_back('\n');
  }
  return art;
}

Game::Game(std::uint32_t seed) {
  reset(seed);
}

void Game::reset(std::uint32_t seed) {
  rng_.seed(seed);
  bag_.clear();
  board_ = createEmptyBoard();
  active_.reset();
  hold_.reset();
  next_ = PieceType::Empty;
  state_ = GameState::Ready;
  fallCounter_ = 0;
  score_ = 0;
  lines_ = 0;
  level_ = 1;
  combo_ = -1;
  lastLinesCleared_ = 0;

  next_ = drawPiece();
  spawn(drawPiece());
}

void Game::start() {
  if (state_ == GameState::Ready || state_ == GameState::Paused) {
    state_ = GameState::Running;
  }
}

void Game::pause() {
  if (state_ == GameState::Running) {
    state_ = GameState::Paused;
  }
}

void Game::resume() {
  if (state_ == GameState::Paused) {
    state_ = GameState::Running;
  }
}

void Game::togglePause() {
  if (state_ == GameState::Running) {
    pause();
  } else {
    resume();
  }
}

void Game::tick() {
  if (state_ != GameState::Running || !active_.has_value()) {
    return;
  }
  if (fallCounter_ + 1 < fallFrames()) {
    ++fallCounter_;
    return;
  }
  fallCounter_ = 0;
  if (!moveDown()) {
    lockPiece();
  }
}

bool Game::moveLeft() {
  if (state_ != GameState::Running || !active_.has_value()) {
    return false;
  }
  return tryMove(-1, 0);
}

bool Game::moveRight() {
  if (state_ != GameState::Running || !active_.has_value()) {
    return false;
  }
  return tryMove(1, 0);
}

bool Game::moveDown() {
  if (state_ != GameState::Running || !active_.has_value()) {
    return false;
  }
  return tryMove(0, 1);
}

bool Game::rotateClockwise() {
  if (state_ != GameState::Running || !active_.has_value()) {
    return false;
  }
  return tryRotate(1);
}

bool Game::rotateCounterClockwise() {
  if (state_ != GameState::Running || !active_.has_value()) {
    return false;
  }
  return tryRotate(-1);
}

bool Game::softDrop() {
  if (!moveDown()) {
    return false;
  }
  fallCounter_ = 0;
  score_ += kSoftDropScore;
  return true;
}

int Game::hardDrop() {
  if (state_ != GameState::Running || !active_.has_value()) {
    return 0;
  }
  int dropped = 0;
  while (moveDown()) {
    ++dropped;
  }
  score_ += dropped * kHardDropScore;
  lockPiece();
  return dropped;
}

bool Game::hold() {
  if (state_ != GameState::Running || !active_.has_value()) {
    return false;
  }

  const PieceType current = active_->type;
  if (hold_.has_value()) {
    const PieceType swapped = *hold_;
    hold_ = current;
    spawn(swapped);
  } else {
    hold_ = current;
    spawn(next_);
  }
  if (state_ == GameState::GameOver) {
    return false;
  }
  next_ = drawPiece();
  fallCounter_ = 0;
  return true;
}

std::vector<PieceType> Game::previewQueue(std::size_t count) const {
  std::vector<PieceType> queue;
  if (count == 0) {
    return queue;
  }

  queue.reserve(count);
  queue.push_back(next_);
  std::vector<PieceType> bag = bag_;
  std::mt19937 rng = rng_;
  for (std::size_t index = 1; index < count; ++index) {
    queue.push_back(drawFromBag(bag, rng));
  }
  return queue;
}

int Game::ghostRow() const {
  if (!active_.has_value()) {
    return -1;
  }
  int row = active_->row;
  while (canPlace(
      active_->type, active_->rotation, active_->column, row + 1)) {
    ++row;
  }
  return row;
}

int Game::fallFrames() const {
  return std::max(
      kMinFallFrames, kBaseFallFrames - (level_ - 1) * kFallFramesDecay);
}

bool Game::canPlace(
    PieceType type,
    int rotation,
    int column,
    int row) const {
  const PieceGrid& grid = gridFor(type, rotation);
  const std::size_t extent = static_cast<std::size_t>(geometrySize(type));
  for (std::size_t localRow = 0; localRow < extent; ++localRow) {
    for (std::size_t localCol = 0; localCol < extent; ++localCol) {
      if (!grid[localRow][localCol]) {
        continue;
      }
      const int boardRow = row + static_cast<int>(localRow);
      const int boardCol = column + static_cast<int>(localCol);
      if (boardCol < 0 || boardCol >= kBoardCols) {
        return false;
      }
      if (boardRow >= kBoardRows) {
        return false;
      }
      if (boardRow < 0) {
        continue;
      }
      const std::size_t indexRow = static_cast<std::size_t>(boardRow);
      const std::size_t indexCol = static_cast<std::size_t>(boardCol);
      if (board_[indexRow][indexCol] != PieceType::Empty) {
        return false;
      }
    }
  }
  return true;
}

bool Game::tryMove(int dColumn, int dRow) {
  if (!active_.has_value()) {
    return false;
  }
  const int column = active_->column + dColumn;
  const int row = active_->row + dRow;
  if (!canPlace(active_->type, active_->rotation, column, row)) {
    return false;
  }
  active_->column = column;
  active_->row = row;
  return true;
}

bool Game::tryRotate(int direction) {
  if (!active_.has_value()) {
    return false;
  }
  const int rotation = (active_->rotation + direction + kRotationCount) %
      kRotationCount;
  for (const auto& kick : kRotationKicks) {
    const int column = active_->column + kick[0];
    const int row = active_->row + kick[1];
    if (canPlace(active_->type, rotation, column, row)) {
      active_->rotation = rotation;
      active_->column = column;
      active_->row = row;
      return true;
    }
  }
  return false;
}

void Game::spawn(PieceType type) {
  const int size = geometrySize(type);
  const PieceGrid& grid = gridFor(type, 0);
  int top = 0;
  while (top < size && !rowHasBlock(grid, top, size)) {
    ++top;
  }

  ActivePiece piece;
  piece.type = type;
  piece.rotation = 0;
  piece.column = (kBoardCols - size) / 2;
  piece.row = -top;
  active_ = piece;
  fallCounter_ = 0;

  if (!canPlace(type, piece.rotation, piece.column, piece.row)) {
    state_ = GameState::GameOver;
  }
}

void Game::lockPiece() {
  if (!active_.has_value()) {
    return;
  }

  const PieceType type = active_->type;
  const PieceGrid& grid = gridFor(type, active_->rotation);
  const std::size_t extent = static_cast<std::size_t>(geometrySize(type));
  bool overflow = false;

  for (std::size_t localRow = 0; localRow < extent; ++localRow) {
    for (std::size_t localCol = 0; localCol < extent; ++localCol) {
      if (!grid[localRow][localCol]) {
        continue;
      }
      const int boardRow = active_->row + static_cast<int>(localRow);
      const int boardCol = active_->column + static_cast<int>(localCol);
      if (boardRow < 0 || boardRow >= kBoardRows || boardCol < 0 ||
          boardCol >= kBoardCols) {
        overflow = true;
        continue;
      }
      const std::size_t indexRow = static_cast<std::size_t>(boardRow);
      const std::size_t indexCol = static_cast<std::size_t>(boardCol);
      board_[indexRow][indexCol] = type;
    }
  }

  lastLinesCleared_ = clearFullRows(board_);
  fallCounter_ = 0;

  if (lastLinesCleared_ > 0) {
    score_ += kLineScores[static_cast<std::size_t>(lastLinesCleared_)] *
        level_;
    combo_ += 1;
    score_ += combo_ * kComboBonus * level_;
    lines_ += lastLinesCleared_;
    level_ = lines_ / kLinesPerLevel + 1;
  } else {
    combo_ = -1;
  }

  if (overflow) {
    state_ = GameState::GameOver;
    return;
  }

  const PieceType upcoming = next_;
  next_ = drawPiece();
  active_.reset();
  spawn(upcoming);
}

PieceType Game::drawPiece() {
  return drawFromBag(bag_, rng_);
}

}
