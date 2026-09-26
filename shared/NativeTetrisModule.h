#pragma once

#include <AppSpecsJSI.h>

#include <memory>

#include "tetris/tetris.h"

namespace facebook::react {

class NativeTetrisModule : public NativeTetrisModuleCxxSpec<NativeTetrisModule> {
 public:
  explicit NativeTetrisModule(std::shared_ptr<CallInvoker> jsInvoker);

  void reset(jsi::Runtime& rt, double seed);
  void start(jsi::Runtime& rt);
  void pause(jsi::Runtime& rt);
  void resume(jsi::Runtime& rt);
  void togglePause(jsi::Runtime& rt);
  void tick(jsi::Runtime& rt);

  bool moveLeft(jsi::Runtime& rt);
  bool moveRight(jsi::Runtime& rt);
  bool moveDown(jsi::Runtime& rt);
  bool rotateClockwise(jsi::Runtime& rt);
  bool rotateCounterClockwise(jsi::Runtime& rt);
  bool softDrop(jsi::Runtime& rt);
  double hardDrop(jsi::Runtime& rt);
  bool hold(jsi::Runtime& rt);

  jsi::Object getSnapshot(jsi::Runtime& rt);
  jsi::Object getPieceShapes(jsi::Runtime& rt);

 private:
  tetris::Game game_{};
};

} // namespace facebook::react
