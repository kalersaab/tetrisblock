#include "NativeTetrisModule.h"

namespace facebook::react {

NativeTetrisModule::NativeTetrisModule(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeTetrisModuleCxxSpec(std::move(jsInvoker)) {}


} // namespace facebook::react