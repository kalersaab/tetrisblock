#pragma once

#include <AppSpecsJSI.h>

#include <memory>
#include <string>

namespace facebook::react {

class NativeTetrisModule : public NativeTetrisModuleCxxSpec<NativeTetrisModule> {
public:
  NativeTetrisModule(std::shared_ptr<CallInvoker> jsInvoker);

};

} // namespace facebook::react
