#import "MasonV8Module.h"
#import "Mason/Mason-Swift.h"

using namespace std;

void destroy_c_mason_track_sizing_function(CMasonTrackSizingFunction tracking){
    switch (tracking.tag) {
        case Repeat:
        {
            auto array = tracking.repeat._2;
            if(array != nullptr){
                free(array->array);
                free(array);
            };
        }
            break;
        default:
            break;
    }
}

std::vector<CMasonMinMax>
toNonRepeatedTrackSizingFunction(v8::Isolate *isolate, v8::Local<v8::Array> &array) {
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    auto len = array->Length();

    std::vector<CMasonMinMax> buffer;

    if (len == 0) {
        return buffer;
    }

    buffer.reserve(len);


    for (int i = 0; i < len; i++) {
        auto value = array->Get(context, i).ToLocalChecked().As<v8::Object>();

        // object {type: number, min_type: number, min_value: number, max_type: number, max_value: number};
        auto min_type = value->Get(context,
                                   STRING_TO_V8_VALUE("min_type")).ToLocalChecked()->Int32Value(
                context).FromJust();
        auto min_value = (float) value->Get(context, STRING_TO_V8_VALUE(
                "min_value")).ToLocalChecked()->NumberValue(context).FromJust();

        auto max_type = value->Get(context,
                                   STRING_TO_V8_VALUE("max_type")).ToLocalChecked()->Int32Value(
                context).FromJust();
        auto max_value = (float) value->Get(context, STRING_TO_V8_VALUE(
                "max_value")).ToLocalChecked()->NumberValue(context).FromJust();

        CMasonMinMax minMax;
        minMax.min_type = min_type;
        minMax.min_value = min_value;
        minMax.max_type = max_type;
        minMax.max_value = max_value;

        buffer.push_back(minMax);
    }

    return buffer;
}

std::vector<CMasonTrackSizingFunction>
toTrackSizingFunction(v8::Isolate *isolate, v8::Local<v8::Array> &array) {
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    auto len = array->Length();

    std::vector<CMasonTrackSizingFunction> buffer;

    if (len == 0) {
        return buffer;
    }

    buffer.reserve(len);

    for (int i = 0; i < len; i++) {
        auto object = array->Get(context, i).ToLocalChecked().As<v8::Object>();
        bool is_repeating = object->Get(context, STRING_TO_V8_VALUE(
                "is_repeating")).ToLocalChecked()->BooleanValue(isolate);
        auto repeating_type = object->Get(context, STRING_TO_V8_VALUE(
                "repeating_type")).ToLocalChecked()->Int32Value(context).FromJust();
        auto repeating_count = (short) object->Get(context, STRING_TO_V8_VALUE(
                "repeating_count")).ToLocalChecked()->Int32Value(context).FromJust();

        auto value = object->Get(context, STRING_TO_V8_VALUE("value"));
        if (is_repeating) {
            auto value_array = value.ToLocalChecked().As<v8::Array>();
            auto repeating_length = value_array->Length();

            auto min_max_size = sizeof(CMasonMinMax);
            auto tracks = (CMasonMinMax*)malloc(repeating_length * min_max_size);

            for (int j = 0; j < repeating_length; j++) {
                auto repeat_object = value_array->Get(context, i).ToLocalChecked().As<v8::Object>();

                auto min_type = repeat_object->Get(context, STRING_TO_V8_VALUE(
                        "min_type")).ToLocalChecked()->Int32Value(context).FromJust();
                auto min_value = (float) repeat_object->Get(context, STRING_TO_V8_VALUE(
                        "min_value")).ToLocalChecked()->NumberValue(context).FromJust();

                auto max_type = repeat_object->Get(context, STRING_TO_V8_VALUE(
                        "max_type")).ToLocalChecked()->Int32Value(context).FromJust();
                auto max_value = (float) repeat_object->Get(context, STRING_TO_V8_VALUE(
                        "max_value")).ToLocalChecked()->NumberValue(context).FromJust();

                CMasonMinMax minMax;
                minMax.min_type = min_type;
                minMax.min_value = min_value;

                minMax.max_type = max_type;
                minMax.max_value = max_value;

                tracks[i * min_max_size] = minMax;;
            }

            CMasonTrackSizingFunction repeat;
            repeat.tag = Repeat;
            Repeat_Body body;
            body._0 = repeating_type;
            auto array = (CMasonNonRepeatedTrackSizingFunctionArray*)malloc(sizeof(CMasonNonRepeatedTrackSizingFunctionArray));
            array->array = tracks;
            array->length = repeating_length;
            body._1 = repeating_count;
            body._2 = array;
            repeat.repeat = body;
            buffer.emplace_back(repeat);

        } else {

            CMasonTrackSizingFunction single;
            single.tag = Single;

            auto single_object = value.ToLocalChecked().As<v8::Object>();

            auto min_type = single_object->Get(context, STRING_TO_V8_VALUE(
                    "min_type")).ToLocalChecked()->Int32Value(context).FromJust();
            auto min_value = (float) single_object->Get(context, STRING_TO_V8_VALUE(
                    "min_value")).ToLocalChecked()->NumberValue(context).FromJust();

            auto max_type = single_object->Get(context, STRING_TO_V8_VALUE(
                    "max_type")).ToLocalChecked()->Int32Value(context).FromJust();
            auto max_value = (float) single_object->Get(context, STRING_TO_V8_VALUE(
                    "max_value")).ToLocalChecked()->NumberValue(context).FromJust();

            CMasonMinMax minMax;
            minMax.min_type = min_type;
            minMax.min_value = min_value;

            minMax.max_type = max_type;
            minMax.max_value = max_value;
            
            single.single = minMax;
            
            buffer.emplace_back(single);
        }
    }

    return buffer;
}


void installV8Module(v8::Isolate *isolate) {

    CREATE_V8_MODULE("MasonV8Module", [](v8::Local<v8::Object> moduleObject) {

        CREATE_FUNCTION("updateNodeAndStyle", {
                MASON_ENTER_WITH_NODE_AND_STYLE
                [MasonReexports node_set_style:mason :node :style];
                RETURN_UNDEFINED
        })

        // Width
        MASON_SET_DIMENSION_PROPERTY("setWidth", style_set_width)
        MASON_GET_DIMENSION_PROPERTY("getWidth", style_get_width)

        MASON_SET_DIMENSION_PROPERTY("setMinWidth", style_set_min_width)
        MASON_GET_DIMENSION_PROPERTY("getMinWidth", style_get_min_width)

        MASON_SET_DIMENSION_PROPERTY("setMaxWidth", style_set_min_width)
        MASON_GET_DIMENSION_PROPERTY("getMaxWidth", style_get_min_width)

        // Height
        MASON_SET_DIMENSION_PROPERTY("setHeight", style_set_height)
        MASON_GET_DIMENSION_PROPERTY("getHeight", style_get_height)

        MASON_SET_DIMENSION_PROPERTY("setMinHeight", style_set_min_width)
        MASON_GET_DIMENSION_PROPERTY("getMinHeight", style_get_min_width)

        MASON_SET_DIMENSION_PROPERTY("setMaxHeight", style_set_min_width)
        MASON_GET_DIMENSION_PROPERTY("getMaxHeight", style_get_min_width)

        CREATE_FUNCTION("compute", {
                MASON_ENTER_WITH_NODE
                [MasonReexports node_compute:mason :node];
                RETURN_UNDEFINED
        })

        CREATE_FUNCTION("computeWH", {
                MASON_ENTER_WITH_NODE

                GET_FLOAT_ARG(2, width);
                GET_FLOAT_ARG(3, height);
                [MasonReexports node_compute_wh:mason :node width:width height:height];
                RETURN_UNDEFINED
        })

        CREATE_FUNCTION("computeMaxContent", {
                MASON_ENTER_WITH_NODE
                [MasonReexports node_compute_max_content:mason :node];
                RETURN_UNDEFINED
        })

        CREATE_FUNCTION("computeMinContent", {
                MASON_ENTER_WITH_NODE
                [MasonReexports node_compute_min_content:mason :node];
                RETURN_UNDEFINED
        })


        CREATE_FUNCTION("updateStyleWithValues", {
                MASON_ENTER_WITH_STYLE

                GET_INT_ARG(1, display)
                GET_INT_ARG(2, position)
                GET_INT_ARG(3, direction)

                GET_INT_ARG(4, flexDirection)
                GET_INT_ARG(5, flexWrap)
                GET_INT_ARG(6, overflow)

                GET_INT_ARG(7, alignItems)
                GET_INT_ARG(8, alignSelf)
                GET_INT_ARG(9, alignContent)

                GET_INT_ARG(10, justifyItems)
                GET_INT_ARG(11, justifySelf)
                GET_INT_ARG(12, justifyContent)

                GET_INT_ARG(13, insetLeftType)
                GET_FLOAT_ARG(14, insetLeftValue)

                GET_INT_ARG(15, insetRightType)
                GET_FLOAT_ARG(16, insetRightValue)

                GET_INT_ARG(17, insetTopType)
                GET_FLOAT_ARG(18, insetTopValue)

                GET_INT_ARG(19, insetBottomType)
                GET_FLOAT_ARG(20, insetBottomValue)

                GET_INT_ARG(21, marginLeftType)
                GET_FLOAT_ARG(22, marginLeftValue)

                GET_INT_ARG(23, marginRightType)
                GET_FLOAT_ARG(24, marginRightValue)

                GET_INT_ARG(25, marginTopType)
                GET_FLOAT_ARG(26, marginTopValue)

                GET_INT_ARG(27, marginBottomType)
                GET_FLOAT_ARG(28, marginBottomValue)

                GET_INT_ARG(29, paddingLeftType)
                GET_FLOAT_ARG(30, paddingLeftValue)

                GET_INT_ARG(31, paddingRightType)
                GET_FLOAT_ARG(32, paddingRightValue)

                GET_INT_ARG(33, paddingTopType)
                GET_FLOAT_ARG(34, paddingTopValue)

                GET_INT_ARG(35, paddingBottomType)
                GET_FLOAT_ARG(36, paddingBottomValue)

                GET_INT_ARG(37, borderLeftType)
                GET_FLOAT_ARG(38, borderLeftValue)

                GET_INT_ARG(39, borderRightType)
                GET_FLOAT_ARG(40, borderRightValue)

                GET_INT_ARG(41, borderTopType)
                GET_FLOAT_ARG(42, borderTopValue)

                GET_INT_ARG(43, borderBottomType)
                GET_FLOAT_ARG(44, borderBottomValue)

                GET_FLOAT_ARG(45, flexGrow)
                GET_FLOAT_ARG(46, flexShrink)

                GET_INT_ARG(47, flexBasisType)
                GET_FLOAT_ARG(48, flexBasisValue)

                GET_INT_ARG(49, widthType)
                GET_FLOAT_ARG(50, widthValue)

                GET_INT_ARG(51, heightType)
                GET_FLOAT_ARG(52, heightValue)

                GET_INT_ARG(53, minWidthType)
                GET_FLOAT_ARG(54, minWidthValue)

                GET_INT_ARG(55, minHeightType)
                GET_FLOAT_ARG(56, minHeightValue)

                GET_INT_ARG(57, maxWidthType)
                GET_FLOAT_ARG(58, maxWidthValue)

                GET_INT_ARG(59, maxHeightType)
                GET_FLOAT_ARG(60, maxHeightValue)

                GET_INT_ARG(61, gapRowType)
                GET_FLOAT_ARG(62, gapRowValue)

                GET_INT_ARG(63, gapColumnType)
                GET_FLOAT_ARG(64, gapColumnValue)

                GET_FLOAT_ARG(65, aspectRatio)

                auto gridAutoRowsValue = info[66].As<v8::Array>();
                auto gridAutoRowsBuffer = toNonRepeatedTrackSizingFunction(isolate,
                gridAutoRowsValue);

                CMasonNonRepeatedTrackSizingFunctionArray gridAutoRows = {};
                gridAutoRows.array = gridAutoRowsBuffer.data();
                gridAutoRows.length = gridAutoRowsBuffer.size();

                auto gridAutoColumnsValue =  info[67].As<v8::Array>();
                auto gridAutoColumnsBuffer = toNonRepeatedTrackSizingFunction(isolate,
                gridAutoColumnsValue);

                CMasonNonRepeatedTrackSizingFunctionArray gridAutoColumns = {};
                gridAutoColumns.array = gridAutoColumnsBuffer.data();
                gridAutoColumns.length = gridAutoColumnsBuffer.size();
            

                GET_INT_ARG(68, gridAutoFlow)

                GET_INT_ARG(69, gridColumnStartType)
                GET_FLOAT_ARG(70, gridColumnStartValue)

                GET_INT_ARG(71, gridColumnEndType)
                GET_FLOAT_ARG(72, gridColumnEndValue)

                GET_INT_ARG(73, gridRowStartType)
                GET_FLOAT_ARG(74, gridRowStartValue)

                GET_INT_ARG(75, gridRowEndType)
                GET_FLOAT_ARG(76, gridRowEndValue)


                auto gridTemplateRowsValue =  info[77].As<v8::Array>();
                auto gridTemplateColumnsValue =  info[78].As<v8::Array>();

                auto gridTemplateRowsBuffer = toTrackSizingFunction(isolate, gridTemplateRowsValue);

                CMasonTrackSizingFunctionArray gridTemplateRows = {};

                gridTemplateRows.array = gridTemplateRowsBuffer.data();
                gridTemplateRows.length = gridTemplateRowsBuffer.size();

                auto gridTemplateColumnsBuffer = toTrackSizingFunction(isolate, gridTemplateColumnsValue);

                CMasonTrackSizingFunctionArray gridTemplateColumns = {};

                gridTemplateColumns.array = gridTemplateColumnsBuffer.data();
                gridTemplateColumns.length = gridTemplateColumnsBuffer.size();
            
                 GET_INT_ARG(79, overflowX)
                 GET_INT_ARG(80, overflowY)
                 GET_FLOAT_ARG(81, scrollbarWidth)
            
            [MasonReexports style_update_with_values
                     :style
                     :display
                     :position
                     :direction
                     :flexDirection
                     :flexWrap
                     :overflow
                     :alignItems
                     :alignSelf
                     :alignContent
                     :justifyItems
                     :justifySelf
                     :justifyContent

                     :insetLeftType :insetLeftValue
                     :insetRightType :insetRightValue
                     :insetTopType :insetTopValue
                     :insetBottomType :insetBottomValue

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

                     :flexGrow :flexShrink
                     :flexBasisType :flexBasisValue

                     :widthType :widthValue
                     :heightType :heightValue

                     :minWidthType :minWidthValue
                     :minHeightType :minHeightValue

                     :maxWidthType :maxWidthValue
                     :maxHeightType :maxHeightValue

                     :gapRowType :gapRowValue
                     :gapColumnType :gapColumnValue
                     :aspectRatio
                     :&gridAutoRows :&gridAutoColumns
                     :gridAutoFlow
                     :gridColumnStartType :gridColumnStartValue
                     :gridColumnEndType :gridColumnEndValue
                     :gridRowStartType  :gridRowStartValue
                     :gridRowEndType   :gridRowEndValue
                     :&gridTemplateRows
                     :&gridTemplateColumns
                     :overflowX
                     :overflowY
                     scrollBarWidth:scrollbarWidth];

                    for(int i = 0; i < gridTemplateRowsBuffer.size();i++){
                        auto it = gridTemplateRowsBuffer[i];
                        destroy_c_mason_track_sizing_function(it);
                }

                    for(int i = 0; i < gridTemplateColumnsBuffer.size();i++){
                        auto it = gridTemplateColumnsBuffer[i];
                        destroy_c_mason_track_sizing_function(it);
                    }

        })

        CREATE_FUNCTION("isDirty", {
                MASON_ENTER_WITH_NODE
                auto value = [MasonReexports node_dirty:mason :node];
                info.GetReturnValue().Set(value);
        })

        CREATE_FUNCTION("markDirty", {
                MASON_ENTER_WITH_NODE
                [MasonReexports node_mark_dirty:mason :node];
        })
        
        
        MASON_SET_NUMBER_PROPERTY("setScrollbarWidth", style_set_scrollbar_width)
        MASON_GET_NUMBER_PROPERTY("getScrollbarWidth", style_get_scrollbar_width)

        MASON_SET_NUMBER_PROPERTY("setOverflow", style_set_overflow)

        MASON_SET_NUMBER_PROPERTY("setOverflowX", style_set_overflow_x)
        MASON_GET_NUMBER_PROPERTY("getOverflowX", style_get_overflow_x)

        MASON_SET_NUMBER_PROPERTY("setOverflowY", style_set_overflow_y)
        MASON_GET_NUMBER_PROPERTY("getOverflowY", style_get_overflow_y)


        MASON_SET_NUMBER_PROPERTY("setDisplay", style_set_display)
        MASON_GET_NUMBER_PROPERTY("getDisplay", style_get_display)

        MASON_SET_NUMBER_PROPERTY("setPosition", style_set_position)
        MASON_GET_NUMBER_PROPERTY("getPosition", style_get_position)

        MASON_SET_NUMBER_PROPERTY("setFlexWrap", style_set_flex_wrap)
        MASON_GET_NUMBER_PROPERTY("getFlexWrap", style_get_flex_wrap)

        MASON_SET_NUMBER_PROPERTY("setAlignItems", style_set_align_items)
        MASON_GET_NUMBER_PROPERTY("getAlignItems", style_get_align_items)

        MASON_SET_NUMBER_PROPERTY("setAlignContent", style_set_align_content)
        MASON_GET_NUMBER_PROPERTY("getAlignContent", style_get_align_content)

        MASON_SET_NUMBER_PROPERTY("setAlignSelf", style_set_align_self)
        MASON_GET_NUMBER_PROPERTY("getAlignSelf", style_get_align_self)

        MASON_SET_NUMBER_PROPERTY("setJustifyItems", style_set_justify_items)
        MASON_GET_NUMBER_PROPERTY("getJustifyItems", style_get_justify_items)

        MASON_SET_NUMBER_PROPERTY("setJustifySelf", style_set_justify_self)
        MASON_GET_NUMBER_PROPERTY("getJustifySelf", style_get_justify_self)

        MASON_SET_NUMBER_PROPERTY("setJustifyContent", style_set_justify_content)
        MASON_GET_NUMBER_PROPERTY("getJustifyContent", style_get_justify_content)

        MASON_SET_LENGTH_PROPERTY("setInset", style_set_inset)

        MASON_SET_LENGTH_PROPERTY("setInsetTop", style_set_inset_top)
        MASON_GET_LENGTH_PROPERTY("getInsetTop", style_get_inset_top)

        MASON_SET_LENGTH_PROPERTY("setInsetLeft", style_set_inset_left)
        MASON_GET_LENGTH_PROPERTY("getInsetLeft", style_get_inset_left)

        MASON_SET_LENGTH_PROPERTY("setInsetBottom", style_set_inset_bottom)
        MASON_GET_LENGTH_PROPERTY("getInsetBottom", style_get_inset_bottom)

        MASON_SET_LENGTH_PROPERTY("setInsetRight", style_set_inset_right)
        MASON_GET_LENGTH_PROPERTY("getInsetRight", style_get_inset_right)


        MASON_SET_LENGTH_PROPERTY_ALL_SIDES("setInset", style_set_margin)

        MASON_SET_LENGTH_PROPERTY("setMarginTop", style_set_margin_top)
        MASON_GET_LENGTH_PROPERTY("getMarginTop", style_get_margin_top)

        MASON_SET_LENGTH_PROPERTY("setMarginLeft", style_set_margin_left)
        MASON_GET_LENGTH_PROPERTY("getMarginLeft", style_get_margin_left)

        MASON_SET_LENGTH_PROPERTY("setMarginBottom", style_set_margin_bottom)
        MASON_GET_LENGTH_PROPERTY("getMarginBottom", style_get_margin_bottom)

        MASON_SET_LENGTH_PROPERTY("setMarginRight", style_set_margin_right)
        MASON_GET_LENGTH_PROPERTY("getMarginRight", style_get_margin_right)

        MASON_SET_LENGTH_PROPERTY_NO_AUTO_ALL_SIDES("setPadding", style_set_padding)

        MASON_SET_LENGTH_PROPERTY_NO_AUTO("setPaddingTop", style_set_padding_top)
        MASON_GET_LENGTH_PROPERTY_NO_AUTO("getPaddingTop", style_get_padding_top)

        MASON_SET_LENGTH_PROPERTY_NO_AUTO("setPaddingLeft", style_set_padding_left)
        MASON_GET_LENGTH_PROPERTY_NO_AUTO("getPaddingLeft", style_get_padding_left)

        MASON_SET_LENGTH_PROPERTY_NO_AUTO("setPaddingBottom", style_set_padding_bottom)
        MASON_GET_LENGTH_PROPERTY_NO_AUTO("getPaddingBottom", style_get_padding_bottom)

        MASON_SET_LENGTH_PROPERTY_NO_AUTO("setPaddingRight", style_set_padding_right)
        MASON_GET_LENGTH_PROPERTY_NO_AUTO("getPaddingRight", style_get_padding_right)

        MASON_SET_LENGTH_PROPERTY_NO_AUTO_ALL_SIDES("setBorder", style_set_border)

        MASON_SET_LENGTH_PROPERTY_NO_AUTO("setBorderTop", style_set_border_top)
        MASON_GET_LENGTH_PROPERTY_NO_AUTO("getBorderTop", style_get_border_top)

        MASON_SET_LENGTH_PROPERTY_NO_AUTO("setBorderLeft", style_set_border_left)
        MASON_GET_LENGTH_PROPERTY_NO_AUTO("getBorderLeft", style_get_border_left)

        MASON_SET_LENGTH_PROPERTY_NO_AUTO("setBorderBottom", style_set_border_bottom)
        MASON_GET_LENGTH_PROPERTY_NO_AUTO("getBorderBottom", style_get_border_bottom)

        MASON_SET_LENGTH_PROPERTY_NO_AUTO("setBorderRight", style_set_border_right)
        MASON_GET_LENGTH_PROPERTY_NO_AUTO("getBorderRight", style_get_border_right)

        MASON_SET_FLOAT_PROPERTY("setFlexGrow", style_set_flex_grow)
        MASON_GET_NUMBER_PROPERTY("getFlexGrow", style_get_flex_grow)

        MASON_SET_FLOAT_PROPERTY("setFlexShrink", style_set_flex_shrink)
        MASON_GET_NUMBER_PROPERTY("getFlexShrink", style_get_flex_shrink)

        MASON_SET_DIMENSION_PROPERTY("setFlexBasis", style_set_flex_basis)
        MASON_GET_DIMENSION_PROPERTY("getFlexBasis", style_get_flex_basis)


        MASON_SET_SIZE_PROPERTY("setGap", style_set_gap)
        MASON_GET_SIZE_PROPERTY("getGap", style_get_gap)


        MASON_SET_LENGTH_PROPERTY_NO_AUTO("setRowGap", style_set_row_gap)
        MASON_GET_LENGTH_PROPERTY_NO_AUTO("getRowGap", style_get_row_gap)

        MASON_SET_LENGTH_PROPERTY_NO_AUTO("setColumnGap", style_set_column_gap)
        MASON_GET_LENGTH_PROPERTY_NO_AUTO("getColumnGap", style_get_column_gap)

        MASON_SET_FLOAT_PROPERTY("setAspectRatio", style_set_aspect_ratio)
        MASON_GET_NUMBER_PROPERTY("getAspectRatio", style_get_aspect_ratio)

        MASON_SET_NUMBER_PROPERTY("setFlexDirection", style_set_flex_direction)
        MASON_GET_NUMBER_PROPERTY("getFlexDirection", style_get_flex_direction)

        MASON_SET_NUMBER_PROPERTY("setAutoFlow", style_set_grid_auto_flow)
        MASON_GET_NUMBER_PROPERTY("getAutoFlow", style_get_grid_auto_flow)


        CREATE_FUNCTION("getGridAutoRows", {
                MASON_ENTER_WITH_NODE_AND_STYLE
                auto rows = [MasonReexports style_get_grid_auto_rows:style];
                auto parsed = [MasonReexports util_parse_non_repeated_track_sizing_function:rows];
            
                [MasonReexports destroyWithNonRepeatedTrackSizingFunctionArray:rows];
                info.GetReturnValue().Set(STRING_TO_V8_VALUE(parsed.UTF8String));
        })

        CREATE_FUNCTION("setGridAutoRows", {
                MASON_ENTER_WITH_NODE_AND_STYLE
                auto array = info[3].As<v8::Array>();
                auto value = toNonRepeatedTrackSizingFunction(isolate, array);

                CMasonNonRepeatedTrackSizingFunctionArray val;
                val.array = value.data();
                val.length = value.size();

               [MasonReexports style_set_grid_auto_rows:style :&val];
                MASON_UPDATE_NODE(info[4])
        })

        CREATE_FUNCTION("getGridAutoColumns", {
                MASON_ENTER_WITH_NODE_AND_STYLE
                auto columns =[MasonReexports style_get_grid_auto_columns:style];
                auto parsed = [MasonReexports util_parse_non_repeated_track_sizing_function:columns];
                [MasonReexports destroyWithNonRepeatedTrackSizingFunctionArray:columns];
        
                info.GetReturnValue().Set(STRING_TO_V8_VALUE(parsed.UTF8String));
        })

        CREATE_FUNCTION("setGridAutoColumns", {
                MASON_ENTER_WITH_NODE_AND_STYLE
                auto array = info[3].As<v8::Array>();
                auto value = toNonRepeatedTrackSizingFunction(isolate, array);

                CMasonNonRepeatedTrackSizingFunctionArray val;
                val.array = value.data();
                val.length = value.size();

                [MasonReexports style_set_grid_auto_columns:style :&val];
                MASON_UPDATE_NODE(info[4])
        })

        CREATE_FUNCTION("getArea", {
                MASON_ENTER_WITH_STYLE
                auto row_start = [MasonReexports style_get_grid_row_start:style];
                auto row_end = [MasonReexports style_get_grid_row_start:style];

                auto col_start = [MasonReexports style_get_grid_column_start:style];
                auto col_end = [MasonReexports style_get_grid_column_start:style];

                v8::Local<v8::Object> object = v8::Object::New((isolate));
                object->Set(context, STRING_TO_V8_VALUE("col_start_type"), v8::Int32::New(isolate, (int) col_start.value_type)).Check();
                object->Set(context, STRING_TO_V8_VALUE("col_start_value"), v8::Int32::New(isolate, (int) col_start.value)).Check();

                object->Set(context, STRING_TO_V8_VALUE("col_end_type"), v8::Int32::New(isolate, (int) col_end.value_type)).Check();
                object->Set(context, STRING_TO_V8_VALUE("col_end_value"), v8::Int32::New(isolate, (int) col_end.value)).Check();

                object->Set(context, STRING_TO_V8_VALUE("row_start_type"), v8::Int32::New(isolate, (int) row_start.value_type)).Check();
                object->Set(context, STRING_TO_V8_VALUE("row_start_value"), v8::Int32::New(isolate, (int) row_start.value)).Check();

                object->Set(context, STRING_TO_V8_VALUE("row_end_type"), v8::Int32::New(isolate, (int) row_end.value_type)).Check();
                object->Set(context, STRING_TO_V8_VALUE("row_end_value"), v8::Int32::New(isolate, (int) row_end.value)).Check();

                std::stringstream ss;
                if (col_start.value == col_end.value &&
                col_start.value_type == col_end.value_type) {
                    if (col_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeAuto) {
                        ss << "auto";
                    } else {
                        ss << col_start.value;
                        if (col_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeSpan) {
                            ss << " span";
                        }
                    }
                } else {
                    if (col_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeAuto) {
                        ss << "auto";
                    } else {
                        ss << col_start.value;
                        if (col_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeSpan) {
                            ss << " span";
                        }
                    }

                    ss << " / ";

                    if (col_end.value_type == CMasonGridPlacementType::MasonGridPlacementTypeAuto) {
                        ss << "auto";
                    } else {
                        ss << col_end.value;
                        if (col_end.value_type == CMasonGridPlacementType::MasonGridPlacementTypeSpan) {
                            ss << " span";
                        }
                    }
                }
                object->Set(context, STRING_TO_V8_VALUE("colFormatted"), STRING_TO_V8_VALUE(ss.str().c_str())).Check();

                std::stringstream row_ss;
                if (row_start.value == row_end.value &&
                row_start.value_type == row_end.value_type) {
                    if (row_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeAuto) {
                        row_ss << "auto";
                    } else {
                        row_ss << row_start.value;
                        if (row_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeSpan) {
                            row_ss << " span";
                        }
                    }
                } else {
                    if (row_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeAuto) {
                        row_ss << "auto";
                    } else {
                        row_ss << row_start.value;
                        if (row_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeSpan) {
                            row_ss << " span";
                        }
                    }

                    row_ss << " / ";

                    if (row_end.value_type == CMasonGridPlacementType::MasonGridPlacementTypeAuto) {
                        row_ss << "auto";
                    } else {
                        row_ss << row_end.value;
                        if (row_end.value_type == CMasonGridPlacementType::MasonGridPlacementTypeSpan) {
                            row_ss << " span";
                        }
                    }
                }
                object->Set(context, STRING_TO_V8_VALUE("rowFormatted"), STRING_TO_V8_VALUE(ss.str().c_str())).Check();

                info.GetReturnValue().Set(object);

        })

        CREATE_FUNCTION("setArea", {
                MASON_ENTER_WITH_NODE_AND_STYLE

                auto object = info[3].As<v8::Object>();

                auto rowStartType = (int) object->Get(context,
                STRING_TO_V8_VALUE("row_start_type")).ToLocalChecked()->Int32Value(context).FromJust();

                auto rowStartValue = (short) object->Get(context,
                STRING_TO_V8_VALUE("row_start_value")).ToLocalChecked()->Int32Value(context).FromJust();

                auto rowEndType = (int) object->Get(context,
                STRING_TO_V8_VALUE("row_end_type")).ToLocalChecked()->Int32Value(context).FromJust();
                auto rowEndValue = (short) object->Get(context,
                STRING_TO_V8_VALUE("row_end_value")).ToLocalChecked()->Int32Value(context).FromJust();

                auto columnStartType = (int) object->Get(context,
                STRING_TO_V8_VALUE("col_start_value")).ToLocalChecked()->Int32Value(context).FromJust();
                auto columnStartValue = (short) object->Get(context,
                STRING_TO_V8_VALUE("col_start_type")).ToLocalChecked()->Int32Value(context).FromJust();

                auto columnEndType = (int) object->Get(context,
                STRING_TO_V8_VALUE("col_end_type")).ToLocalChecked()->Int32Value(context).FromJust();
                auto columnEndValue = (short) object->Get(context,
                STRING_TO_V8_VALUE("col_end_value")).ToLocalChecked()->Int32Value(context).FromJust();

               [MasonReexports style_set_grid_area
                :style
                :jsToGridPlacement(rowStartValue, rowStartType)
                :jsToGridPlacement(rowEndValue, rowEndType)
                :jsToGridPlacement(columnStartValue, columnStartType)
                :jsToGridPlacement(columnEndValue, columnEndType)];

                MASON_UPDATE_NODE(info[4])

        })

        CREATE_FUNCTION("getColumn", {
                MASON_ENTER_WITH_STYLE

                auto col_start = [MasonReexports style_get_grid_column_start:style];
                auto col_end = [MasonReexports style_get_grid_column_start:style];


                v8::Local<v8::Object> object = v8::Object::New((isolate));
                object->Set(context, STRING_TO_V8_VALUE("col_start_type"), v8::Int32::New(isolate, (int) col_start.value_type)).Check();
                object->Set(context, STRING_TO_V8_VALUE("col_start_value"), v8::Int32::New(isolate, (int) col_start.value)).Check();

                object->Set(context, STRING_TO_V8_VALUE("col_end_type"), v8::Int32::New(isolate, (int) col_end.value_type)).Check();
                object->Set(context, STRING_TO_V8_VALUE("col_end_value"), v8::Int32::New(isolate, (int) col_end.value)).Check();

                std::stringstream ss;
                if (col_start.value == col_end.value &&
                col_start.value_type == col_end.value_type) {
                    if (col_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeAuto) {
                        ss << "auto";
                    } else {
                        ss << col_start.value;
                        if (col_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeSpan) {
                            ss << " span";
                        }
                    }
                } else {
                    if (col_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeAuto) {
                        ss << "auto";
                    } else {
                        ss << col_start.value;
                        if (col_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeSpan) {
                            ss << " span";
                        }
                    }

                    ss << " / ";

                    if (col_end.value_type == CMasonGridPlacementType::MasonGridPlacementTypeAuto) {
                        ss << "auto";
                    } else {
                        ss << col_end.value;
                        if (col_end.value_type == CMasonGridPlacementType::MasonGridPlacementTypeSpan) {
                            ss << " span";
                        }
                    }
                }
                object->Set(context, STRING_TO_V8_VALUE("colFormatted"), STRING_TO_V8_VALUE(ss.str().c_str())).Check();

                info.GetReturnValue().Set(object);
        })


        CREATE_FUNCTION("setColumn", {
                MASON_ENTER_WITH_NODE_AND_STYLE

                auto object = info[3].As<v8::Object>();

                auto columnStartType = (int) object->Get(context,
                STRING_TO_V8_VALUE("col_start_value")).ToLocalChecked()->Int32Value(context).FromJust();
                auto columnStartValue = (short) object->Get(context,
                STRING_TO_V8_VALUE("col_start_type")).ToLocalChecked()->Int32Value(context).FromJust();

                auto columnEndType = (int) object->Get(context,
                STRING_TO_V8_VALUE("col_end_type")).ToLocalChecked()->Int32Value(context).FromJust();
                auto columnEndValue = (short) object->Get(context,
                STRING_TO_V8_VALUE("col_end_value")).ToLocalChecked()->Int32Value(context).FromJust();

                [MasonReexports style_set_grid_column
                :style
                :jsToGridPlacement(columnStartValue, columnStartType)
                :jsToGridPlacement(columnEndValue, columnEndType)];

                MASON_UPDATE_NODE(info[4])

        })


        CREATE_FUNCTION("getRow", {
                MASON_ENTER_WITH_STYLE

                auto row_start = [MasonReexports style_get_grid_row_start:style];
                auto row_end = [MasonReexports style_get_grid_row_start:style];


                v8::Local<v8::Object> object = v8::Object::New((isolate));

                object->Set(context, STRING_TO_V8_VALUE("row_start_type"), v8::Int32::New(isolate, (int) row_start.value_type)).Check();
                object->Set(context, STRING_TO_V8_VALUE("row_start_value"), v8::Int32::New(isolate, (int) row_start.value)).Check();

                object->Set(context, STRING_TO_V8_VALUE("row_end_type"), v8::Int32::New(isolate, (int) row_end.value_type)).Check();
                object->Set(context, STRING_TO_V8_VALUE("row_end_value"), v8::Int32::New(isolate, (int) row_end.value)).Check();

                std::stringstream row_ss;
                if (row_start.value == row_end.value &&
                row_start.value_type == row_end.value_type) {
                    if (row_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeAuto) {
                        row_ss << "auto";
                    } else {
                        row_ss << row_start.value;
                        if (row_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeSpan) {
                            row_ss << " span";
                        }
                    }
                } else {
                    if (row_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeAuto) {
                        row_ss << "auto";
                    } else {
                        row_ss << row_start.value;
                        if (row_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeSpan) {
                            row_ss << " span";
                        }
                    }

                    row_ss << " / ";

                    if (row_end.value_type == CMasonGridPlacementType::MasonGridPlacementTypeAuto) {
                        row_ss << "auto";
                    } else {
                        row_ss << row_end.value;
                        if (row_end.value_type == CMasonGridPlacementType::MasonGridPlacementTypeSpan) {
                            row_ss << " span";
                        }
                    }
                }
                object->Set(context, STRING_TO_V8_VALUE("rowFormatted"), STRING_TO_V8_VALUE(row_ss.str().c_str())).Check();

                info.GetReturnValue().Set(object);
        })


        CREATE_FUNCTION("setRow", {
                MASON_ENTER_WITH_NODE_AND_STYLE

                auto object = info[3].As<v8::Object>();

                auto rowStartType = (int) object->Get(context,
                STRING_TO_V8_VALUE("row_start_type")).ToLocalChecked()->Int32Value(context).FromJust();

                auto rowStartValue = (short) object->Get(context,
                STRING_TO_V8_VALUE("row_start_value")).ToLocalChecked()->Int32Value(context).FromJust();

                auto rowEndType = (int) object->Get(context,
                STRING_TO_V8_VALUE("row_end_type")).ToLocalChecked()->Int32Value(context).FromJust();
                auto rowEndValue = (short) object->Get(context,
                STRING_TO_V8_VALUE("row_end_value")).ToLocalChecked()->Int32Value(context).FromJust();

                [MasonReexports style_set_grid_row
                :style
                :jsToGridPlacement(rowStartValue, rowStartType)
                :jsToGridPlacement(rowEndValue, rowEndType)];

                MASON_UPDATE_NODE(info[4])

        })


        MASON_GET_GRID_PROPERTY("getColumnStart", style_get_grid_column_start)
        MASON_GET_GRID_PROPERTY("getColumnEnd", style_get_grid_column_end)
        MASON_GET_GRID_PROPERTY("getRowStart", style_get_grid_row_start)
        MASON_GET_GRID_PROPERTY("getRowEnd", style_get_grid_row_end)

        MASON_SET_GRID_PROPERTY("setColumnStart", style_set_grid_column_start)
        MASON_SET_GRID_PROPERTY("setColumnEnd", style_set_grid_column_end)
        MASON_SET_GRID_PROPERTY("setRowStart", style_set_grid_row_start)
        MASON_SET_GRID_PROPERTY("setRowEnd", style_set_grid_row_end)


        CREATE_FUNCTION("getGridTemplateRows", {
                MASON_ENTER_WITH_STYLE
                auto rows = [MasonReexports style_get_grid_template_rows:style];
                auto parsed = [MasonReexports util_parse_auto_repeating_track_sizing_function:rows];
                [MasonReexports destroyWithTrackSizingFunctionArray:rows];
                info.GetReturnValue().Set(STRING_TO_V8_VALUE(parsed.UTF8String));

        })

        CREATE_FUNCTION("getGridTemplateColumns", {
                MASON_ENTER_WITH_STYLE
                auto columns = [MasonReexports style_get_grid_template_columns:style];
                auto parsed = [MasonReexports util_parse_auto_repeating_track_sizing_function:columns];
                [MasonReexports destroyWithTrackSizingFunctionArray:columns];
                info.GetReturnValue().Set(STRING_TO_V8_VALUE(parsed.UTF8String));
        })

        CREATE_FUNCTION("setGridTemplateRows", {
                MASON_ENTER_WITH_NODE_AND_STYLE

                auto array = info[3].As<v8::Array>();
                auto value = toTrackSizingFunction(isolate, array);
                CMasonTrackSizingFunctionArray rows = {};
                rows.array = value.data();
                rows.length = value.size();

                [MasonReexports style_set_grid_template_rows:style :&rows];

                    for(int i = 0; i < value.size();i++){
                        auto it = value[i];
                        destroy_c_mason_track_sizing_function(it);
                    }

                MASON_UPDATE_NODE(info[4])

        })

        CREATE_FUNCTION("setGridTemplateColumns", {
                MASON_ENTER_WITH_NODE_AND_STYLE

                auto array = info[3].As<v8::Array>();
                auto value = toTrackSizingFunction(isolate, array);
                CMasonTrackSizingFunctionArray columns = {};
                columns.array = value.data();
                columns.length = value.size();

               [MasonReexports style_set_grid_template_columns:style :&columns];

                    for(int i = 0; i < value.size();i++){
                        auto it = value[i];
                        destroy_c_mason_track_sizing_function(it);
                    }

                MASON_UPDATE_NODE(info[4])

        })

        CREATE_FUNCTION("layout", {
            MASON_ENTER_WITH_NODE

            // TODO
        })

        CREATE_FUNCTION("getComputedLayout",  {
            MASON_ENTER_WITH_NODE
            // TODO
        })

    });
}


@implementation MasonV8ModuleInstaller

- (void )install {
    v8::Isolate* isolate = tns::Runtime::GetCurrentRuntime()->GetIsolate();
    installV8Module(isolate);
}

@end
