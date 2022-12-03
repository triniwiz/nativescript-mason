#import "JSIModule.h"
#import "NativeScript/JSIRuntime.h"
#import "Mason/Mason-Swift.h"

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


static Value dimensionToJS(Runtime &runtime,CMasonDimension dimension){
    switch (dimension.value_type) {
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

static CMasonDimension jsToDimension(float value, int value_type){
    switch (value_type) {
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

static CMasonDimensionType jsToDimensionType(int value_type){
    switch (value_type) {
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


void install(Runtime &jsiRuntime) {
    
    
    CREATE_FUNC("__Mason_updateFlexStyleWithValues", 64, [](Runtime &runtime, const Value &thisValue,
                                                            const Value *arguments, size_t count) -> Value {
        
        auto style = reinterpret_cast<void*>((int64_t)arguments[0].asNumber());
        auto display = (int)arguments[1].asNumber();
        auto positionType = (int)arguments[2].asNumber();
        auto direction = (int)arguments[3].asNumber();

        auto flexDirection = (int)arguments[4].asNumber();
        auto flexWrap = (int)arguments[5].asNumber();
        auto overflow = (int)arguments[6].asNumber();
        
        auto alignItems = (int)arguments[7].asNumber();
        auto alignSelf = (int)arguments[8].asNumber();
        auto alignContent = (int)arguments[9].asNumber();
        
        auto justifyContent = (int)arguments[10].asNumber();
        
        auto positionLeftType = (int)arguments[11].asNumber();
        auto positionLeftValue = (float)arguments[12].asNumber();
        
        auto positionRightType = (int)arguments[13].asNumber();
        auto positionRightValue = (float)arguments[14].asNumber();
        
        auto positionTopType = (int)arguments[15].asNumber();
        auto positionTopValue = (float)arguments[16].asNumber();
        
        auto positionBottomType = (int)arguments[17].asNumber();
        auto positionBottomValue = (float)arguments[18].asNumber();
        
        
        
        auto marginLeftType = (int)arguments[19].asNumber();
        auto marginLeftValue = (float)arguments[20].asNumber();
        
        auto marginRightType = (int)arguments[21].asNumber();
        auto marginRightValue = (float)arguments[22].asNumber();
        
        auto marginTopType = (int)arguments[23].asNumber();
        auto marginTopValue = (float)arguments[24].asNumber();
        
        auto marginBottomType = (int)arguments[25].asNumber();
        auto marginBottomValue = (float)arguments[26].asNumber();
        
        
        auto paddingLeftType = (int)arguments[27].asNumber();
        auto paddingLeftValue = (float)arguments[28].asNumber();
        
        auto paddingRightType = (int)arguments[29].asNumber();
        auto paddingRightValue = (float)arguments[30].asNumber();
        
        auto paddingTopType = (int)arguments[31].asNumber();
        auto paddingTopValue = (float)arguments[32].asNumber();
        
        auto paddingBottomType = (int)arguments[33].asNumber();
        auto paddingBottomValue = (float)arguments[34].asNumber();
        
        
        auto borderLeftType = (int)arguments[35].asNumber();
        auto borderLeftValue = (float)arguments[36].asNumber();
        
        auto borderRightType = (int)arguments[37].asNumber();
        auto borderRightValue = (float)arguments[38].asNumber();
        
        auto borderTopType = (int)arguments[39].asNumber();
        auto borderTopValue = (float)arguments[40].asNumber();
        
        auto borderBottomType = (int)arguments[41].asNumber();
        auto borderBottomValue = (float)arguments[42].asNumber();
        
        auto flexGrow = (float)arguments[43].asNumber();
        auto flexShrink = (float)arguments[44].asNumber();
        
        auto flexBasisType = (int)arguments[45].asNumber();
        auto flexBasisValue = (float)arguments[46].asNumber();
        
        auto widthType = (int)arguments[47].asNumber();
        auto widthValue = (float)arguments[48].asNumber();
        
        auto heightType = (int)arguments[49].asNumber();
        auto heightValue = (float)arguments[50].asNumber();
        
        auto minWidthType = (int)arguments[51].asNumber();
        auto minWidthValue = (float)arguments[52].asNumber();
        
        auto minHeightType = (int)arguments[53].asNumber();
        auto minHeightValue = (float)arguments[54].asNumber();
        
        auto maxWidthType = (int)arguments[55].asNumber();
        auto maxWidthValue = (float)arguments[56].asNumber();
        
        auto maxHeightType = (int)arguments[57].asNumber();
        auto maxHeightValue = (float)arguments[58].asNumber();
        
        auto flexGapWidthType = (int)arguments[59].asNumber();
        auto flexGapWidthValue = (float)arguments[60].asNumber();
        
        auto flexGapHeightType = (int)arguments[61].asNumber();
        auto flexGapHeightValue = (float)arguments[62].asNumber();
        
        auto aspectRatio = (float)arguments[63].asNumber();
        
       
        
        [MasonReexports style_update_with_values:style :display
                                       :positionType
                                       :direction
                                       :flexDirection
                                       :flexWrap
                                       :overflow
                                       :alignItems
                                       :alignSelf
                                       :alignContent
                                       :justifyContent
                                       
                                       :positionLeftType :positionLeftValue
                                       :positionRightType :positionRightValue
                                       :positionTopType :positionTopValue
                                       :positionBottomType :positionBottomValue
                                       
                                       :marginLeftType :marginLeftValue
                                       :marginRightType :marginRightValue
                                       :marginTopType :marginTopValue
                                       :marginBottomType :marginBottomValue
                                       
                                       :paddingLeftType :paddingLeftValue
                                       :paddingRightType :paddingRightValue
                                       :paddingTopType :paddingTopValue
                                       :paddingBottomType :paddingBottomValue
                                       
                                       :borderLeftType :borderLeftValue
                                       :borderRightType :borderRightValue
                                       :borderTopType :borderTopValue
                                       :borderBottomType :borderBottomValue
                                       
                                       :flexGrow: flexShrink
                                       :flexBasisType: flexBasisValue
                                       
                                       :widthType: widthValue
                                       :heightType: heightValue
                                       
                                       :minWidthType :minWidthValue
                                       :minHeightType :minHeightValue
                                       
                                       :maxWidthType :maxWidthValue
                                       :maxHeightType :maxHeightValue
                                       
                                       :flexGapWidthType :flexGapWidthValue
                                       :flexGapHeightType :flexGapHeightValue aspectRatio: aspectRatio];
                              
                              return Value::undefined();
    });
    
    
    
    CREATE_FUNC("__Mason_compute", 2, [](Runtime &runtime, const Value &thisValue,
                                         const Value *arguments, size_t count) -> Value {
        
        auto mason = reinterpret_cast<void*>((int64_t)arguments[0].asNumber());
        auto node = reinterpret_cast<void*>((int64_t)arguments[1].asNumber());
        
        [MasonReexports node_compute:mason :node];
        
        return Value::undefined();
        
    });
    
    
    
    CREATE_FUNC("__Mason_computeWH", 4, [](Runtime &runtime, const Value &thisValue,
                                           const Value *arguments, size_t count) -> Value {
        
        auto mason = reinterpret_cast<void*>((int64_t)arguments[0].asNumber());
        auto node = reinterpret_cast<void*>((int64_t)arguments[1].asNumber());
        
        auto width = (float)arguments[2].asNumber();
        auto height = (float)arguments[3].asNumber();
        
        [MasonReexports node_compute_wh:mason :node width:width height:height];
    
    
        return Value::undefined();
        
    });
    
    createFunc(jsiRuntime, "__Mason_computeMaxContent", 2, [](Runtime &runtime, const Value &thisValue,
                                                              const Value *arguments, size_t count) -> Value {
        
        auto mason = reinterpret_cast<void*>((int64_t)arguments[0].asNumber());
        auto node = reinterpret_cast<void*>((int64_t)arguments[1].asNumber());
        
        [MasonReexports node_compute_max_content:mason :node];
        
    
        return Value::undefined();
        
    });
    
    
    CREATE_FUNC("__Mason_computeMinContent", 2, [](Runtime &runtime, const Value &thisValue,
                                                   const Value *arguments, size_t count) -> Value {
        
        auto mason = reinterpret_cast<void*>((int64_t)arguments[0].asNumber());
        auto node = reinterpret_cast<void*>((int64_t)arguments[1].asNumber());
        
        [MasonReexports node_compute_min_content:mason :node];
    
    
        return Value::undefined();
        
    });
    
    
    /* todo */
    /*
    createFunc(jsiRuntime, "__Mason_layout", 2, [](Runtime &runtime, const Value &thisValue,
                                                            const Value *arguments,
                                                                      const Value *, size_t) -> Value {
        
        auto mason = reinterpret_cast<void*>((int64_t)arguments[0].asNumber());
        auto node = reinterpret_cast<void*>((int64_t)arguments[1].asNumber());
        
        
    
        return Value::undefined();
        
    });
    */
    
    
//    CREATE_FUNC("__Mason_getComputedLayout", 2, [](Runtime &runtime, const Value &thisValue,
//                                          const Value *arguments, size_t count) -> Value {
//
//        auto style = reinterpret_cast<void*>((int64_t)arguments[0].asNumber());
//
//        auto layout = Object(runtime);
//
//        auto layoutPtr = &layout;
//
//
//        auto width = [MasonReexports style_get_width:style];
//
//        return dimensionToJS(runtime, width);
//
//    });
    
    
    CREATE_FUNC("__Mason_getDisplay", 1, [](Runtime &runtime, const Value &thisValue,
                                          const Value *arguments, size_t count) -> Value {
        
        auto style = reinterpret_cast<void*>((int64_t)arguments[0].asNumber());

        auto value = [MasonReexports style_get_display:style];
        
        return Value(value);
        
    });
    
    
    CREATE_FUNC("__Mason_setDisplay", 2, [](Runtime &runtime, const Value &thisValue,
                                          const Value *arguments, size_t count) -> Value {
        
        auto style = reinterpret_cast<void*>((int64_t)arguments[0].asNumber());
        auto display = (int)arguments[1].asNumber();

        [MasonReexports style_set_display:style :display];
        
        return Value::undefined();
        
    });
    
    
//
    
    CREATE_FUNC("__Mason_getWidth", 1, [](Runtime &runtime, const Value &thisValue,
                                          const Value *arguments, size_t count) -> Value {
        
        auto style = reinterpret_cast<void*>((int64_t)arguments[0].asNumber());

        auto width = [MasonReexports style_get_width:style];
        
        return Value((double)width.value);//dimensionToJS(runtime, width);
        
    });
    
    CREATE_FUNC("__Mason_setWidth", 3, [](Runtime &runtime, const Value &thisValue,
                                          const Value *arguments, size_t count) -> Value {
        
        auto style = reinterpret_cast<void*>((int64_t)arguments[0].asNumber());
        
        auto value = (float)arguments[1].asNumber();
        auto value_type = (int)arguments[2].asNumber();

      
        [MasonReexports style_set_width:style :value :jsToDimensionType(value_type)];
        
        return Value::undefined();
        
    });
    
    
    CREATE_FUNC("__Mason_getHeight", 2, [](Runtime &runtime, const Value &thisValue,
                                           const Value *arguments, size_t count) -> Value {
        
        auto style = reinterpret_cast<void*>((int64_t)arguments[0].asNumber());

        auto height = [MasonReexports style_get_height:style];

       // return dimensionToJS(runtime, height);
        
        return Value((double)height.value);
    });
    
    CREATE_FUNC("__Mason_setHeight", 3, [](Runtime &runtime, const Value &thisValue,
                                          const Value *arguments, size_t count) -> Value {
        
        auto style = reinterpret_cast<void*>((int64_t)arguments[0].asNumber());
        
        auto value = (float)arguments[1].asNumber();
        auto value_type = (int)arguments[2].asNumber();

      
        [MasonReexports style_set_height:style :value :jsToDimensionType(value_type)];
        
        return Value::undefined();
        
    });
    
        
    
}







@implementation JSIModule

- (void )install {
  std::shared_ptr<facebook::jsi::Runtime> rt = [JSIRuntime runtime];
  install(*rt);
}

@end
