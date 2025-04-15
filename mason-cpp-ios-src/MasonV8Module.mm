#import "MasonV8Module.h"
#import <NativeScript/runtime/Runtime.h>
#import "MasonV8JSIModule.h"

@implementation MasonV8Module

- (void )install {
    v8::Isolate* isolate = tns::Runtime::GetCurrentRuntime()->GetIsolate();
    MasonV8JSIModule::install(isolate);
}

@end
