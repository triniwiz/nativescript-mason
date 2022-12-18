//
// Created by Osei Fortune on 14/12/2022.
//

#ifndef MASON_NATIVE_MASONJSIMODULE_H
#define MASON_NATIVE_MASONJSIMODULE_H

#import "mason-android/src/lib.rs.h"
#import "v8runtime/V8Runtime.h"

using namespace facebook::jsi;
using namespace std;


template<typename NativeFunc>
static void createFunc(Runtime &jsiRuntime, const char *prop, int paramCount, NativeFunc &&func) {
    auto f = Function::createFromHostFunction(jsiRuntime,
                                              PropNameID::forAscii(jsiRuntime, prop),
                                              paramCount,
                                              std::forward<NativeFunc>(func));
    jsiRuntime.global().setProperty(jsiRuntime, prop, std::move(f));
}

#define CREATE_FUNC(prop, paramCount, func) \
    createFunc(jsiRuntime, prop, paramCount, func)

inline static Value dimensionToJS(Runtime &runtime,CMasonDimension dimension){
    switch ((CMasonDimensionType)dimension.value_type) {
        case CMasonDimensionType::Auto:
            return facebook::jsi::String::createFromUtf8(runtime, "auto");
        case CMasonDimensionType::Percent: {
            auto ret = std::to_string(dimension.value) + "%";
            return facebook::jsi::String::createFromUtf8(runtime, ret.c_str());
        }
        case CMasonDimensionType::Points: {
            auto ret = std::to_string(dimension.value) + "px";
            return facebook::jsi::String::createFromUtf8(runtime, ret.c_str());
        }
        default:
            return Value::undefined();
    }
}

inline static CMasonDimension jsToDimension(float value, int value_type){
    switch ((CMasonDimensionType)value_type) {
        case CMasonDimensionType::Auto:
            return CMasonDimension {value, CMasonDimensionType::Auto};
        case CMasonDimensionType::Percent: {
            return CMasonDimension {value, CMasonDimensionType::Percent};
        }
        case CMasonDimensionType::Points: {
            return CMasonDimension {value, CMasonDimensionType::Points};
        }
        default:
            return CMasonDimension {value, CMasonDimensionType::Undefined};
    }
}

inline static CMasonDimensionType jsToDimensionType(int value_type){
    switch ((CMasonDimensionType)value_type) {
        case CMasonDimensionType::Auto:
            return CMasonDimensionType::Auto;
        case CMasonDimensionType::Percent: {
            return CMasonDimensionType::Percent;
        }
        case CMasonDimensionType::Points: {
            return CMasonDimensionType::Points;
        }
        default:
            return CMasonDimensionType::Undefined;
    }
}

class MasonJSIModule {
public:
    static void install(facebook::jsi::Runtime &rt);
};


#endif //MASON_NATIVE_MASONJSIMODULE_H
