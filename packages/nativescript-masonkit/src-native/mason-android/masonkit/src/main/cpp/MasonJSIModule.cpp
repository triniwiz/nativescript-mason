//
// Created by Osei Fortune on 14/12/2022.
//

#include "MasonJSIModule.h"
#include <android/log.h>

using namespace facebook::jsi;
using namespace std;


void MasonJSIModule::install(facebook::jsi::Runtime &jsiRuntime) {
    CREATE_FUNC("__Mason_updateNodeAndStyle", 3,
                [](Runtime &runtime, const Value &thisValue,
                   const Value *arguments, size_t count) -> Value {

                    auto mason = (int64_t) arguments[0].asNumber();
                    auto node = (int64_t) arguments[1].asNumber();
                    auto style = (int64_t) arguments[2].asNumber();

                    mason_node_update_and_set_style(mason, node, style);

                    return Value::undefined();
                });


    CREATE_FUNC("__Mason_updateFlexStyleWithValues", 64,
                [](Runtime &runtime, const Value &thisValue,
                   const Value *arguments, size_t count) -> Value {

                    auto style = (int64_t) arguments[0].asNumber();
                    auto display = (int) arguments[1].asNumber();
                    auto positionType = (int) arguments[2].asNumber();
                    auto direction = (int) arguments[3].asNumber();

                    auto flexDirection = (int) arguments[4].asNumber();
                    auto flexWrap = (int) arguments[5].asNumber();
                    auto overflow = (int) arguments[6].asNumber();

                    auto alignItems = (int) arguments[7].asNumber();
                    auto alignSelf = (int) arguments[8].asNumber();
                    auto alignContent = (int) arguments[9].asNumber();

                    auto justifyContent = (int) arguments[10].asNumber();

                    auto positionLeftType = (int) arguments[11].asNumber();
                    auto positionLeftValue = (float) arguments[12].asNumber();

                    auto positionRightType = (int) arguments[13].asNumber();
                    auto positionRightValue = (float) arguments[14].asNumber();

                    auto positionTopType = (int) arguments[15].asNumber();
                    auto positionTopValue = (float) arguments[16].asNumber();

                    auto positionBottomType = (int) arguments[17].asNumber();
                    auto positionBottomValue = (float) arguments[18].asNumber();


                    auto marginLeftType = (int) arguments[19].asNumber();
                    auto marginLeftValue = (float) arguments[20].asNumber();

                    auto marginRightType = (int) arguments[21].asNumber();
                    auto marginRightValue = (float) arguments[22].asNumber();

                    auto marginTopType = (int) arguments[23].asNumber();
                    auto marginTopValue = (float) arguments[24].asNumber();

                    auto marginBottomType = (int) arguments[25].asNumber();
                    auto marginBottomValue = (float) arguments[26].asNumber();


                    auto paddingLeftType = (int) arguments[27].asNumber();
                    auto paddingLeftValue = (float) arguments[28].asNumber();

                    auto paddingRightType = (int) arguments[29].asNumber();
                    auto paddingRightValue = (float) arguments[30].asNumber();

                    auto paddingTopType = (int) arguments[31].asNumber();
                    auto paddingTopValue = (float) arguments[32].asNumber();

                    auto paddingBottomType = (int) arguments[33].asNumber();
                    auto paddingBottomValue = (float) arguments[34].asNumber();


                    auto borderLeftType = (int) arguments[35].asNumber();
                    auto borderLeftValue = (float) arguments[36].asNumber();

                    auto borderRightType = (int) arguments[37].asNumber();
                    auto borderRightValue = (float) arguments[38].asNumber();

                    auto borderTopType = (int) arguments[39].asNumber();
                    auto borderTopValue = (float) arguments[40].asNumber();

                    auto borderBottomType = (int) arguments[41].asNumber();
                    auto borderBottomValue = (float) arguments[42].asNumber();

                    auto flexGrow = (float) arguments[43].asNumber();
                    auto flexShrink = (float) arguments[44].asNumber();

                    auto flexBasisType = (int) arguments[45].asNumber();
                    auto flexBasisValue = (float) arguments[46].asNumber();

                    auto widthType = (int) arguments[47].asNumber();
                    auto widthValue = (float) arguments[48].asNumber();

                    auto heightType = (int) arguments[49].asNumber();
                    auto heightValue = (float) arguments[50].asNumber();

                    auto minWidthType = (int) arguments[51].asNumber();
                    auto minWidthValue = (float) arguments[52].asNumber();

                    auto minHeightType = (int) arguments[53].asNumber();
                    auto minHeightValue = (float) arguments[54].asNumber();

                    auto maxWidthType = (int) arguments[55].asNumber();
                    auto maxWidthValue = (float) arguments[56].asNumber();

                    auto maxHeightType = (int) arguments[57].asNumber();
                    auto maxHeightValue = (float) arguments[58].asNumber();

                    auto flexGapWidthType = (int) arguments[59].asNumber();
                    auto flexGapWidthValue = (float) arguments[60].asNumber();

                    auto flexGapHeightType = (int) arguments[61].asNumber();
                    auto flexGapHeightValue = (float) arguments[62].asNumber();

                    auto aspectRatio = (float) arguments[63].asNumber();


                    mason_style_update_with_values(
                            style,
                            display,
                            positionType,
                            direction,
                            flexDirection,
                            flexWrap,
                            overflow,
                            alignItems,
                            alignSelf,
                            alignContent,
                            justifyContent,

                            positionLeftType, positionLeftValue,
                            positionRightType, positionRightValue,
                            positionTopType, positionTopValue,
                            positionBottomType, positionBottomValue,

                            marginLeftType, marginLeftValue,
                            marginRightType, marginRightValue,
                            marginTopType, marginTopValue,
                            marginBottomType, marginBottomValue,

                            paddingLeftType, paddingLeftValue,
                            paddingRightType, paddingRightValue,
                            paddingTopType, paddingTopValue,
                            paddingBottomType, paddingBottomValue,

                            borderLeftType, borderLeftValue,
                            borderRightType, borderRightValue,
                            borderTopType, borderTopValue,
                            borderBottomType, borderBottomValue,

                            flexGrow, flexShrink,
                            flexBasisType, flexBasisValue,

                            widthType, widthValue,
                            heightType, heightValue,

                            minWidthType, minWidthValue,
                            minHeightType, minHeightValue,

                            maxWidthType, maxWidthValue,
                            maxHeightType, maxHeightValue,

                            flexGapWidthType, flexGapWidthValue,
                            flexGapHeightType, flexGapHeightValue,
                            aspectRatio);

                    return Value::undefined();
                });


    CREATE_FUNC("__Mason_compute", 2, [](Runtime &runtime, const Value &thisValue,
                                         const Value *arguments, size_t count) -> Value {

        auto mason = (int64_t) arguments[0].asNumber();
        auto node = (int64_t) arguments[1].asNumber();

        mason_node_compute(mason, node);

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_computeWH", 4, [](Runtime &runtime, const Value &thisValue,
                                           const Value *arguments, size_t count) -> Value {

        auto mason = (int64_t) arguments[0].asNumber();
        auto node = (int64_t) arguments[1].asNumber();

        auto width = (float) arguments[2].asNumber();
        auto height = (float) arguments[3].asNumber();

        mason_node_compute_wh(mason, node, width, height);


        return Value::undefined();

    });

    createFunc(jsiRuntime, "__Mason_computeMaxContent", 2,
               [](Runtime &runtime, const Value &thisValue,
                  const Value *arguments, size_t count) -> Value {

                   auto mason = (int64_t) arguments[0].asNumber();
                   auto node = (int64_t) arguments[1].asNumber();

                   mason_node_compute_max_content(mason, node);

                   return Value::undefined();

               });


    CREATE_FUNC("__Mason_computeMinContent", 2, [](Runtime &runtime, const Value &thisValue,
                                                   const Value *arguments, size_t count) -> Value {

        auto mason = (int64_t) arguments[0].asNumber();
        auto node = (int64_t) arguments[1].asNumber();

        mason_node_compute_min_content(mason, node);

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

        auto style = (int64_t) arguments[0].asNumber();

        auto value = mason_style_get_display(style);

        return Value(value);

    }

    );


    CREATE_FUNC("__Mason_setDisplay", 2, [](Runtime &runtime, const Value &thisValue,
                                            const Value *arguments, size_t count) -> Value {


        auto style = (int64_t) arguments[0].asNumber();
        auto display = (int) arguments[1].asNumber();

        mason_style_set_display(style, display);

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_getPositionType", 1, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto position = mason_style_get_position_type(style);

        return Value(position);

    });


    CREATE_FUNC("__Mason_setPositionType", 2, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {


        auto style = (int64_t) arguments[0].asNumber();
        auto position = (int) arguments[1].asNumber();

        mason_style_set_position_type(style, position);

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_getFlexWrap", 1, [](Runtime &runtime, const Value &thisValue,
                                             const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_flex_wrap(style);

        return Value(ret);

    });


    CREATE_FUNC("__Mason_setFlexWrap", 2, [](Runtime &runtime, const Value &thisValue,
                                             const Value *arguments, size_t count) -> Value {


        auto style = (int64_t) arguments[0].asNumber();
        auto new_value = (int) arguments[1].asNumber();

        mason_style_set_flex_wrap(style, new_value);

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_getAlignItems", 1, [](Runtime &runtime, const Value &thisValue,
                                               const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_align_items(style);

        return Value(ret);

    });


    CREATE_FUNC("__Mason_setAlignItems", 2, [](Runtime &runtime, const Value &thisValue,
                                               const Value *arguments, size_t count) -> Value {


        auto style = (int64_t) arguments[0].asNumber();
        auto new_value = (int) arguments[1].asNumber();

        mason_style_set_align_items(style, new_value);

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_getAlignContent", 1, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_align_content(style);

        return Value(ret);

    });


    CREATE_FUNC("__Mason_setAlignContent", 2, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {


        auto style = (int64_t) arguments[0].asNumber();
        auto new_value = (int) arguments[1].asNumber();

        mason_style_set_align_content(style, new_value);

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_getAlignSelf", 1, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_align_self(style);

        return Value(ret);

    });


    CREATE_FUNC("__Mason_setAlignSelf", 2, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {


        auto style = (int64_t) arguments[0].asNumber();
        auto new_value = (int) arguments[1].asNumber();

        mason_style_set_align_self(style, new_value);

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_getJustifyContent", 1, [](Runtime &runtime, const Value &thisValue,
                                                   const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_justify_content(style);

        return Value(ret);

    });


    CREATE_FUNC("__Mason_setJustifyContent", 2, [](Runtime &runtime, const Value &thisValue,
                                                   const Value *arguments, size_t count) -> Value {


        auto style = (int64_t) arguments[0].asNumber();
        auto new_value = (int) arguments[1].asNumber();

        mason_style_set_justify_content(style, new_value);

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_setPosition", 3, [](Runtime &runtime, const Value &thisValue,
                                             const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_position(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getPositionLeft", 1, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_position_left(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setPositionLeft", 3, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_position_left(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getPositionRight", 1, [](Runtime &runtime, const Value &thisValue,
                                                  const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_position_right(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setPositionRight", 3, [](Runtime &runtime, const Value &thisValue,
                                                  const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_position_right(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getPositionTop", 1, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_position_top(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setPositionTop", 3, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_position_top(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getPositionBottom", 1, [](Runtime &runtime, const Value &thisValue,
                                                   const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_position_bottom(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setPositionBottom", 3, [](Runtime &runtime, const Value &thisValue,
                                                   const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_position_bottom(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_setMargin", 3, [](Runtime &runtime, const Value &thisValue,
                                           const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_margin(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getMarginLeft", 1, [](Runtime &runtime, const Value &thisValue,
                                               const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_margin_left(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setMarginLeft", 3, [](Runtime &runtime, const Value &thisValue,
                                               const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_margin_left(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getMarginRight", 1, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_margin_right(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setMarginRight", 3, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_margin_right(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getMarginTop", 1, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_margin_top(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setMarginTop", 3, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_margin_top(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getMarginBottom", 1, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_margin_bottom(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setMarginBottom", 3, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_margin_bottom(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_setPadding", 3, [](Runtime &runtime, const Value &thisValue,
                                            const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_padding(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getPaddingLeft", 1, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_padding_left(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setPaddingLeft", 3, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_padding_left(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getPaddingRight", 1, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_padding_right(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setPaddingRight", 3, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_padding_right(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getPaddingTop", 1, [](Runtime &runtime, const Value &thisValue,
                                               const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_padding_top(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setPaddingTop", 3, [](Runtime &runtime, const Value &thisValue,
                                               const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_padding_top(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getPaddingBottom", 1, [](Runtime &runtime, const Value &thisValue,
                                                  const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_padding_bottom(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setPaddingBottom", 3, [](Runtime &runtime, const Value &thisValue,
                                                  const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_padding_bottom(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_setBorder", 3, [](Runtime &runtime, const Value &thisValue,
                                           const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_border(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getBorderLeft", 1, [](Runtime &runtime, const Value &thisValue,
                                               const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_border_left(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setBorderLeft", 3, [](Runtime &runtime, const Value &thisValue,
                                               const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_border_left(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getBorderRight", 1, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_border_right(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setBorderRight", 3, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_border_right(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getBorderTop", 1, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_border_top(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setBorderTop", 3, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_border_top(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getBorderBottom", 1, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_border_bottom(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setBorderBottom", 3, [](Runtime &runtime, const Value &thisValue,
                                                 const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_border_bottom(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_getFlexGrow", 1, [](Runtime &runtime, const Value &thisValue,
                                             const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = (double) mason_style_get_flex_grow(style);

        return Value(ret);

    }

    );


    CREATE_FUNC("__Mason_setFlexGrow", 2, [](Runtime &runtime, const Value &thisValue,
                                             const Value *arguments, size_t count) -> Value {


        auto style = (int64_t) arguments[0].asNumber();
        auto new_value = (float) arguments[1].asNumber();

        mason_style_set_flex_grow(style, new_value);

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_getFlexShrink", 1, [](Runtime &runtime, const Value &thisValue,
                                               const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = (double) mason_style_get_flex_shrink(style);

        return Value(ret);

    }

    );


    CREATE_FUNC("__Mason_setFlexShrink", 2, [](Runtime &runtime, const Value &thisValue,
                                               const Value *arguments, size_t count) -> Value {


        auto style = (int64_t) arguments[0].asNumber();
        auto new_value = (float) arguments[1].asNumber();

        mason_style_set_flex_shrink(style, new_value);

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_getFlexBasis", 1, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = mason_style_get_flex_basis(style);

        return dimensionToJS(runtime, ret);

    });

    CREATE_FUNC("__Mason_setFlexBasis", 3, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_flex_basis(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_getGap", 1, [](Runtime &runtime, const Value &thisValue,
                                        const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto size = mason_style_get_gap(style);

        return sizeToJS(runtime, size);

    });

    CREATE_FUNC("__Mason_setGap", 5, [](Runtime &runtime, const Value &thisValue,
                                        const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto width_value = (float) arguments[1].asNumber();
        auto width_type = (int) arguments[2].asNumber();

        auto height_value = (float) arguments[3].asNumber();
        auto height_type = (int) arguments[4].asNumber();


        mason_style_set_gap(style, width_value, jsToDimensionType(width_type), height_value,
                            jsToDimensionType(height_type));

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_getAspectRatio", 1, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto ret = (double) mason_style_get_aspect_ratio(style);

        return Value(ret);

    }

    );


    CREATE_FUNC("__Mason_setAspectRatio", 2, [](Runtime &runtime, const Value &thisValue,
                                                const Value *arguments, size_t count) -> Value {


        auto style = (int64_t) arguments[0].asNumber();
        auto new_value = (float) arguments[1].asNumber();

        mason_style_set_aspect_ratio(style, new_value);

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_getFlexDirection", 1, [](Runtime &runtime, const Value &thisValue,
                                                  const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = mason_style_get_flex_direction(style);

        return Value(value);

    }

    );


    CREATE_FUNC("__Mason_setFlexDirection", 2, [](Runtime &runtime, const Value &thisValue,
                                                  const Value *arguments, size_t count) -> Value {


        auto style = (int64_t) arguments[0].asNumber();
        auto display = (int) arguments[1].asNumber();

        mason_style_set_flex_direction(style, display);

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_getMinWidth", 1, [](Runtime &runtime, const Value &thisValue,
                                             const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto width = mason_style_get_min_width(style);

        return dimensionToJS(runtime, width);

    });

    CREATE_FUNC("__Mason_setMinWidth", 3, [](Runtime &runtime, const Value &thisValue,
                                             const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_min_width(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getMinHeight", 2, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto height = mason_style_get_min_height(style);

        return dimensionToJS(runtime, height);
    });

    CREATE_FUNC("__Mason_setMinHeight", 3, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_min_height(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    }

    );

    CREATE_FUNC("__Mason_getWidth", 1, [](Runtime &runtime, const Value &thisValue,
                                          const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto width = mason_style_get_width(style);

        return dimensionToJS(runtime, width);

    });

    CREATE_FUNC("__Mason_setWidth", 3, [](Runtime &runtime, const Value &thisValue,
                                          const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_width(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });


    CREATE_FUNC("__Mason_getHeight", 2, [](Runtime &runtime, const Value &thisValue,
                                           const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto height = mason_style_get_height(style);

        return dimensionToJS(runtime, height);
    });

    CREATE_FUNC("__Mason_setHeight", 3, [](Runtime &runtime, const Value &thisValue,
                                           const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_height(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    }

    );

    CREATE_FUNC("__Mason_getMaxWidth", 1, [](Runtime &runtime, const Value &thisValue,
                                             const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto width = mason_style_get_max_width(style);

        return dimensionToJS(runtime, width);

    });

    CREATE_FUNC("__Mason_setMaxWidth", 3, [](Runtime &runtime, const Value &thisValue,
                                             const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_max_width(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    });

    CREATE_FUNC("__Mason_getMaxHeight", 2, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto height = mason_style_get_max_height(style);

        return dimensionToJS(runtime, height);
    });

    CREATE_FUNC("__Mason_setMaxHeight", 3, [](Runtime &runtime, const Value &thisValue,
                                              const Value *arguments, size_t count) -> Value {

        auto style = (int64_t) arguments[0].asNumber();

        auto value = (float) arguments[1].asNumber();
        auto value_type = (int) arguments[2].asNumber();


        mason_style_set_max_height(style, value, jsToDimensionType(value_type));

        return Value::undefined();

    }

    );
}
