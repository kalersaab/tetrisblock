#import <Foundation/Foundation.h>
#import <ReactCommon/RCTTurboModule.h>

#include "../../shared/NativeTetrisModule.h"

@interface NativeTetrisModuleProvider : NSObject <RCTModuleProvider>
@end

@implementation NativeTetrisModuleProvider

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeTetrisModule>(params.jsInvoker);
}

@end
