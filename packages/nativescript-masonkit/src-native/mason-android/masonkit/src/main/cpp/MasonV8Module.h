//
// Created by Osei Fortune on 14/12/2022.
//

#ifndef MASON_NATIVE_MASONJSIMODULE_H
#define MASON_NATIVE_MASONJSIMODULE_H

#include "libplatform/libplatform.h"
#include "v8.h"

#import "mason-android/src/lib.rs.h"
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
  int64_t mason = info[0].As<v8::BigInt>()->Int64Value();

#define MASON_ENTER_WITH_NODE                             \
  int64_t mason = info[0].As<v8::BigInt>()->Int64Value(); \
  int64_t node = info[1].As<v8::BigInt>()->Int64Value();

#define MASON_ENTER_WITH_NODE_AND_STYLE                   \
  int64_t mason = info[0].As<v8::BigInt>()->Int64Value(); \
  int64_t node = info[1].As<v8::BigInt>()->Int64Value();  \
  int64_t style = info[2].As<v8::BigInt>()->Int64Value();

#define MASON_ENTER_WITH_STYLE \
  int64_t style = info[0].As<v8::BigInt>()->Int64Value();

#define MASON_UPDATE_NODE(arg)                           \
  if (arg->BooleanValue(isolate))                        \
  {                                                      \
    mason_node_update_and_set_style(mason, node, style); \
  }

#define MASON_SET_NUMBER_PROPERTY(name, setter)           \
  CREATE_FUNCTION(name, {                                 \
    MASON_ENTER_WITH_NODE_AND_STYLE                       \
    auto value = info[3]->Int32Value(context).FromJust(); \
    setter(style, value);                                 \
    MASON_UPDATE_NODE(info[4])                            \
    RETURN_UNDEFINED                                      \
  })

#define MASON_SET_FLOAT_PROPERTY(name, setter)             \
  CREATE_FUNCTION(name, {                                  \
    MASON_ENTER_WITH_NODE_AND_STYLE                        \
    auto value = info[3]->NumberValue(context).FromJust(); \
    setter(style, value);                                  \
    MASON_UPDATE_NODE(info[4])                             \
    RETURN_UNDEFINED                                       \
  })

#define MASON_GET_NUMBER_PROPERTY(name, getter) \
  CREATE_FUNCTION(name, {                       \
    MASON_ENTER_WITH_STYLE                      \
    info.GetReturnValue().Set(getter(style));   \
  });

#define MASON_SET_LENGTH_PROPERTY(name, setter)                     \
  CREATE_FUNCTION(name, {                                           \
    MASON_ENTER_WITH_NODE_AND_STYLE                                 \
    auto value = info[3]->Int32Value(context).FromJust();           \
    auto value_type = info[4]->Int32Value(context).FromJust();      \
    setter(style, value, jsToLengthPercentageAutoType(value_type)); \
    MASON_UPDATE_NODE(info[5])                                      \
    RETURN_UNDEFINED                                                \
  })

#define MASON_SET_LENGTH_PROPERTY_NO_AUTO(name, setter)         \
  CREATE_FUNCTION(name, {                                       \
    MASON_ENTER_WITH_NODE_AND_STYLE                             \
    auto value = info[3]->Int32Value(context).FromJust();       \
    auto value_type = info[4]->Int32Value(context).FromJust();  \
    setter(style, value, jsToLengthPercentageType(value_type)); \
    MASON_UPDATE_NODE(info[5])                                  \
    RETURN_UNDEFINED                                            \
  })

#define MASON_GET_LENGTH_PROPERTY(name, getter)                                  \
  CREATE_FUNCTION(name, {                                                        \
    MASON_ENTER_WITH_STYLE                                                       \
    info.GetReturnValue().Set(lengthPercentageAutoToJS(isolate, getter(style))); \
  });

#define MASON_GET_LENGTH_PROPERTY_NO_AUTO(name, getter)                      \
  CREATE_FUNCTION(name, {                                                    \
    MASON_ENTER_WITH_STYLE                                                   \
    info.GetReturnValue().Set(lengthPercentageToJS(isolate, getter(style))); \
  });

#define MASON_SET_DIMENSION_PROPERTY(name, setter)             \
  CREATE_FUNCTION(name, {                                      \
    MASON_ENTER_WITH_NODE_AND_STYLE                            \
    auto value = info[3]->Int32Value(context).FromJust();      \
    auto value_type = info[4]->Int32Value(context).FromJust(); \
    setter(style, value, jsToDimensionType(value_type));       \
    MASON_UPDATE_NODE(info[5])                                 \
    RETURN_UNDEFINED                                           \
  })

#define STRING_TO_V8_VALUE(value) \
  v8::String::NewFromUtf8(isolate, value).ToLocalChecked()

#define DOUBLE_TO_V8_VALUE(value) \
  v8::Number::New(isolate, value)

#define MASON_GET_DIMENSION_PROPERTY(name, getter)                    \
  CREATE_FUNCTION(name, {                                             \
    MASON_ENTER_WITH_STYLE                                            \
    info.GetReturnValue().Set(dimensionToJS(isolate, getter(style))); \
  });

#define MASON_SET_SIZE_PROPERTY(name, setter)                                                                  \
  CREATE_FUNCTION(name, {                                                                                      \
    MASON_ENTER_WITH_NODE_AND_STYLE                                                                            \
    auto width = info[3]->NumberValue(context).FromJust();                                                     \
    auto width_type = info[4]->Int32Value(context).FromJust();                                                 \
    auto height = info[3]->NumberValue(context).FromJust();                                                    \
    auto height_type = info[4]->Int32Value(context).FromJust();                                                \
    setter(style, width, jsToLengthPercentageType(width_type), height, jsToLengthPercentageType(height_type)); \
    MASON_UPDATE_NODE(info[7])                                                                                 \
    RETURN_UNDEFINED                                                                                           \
  })

#define MASON_GET_SIZE_PROPERTY(name, getter)                    \
  CREATE_FUNCTION(name, {                                        \
    MASON_ENTER_WITH_STYLE                                       \
    info.GetReturnValue().Set(sizeToJS(isolate, getter(style))); \
  });

#define MASON_GET_GRID_PROPERTY(name, getter)                             \
  CREATE_FUNCTION(name, {                                                 \
    MASON_ENTER_WITH_STYLE                                                \
    info.GetReturnValue().Set(gridPlacementToJS(isolate, getter(style))); \
  });

#define MASON_SET_GRID_PROPERTY(name, setter)                    \
  CREATE_FUNCTION(name, {                                        \
    MASON_ENTER_WITH_NODE_AND_STYLE                              \
    auto object = info[3].As<v8::Object>();                      \
    auto value = (short)object->Get(context,                     \
                                    STRING_TO_V8_VALUE("value")) \
                     .ToLocalChecked()                           \
                     ->Int32Value(context)                       \
                     .FromJust();                                \
    auto type = (int)object->Get(context,                        \
                                 STRING_TO_V8_VALUE("type"))     \
                    .ToLocalChecked()                            \
                    ->Int32Value(context)                        \
                    .FromJust();                                 \
    if (type >= 0 && type < 3)                                   \
    {                                                            \
      setter(style, jsToGridPlacement(value, type));             \
      MASON_UPDATE_NODE(info[4])                                 \
    }                                                            \
  })

inline static v8::Local<v8::Value>
gridPlacementToJS(v8::Isolate *isolate, CMasonGridPlacement placement)
{
  switch (placement.value_type)
  {
  case CMasonGridPlacementType::Auto:
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
  case CMasonGridPlacementType::Line:
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
  case CMasonGridPlacementType::Span:
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
  case CMasonGridPlacementType::Auto:
  {
    return CMasonGridPlacement{0, CMasonGridPlacementType::Auto};
  }
  case CMasonGridPlacementType::Line:
  {
    return CMasonGridPlacement{value, CMasonGridPlacementType::Line};
  }
  case CMasonGridPlacementType::Span:
  {
    return CMasonGridPlacement{value, CMasonGridPlacementType::Span};
  }
  default:
    // assert ??
    return CMasonGridPlacement{0, CMasonGridPlacementType::Auto};
  }
}

inline static v8::Local<v8::Value>
lengthPercentageToJS(v8::Isolate *isolate, CMasonLengthPercentage length)
{
  switch (length.value_type)
  {
  case CMasonLengthPercentageType::Percent:
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
  case CMasonLengthPercentageType::Points:
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
  case CMasonLengthPercentageType::Percent:
  {
    return CMasonLengthPercentage{value, CMasonLengthPercentageType::Percent};
  }
  case CMasonLengthPercentageType::Points:
  {
    return CMasonLengthPercentage{value, CMasonLengthPercentageType::Points};
  }
  default:
    // assert ??
    return CMasonLengthPercentage{0, CMasonLengthPercentageType::Points};
  }
}

inline static CMasonLengthPercentageType jsToLengthPercentageType(int value_type)
{
  switch ((CMasonLengthPercentageType)value_type)
  {
  case CMasonLengthPercentageType::Percent:
  {
    return CMasonLengthPercentageType::Percent;
  }
  case CMasonLengthPercentageType::Points:
  {
    return CMasonLengthPercentageType::Points;
  }
  default:
    // assert invalid type ???
    return CMasonLengthPercentageType::Points;
  }
}

inline static v8::Local<v8::Value>
lengthPercentageAutoToJS(v8::Isolate *isolate, CMasonLengthPercentageAuto length)
{
  switch (length.value_type)
  {
  case CMasonLengthPercentageAutoType::Auto:
    return STRING_TO_V8_VALUE("auto");
  case CMasonLengthPercentageAutoType::Percent:
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
  case CMasonLengthPercentageAutoType::Points:
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
  case CMasonLengthPercentageAutoType::Auto:
    return CMasonLengthPercentageAuto{value, CMasonLengthPercentageAutoType::Auto};
  case CMasonLengthPercentageAutoType::Percent:
  {
    return CMasonLengthPercentageAuto{value, CMasonLengthPercentageAutoType::Percent};
  }
  case CMasonLengthPercentageAutoType::Points:
  {
    return CMasonLengthPercentageAuto{value, CMasonLengthPercentageAutoType::Points};
  }
  default:
    // assert invalid type ???
    return CMasonLengthPercentageAuto{0, CMasonLengthPercentageAutoType::Points};
  }
}

inline static CMasonLengthPercentageAutoType jsToLengthPercentageAutoType(int value_type)
{
  switch ((CMasonLengthPercentageAutoType)value_type)
  {
  case CMasonLengthPercentageAutoType::Auto:
    return CMasonLengthPercentageAutoType::Auto;
  case CMasonLengthPercentageAutoType::Percent:
  {
    return CMasonLengthPercentageAutoType::Percent;
  }
  case CMasonLengthPercentageAutoType::Points:
  {
    return CMasonLengthPercentageAutoType::Points;
  }
  default:
    // assert invalid type ???
    return CMasonLengthPercentageAutoType::Auto;
  }
}

inline static v8::Local<v8::Value> dimensionToJS(v8::Isolate *isolate, CMasonDimension dimension)
{
  switch ((CMasonDimensionType)dimension.value_type)
  {
  case CMasonDimensionType::Auto:
    return STRING_TO_V8_VALUE("auto");
  case CMasonDimensionType::Percent:
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
  case CMasonDimensionType::Points:
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
  case CMasonDimensionType::Auto:
    return CMasonDimension{value, CMasonDimensionType::Auto};
  case CMasonDimensionType::Percent:
  {
    return CMasonDimension{value, CMasonDimensionType::Percent};
  }
  case CMasonDimensionType::Points:
  {
    return CMasonDimension{value, CMasonDimensionType::Points};
  }
  default:
    // assert invalid type ???
    return CMasonDimension{0, CMasonDimensionType::Points};
  }
}

inline static CMasonDimensionType jsToDimensionType(int value_type)
{
  switch ((CMasonDimensionType)value_type)
  {
  case CMasonDimensionType::Auto:
    return CMasonDimensionType::Auto;
  case CMasonDimensionType::Percent:
  {
    return CMasonDimensionType::Percent;
  }
  case CMasonDimensionType::Points:
  {
    return CMasonDimensionType::Points;
  }
  default:
    // assert invalid type ???
    return CMasonDimensionType::Auto;
  }
}

inline static v8::Local<v8::Value> sizeToJS(v8::Isolate *isolate, CMasonDimensionSize size)
{
  v8::Local<v8::Object> object = v8::Object::New((isolate));
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("width"),
              dimensionToJS(isolate, size.width))
      .Check();
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("height"),
              dimensionToJS(isolate, size.width))
      .Check();
  return object;
}

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

inline static v8::Local<v8::Object>
sizeToJS(v8::Isolate *isolate, CMasonLengthPercentageAutoSize size)
{

  v8::Local<v8::Object> object = v8::Object::New((isolate));
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("width"),
              lengthPercentageAutoToJS(isolate, size.width))
      .Check();
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("height"),
              lengthPercentageAutoToJS(isolate, size.width))
      .Check();
  return object;
}

inline static v8::Local<v8::Object> rectToJS(v8::Isolate *isolate, CMasonDimensionRect rect)
{

  v8::Local<v8::Object> object = v8::Object::New((isolate));
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("left"),
              dimensionToJS(isolate, rect.left))
      .Check();
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("right"),
              dimensionToJS(isolate, rect.right))
      .Check();
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("top"),
              dimensionToJS(isolate, rect.top))
      .Check();
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("bottom"),
              dimensionToJS(isolate, rect.bottom))
      .Check();
  return object;
}

inline static v8::Local<v8::Object>
rectToJS(v8::Isolate *isolate, CMasonLengthPercentageRect rect)
{

  v8::Local<v8::Object> object = v8::Object::New((isolate));
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("left"),
              lengthPercentageToJS(isolate, rect.left))
      .Check();
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("right"),
              lengthPercentageToJS(isolate, rect.right))
      .Check();
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("top"),
              lengthPercentageToJS(isolate, rect.top))
      .Check();
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("bottom"),
              lengthPercentageToJS(isolate, rect.bottom))
      .Check();
  return object;
}

inline static v8::Local<v8::Object>
rectToJS(v8::Isolate *isolate, CMasonLengthPercentageAutoRect rect)
{
  v8::Local<v8::Object> object = v8::Object::New((isolate));
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("left"),
              lengthPercentageAutoToJS(isolate, rect.left))
      .Check();
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("right"),
              lengthPercentageAutoToJS(isolate, rect.right))
      .Check();
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("top"),
              lengthPercentageAutoToJS(isolate, rect.top))
      .Check();
  object->Set(isolate->GetCurrentContext(), STRING_TO_V8_VALUE("bottom"),
              lengthPercentageAutoToJS(isolate, rect.bottom))
      .Check();
  return object;
}

class MasonV8ModuleInstaller
{
public:
  static void installV8Module(v8::Isolate *isolate);
};

#endif // MASON_NATIVE_MASONJSIMODULE_H
