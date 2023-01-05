#import "JSIModule.h"
#import "Mason/Mason-Swift.h"

using namespace facebook::jsi;
using namespace std;

CMasonNonRepeatedTrackSizingFunctionArray toNonRepeatedTrackSizingFunction(facebook::jsi::Runtime &runtime, facebook::jsi::Array &array) {
    auto len = array.length(runtime);
    
    CMasonNonRepeatedTrackSizingFunctionArray ret {};
 
    std::vector<CMasonMinMax> buffer;
    buffer.reserve(len);
    

    auto auto_vec = rust::Vec<CMasonNonRepeatedTrackSizingFunction>();

    if (len == 0) {
        return std::move(auto_vec);
    }

    auto_vec.reserve(len);

    for (int i = 0; i < len; i++) {
        auto value = array.getValueAtIndex(runtime, i).asObject(
                runtime);
        // base object {type: number};
        auto type = (int) value.getProperty(runtime, "type").getNumber();
        switch (type) {
            case 0: // auto
                
                mason_util_create_non_repeated_track_sizing_function_with_type_value(
                        0, 0, 0, 0 - 1, auto_vec);
                break;
            case 1: // min-content
                mason_util_create_non_repeated_track_sizing_function_with_type_value(
                        1, 0, 0, -1, auto_vec);
                break;
            case 2: // max-content
                mason_util_create_non_repeated_track_sizing_function_with_type_value(
                        2, 0, 0, -1, auto_vec);
                break;

            case 3: //fit-content
            {
                // object {type: number, value_type: number, value: number};
                auto value_type = (int) value.getProperty(runtime, "value_type").getNumber();
                auto val = (float) value.getProperty(runtime, "value").getNumber();
                mason_util_create_non_repeated_track_sizing_function_with_type_value(
                        3, value_type, val, -1, auto_vec);
            }
                break;
            case 4: //flex
            {
                // object {type: number, value: number};
                auto val = (float) value.getProperty(runtime, "value").getNumber();
                mason_util_create_non_repeated_track_sizing_function_with_type_value(
                        4, 0, val, -1, auto_vec);
            }
                break;
            case 5: //points
            {
                // object {type: number, value: number};
                auto val = (float) value.getProperty(runtime, "value").getNumber();
                mason_util_create_non_repeated_track_sizing_function_with_type_value(
                        5, 0, val, -1, auto_vec);
            }
                break;
            case 6: //percentage
            {
                // object {type: number, value: number};
                auto val = (float) value.getProperty(runtime, "value").getNumber();
                mason_util_create_non_repeated_track_sizing_function_with_type_value(
                        6, 0, val, -1, auto_vec);
            }
                break;
            case 7: //flex
            {
                // object {type: number, min_type: number, min_value: number, max_type: number, max_value: number};
                auto min_type = (int) value.getProperty(runtime, "min_type").getNumber();
                auto min_value = (float) value.getProperty(runtime, "min_value").getNumber();

                auto max_type = (int) value.getProperty(runtime, "max_type").getNumber();
                auto max_value = (float) value.getProperty(runtime, "max_value").getNumber();

                CMasonMinMax minMax = {};
                minMax.min_type = min_type;
                minMax.min_value = min_value;
                minMax.max_type = max_type;
                minMax.max_value = max_value;

                mason_util_create_non_repeated_track_sizing_function(minMax, -1, auto_vec);

            }
                break;
            default:
                // todo assert or do nothing ??
                break;
        }
    }

    return std::move(auto_vec);
}


rust::Vec<CMasonTrackSizingFunction>
toTrackSizingFunction(facebook::jsi::Runtime &runtime, facebook::jsi::Array &array) {
    auto len = array.length(runtime);

    auto auto_vec = rust::Vec<CMasonTrackSizingFunction>();

    if (len == 0) {
        return std::move(auto_vec);
    }

    auto_vec.reserve(len);

    for (int i = 0; i < len; i++) {

    }

    return std::move(auto_vec);
}


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


static void* getPointerValue(const facebook::jsi::Value &value, facebook::jsi::Runtime &runtime) {
    // todo switch to bigint
    auto ptrValue = std::stoll(value.asString(runtime).utf8(runtime));
    
    return reinterpret_cast<void*>(ptrValue);
    
    //return reinterpret_cast<void*>(value.asBigInt(runtime).Int64Value(runtime));
   // return reinterpret_cast<void*>((int64_t)value.asNumber());
}



void install(Runtime &jsiRuntime) {
    
    
    CREATE_FUNC("__Mason_updateFlexStyleWithValues", 64, [](Runtime &runtime, const Value &thisValue,
                                                            const Value *arguments, size_t count) -> Value {
        
      
        auto style = getPointerValue(arguments[0], runtime);
                           auto display = (int) arguments[1].asNumber();
                           auto position = (int) arguments[2].asNumber();
                           auto direction = (int) arguments[3].asNumber();

                           auto flexDirection = (int) arguments[4].asNumber();
                           auto flexWrap = (int) arguments[5].asNumber();
                           auto overflow = (int) arguments[6].asNumber();

                           auto alignItems = (int) arguments[7].asNumber();
                           auto alignSelf = (int) arguments[8].asNumber();
                           auto alignContent = (int) arguments[9].asNumber();


                           auto justifyItems = (int) arguments[10].asNumber();
                           auto justifySelf = (int) arguments[11].asNumber();
                           auto justifyContent = (int) arguments[12].asNumber();

                           auto insetLeftType = (int) arguments[13].asNumber();
                           auto insetLeftValue = (float) arguments[14].asNumber();

                           auto insetRightType = (int) arguments[15].asNumber();
                           auto insetRightValue = (float) arguments[16].asNumber();

                           auto insetTopType = (int) arguments[17].asNumber();
                           auto insetTopValue = (float) arguments[18].asNumber();

                           auto insetBottomType = (int) arguments[19].asNumber();
                           auto insetBottomValue = (float) arguments[20].asNumber();


                           auto marginLeftType = (int) arguments[21].asNumber();
                           auto marginLeftValue = (float) arguments[22].asNumber();

                           auto marginRightType = (int) arguments[23].asNumber();
                           auto marginRightValue = (float) arguments[24].asNumber();

                           auto marginTopType = (int) arguments[25].asNumber();
                           auto marginTopValue = (float) arguments[26].asNumber();

                           auto marginBottomType = (int) arguments[27].asNumber();
                           auto marginBottomValue = (float) arguments[28].asNumber();


                           auto paddingLeftType = (int) arguments[29].asNumber();
                           auto paddingLeftValue = (float) arguments[30].asNumber();

                           auto paddingRightType = (int) arguments[31].asNumber();
                           auto paddingRightValue = (float) arguments[32].asNumber();

                           auto paddingTopType = (int) arguments[33].asNumber();
                           auto paddingTopValue = (float) arguments[34].asNumber();

                           auto paddingBottomType = (int) arguments[35].asNumber();
                           auto paddingBottomValue = (float) arguments[36].asNumber();


                           auto borderLeftType = (int) arguments[37].asNumber();
                           auto borderLeftValue = (float) arguments[38].asNumber();

                           auto borderRightType = (int) arguments[39].asNumber();
                           auto borderRightValue = (float) arguments[40].asNumber();

                           auto borderTopType = (int) arguments[41].asNumber();
                           auto borderTopValue = (float) arguments[42].asNumber();

                           auto borderBottomType = (int) arguments[43].asNumber();
                           auto borderBottomValue = (float) arguments[44].asNumber();

                           auto flexGrow = (float) arguments[45].asNumber();
                           auto flexShrink = (float) arguments[46].asNumber();

                           auto flexBasisType = (int) arguments[47].asNumber();
                           auto flexBasisValue = (float) arguments[48].asNumber();

                           auto widthType = (int) arguments[49].asNumber();
                           auto widthValue = (float) arguments[50].asNumber();

                           auto heightType = (int) arguments[51].asNumber();
                           auto heightValue = (float) arguments[52].asNumber();

                           auto minWidthType = (int) arguments[53].asNumber();
                           auto minWidthValue = (float) arguments[54].asNumber();

                           auto minHeightType = (int) arguments[55].asNumber();
                           auto minHeightValue = (float) arguments[56].asNumber();

                           auto maxWidthType = (int) arguments[57].asNumber();
                           auto maxWidthValue = (float) arguments[58].asNumber();

                           auto maxHeightType = (int) arguments[59].asNumber();
                           auto maxHeightValue = (float) arguments[60].asNumber();

                           auto gapRowType = (int) arguments[61].asNumber();
                           auto gapRowValue = (float) arguments[62].asNumber();

                           auto gapColumnType = (int) arguments[63].asNumber();
                           auto gapColumnValue = (float) arguments[64].asNumber();

                           auto aspectRatio = (float) arguments[65].asNumber();

                           auto gridAutoRowsValue = arguments[66].asObject(runtime).getArray(runtime);

                           auto gridAutoColumnsValue = arguments[67].asObject(runtime).getArray(runtime);

                           auto gridAutoRows = toNonRepeatedTrackSizingFunction(runtime,
                                                                                gridAutoRowsValue);
                           auto gridAutoColumns = toNonRepeatedTrackSizingFunction(runtime,
                                                                                   gridAutoColumnsValue);

                           auto gridAutoFlow = (int) arguments[68].asNumber();

                           auto gridColumnStartType = (int) arguments[69].asNumber();
                           auto gridColumnStartValue = (short) arguments[70].asNumber();

                           auto gridColumnEndType = (int) arguments[71].asNumber();
                           auto gridColumnEndValue = (short) arguments[72].asNumber();

                           auto gridRowStartType = (int) arguments[73].asNumber();
                           auto gridRowStartValue = (short) arguments[74].asNumber();

                           auto gridRowEndType = (int) arguments[75].asNumber();
                           auto gridRowEndValue = (short) arguments[76].asNumber();


                           auto gridTemplateRowsValue = arguments[77].asObject(runtime).getArray(runtime);
                           auto gridTemplateColumnsValue = arguments[78].asObject(runtime).getArray(
                                   runtime);

                           auto gridTemplateRows = toTrackSizingFunction(runtime, gridTemplateRowsValue);
                           auto gridTemplateColumns = toTrackSizingFunction(runtime,
                                                                            gridTemplateColumnsValue);
        
       
        
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
    
    
    CREATE_FUNC("__Mason_isDirty", 2, [](Runtime &runtime, const Value &thisValue,
                                            const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);
        
        auto value  = [MasonReexports node_dirty:mason :node];
        
           return Value(value);

       }
       );


       CREATE_FUNC("__Mason_markDirty", 2, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {


           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);
           
           [MasonReexports node_mark_dirty:mason :node];

           return Value::undefined();
       });


       CREATE_FUNC("__Mason_getDisplay", 1, [](Runtime &runtime, const Value &thisValue,
                                               const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto value = [MasonReexports style_get_display: style];

           return Value(value);

       }
       );


       CREATE_FUNC("__Mason_setDisplay", 5, [](Runtime &runtime, const Value &thisValue,
                                               const Value *arguments, size_t count) -> Value {


           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[4].asBool();

           auto display = (int) arguments[3].asNumber();

           [MasonReexports style_set_display:style :display];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();
       }

       );


       CREATE_FUNC("__Mason_getPositionType", 1, [](Runtime &runtime, const Value &thisValue,
                                                    const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto position = [MasonReexports style_get_position_type:style];

           return Value(position);

       });


       CREATE_FUNC("__Mason_setPositionType", 5, [](Runtime &runtime, const Value &thisValue,
                                                    const Value *arguments, size_t count) -> Value {


           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[4].asBool();

           auto position = (int) arguments[3].asNumber();

           [MasonReexports style_set_position_type:mason :position];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });


       CREATE_FUNC("__Mason_getFlexWrap", 1, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_flex_wrap:style];

           return Value(ret);

       });


       CREATE_FUNC("__Mason_setFlexWrap", 5, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {


           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[4].asBool();

           auto new_value = (int) arguments[3].asNumber();
           
           [MasonReexports style_set_flex_wrap:style :new_value];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });


       CREATE_FUNC("__Mason_getAlignItems", 1, [](Runtime &runtime, const Value &thisValue,
                                                  const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_align_items:style];

           return Value(ret);

       });


       CREATE_FUNC("__Mason_setAlignItems", 5, [](Runtime &runtime, const Value &thisValue,
                                                  const Value *arguments, size_t count) -> Value {


           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[4].asBool();

           auto new_value = (int) arguments[3].asNumber();

           [MasonReexports style_set_align_items:style :new_value];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });


       CREATE_FUNC("__Mason_getAlignContent", 1, [](Runtime &runtime, const Value &thisValue,
                                                    const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_align_content:style];

           return Value(ret);

       });


       CREATE_FUNC("__Mason_setAlignContent", 5, [](Runtime &runtime, const Value &thisValue,
                                                    const Value *arguments, size_t count) -> Value {


           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[4].asBool();

           auto new_value = (int) arguments[3].asNumber();
           
           [MasonReexports style_set_align_content:style :new_value];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });


       CREATE_FUNC("__Mason_getAlignSelf", 1, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_align_self:style];

           return Value(ret);

       });


       CREATE_FUNC("__Mason_setAlignSelf", 5, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {


           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[4].asBool();

           auto new_value = (int) arguments[3].asNumber();

           
           [MasonReexports style_set_align_self:style :new_value];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });


       CREATE_FUNC("__Mason_getJustifyContent", 1, [](Runtime &runtime, const Value &thisValue,
                                                      const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_justify_content:style];

           return Value(ret);

       });


       CREATE_FUNC("__Mason_setJustifyContent", 5, [](Runtime &runtime, const Value &thisValue,
                                                      const Value *arguments, size_t count) -> Value {


           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[4].asBool();

           auto new_value = (int) arguments[3].asNumber();

           [MasonReexports style_set_justify_content:style :new_value];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });


       CREATE_FUNC("__Mason_setPosition", 6, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_position:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getPositionLeft", 1, [](Runtime &runtime, const Value &thisValue,
                                                    const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_position_left:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setPositionLeft", 6, [](Runtime &runtime, const Value &thisValue,
                                                    const Value *arguments, size_t count) -> Value {
           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();

           [MasonReexports style_set_position_left:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getPositionRight", 1, [](Runtime &runtime, const Value &thisValue,
                                                     const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret =  [MasonReexports style_get_position_right:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setPositionRight", 6, [](Runtime &runtime, const Value &thisValue,
                                                     const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();

           [MasonReexports style_set_position_right:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getPositionTop", 1, [](Runtime &runtime, const Value &thisValue,
                                                   const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret =  [MasonReexports style_get_position_top:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setPositionTop", 6, [](Runtime &runtime, const Value &thisValue,
                                                   const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();

           [MasonReexports style_set_position_top:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getPositionBottom", 1, [](Runtime &runtime, const Value &thisValue,
                                                      const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret =  [MasonReexports style_get_position_bottom:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setPositionBottom", 6, [](Runtime &runtime, const Value &thisValue,
                                                      const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_position_bottom:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_setMargin", 6, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();
           
           [MasonReexports style_set_margin:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getMarginLeft", 1, [](Runtime &runtime, const Value &thisValue,
                                                  const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_margin_left:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setMarginLeft", 6, [](Runtime &runtime, const Value &thisValue,
                                                  const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_margin_left:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getMarginRight", 1, [](Runtime &runtime, const Value &thisValue,
                                                   const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_margin_right:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setMarginRight", 6, [](Runtime &runtime, const Value &thisValue,
                                                   const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_margin_right:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getMarginTop", 1, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_margin_top:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setMarginTop", 6, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_margin_top:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getMarginBottom", 1, [](Runtime &runtime, const Value &thisValue,
                                                    const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_margin_bottom:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setMarginBottom", 6, [](Runtime &runtime, const Value &thisValue,
                                                    const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_margin_bottom:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_setPadding", 6, [](Runtime &runtime, const Value &thisValue,
                                               const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_padding:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getPaddingLeft", 1, [](Runtime &runtime, const Value &thisValue,
                                                   const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_padding_left:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setPaddingLeft", 6, [](Runtime &runtime, const Value &thisValue,
                                                   const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_padding_left:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getPaddingRight", 1, [](Runtime &runtime, const Value &thisValue,
                                                    const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_padding_right:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setPaddingRight", 6, [](Runtime &runtime, const Value &thisValue,
                                                    const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_padding_right:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getPaddingTop", 1, [](Runtime &runtime, const Value &thisValue,
                                                  const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_padding_top:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setPaddingTop", 6, [](Runtime &runtime, const Value &thisValue,
                                                  const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_padding_top:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getPaddingBottom", 1, [](Runtime &runtime, const Value &thisValue,
                                                     const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_padding_bottom:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setPaddingBottom", 6, [](Runtime &runtime, const Value &thisValue,
                                                     const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_padding_bottom:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });


       CREATE_FUNC("__Mason_setBorder", 6, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_border:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getBorderLeft", 1, [](Runtime &runtime, const Value &thisValue,
                                                  const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_border_left:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setBorderLeft", 6, [](Runtime &runtime, const Value &thisValue,
                                                  const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_border_left:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getBorderRight", 1, [](Runtime &runtime, const Value &thisValue,
                                                   const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_border_right:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setBorderRight", 6, [](Runtime &runtime, const Value &thisValue,
                                                   const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_border_right:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getBorderTop", 1, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_border_top:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setBorderTop", 6, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_border_top:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getBorderBottom", 1, [](Runtime &runtime, const Value &thisValue,
                                                    const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_border_bottom:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setBorderBottom", 6, [](Runtime &runtime, const Value &thisValue,
                                                    const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_border_bottom:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });


       CREATE_FUNC("__Mason_getFlexGrow", 1, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = (double) [MasonReexports style_get_flex_grow:style];

           return Value(ret);

       }

       );


       CREATE_FUNC("__Mason_setFlexGrow", 5, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {


           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[4].asBool();

           auto new_value = (float) arguments[3].asNumber();

           [MasonReexports style_set_flex_grow:style :new_value];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });


       CREATE_FUNC("__Mason_getFlexShrink", 1, [](Runtime &runtime, const Value &thisValue,
                                                  const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = (double) [MasonReexports style_get_flex_shrink:style];

           return Value(ret);

       }

       );


       CREATE_FUNC("__Mason_setFlexShrink", 5, [](Runtime &runtime, const Value &thisValue,
                                                  const Value *arguments, size_t count) -> Value {


           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[4].asBool();

           auto new_value = (float) arguments[3].asNumber();
           
           [MasonReexports style_set_flex_shrink:style : new_value];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });


       CREATE_FUNC("__Mason_getFlexBasis", 1, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = [MasonReexports style_get_flex_basis:style];

           return dimensionToJS(runtime, ret);

       });

       CREATE_FUNC("__Mason_setFlexBasis", 6, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();

           [MasonReexports style_set_flex_basis:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });


       CREATE_FUNC("__Mason_getGap", 1, [](Runtime &runtime, const Value &thisValue,
                                           const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto size = [MasonReexports style_get_gap: style];

           return sizeToJS(runtime, size);

       });

       CREATE_FUNC("__Mason_setGap", 8, [](Runtime &runtime, const Value &thisValue,
                                           const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);

           auto update = arguments[7].asBool();

           auto width_value = (float) arguments[3].asNumber();
           auto width_type = (int) arguments[4].asNumber();

           auto height_value = (float) arguments[5].asNumber();
           auto height_type = (int) arguments[6].asNumber();

           [MasonReexports style_set_gap:style :width_value :jsToDimensionType(width_type) :height_value :jsToDimensionType(height_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });


       CREATE_FUNC("__Mason_getAspectRatio", 1, [](Runtime &runtime, const Value &thisValue,
                                                   const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto ret = (double)  [MasonReexports style_get_aspect_ratio:style];

           return Value(ret);

       }

       );


       CREATE_FUNC("__Mason_setAspectRatio", 5, [](Runtime &runtime, const Value &thisValue,
                                                   const Value *arguments, size_t count) -> Value {


           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[4].asBool();

           auto new_value = (float) arguments[3].asNumber();

           [MasonReexports style_set_aspect_ratio:style :new_value];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });


       CREATE_FUNC("__Mason_getFlexDirection", 1, [](Runtime &runtime, const Value &thisValue,
                                                     const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto value = [MasonReexports style_get_flex_direction:style];

           return Value(value);

       }

       );


       CREATE_FUNC("__Mason_setFlexDirection", 5, [](Runtime &runtime, const Value &thisValue,
                                                     const Value *arguments, size_t count) -> Value {


           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[4].asBool();

           auto direction = (int) arguments[3].asNumber();

           [MasonReexports style_set_flex_direction:style :direction];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });


       CREATE_FUNC("__Mason_getMinWidth", 1, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto width = [MasonReexports style_get_min_width:style];

           return dimensionToJS(runtime, width);

       });

       CREATE_FUNC("__Mason_setMinWidth", 6, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();

           [MasonReexports style_set_min_width:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getMinHeight", 2, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto height = [MasonReexports style_get_min_height:style];

           return dimensionToJS(runtime, height);
       });

       CREATE_FUNC("__Mason_setMinHeight", 6, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_min_height:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       }

       );

       CREATE_FUNC("__Mason_getWidth", 1, [](Runtime &runtime, const Value &thisValue,
                                             const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto width = [MasonReexports style_get_width:style];

           return dimensionToJS(runtime, width);

       });

       CREATE_FUNC("__Mason_setWidth", 6, [](Runtime &runtime, const Value &thisValue,
                                             const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_width:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });


       CREATE_FUNC("__Mason_getHeight", 2, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto height = [MasonReexports style_get_min_height:style];

           return dimensionToJS(runtime, height);
       });

       CREATE_FUNC("__Mason_setHeight", 6, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_height:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       }

       );

       CREATE_FUNC("__Mason_getMaxWidth", 1, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto width = [MasonReexports style_get_max_width:style];

           return dimensionToJS(runtime, width);

       });

       CREATE_FUNC("__Mason_setMaxWidth", 6, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_max_width:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       });

       CREATE_FUNC("__Mason_getMaxHeight", 2, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

           auto style = getPointerValue(arguments[0], runtime);

           auto height = [MasonReexports style_get_max_height:style];

           return dimensionToJS(runtime, height);
       });

       CREATE_FUNC("__Mason_setMaxHeight", 6, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

           auto mason = getPointerValue(arguments[0], runtime);

           auto node = getPointerValue(arguments[1], runtime);

           auto style = getPointerValue(arguments[2], runtime);
           auto update = arguments[5].asBool();

           auto value = (float) arguments[3].asNumber();
           auto value_type = (int) arguments[4].asNumber();


           [MasonReexports style_set_max_width:style :value :jsToDimensionType(value_type)];

           if (update) {
               [MasonReexports node_set_style:mason :node :style];
           }

           return Value::undefined();

       }

       );
}







@implementation JSIModule

- (void )install {
  std::shared_ptr<facebook::jsi::Runtime> rt = [JSIRuntime runtime];
  install(*rt);
}

@end
