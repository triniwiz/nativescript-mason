#import <NativeScript/runtime/Runtime.h>
#import "cpp/include/mason_native.h"
#import <sstream>

using namespace std;

template <typename Lambda>
void AddFunctionToV8Object(v8::Local<v8::Object> target, const char *functionName, Lambda &&callback)
{
  v8::Isolate *isolate = target->GetIsolate();
  v8::Local<v8::FunctionTemplate> funcTemplate = v8::FunctionTemplate::New(isolate, callback);
  v8::Local<v8::Function> function = funcTemplate->GetFunction(
                                                     isolate->GetCurrentContext())
                                         .ToLocalChecked();
  v8::Local<v8::String> funcName = v8::String::NewFromUtf8(isolate,
                                                           functionName)
                                       .ToLocalChecked();
  target->Set(isolate->GetCurrentContext(), funcName, function).Check();
}

#define GET_INT_ARG(index, name) \
  auto name = info[index]->Int32Value(context).FromJust();

#define GET_FLOAT_ARG(index, name) \
  auto name = (float)info[index]->NumberValue(context).FromJust();

#define CREATE_V8_MODULE(moduleName, lambda)                                                        \
  v8::Local<v8::Context> ctx = (isolate)->GetCurrentContext();                                      \
  v8::Local<v8::Object> global = ctx->Global();                                                     \
  v8::Local<v8::Object> moduleObject = v8::Object::New((isolate));                                  \
  v8::Local<v8::String> moduleObjectName = v8::String::NewFromUtf8(                                 \
                                               (isolate), (moduleName), v8::NewStringType::kNormal) \
                                               .ToLocalChecked();                                   \
  lambda(moduleObject);                                                                             \
  global->Set(ctx, moduleObjectName, moduleObject).FromJust();

#define CREATE_FUNCTION(functionName, functionBody)                                                             \
  {                                                                                                             \
    AddFunctionToV8Object(moduleObject, functionName, [](const v8::FunctionCallbackInfo<v8::Value> &info) {               \
V8_ENTER                                                                                                        \
functionBody }); \
  }

#define V8_ENTER                            \
  v8::Isolate *isolate = info.GetIsolate(); \
  v8::Local<v8::Context> context = isolate->GetCurrentContext();

#define RETURN_UNDEFINED \
  info.GetReturnValue().SetUndefined();

#define MASON_ENTER \
  auto mason = reinterpret_cast<void *>(info[0].As<v8::BigInt>()->Int64Value());

#define MASON_ENTER_WITH_NODE                                                    \
  auto mason = reinterpret_cast<void *>(info[0].As<v8::BigInt>()->Int64Value()); \
  auto node = reinterpret_cast<void *>(info[1].As<v8::BigInt>()->Int64Value());

#define MASON_ENTER_WITH_NODE_AND_STYLE                                          \
  auto mason = reinterpret_cast<void *>(info[0].As<v8::BigInt>()->Int64Value()); \
  auto node = reinterpret_cast<void *>(info[1].As<v8::BigInt>()->Int64Value());  \
  auto style = reinterpret_cast<void *>(info[2].As<v8::BigInt>()->Int64Value());

#define MASON_ENTER_WITH_STYLE \
  auto style = reinterpret_cast<void *>(info[0].As<v8::BigInt>()->Int64Value());

#define MASON_UPDATE_NODE(arg)                        \
  if (arg->BooleanValue(isolate))                     \
  {                                                   \
    [MasonReexports node_set_style:mason:node:style]; \
  }

#define MASON_SET_NUMBER_PROPERTY(name, setter)           \
  CREATE_FUNCTION(name, {                                 \
    MASON_ENTER_WITH_NODE_AND_STYLE                       \
    auto value = info[3]->Int32Value(context).FromJust(); \
    [MasonReexports setter:style:value];                  \
    MASON_UPDATE_NODE(info[4])                            \
    RETURN_UNDEFINED                                      \
  })

#define MASON_SET_FLOAT_PROPERTY(name, setter)             \
  CREATE_FUNCTION(name, {                                  \
    MASON_ENTER_WITH_NODE_AND_STYLE                        \
    auto value = info[3]->NumberValue(context).FromJust(); \
    [MasonReexports setter:style:value];                   \
    MASON_UPDATE_NODE(info[4])                             \
    RETURN_UNDEFINED                                       \
  })

#define MASON_GET_NUMBER_PROPERTY(name, getter)               \
  CREATE_FUNCTION(name, {                                     \
    MASON_ENTER_WITH_STYLE                                    \
    info.GetReturnValue().Set([MasonReexports getter:style]); \
  });

#define MASON_SET_LENGTH_PROPERTY(name, setter)                                   \
  CREATE_FUNCTION(name, {                                                         \
    MASON_ENTER_WITH_NODE_AND_STYLE                                               \
    auto value = info[3]->NumberValue(context).FromJust();                        \
    auto value_type = info[4]->Int32Value(context).FromJust();                    \
    [MasonReexports setter:style:value:jsToLengthPercentageAutoType(value_type)]; \
    MASON_UPDATE_NODE(info[5])                                                    \
    RETURN_UNDEFINED                                                              \
  })

#define MASON_SET_LENGTH_PROPERTY_ALL_SIDES(name, setter)                         \
  CREATE_FUNCTION(name, {                                                         \
    MASON_ENTER_WITH_NODE_AND_STYLE                                               \
    auto value = info[3]->NumberValue(context).FromJust();                        \
    auto value_type = info[4]->Int32Value(context).FromJust();                    \
    [MasonReexports setter:style:value:jsToLengthPercentageAutoType(value_type)]; \
    MASON_UPDATE_NODE(info[5])                                                    \
    RETURN_UNDEFINED                                                              \
  })

#define MASON_SET_LENGTH_PROPERTY_NO_AUTO(name, setter)                       \
  CREATE_FUNCTION(name, {                                                     \
    MASON_ENTER_WITH_NODE_AND_STYLE                                           \
    auto value = info[3]->NumberValue(context).FromJust();                    \
    auto value_type = info[4]->Int32Value(context).FromJust();                \
    [MasonReexports setter:style:value:jsToLengthPercentageType(value_type)]; \
    MASON_UPDATE_NODE(info[5])                                                \
    RETURN_UNDEFINED                                                          \
  })

#define MASON_SET_LENGTH_PROPERTY_NO_AUTO_ALL_SIDES(name, setter)             \
  CREATE_FUNCTION(name, {                                                     \
    MASON_ENTER_WITH_NODE_AND_STYLE                                           \
    auto value = info[3]->NumberValue(context).FromJust();                    \
    auto value_type = info[4]->Int32Value(context).FromJust();                \
    [MasonReexports setter:style:value:jsToLengthPercentageType(value_type)]; \
    MASON_UPDATE_NODE(info[5])                                                \
    RETURN_UNDEFINED                                                          \
  })

#define MASON_GET_LENGTH_PROPERTY(name, getter)                                                  \
  CREATE_FUNCTION(name, {                                                                        \
    MASON_ENTER_WITH_STYLE                                                                       \
    info.GetReturnValue().Set(lengthPercentageAutoToJS(isolate, [MasonReexports getter:style])); \
  });

#define MASON_GET_LENGTH_PROPERTY_NO_AUTO(name, getter)                                      \
  CREATE_FUNCTION(name, {                                                                    \
    MASON_ENTER_WITH_STYLE                                                                   \
    info.GetReturnValue().Set(lengthPercentageToJS(isolate, [MasonReexports getter:style])); \
  });

#define MASON_SET_DIMENSION_PROPERTY(name, setter)                     \
  CREATE_FUNCTION(name, {                                              \
    MASON_ENTER_WITH_NODE_AND_STYLE                                    \
    auto value = info[3]->NumberValue(context).FromJust();             \
    auto value_type = info[4]->Int32Value(context).FromJust();         \
    [MasonReexports setter:style:value:jsToDimensionType(value_type)]; \
    MASON_UPDATE_NODE(info[5])                                         \
    RETURN_UNDEFINED                                                   \
  })

#define STRING_TO_V8_VALUE(value) \
  v8::String::NewFromUtf8(isolate, value).ToLocalChecked()

#define DOUBLE_TO_V8_VALUE(value) \
  v8::Number::New(isolate, value)

#define MASON_GET_DIMENSION_PROPERTY(name, getter)                                    \
  CREATE_FUNCTION(name, {                                                             \
    MASON_ENTER_WITH_STYLE                                                            \
    info.GetReturnValue().Set(dimensionToJS(isolate, [MasonReexports getter:style])); \
  });

#define MASON_SET_SIZE_PROPERTY(name, setter)                                                                              \
  CREATE_FUNCTION(name, {                                                                                                  \
    MASON_ENTER_WITH_NODE_AND_STYLE                                                                                        \
    auto width = info[3]->NumberValue(context).FromJust();                                                                 \
    auto width_type = info[4]->Int32Value(context).FromJust();                                                             \
    auto height = info[3]->NumberValue(context).FromJust();                                                                \
    auto height_type = info[4]->Int32Value(context).FromJust();                                                            \
    [MasonReexports setter:style:width:jsToLengthPercentageType(width_type):height:jsToLengthPercentageType(height_type)]; \
    MASON_UPDATE_NODE(info[7])                                                                                             \
    RETURN_UNDEFINED                                                                                                       \
  })

#define MASON_GET_SIZE_PROPERTY(name, getter)                                    \
  CREATE_FUNCTION(name, {                                                        \
    MASON_ENTER_WITH_STYLE                                                       \
    info.GetReturnValue().Set(sizeToJS(isolate, [MasonReexports getter:style])); \
  });

#define MASON_GET_GRID_PROPERTY(name, getter)                                             \
  CREATE_FUNCTION(name, {                                                                 \
    MASON_ENTER_WITH_STYLE                                                                \
    info.GetReturnValue().Set(gridPlacementToJS(isolate, [MasonReexports getter:style])); \
  });

#define MASON_SET_GRID_PROPERTY(name, setter)                       \
  CREATE_FUNCTION(name, {                                           \
    MASON_ENTER_WITH_NODE_AND_STYLE                                 \
    auto object = info[3].As<v8::Object>();                         \
    auto value = (short)object->Get(context,                        \
                                    STRING_TO_V8_VALUE("value"))    \
                     .ToLocalChecked()                              \
                     ->Int32Value(context)                          \
                     .FromJust();                                   \
    auto type = (int)object->Get(context,                           \
                                 STRING_TO_V8_VALUE("type"))        \
                    .ToLocalChecked()                               \
                    ->Int32Value(context)                           \
                    .FromJust();                                    \
    if (type >= 0 && type < 3)                                      \
    {                                                               \
      [MasonReexports setter:style:jsToGridPlacement(value, type)]; \
      MASON_UPDATE_NODE(info[4])                                    \
    }                                                               \
  })

inline static v8::Local<v8::Value>
gridPlacementToJS(v8::Isolate *isolate, CMasonGridPlacement placement)
{
  switch (placement.value_type)
  {
  case CMasonGridPlacementType::MasonGridPlacementTypeAuto:
  {
    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("value"),
                DOUBLE_TO_V8_VALUE(placement.value))
        .Check();
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("type"),
                DOUBLE_TO_V8_VALUE(0))
        .Check();
    return object;
  }
  case CMasonGridPlacementType::MasonGridPlacementTypeLine:
  {

    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("value"),
                DOUBLE_TO_V8_VALUE(placement.value))
        .Check();
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("type"),
                DOUBLE_TO_V8_VALUE(1))
        .Check();
    return object;
  }
  case CMasonGridPlacementType::MasonGridPlacementTypeSpan:
  {
    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("value"),
                DOUBLE_TO_V8_VALUE(placement.value))
        .Check();
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("type"),
                DOUBLE_TO_V8_VALUE(2))
        .Check();
    return object;
  }
  default:
    return v8::Undefined(isolate);
  }
}

inline static CMasonGridPlacement jsToGridPlacement(short value, int value_type)
{
  switch ((CMasonGridPlacementType)value_type)
  {
  case CMasonGridPlacementType::MasonGridPlacementTypeAuto:
  {
    return CMasonGridPlacement{0, CMasonGridPlacementType::MasonGridPlacementTypeAuto};
  }
  case CMasonGridPlacementType::MasonGridPlacementTypeLine:
  {
    return CMasonGridPlacement{value, CMasonGridPlacementType::MasonGridPlacementTypeLine};
  }
  case CMasonGridPlacementType::MasonGridPlacementTypeSpan:
  {
    return CMasonGridPlacement{value, CMasonGridPlacementType::MasonGridPlacementTypeSpan};
  }
  default:
    // assert ??
    return CMasonGridPlacement{0, CMasonGridPlacementType::MasonGridPlacementTypeAuto};
  }
}

inline static v8::Local<v8::Value>
lengthPercentageToJS(v8::Isolate *isolate, CMasonLengthPercentage length)
{
  switch (length.value_type)
  {
  case CMasonLengthPercentageType::MasonLengthPercentagePercent:
  {
    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("value"),
                DOUBLE_TO_V8_VALUE(length.value / 100))
        .Check();
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("unit"),
                STRING_TO_V8_VALUE("%"))
        .Check();
    return object;
  }
  case CMasonLengthPercentageType::MasonLengthPercentagePoints:
  {

    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("value"),
                DOUBLE_TO_V8_VALUE(length.value))
        .Check();
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("unit"),
                STRING_TO_V8_VALUE("px"))
        .Check();
    return object;
  }
  default:
    return v8::Undefined(isolate);
  }
}

inline static CMasonLengthPercentage jsToLengthPercentage(float value, int value_type)
{
  switch ((CMasonLengthPercentageType)value_type)
  {
  case CMasonLengthPercentageType::MasonLengthPercentagePercent:
  {
    return CMasonLengthPercentage{value, CMasonLengthPercentageType::MasonLengthPercentagePercent};
  }
  case CMasonLengthPercentageType::MasonLengthPercentagePoints:
  {
    return CMasonLengthPercentage{value, CMasonLengthPercentageType::MasonLengthPercentagePoints};
  }
  default:
    // assert ??
    return CMasonLengthPercentage{0, CMasonLengthPercentageType::MasonLengthPercentagePoints};
  }
}

inline static CMasonLengthPercentageType jsToLengthPercentageType(int value_type)
{
  switch ((CMasonLengthPercentageType)value_type)
  {
  case CMasonLengthPercentageType::MasonLengthPercentagePercent:
  {
    return CMasonLengthPercentageType::MasonLengthPercentagePercent;
  }
  case CMasonLengthPercentageType::MasonLengthPercentagePoints:
  {
    return CMasonLengthPercentageType::MasonLengthPercentagePoints;
  }
  default:
    // assert invalid type ???
    return CMasonLengthPercentageType::MasonLengthPercentagePoints;
  }
}

inline static v8::Local<v8::Value>
lengthPercentageAutoToJS(v8::Isolate *isolate, CMasonLengthPercentageAuto length)
{
  switch (length.value_type)
  {
  case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto:
    return STRING_TO_V8_VALUE("auto");
  case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent:
  {
    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("value"),
                DOUBLE_TO_V8_VALUE(length.value / 100))
        .Check();
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("unit"),
                STRING_TO_V8_VALUE("%"))
        .Check();
    return object;
  }
  case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints:
  {
    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("value"),
                DOUBLE_TO_V8_VALUE(length.value))
        .Check();
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("unit"),
                STRING_TO_V8_VALUE("px"))
        .Check();

    return object;
  }
  default:
    return v8::Undefined(isolate);
  }
}

inline static CMasonLengthPercentageAuto jsToLengthPercentageAuto(float value, int value_type)
{
  switch ((CMasonLengthPercentageAutoType)value_type)
  {
  case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto:
    return CMasonLengthPercentageAuto{value, CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto};
  case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent:
  {
    return CMasonLengthPercentageAuto{value, CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent};
  }
  case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints:
  {
    return CMasonLengthPercentageAuto{value, CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints};
  }
  default:
    // assert invalid type ???
    return CMasonLengthPercentageAuto{0, CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints};
  }
}

inline static CMasonLengthPercentageAutoType jsToLengthPercentageAutoType(int value_type)
{
  switch ((CMasonLengthPercentageAutoType)value_type)
  {
  case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto:
    return CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto;
  case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent:
  {
    return CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent;
  }
  case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints:
  {
    return CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints;
  }
  default:
    // assert invalid type ???
    return CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto;
  }
}

inline static v8::Local<v8::Value> dimensionToJS(v8::Isolate *isolate, CMasonDimension dimension)
{
  switch ((CMasonDimensionType)dimension.value_type)
  {
  case CMasonDimensionType::MasonDimensionAuto:
    return STRING_TO_V8_VALUE("auto");
  case CMasonDimensionType::MasonDimensionPercent:
  {

    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("value"),
                DOUBLE_TO_V8_VALUE(dimension.value / 100))
        .Check();
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("unit"),
                STRING_TO_V8_VALUE("%"))
        .Check();
    return object;
  }
  case CMasonDimensionType::MasonDimensionPoints:
  {
    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("value"),
                DOUBLE_TO_V8_VALUE(dimension.value))
        .Check();
    object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("unit"),
                STRING_TO_V8_VALUE("px"))
        .Check();
    return object;
  }
  default:
    return v8::Undefined(isolate);
  }
}

inline static CMasonDimension jsToDimension(float value, int value_type)
{
  switch ((CMasonDimensionType)value_type)
  {
  case CMasonDimensionType::MasonDimensionAuto:
    return CMasonDimension{value, CMasonDimensionType::MasonDimensionAuto};
  case CMasonDimensionType::MasonDimensionPercent:
  {
    return CMasonDimension{value, CMasonDimensionType::MasonDimensionPercent};
  }
  case CMasonDimensionType::MasonDimensionPoints:
  {
    return CMasonDimension{value, CMasonDimensionType::MasonDimensionPoints};
  }
  default:
    // assert invalid type ???
    return CMasonDimension{0, CMasonDimensionType::MasonDimensionPoints};
  }
}

inline static CMasonDimensionType jsToDimensionType(int value_type)
{
  switch ((CMasonDimensionType)value_type)
  {
  case CMasonDimensionType::MasonDimensionAuto:
    return CMasonDimensionType::MasonDimensionAuto;
  case CMasonDimensionType::MasonDimensionPercent:
  {
    return CMasonDimensionType::MasonDimensionPercent;
  }
  case CMasonDimensionType::MasonDimensionPoints:
  {
    return CMasonDimensionType::MasonDimensionPoints;
  }
  default:
    // assert invalid type ???
    return CMasonDimensionType::MasonDimensionAuto;
  }
}

// inline static v8::Local<v8::Value> sizeToJS(v8::Isolate *isolate, CMasonDimensionSize size) {
//     v8::Local<v8::Object> object = v8::Object::New((isolate));
//     object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("width"),
//                 dimensionToJS(isolate, size.width)).Check();
//     object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("height"),
//                 dimensionToJS(isolate, size.width)).Check();
//     return object;
// }

inline static v8::Local<v8::Object>
sizeToJS(v8::Isolate *isolate, CMasonLengthPercentageSize size)
{

  v8::Local<v8::Object> object = v8::Object::New((isolate));
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("width"),
              lengthPercentageToJS(isolate, size.width))
      .Check();
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("height"),
              lengthPercentageToJS(isolate, size.width))
      .Check();
  return object;
}

// inline static v8::Local<v8::Object>
// sizeToJS(v8::Isolate *isolate, CMasonLengthPercentageAutoSize size) {
//
//     v8::Local<v8::Object> object = v8::Object::New((isolate));
//     object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("width"),
//                 lengthPercentageAutoToJS(isolate, size.width)).Check();
//     object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("height"),
//                 lengthPercentageAutoToJS(isolate, size.width)).Check();
//     return object;
// }

// inline static v8::Local<v8::Object> rectToJS(v8::Isolate *isolate, CMasonDimensionRect rect) {
//
//     v8::Local<v8::Object> object = v8::Object::New((isolate));
//     object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("left"),
//                 dimensionToJS(isolate, rect.left)).Check();
//     object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("right"),
//                 dimensionToJS(isolate, rect.right)).Check();
//     object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("top"),
//                 dimensionToJS(isolate, rect.top)).Check();
//     object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("bottom"),
//                 dimensionToJS(isolate, rect.bottom)).Check();
//     return object;
//
// }

// inline static v8::Local<v8::Object>
// rectToJS(v8::Isolate *isolate, CMasonLengthPercentageRect rect) {
//
//     v8::Local<v8::Object> object = v8::Object::New((isolate));
//     object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("left"),
//                 lengthPercentageToJS(isolate, rect.left)).Check();
//     object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("right"),
//                 lengthPercentageToJS(isolate, rect.right)).Check();
//     object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("top"),
//                 lengthPercentageToJS(isolate, rect.top)).Check();
//     object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("bottom"),
//                 lengthPercentageToJS(isolate, rect.bottom)).Check();
//     return object;
//
// }

// inline static v8::Local<v8::Object>
// rectToJS(v8::Isolate *isolate, CMasonLengthPercentageAutoRect rect) {
//     v8::Local<v8::Object> object = v8::Object::New((isolate));
//     object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("left"),
//                 lengthPercentageAutoToJS(isolate, rect.left)).Check();
//     object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("right"),
//                 lengthPercentageAutoToJS(isolate, rect.right)).Check();
//     object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("top"),
//                 lengthPercentageAutoToJS(isolate, rect.top)).Check();
//     object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("bottom"),
//                 lengthPercentageAutoToJS(isolate, rect.bottom)).Check();
//     return object;
//
// }

@interface MasonV8ModuleInstaller : NSObject

- (void)install;

@end
