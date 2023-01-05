#import "Foundation/Foundation.h"
#import "NativeScript/JSIRuntime.h"
#import "include/mason_native.h"

using namespace facebook::jsi;
using namespace std;


inline static Value gridPlacementToJS(Runtime &runtime, CMasonGridPlacement placement) {
    switch (placement.value_type) {
        case CMasonGridPlacementType::MasonGridPlacementTypeAuto: {
            auto ret = facebook::jsi::Object(runtime);
            ret.setProperty(runtime, "value", (int) placement.value);
            ret.setProperty(runtime, "type", 0);
            return ret;
        }
        case CMasonGridPlacementType::MasonGridPlacementTypeLine: {
            auto ret = facebook::jsi::Object(runtime);
            ret.setProperty(runtime, "value", (int) placement.value);
            ret.setProperty(runtime, "type", 1);
            return ret;
        }
        case CMasonGridPlacementType::MasonGridPlacementTypeSpan: {
            auto ret = facebook::jsi::Object(runtime);
            ret.setProperty(runtime, "value", (int) placement.value);
            ret.setProperty(runtime, "type", 2);
            return ret;
        }
        default:
            return Value::undefined();
    }
}

inline static CMasonGridPlacement jsToGridPlacement(short value, int value_type) {
    switch ((CMasonGridPlacementType) value_type) {
        case CMasonGridPlacementType::MasonGridPlacementTypeAuto: {
            return CMasonGridPlacement{0, CMasonGridPlacementType::MasonGridPlacementTypeAuto};
        }
        case CMasonGridPlacementType::MasonGridPlacementTypeLine: {
            return CMasonGridPlacement{value, CMasonGridPlacementType::MasonGridPlacementTypeLine};
        }
        case CMasonGridPlacementType::MasonGridPlacementTypeSpan: {
            return CMasonGridPlacement{value, CMasonGridPlacementType::MasonGridPlacementTypeSpan};
        }
        default:
            // assert ??
            return CMasonGridPlacement{0, CMasonGridPlacementType::MasonGridPlacementTypeAuto};
    }
}

inline static Value lengthPercentageToJS(Runtime &runtime, CMasonLengthPercentage length) {
    switch (length.value_type) {
        case CMasonLengthPercentageType::MasonLengthPercentagePercent: {
            auto ret = facebook::jsi::Object(runtime);
            ret.setProperty(runtime, "value", length.value / 100);
            ret.setProperty(runtime, "unit", "%");
            return ret;
        }
        case CMasonLengthPercentageType::MasonLengthPercentagePoints: {
            auto ret = facebook::jsi::Object(runtime);
            ret.setProperty(runtime, "value", length.value);
            ret.setProperty(runtime, "unit", "px");
            return ret;
        }
        default:
            return Value::undefined();
    }
}

inline static CMasonLengthPercentage jsToLengthPercentage(float value, int value_type) {
    switch ((CMasonLengthPercentageType) value_type) {
        case CMasonLengthPercentageType::MasonLengthPercentagePercent: {
            return CMasonLengthPercentage{value, CMasonLengthPercentageType::MasonLengthPercentagePercent};
        }
        case CMasonLengthPercentageType::MasonLengthPercentagePoints: {
            return CMasonLengthPercentage{value, CMasonLengthPercentageType::MasonLengthPercentagePoints};
        }
        default:
             // assert ??
            return CMasonLengthPercentage{0, CMasonLengthPercentageType::MasonLengthPercentagePoints};
    }
}

inline static CMasonLengthPercentageType jsToLengthPercentageType(int value_type) {
    switch ((CMasonLengthPercentageType) value_type) {
        case CMasonLengthPercentageType::MasonLengthPercentagePercent: {
            return CMasonLengthPercentageType::MasonLengthPercentagePercent;
        }
        case CMasonLengthPercentageType::MasonLengthPercentagePoints: {
            return CMasonLengthPercentageType::MasonLengthPercentagePoints;
        }
        default:
            // assert invalid type ???
            return CMasonLengthPercentageType::MasonLengthPercentagePoints;
    }
}

inline static Value lengthPercentageAutoToJS(Runtime &runtime, CMasonLengthPercentageAuto length) {
    switch (length.value_type) {
        case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto:
            return facebook::jsi::String::createFromUtf8(runtime, "auto");
        case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent: {
            auto ret = facebook::jsi::Object(runtime);
            ret.setProperty(runtime, "value", length.value / 100);
            ret.setProperty(runtime, "unit", "%");
            return ret;
        }
        case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints: {
            auto ret = facebook::jsi::Object(runtime);
            ret.setProperty(runtime, "value", length.value);
            ret.setProperty(runtime, "unit", "px");
            return ret;
        }
        default:
            return Value::undefined();
    }
}

inline static CMasonLengthPercentageAuto jsToLengthPercentageAuto(float value, int value_type) {
    switch ((CMasonLengthPercentageAutoType) value_type) {
        case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto:
            return CMasonLengthPercentageAuto{value, CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto};
        case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent: {
            return CMasonLengthPercentageAuto{value, CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent};
        }
        case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints: {
            return CMasonLengthPercentageAuto{value, CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints};
        }
        default:
            // assert invalid type ???
            return CMasonLengthPercentageAuto{0, CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints};
    }
}

inline static CMasonLengthPercentageAutoType jsToLengthPercentageAutoType(int value_type) {
    switch ((CMasonLengthPercentageAutoType) value_type) {
        case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto:
            return CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto;
        case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent: {
            return CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent;
        }
        case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints: {
            return CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints;
        }
        default:
            // assert invalid type ???
            return CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto;
    }
}

inline static Value dimensionToJS(Runtime &runtime, CMasonDimension dimension) {
    switch ((CMasonDimensionType) dimension.value_type) {
        case CMasonDimensionType::MasonDimensionAuto:
            return facebook::jsi::String::createFromUtf8(runtime, "auto");
        case CMasonDimensionType::MasonDimensionPercent: {
            auto ret = facebook::jsi::Object(runtime);
            ret.setProperty(runtime, "value", dimension.value / 100);
            ret.setProperty(runtime, "unit", "%");
            return ret;
        }
        case CMasonDimensionType::MasonDimensionPoints: {
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
        case CMasonDimensionType::MasonDimensionAuto:
            return CMasonDimension{value, CMasonDimensionType::MasonDimensionAuto};
        case CMasonDimensionType::MasonDimensionPercent: {
            return CMasonDimension{value, CMasonDimensionType::MasonDimensionPercent};
        }
        case CMasonDimensionType::MasonDimensionPoints: {
            return CMasonDimension{value, CMasonDimensionType::MasonDimensionPoints};
        }
        default:
            // assert invalid type ???
            return CMasonDimension{0, CMasonDimensionType::MasonDimensionPoints};
    }
}

inline static CMasonDimensionType jsToDimensionType(int value_type) {
    switch ((CMasonDimensionType) value_type) {
        case CMasonDimensionType::MasonDimensionAuto:
            return CMasonDimensionType::MasonDimensionAuto;
        case CMasonDimensionType::MasonDimensionPercent: {
            return CMasonDimensionType::MasonDimensionPercent;
        }
        case CMasonDimensionType::MasonDimensionPoints: {
            return CMasonDimensionType::MasonDimensionPoints;
        }
        default:
            // assert invalid type ???
            return CMasonDimensionType::MasonDimensionAuto;
    }
}

inline static Value sizeToJS(Runtime &runtime, CMasonLengthPercentageSize size) {
    auto ret = facebook::jsi::Object(runtime);
    ret.setProperty(runtime, "width", lengthPercentageToJS(runtime, size.width));
    ret.setProperty(runtime, "height", lengthPercentageToJS(runtime, size.height));
    return ret;
}


@interface JSIModule : NSObject

- (void) install;

@end
