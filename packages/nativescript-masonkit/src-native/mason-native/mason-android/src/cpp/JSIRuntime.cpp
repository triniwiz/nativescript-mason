//
// Created by Osei Fortune on 14/12/2022.
//

#include "JSIRuntime.h"
#include "MasonJSIModule.h"

void setup_jsi_runtime(int64_t isolate) {
    auto rt = std::make_shared<rnv8::V8Runtime>((v8::Isolate *) isolate);
    MasonJSIModule::install(*rt);
}
