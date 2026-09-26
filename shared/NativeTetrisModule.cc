#include "NativeTetrisModule.h"

#include <cstdint>
#include <string>
#include <utility>

namespace facebook::react {

namespace {

std::string toStateName(tetris::GameState state) {
  switch (state) {
    case tetris::GameState::Ready:
      return "ready";
    case tetris::GameState::Running:
      return "running";
    case tetris::GameState::Paused:
      return "paused";
    case tetris::GameState::GameOver:
      return "gameOver";
  }
  return "ready";
}

} // namespace

NativeTetrisModule::NativeTetrisModule(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeTetrisModuleCxxSpec(std::move(jsInvoker)) {}

void NativeTetrisModule::reset(jsi::Runtime&, double seed) {
  game_.reset(static_cast<std::uint32_t>(seed));
}

void NativeTetrisModule::start(jsi::Runtime&) {
  game_.start();
}

void NativeTetrisModule::pause(jsi::Runtime&) {
  game_.pause();
}

void NativeTetrisModule::resume(jsi::Runtime&) {
  game_.resume();
}

void NativeTetrisModule::togglePause(jsi::Runtime&) {
  game_.togglePause();
}

void NativeTetrisModule::tick(jsi::Runtime&) {
  game_.tick();
}

bool NativeTetrisModule::moveLeft(jsi::Runtime&) {
  return game_.moveLeft();
}

bool NativeTetrisModule::moveRight(jsi::Runtime&) {
  return game_.moveRight();
}

bool NativeTetrisModule::moveDown(jsi::Runtime&) {
  return game_.moveDown();
}

bool NativeTetrisModule::rotateClockwise(jsi::Runtime&) {
  return game_.rotateClockwise();
}

bool NativeTetrisModule::rotateCounterClockwise(jsi::Runtime&) {
  return game_.rotateCounterClockwise();
}

bool NativeTetrisModule::softDrop(jsi::Runtime&) {
  return game_.softDrop();
}

double NativeTetrisModule::hardDrop(jsi::Runtime&) {
  return static_cast<double>(game_.hardDrop());
}

bool NativeTetrisModule::hold(jsi::Runtime&) {
  return game_.hold();
}

jsi::Object NativeTetrisModule::getSnapshot(jsi::Runtime& rt) {
  jsi::Object snapshot(rt);

  snapshot.setProperty(rt, "rows", static_cast<double>(tetris::kBoardRows));
  snapshot.setProperty(rt, "cols", static_cast<double>(tetris::kBoardCols));

  jsi::Array board(rt, tetris::kBoardRows * tetris::kBoardCols);
  std::size_t index = 0;
  for (const auto& row : game_.board()) {
    for (const auto cell : row) {
      board.setValueAtIndex(rt, index++, static_cast<double>(cell));
    }
  }
  snapshot.setProperty(rt, "board", std::move(board));

  if (const auto active = game_.activePiece(); active.has_value()) {
    jsi::Object piece(rt);
    piece.setProperty(rt, "type", static_cast<double>(active->type));
    piece.setProperty(rt, "rotation", static_cast<double>(active->rotation));
    piece.setProperty(rt, "column", static_cast<double>(active->column));
    piece.setProperty(rt, "row", static_cast<double>(active->row));
    snapshot.setProperty(rt, "active", std::move(piece));
  } else {
    snapshot.setProperty(rt, "active", jsi::Value::null());
  }

  if (const auto held = game_.holdPiece(); held.has_value()) {
    snapshot.setProperty(rt, "hold", static_cast<double>(*held));
  } else {
    snapshot.setProperty(rt, "hold", jsi::Value::null());
  }

  jsi::Array next(rt, 3);
  const auto preview = game_.previewQueue(3);
  for (std::size_t i = 0; i < preview.size(); i++) {
    next.setValueAtIndex(rt, i, static_cast<double>(preview[i]));
  }
  snapshot.setProperty(rt, "next", std::move(next));

  snapshot.setProperty(rt, "ghostRow", static_cast<double>(game_.ghostRow()));
  snapshot.setProperty(rt, "state", toStateName(game_.state()));
  snapshot.setProperty(rt, "score", static_cast<double>(game_.score()));
  snapshot.setProperty(rt, "lines", static_cast<double>(game_.lines()));
  snapshot.setProperty(rt, "level", static_cast<double>(game_.level()));
  snapshot.setProperty(rt, "combo", static_cast<double>(game_.combo()));
  snapshot.setProperty(
      rt, "lastLinesCleared", static_cast<double>(game_.lastLinesCleared()));
  snapshot.setProperty(rt, "fallFrames", static_cast<double>(game_.fallFrames()));

  return snapshot;
}

jsi::Object NativeTetrisModule::getPieceShapes(jsi::Runtime& rt) {
  jsi::Object result(rt);
  jsi::Array sizes(rt, tetris::kPieceCount + 1);
  jsi::Array rotations(rt, tetris::kPieceCount + 1);

  for (int index = 0; index <= tetris::kPieceCount; ++index) {
    const auto type = static_cast<tetris::PieceType>(index);
    const auto& geometry = tetris::pieceGeometry(type);
    const int size = index == 0 ? 0 : geometry.size;
    const auto sizeIndex = static_cast<std::size_t>(index);

    sizes.setValueAtIndex(rt, sizeIndex, static_cast<double>(size));

    jsi::Array pieceRotations(rt, tetris::kRotationCount);
    for (int rotation = 0; rotation < tetris::kRotationCount; ++rotation) {
      const auto& grid =
          geometry.rotations[static_cast<std::size_t>(rotation)];
      jsi::Array cells(rt, static_cast<std::size_t>(size * size));
      std::size_t cell = 0;
      for (int row = 0; row < size; ++row) {
        for (int column = 0; column < size; ++column) {
          const bool filled =
              grid[static_cast<std::size_t>(row)][static_cast<std::size_t>(column)];
          cells.setValueAtIndex(rt, cell++, filled ? 1 : 0);
        }
      }
      pieceRotations.setValueAtIndex(
          rt, static_cast<std::size_t>(rotation), std::move(cells));
    }
    rotations.setValueAtIndex(rt, sizeIndex, std::move(pieceRotations));
  }

  result.setProperty(rt, "sizes", std::move(sizes));
  result.setProperty(rt, "rotations", std::move(rotations));
  return result;
}

} // namespace facebook::react
