//
// Created by Osei Fortune on 01/01/2024.
//
#pragma once
#ifndef MASON_HELPERS_H
#define MASON_HELPERS_H

#include "Common.h"


class Helpers {
public:

    static const char *LOG_TAG;

    static int m_maxLogcatObjectSize;

#ifdef __ANDROID__

    static void sendToADBLogcat(const std::string &message, android_LogPriority logPriority);

#endif

    static void LogToConsole(const std::string &message);

    static void ThrowIllegalConstructor(v8::Isolate *isolate);

    static v8::Local<v8::String> ConvertToV8String(v8::Isolate *isolate, const std::string &string);

    static std::string ConvertFromV8String(v8::Isolate *isolate, const v8::Local<v8::Value> &value);

    static void
    SetPrivate(v8::Isolate *isolate, v8::Local<v8::Object> object, const std::string &property,
               v8::Local<v8::Value> value);

    static v8::Local<v8::Value>
    GetPrivate(v8::Isolate *isolate, v8::Local<v8::Object> object, const std::string &property);
};

inline static v8::Local<v8::Value>
gridPlacementToJS(v8::Isolate *isolate, CMasonGridPlacement placement) {
    switch (placement.value_type) {
        case CMasonGridPlacementType::MasonGridPlacementTypeAuto: {
            v8::Local<v8::Object> object = v8::Object::New((isolate));
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "value"),
                        v8::Number::New(isolate, placement.value))
                    .Check();
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "type"),
                        v8::Number::New(isolate, 0))
                    .Check();
            return object;
        }
        case CMasonGridPlacementType::MasonGridPlacementTypeLine: {

            v8::Local<v8::Object> object = v8::Object::New((isolate));
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "value"),
                        v8::Number::New(isolate, placement.value))
                    .Check();
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "type"),
                        v8::Number::New(isolate, 1))
                    .Check();
            return object;
        }
        case CMasonGridPlacementType::MasonGridPlacementTypeSpan: {
            v8::Local<v8::Object> object = v8::Object::New((isolate));
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "value"),
                        v8::Number::New(isolate, placement.value))
                    .Check();
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "type"),
                        v8::Number::New(isolate, 2))
                    .Check();
            return object;
        }
        default:
            return v8::Undefined(isolate);
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

inline static v8::Local<v8::Value>
lengthPercentageToJS(v8::Isolate *isolate, CMasonLengthPercentage length) {
    switch (length.value_type) {
        case CMasonLengthPercentageType::MasonLengthPercentagePercent: {
            v8::Local<v8::Object> object = v8::Object::New((isolate));
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "value"),
                        v8::Number::New(isolate, length.value / 100))
                    .Check();
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "unit"),
                        Helpers::ConvertToV8String(isolate, "%"))
                    .Check();
            return object;
        }
        case CMasonLengthPercentageType::MasonLengthPercentagePoints: {

            v8::Local<v8::Object> object = v8::Object::New((isolate));
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "value"),
                        v8::Number::New(isolate, length.value))
                    .Check();
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "unit"),
                        Helpers::ConvertToV8String(isolate, "px"))
                    .Check();
            return object;
        }
        default:
            return v8::Undefined(isolate);
    }
}

inline static CMasonLengthPercentage jsToLengthPercentage(float value, int value_type) {
    switch ((CMasonLengthPercentageType) value_type) {
        case CMasonLengthPercentageType::MasonLengthPercentagePercent: {
            return CMasonLengthPercentage{value,
                                          CMasonLengthPercentageType::MasonLengthPercentagePercent};
        }
        case CMasonLengthPercentageType::MasonLengthPercentagePoints: {
            return CMasonLengthPercentage{value,
                                          CMasonLengthPercentageType::MasonLengthPercentagePoints};
        }
        default:
            // assert ??
            return CMasonLengthPercentage{0,
                                          CMasonLengthPercentageType::MasonLengthPercentagePoints};
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

inline static v8::Local<v8::Value>
lengthPercentageAutoToJS(v8::Isolate *isolate, CMasonLengthPercentageAuto length) {
    switch (length.value_type) {
        case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto:
            return Helpers::ConvertToV8String(isolate, "auto");
        case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent: {
            v8::Local<v8::Object> object = v8::Object::New((isolate));
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "value"),
                        v8::Number::New(isolate, length.value / 100))
                    .Check();
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "unit"),
                        Helpers::ConvertToV8String(isolate, "%"))
                    .Check();
            return object;
        }
        case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints: {
            v8::Local<v8::Object> object = v8::Object::New((isolate));
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "value"),
                        v8::Number::New(isolate, length.value))
                    .Check();
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "unit"),
                        Helpers::ConvertToV8String(isolate, "px"))
                    .Check();

            return object;
        }
        default:
            return v8::Undefined(isolate);
    }
}

inline static CMasonLengthPercentageAuto jsToLengthPercentageAuto(float value, int value_type) {
    switch ((CMasonLengthPercentageAutoType) value_type) {
        case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto:
            return CMasonLengthPercentageAuto{value,
                                              CMasonLengthPercentageAutoType::MasonLengthPercentageAutoAuto};
        case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent: {
            return CMasonLengthPercentageAuto{value,
                                              CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPercent};
        }
        case CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints: {
            return CMasonLengthPercentageAuto{value,
                                              CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints};
        }
        default:
            // assert invalid type ???
            return CMasonLengthPercentageAuto{0,
                                              CMasonLengthPercentageAutoType::MasonLengthPercentageAutoPoints};
    }
}

inline static CMasonLengthPercentageAutoType jsToLengthPercentageAutoType(int value_type) {
    return (CMasonLengthPercentageAutoType) value_type;
}

inline static v8::Local<v8::Value> dimensionToJS(v8::Isolate *isolate, CMasonDimension dimension) {
    switch ((CMasonDimensionType) dimension.value_type) {
        case CMasonDimensionType::MasonDimensionAuto:
            return Helpers::ConvertToV8String(isolate, "auto");
        case CMasonDimensionType::MasonDimensionPercent: {

            v8::Local<v8::Object> object = v8::Object::New((isolate));
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "value"),
                        v8::Number::New(isolate, dimension.value / 100))
                    .Check();
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "unit"),
                        Helpers::ConvertToV8String(isolate, "%"))
                    .Check();
            return object;
        }
        case CMasonDimensionType::MasonDimensionPoints: {
            v8::Local<v8::Object> object = v8::Object::New((isolate));
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "value"),
                        v8::Number::New(isolate, dimension.value))
                    .Check();
            object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate, "unit"),
                        Helpers::ConvertToV8String(isolate, "px"))
                    .Check();
            return object;
        }
        default:
            return v8::Undefined(isolate);
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
    return (CMasonDimensionType) value_type;
}

/*
inline static v8::Local<v8::Value> sizeToJS(v8::Isolate *isolate, CMasonDimensionSize size)
{
    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"width"),
                dimensionToJS(isolate, size.width))
            .Check();
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"height"),
                dimensionToJS(isolate, size.width))
            .Check();
    return object;
}

inline static v8::Local<v8::Object>
sizeToJS(v8::Isolate *isolate, CMasonLengthPercentageSize size)
{

    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"width"),
                lengthPercentageToJS(isolate, size.width))
            .Check();
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"height"),
                lengthPercentageToJS(isolate, size.width))
            .Check();
    return object;
}

inline static v8::Local<v8::Object>
sizeToJS(v8::Isolate *isolate, CMasonLengthPercentageAutoSize size)
{

    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"width"),
                lengthPercentageAutoToJS(isolate, size.width))
            .Check();
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"height"),
                lengthPercentageAutoToJS(isolate, size.width))
            .Check();
    return object;
}

inline static v8::Local<v8::Object> rectToJS(v8::Isolate *isolate, CMasonDimensionRect rect)
{

    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"left"),
                dimensionToJS(isolate, rect.left))
            .Check();
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"right"),
                dimensionToJS(isolate, rect.right))
            .Check();
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"top"),
                dimensionToJS(isolate, rect.top))
            .Check();
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"bottom"),
                dimensionToJS(isolate, rect.bottom))
            .Check();
    return object;
}

inline static v8::Local<v8::Object>
rectToJS(v8::Isolate *isolate, CMasonLengthPercentageRect rect)
{

    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"left"),
                lengthPercentageToJS(isolate, rect.left))
            .Check();
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"right"),
                lengthPercentageToJS(isolate, rect.right))
            .Check();
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"top"),
                lengthPercentageToJS(isolate, rect.top))
            .Check();
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"bottom"),
                lengthPercentageToJS(isolate, rect.bottom))
            .Check();
    return object;
}

inline static v8::Local<v8::Object>
rectToJS(v8::Isolate *isolate, CMasonLengthPercentageAutoRect rect)
{
    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"left"),
                lengthPercentageAutoToJS(isolate, rect.left))
            .Check();
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"right"),
                lengthPercentageAutoToJS(isolate, rect.right))
            .Check();
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"top"),
                lengthPercentageAutoToJS(isolate, rect.top))
            .Check();
    object->Set(isolate->GetCurrentContext(), Helpers::ConvertToV8String(isolate,"bottom"),
                lengthPercentageAutoToJS(isolate, rect.bottom))
            .Check();
    return object;
}

*/



#endif //MASON_HELPERS_H
