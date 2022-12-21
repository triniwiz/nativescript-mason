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

inline static int64_t getPointerValue(const facebook::jsi::Value &value, Runtime &runtime) {
    return value.asBigInt(runtime).Int64Value(runtime);
}

inline static Value dimensionToJS(Runtime &runtime, CMasonDimension dimension) {
    switch ((CMasonDimensionType) dimension.value_type) {
        case CMasonDimensionType::Auto:
            return facebook::jsi::String::createFromUtf8(runtime, "auto");
        case CMasonDimensionType::Percent: {
            auto ret = facebook::jsi::Object(runtime);
            ret.setProperty(runtime, "value", dimension.value / 100);
            ret.setProperty(runtime, "unit", "%");
            return ret;
        }
        case CMasonDimensionType::Points: {
            auto ret = facebook::jsi::Object(runtime);
            ret.setProperty(runtime, "value", dimension.value);
            ret.setProperty(runtime, "unit", "px");
            return ret;
        }
        default:
            return Value::undefined();
    }
}

inline static CMasonDimension jsToDimension(float value, int value_type) {
    switch ((CMasonDimensionType) value_type) {
        case CMasonDimensionType::Auto:
            return CMasonDimension{value, CMasonDimensionType::Auto};
        case CMasonDimensionType::Percent: {
            return CMasonDimension{value, CMasonDimensionType::Percent};
        }
        case CMasonDimensionType::Points: {
            return CMasonDimension{value, CMasonDimensionType::Points};
        }
        default:
            return CMasonDimension{value, CMasonDimensionType::Undefined};
    }
}

inline static CMasonDimensionType jsToDimensionType(int value_type) {
    switch ((CMasonDimensionType) value_type) {
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

inline static Value sizeToJS(Runtime &runtime, CMasonSize size) {
    auto ret = facebook::jsi::Object(runtime);
    ret.setProperty(runtime, "width", dimensionToJS(runtime, size.width));
    ret.setProperty(runtime, "height", dimensionToJS(runtime, size.height));
    return ret;
}


class MasonJSIModule {
public:
    static void install(facebook::jsi::Runtime &rt);
};


#endif //MASON_NATIVE_MASONJSIMODULE_H
