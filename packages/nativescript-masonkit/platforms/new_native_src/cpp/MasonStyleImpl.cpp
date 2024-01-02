//
// Created by Osei Fortune on 01/01/2024.
//

#include "MasonStyleImpl.h"
#include "Caches.h"


/*

[[maybe_unused]] rust::Vec<CMasonNonRepeatedTrackSizingFunction>
toNonRepeatedTrackSizingFunction(v8::Isolate *isolate, v8::Local<v8::Array> &array)
{
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    auto len = array->Length();

    auto auto_vec = rust::Vec<CMasonNonRepeatedTrackSizingFunction>();

    if (len == 0)
    {
        return std::move(auto_vec);
    }

    auto_vec.reserve(len);

    for (int i = 0; i < len; i++)
    {
        auto value = array->Get(context, i).ToLocalChecked().As<v8::Object>();

        // object {type: number, min_type: number, min_value: number, max_type: number, max_value: number};
        auto min_type = value->Get(context,
                                   STRING_TO_V8_VALUE("min_type"))
                .ToLocalChecked()
                ->Int32Value(
                        context)
                .FromJust();
        auto min_value = (float)value->Get(context, STRING_TO_V8_VALUE(
                        "min_value"))
                .ToLocalChecked()
                ->NumberValue(context)
                .FromJust();

        auto max_type = value->Get(context,
                                   STRING_TO_V8_VALUE("max_type"))
                .ToLocalChecked()
                ->Int32Value(
                        context)
                .FromJust();
        auto max_value = (float)value->Get(context, STRING_TO_V8_VALUE(
                        "max_value"))
                .ToLocalChecked()
                ->NumberValue(context)
                .FromJust();

        CMasonMinMax minMax = {};
        minMax.min_type = min_type;
        minMax.min_value = min_value;
        minMax.max_type = max_type;
        minMax.max_value = max_value;

        mason_util_create_non_repeated_track_sizing_function(minMax, -1, auto_vec);
    }

    return std::move(auto_vec);
}

[[maybe_unused]] rust::Vec<CMasonTrackSizingFunction>
toTrackSizingFunction(v8::Isolate *isolate, v8::Local<v8::Array> &array)
{
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    auto len = array->Length();

    auto auto_vec = rust::Vec<CMasonTrackSizingFunction>();

    if (len == 0)
    {
        return std::move(auto_vec);
    }

    auto_vec.reserve(len);

    for (int i = 0; i < len; i++)
    {
        auto object = array->Get(context, i).ToLocalChecked().As<v8::Object>();
        bool is_repeating = object->Get(context, STRING_TO_V8_VALUE(
                        "is_repeating"))
                .ToLocalChecked()
                ->BooleanValue(isolate);
        auto repeating_type = object->Get(context, STRING_TO_V8_VALUE(
                        "repeating_type"))
                .ToLocalChecked()
                ->Int32Value(context)
                .FromJust();
        auto repeating_count = (short)object->Get(context, STRING_TO_V8_VALUE(
                        "repeating_count"))
                .ToLocalChecked()
                ->Int32Value(context)
                .FromJust();

        auto value = object->Get(context, STRING_TO_V8_VALUE("value"));
        if (is_repeating)
        {
            auto value_array = value.ToLocalChecked().As<v8::Array>();
            auto repeating_length = value_array->Length();

            rust::Vec<CMasonMinMax> vec;
            vec.reserve(repeating_length);

            for (int j = 0; j < repeating_length; j++)
            {
                auto repeat_object = value_array->Get(context, i).ToLocalChecked().As<v8::Object>();

                auto min_type = repeat_object->Get(context, STRING_TO_V8_VALUE(
                                "min_type"))
                        .ToLocalChecked()
                        ->Int32Value(context)
                        .FromJust();
                auto min_value = (float)repeat_object->Get(context, STRING_TO_V8_VALUE(
                                "min_value"))
                        .ToLocalChecked()
                        ->NumberValue(context)
                        .FromJust();

                auto max_type = repeat_object->Get(context, STRING_TO_V8_VALUE(
                                "max_type"))
                        .ToLocalChecked()
                        ->Int32Value(context)
                        .FromJust();
                auto max_value = (float)repeat_object->Get(context, STRING_TO_V8_VALUE(
                                "max_value"))
                        .ToLocalChecked()
                        ->NumberValue(context)
                        .FromJust();

                CMasonMinMax minMax{};
                minMax.min_type = min_type;
                minMax.min_value = min_value;

                minMax.max_type = max_type;
                minMax.max_value = max_value;

                vec.emplace_back(minMax);
            }

            mason_util_create_auto_repeating_track_sizing_function(
                    repeating_type, repeating_count, std::move(vec), -1, auto_vec);
        }
        else
        {
            auto single_object = value.ToLocalChecked().As<v8::Object>();

            auto min_type = single_object->Get(context, STRING_TO_V8_VALUE(
                            "min_type"))
                    .ToLocalChecked()
                    ->Int32Value(context)
                    .FromJust();
            auto min_value = (float)single_object->Get(context, STRING_TO_V8_VALUE(
                            "min_value"))
                    .ToLocalChecked()
                    ->NumberValue(context)
                    .FromJust();

            auto max_type = single_object->Get(context, STRING_TO_V8_VALUE(
                            "max_type"))
                    .ToLocalChecked()
                    ->Int32Value(context)
                    .FromJust();
            auto max_value = (float)single_object->Get(context, STRING_TO_V8_VALUE(
                            "max_value"))
                    .ToLocalChecked()
                    ->NumberValue(context)
                    .FromJust();

            CMasonMinMax minMax{};
            minMax.min_type = min_type;
            minMax.min_value = min_value;

            minMax.max_type = max_type;
            minMax.max_value = max_value;

            mason_util_create_single_track_sizing_function(minMax, -1, auto_vec);
        }
    }

    return std::move(auto_vec);
}

*/


void MasonStyleImpl::Init(v8::Isolate *isolate) {
    v8::Locker locker(isolate);
    v8::Isolate::Scope isolate_scope(isolate);
    v8::HandleScope handle_scope(isolate);

    auto ctor = GetCtor(isolate);
    auto context = isolate->GetCurrentContext();
    auto global = context->Global();
    auto func = ctor->GetFunction(context).ToLocalChecked();

    global->Set(context, Helpers::ConvertToV8String(isolate, "NSCMasonStyle"), func);
}

MasonStyleImpl *MasonStyleImpl::GetPointer(v8::Local<v8::Object> object) {
    auto ptr = object->GetInternalField(0).As<v8::External>()->Value();
    if (ptr == nullptr) {
        return nullptr;
    }
    return static_cast<MasonStyleImpl *>(ptr);
}

v8::Local<v8::FunctionTemplate> MasonStyleImpl::GetCtor(v8::Isolate *isolate) {
    auto cache = Caches::Get(isolate);
    auto ctor = cache->MasonStyleTmpl.get();
    if (ctor != nullptr) {
        return ctor->Get(isolate);
    }

    v8::Local<v8::FunctionTemplate> ctorTmpl = v8::FunctionTemplate::New(isolate, nullptr);

    ctorTmpl->InstanceTemplate()->SetInternalFieldCount(1);
    ctorTmpl->SetClassName(Helpers::ConvertToV8String(isolate, "NSCMasonStyle"));

    auto tmpl = ctorTmpl->InstanceTemplate();
    tmpl->SetInternalFieldCount(1);


    tmpl->SetAccessor(
            Helpers::ConvertToV8String(isolate, "display"),
            &GetDisplay,
            &SetDisplay
    );


    tmpl->SetAccessor(
            Helpers::ConvertToV8String(isolate, "scrollbarWidth"),
            &GetScrollbarWidth,
            &SetScrollbarWidth
    );


    tmpl->SetAccessor(
            Helpers::ConvertToV8String(isolate, "overflow"),
            nullptr,
            &SetOverflow
    );

    tmpl->SetAccessor(
            Helpers::ConvertToV8String(isolate, "overflowX"),
            &GetOverflowX,
            &SetOverflowX
    );

    tmpl->SetAccessor(
            Helpers::ConvertToV8String(isolate, "overflowY"),
            &GetOverflowY,
            &SetOverflowY
    );

    tmpl->SetAccessor(
            Helpers::ConvertToV8String(isolate, "position"),
            &GetPosition,
            &SetPosition
    );


    tmpl->SetAccessor(
            Helpers::ConvertToV8String(isolate, "flexWrap"),
            &GetFlexWrap,
            &SetFlexWrap
    );

    tmpl->SetAccessor(
            Helpers::ConvertToV8String(isolate, "alignItems"),
            &GetAlignItems,
            &SetAlignItems
    );


    tmpl->SetAccessor(
            Helpers::ConvertToV8String(isolate, "alignContent"),
            &GetAlignContent,
            &SetAlignContent
    );


    tmpl->SetAccessor(
            Helpers::ConvertToV8String(isolate, "alignSelf"),
            &GetAlignSelf,
            &SetAlignSelf
    );


    tmpl->SetAccessor(
            Helpers::ConvertToV8String(isolate, "justifyItems"),
            &GetJustifyItems,
            &SetJustifyItems
    );


    tmpl->SetAccessor(
            Helpers::ConvertToV8String(isolate, "justifyContent"),
            &GetJustifyContent,
            &SetJustifyContent
    );


    tmpl->SetAccessor(
            Helpers::ConvertToV8String(isolate, "justifySelf"),
            &GetJustifySelf,
            &SetJustifySelf
    );


    cache->MasonStyleTmpl =
            std::make_unique<v8::Persistent<v8::FunctionTemplate>>(isolate, ctorTmpl);

    return ctorTmpl;

}

MasonStyleImpl::MasonStyleImpl(void *style) : style_(style) {}


void MasonStyleImpl::GetDisplay(v8::Local<v8::String> property,
                                const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_display(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetDisplay(v8::Local<v8::String> property,
                                v8::Local<v8::Value> value,
                                const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_display(ptr->style_, val);
}


void MasonStyleImpl::GetScrollbarWidth(v8::Local<v8::String> property,
                                       const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_scrollbar_width(ptr->style_);

    info.GetReturnValue().Set((double) ret);

}

void MasonStyleImpl::SetScrollbarWidth(v8::Local<v8::String> property,
                                       v8::Local<v8::Value> value,
                                       const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = (float) value->NumberValue(context).ToChecked();
    mason_style_set_scrollbar_width(ptr->style_, val);
}


void MasonStyleImpl::GetOverflow(v8::Local<v8::String> property,
                                 const v8::PropertyCallbackInfo<v8::Value> &info) {


}

void MasonStyleImpl::SetOverflow(v8::Local<v8::String> property,
                                 v8::Local<v8::Value> value,
                                 const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_overflow(ptr->style_, val);
}

void MasonStyleImpl::GetOverflowX(v8::Local<v8::String> property,
                                  const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_overflow_x(ptr->style_);

    info.GetReturnValue().Set((double) ret);

}

void MasonStyleImpl::SetOverflowX(v8::Local<v8::String> property,
                                  v8::Local<v8::Value> value,
                                  const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_overflow_x(ptr->style_, val);
}

void MasonStyleImpl::GetOverflowY(v8::Local<v8::String> property,
                                  const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_overflow_y(ptr->style_);

    info.GetReturnValue().Set((double) ret);

}

void MasonStyleImpl::SetOverflowY(v8::Local<v8::String> property,
                                  v8::Local<v8::Value> value,
                                  const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_overflow_y(ptr->style_, val);
}

void MasonStyleImpl::GetPosition(v8::Local<v8::String> property,
                                 const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_position(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetPosition(v8::Local<v8::String> property,
                                 v8::Local<v8::Value> value,
                                 const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_position(ptr->style_, val);
}

void MasonStyleImpl::GetFlexWrap(v8::Local<v8::String> property,
                                 const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_flex_wrap(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetFlexWrap(v8::Local<v8::String> property,
                                 v8::Local<v8::Value> value,
                                 const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_flex_wrap(ptr->style_, val);
}

void MasonStyleImpl::GetAlignItems(v8::Local<v8::String> property,
                                   const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_align_items(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetAlignItems(v8::Local<v8::String> property,
                                   v8::Local<v8::Value> value,
                                   const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_align_items(ptr->style_, val);
}

void MasonStyleImpl::GetAlignContent(v8::Local<v8::String> property,
                                     const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_align_content(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetAlignContent(v8::Local<v8::String> property,
                                     v8::Local<v8::Value> value,
                                     const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_align_content(ptr->style_, val);
}

void MasonStyleImpl::GetAlignSelf(v8::Local<v8::String> property,
                                  const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_align_self(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetAlignSelf(v8::Local<v8::String> property,
                                  v8::Local<v8::Value> value,
                                  const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_align_self(ptr->style_, val);
}

void MasonStyleImpl::GetJustifyItems(v8::Local<v8::String> property,
                                     const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_justify_items(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetJustifyItems(v8::Local<v8::String> property,
                                     v8::Local<v8::Value> value,
                                     const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_justify_items(ptr->style_, val);
}


void MasonStyleImpl::GetJustifyContent(v8::Local<v8::String> property,
                                       const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_justify_content(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetJustifyContent(v8::Local<v8::String> property,
                                       v8::Local<v8::Value> value,
                                       const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_justify_content(ptr->style_, val);
}

void MasonStyleImpl::GetJustifySelf(v8::Local<v8::String> property,
                                    const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_justify_self(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetJustifySelf(v8::Local<v8::String> property,
                                    v8::Local<v8::Value> value,
                                    const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_justify_self(ptr->style_, val);
}

void MasonStyleImpl::GetInset(v8::Local<v8::String> property,
                              const v8::PropertyCallbackInfo<v8::Value> &info) {


}

void MasonStyleImpl::SetInset(v8::Local<v8::String> property,
                              v8::Local<v8::Value> value,
                              const v8::PropertyCallbackInfo<void> &info) {
//    MasonStyleImpl *ptr = GetPointer(info.This());
//    if (ptr == nullptr) {
//        return;
//    }
//    auto isolate = info.GetIsolate();
//    auto context = isolate->GetCurrentContext();
//    auto val = value->Int32Value(context).ToChecked();
//    mason_style_set_inset(ptr->style_, val);
}


void MasonStyleImpl::GetInsetLeft(v8::Local<v8::String> property,
                                  const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_inset_left(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetInsetLeft(v8::Local<v8::String> property,
                                  v8::Local<v8::Value> value,
                                  const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_inset_left(ptr->style_, val);
}


void MasonStyleImpl::GetInsetTop(v8::Local<v8::String> property,
                                 const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_inset_top(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetInsetTop(v8::Local<v8::String> property,
                                 v8::Local<v8::Value> value,
                                 const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_inset_top(ptr->style_, val);
}


void MasonStyleImpl::GetInsetRight(v8::Local<v8::String> property,
                                   const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_inset_right(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetInsetRight(v8::Local<v8::String> property,
                                   v8::Local<v8::Value> value,
                                   const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_inset_right(ptr->style_, val);
}


void MasonStyleImpl::GetInsetBottom(v8::Local<v8::String> property,
                                    const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_inset_bottom(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetInsetBottom(v8::Local<v8::String> property,
                                    v8::Local<v8::Value> value,
                                    const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_inset_bottom(ptr->style_, val);
}


void MasonStyleImpl::GetMargin(v8::Local<v8::String> property,
                               const v8::PropertyCallbackInfo<v8::Value> &info) {


}

void MasonStyleImpl::SetMargin(v8::Local<v8::String> property,
                               v8::Local<v8::Value> value,
                               const v8::PropertyCallbackInfo<void> &info) {
//    MasonStyleImpl *ptr = GetPointer(info.This());
//    if (ptr == nullptr) {
//        return;
//    }
//    auto isolate = info.GetIsolate();
//    auto context = isolate->GetCurrentContext();
//    auto val = value->Int32Value(context).ToChecked();
//    mason_style_set_Margin(ptr->style_, val);
}


void MasonStyleImpl::GetMarginLeft(v8::Local<v8::String> property,
                                   const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_margin_left(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetMarginLeft(v8::Local<v8::String> property,
                                   v8::Local<v8::Value> value,
                                   const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_margin_left(ptr->style_, val);
}


void MasonStyleImpl::GetMarginTop(v8::Local<v8::String> property,
                                  const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_margin_top(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetMarginTop(v8::Local<v8::String> property,
                                  v8::Local<v8::Value> value,
                                  const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_margin_top(ptr->style_, val);
}


void MasonStyleImpl::GetMarginRight(v8::Local<v8::String> property,
                                    const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_margin_right(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetMarginRight(v8::Local<v8::String> property,
                                    v8::Local<v8::Value> value,
                                    const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_margin_right(ptr->style_, val);
}


void MasonStyleImpl::GetMarginBottom(v8::Local<v8::String> property,
                                     const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_margin_bottom(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetMarginBottom(v8::Local<v8::String> property,
                                     v8::Local<v8::Value> value,
                                     const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_margin_bottom(ptr->style_, val);
}


void MasonStyleImpl::GetPadding(v8::Local<v8::String> property,
                                const v8::PropertyCallbackInfo<v8::Value> &info) {


}

void MasonStyleImpl::SetPadding(v8::Local<v8::String> property,
                                v8::Local<v8::Value> value,
                                const v8::PropertyCallbackInfo<void> &info) {
//    MasonStyleImpl *ptr = GetPointer(info.This());
//    if (ptr == nullptr) {
//        return;
//    }
//    auto isolate = info.GetIsolate();
//    auto context = isolate->GetCurrentContext();
//    auto val = value->Int32Value(context).ToChecked();
//    mason_style_set_Padding(ptr->style_, val);
}


void MasonStyleImpl::GetPaddingLeft(v8::Local<v8::String> property,
                                    const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_padding_left(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetPaddingLeft(v8::Local<v8::String> property,
                                    v8::Local<v8::Value> value,
                                    const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_padding_left(ptr->style_, val);
}


void MasonStyleImpl::GetPaddingTop(v8::Local<v8::String> property,
                                   const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_padding_top(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetPaddingTop(v8::Local<v8::String> property,
                                   v8::Local<v8::Value> value,
                                   const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_padding_top(ptr->style_, val);
}


void MasonStyleImpl::GetPaddingRight(v8::Local<v8::String> property,
                                     const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_padding_right(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetPaddingRight(v8::Local<v8::String> property,
                                     v8::Local<v8::Value> value,
                                     const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_padding_right(ptr->style_, val);
}


void MasonStyleImpl::GetPaddingBottom(v8::Local<v8::String> property,
                                      const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_padding_bottom(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetPaddingBottom(v8::Local<v8::String> property,
                                      v8::Local<v8::Value> value,
                                      const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_padding_bottom(ptr->style_, val);
}


void MasonStyleImpl::GetBorder(v8::Local<v8::String> property,
                               const v8::PropertyCallbackInfo<v8::Value> &info) {


}

void MasonStyleImpl::SetBorder(v8::Local<v8::String> property,
                               v8::Local<v8::Value> value,
                               const v8::PropertyCallbackInfo<void> &info) {
//    MasonStyleImpl *ptr = GetPointer(info.This());
//    if (ptr == nullptr) {
//        return;
//    }
//    auto isolate = info.GetIsolate();
//    auto context = isolate->GetCurrentContext();
//    auto val = value->Int32Value(context).ToChecked();
//    mason_style_set_Border(ptr->style_, val);
}


void MasonStyleImpl::GetBorderLeft(v8::Local<v8::String> property,
                                   const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_border_left(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetBorderLeft(v8::Local<v8::String> property,
                                   v8::Local<v8::Value> value,
                                   const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_border_left(ptr->style_, val);
}


void MasonStyleImpl::GetBorderTop(v8::Local<v8::String> property,
                                  const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_border_top(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetBorderTop(v8::Local<v8::String> property,
                                  v8::Local<v8::Value> value,
                                  const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_border_top(ptr->style_, val);
}


void MasonStyleImpl::GetBorderRight(v8::Local<v8::String> property,
                                    const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_border_right(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetBorderRight(v8::Local<v8::String> property,
                                    v8::Local<v8::Value> value,
                                    const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_border_right(ptr->style_, val);
}


void MasonStyleImpl::GetBorderBottom(v8::Local<v8::String> property,
                                     const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_border_bottom(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetBorderBottom(v8::Local<v8::String> property,
                                     v8::Local<v8::Value> value,
                                     const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_border_bottom(ptr->style_, val);
}


void MasonStyleImpl::GetBorder(v8::Local<v8::String> property,
                               const v8::PropertyCallbackInfo<v8::Value> &info) {


}

void MasonStyleImpl::SetBorder(v8::Local<v8::String> property,
                               v8::Local<v8::Value> value,
                               const v8::PropertyCallbackInfo<void> &info) {
//    MasonStyleImpl *ptr = GetPointer(info.This());
//    if (ptr == nullptr) {
//        return;
//    }
//    auto isolate = info.GetIsolate();
//    auto context = isolate->GetCurrentContext();
//    auto val = value->Int32Value(context).ToChecked();
//    mason_style_set_Border(ptr->style_, val);
}


void MasonStyleImpl::GetBorderLeft(v8::Local<v8::String> property,
                                   const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_border_left(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetBorderLeft(v8::Local<v8::String> property,
                                   v8::Local<v8::Value> value,
                                   const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_border_left(ptr->style_, val);
}


void MasonStyleImpl::GetBorderTop(v8::Local<v8::String> property,
                                  const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_border_top(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetBorderTop(v8::Local<v8::String> property,
                                  v8::Local<v8::Value> value,
                                  const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_border_top(ptr->style_, val);
}


void MasonStyleImpl::GetBorderRight(v8::Local<v8::String> property,
                                    const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_border_right(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetBorderRight(v8::Local<v8::String> property,
                                    v8::Local<v8::Value> value,
                                    const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_border_right(ptr->style_, val);
}


void MasonStyleImpl::GetBorderBottom(v8::Local<v8::String> property,
                                     const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_border_bottom(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetBorderBottom(v8::Local<v8::String> property,
                                     v8::Local<v8::Value> value,
                                     const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_border_bottom(ptr->style_, val);
}


void MasonStyleImpl::GetFlexGrow(v8::Local<v8::String> property,
                                 const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_flex_grow(ptr->style_);

    info.GetReturnValue().Set((double) ret);

}

void MasonStyleImpl::SetFlexGrow(v8::Local<v8::String> property,
                                 v8::Local<v8::Value> value,
                                 const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = (float) value->NumberValue(context).ToChecked();
    mason_style_set_flex_grow(ptr->style_, val);
}

void MasonStyleImpl::GetFlexShrink(v8::Local<v8::String> property,
                                   const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_flex_shrink(ptr->style_);

    info.GetReturnValue().Set((double) ret);

}

void MasonStyleImpl::SetFlexShrink(v8::Local<v8::String> property,
                                   v8::Local<v8::Value> value,
                                   const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = (float) value->NumberValue(context).ToChecked();
    mason_style_set_flex_shrink(ptr->style_, val);
}

void MasonStyleImpl::GetFlexBasis(v8::Local<v8::String> property,
                                   const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_flex_basis(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetFlexBasis(v8::Local<v8::String> property,
                                   v8::Local<v8::Value> value,
                                   const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = (float) value->NumberValue(context).ToChecked();
    mason_style_set_flex_basis(ptr->style_, val);
}


void MasonStyleImpl::GetGap(v8::Local<v8::String> property,
                                  const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_gap(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetGap(v8::Local<v8::String> property,
                                  v8::Local<v8::Value> value,
                                  const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = (float) value->NumberValue(context).ToChecked();
    mason_style_set_gap(ptr->style_, val);
}


void MasonStyleImpl::GetRowGap(v8::Local<v8::String> property,
                            const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_row_gap(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetRowGap(v8::Local<v8::String> property,
                            v8::Local<v8::Value> value,
                            const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = (float) value->NumberValue(context).ToChecked();
    mason_style_set_row_gap(ptr->style_, val);
}



void MasonStyleImpl::GetColumnGap(v8::Local<v8::String> property,
                               const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_column_gap(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetColumnGap(v8::Local<v8::String> property,
                               v8::Local<v8::Value> value,
                               const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = (float) value->NumberValue(context).ToChecked();
    mason_style_set_column_gap(ptr->style_, val);
}


void MasonStyleImpl::GetAspectRatio(v8::Local<v8::String> property,
                                  const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_aspect_ratio(ptr->style_);

    info.GetReturnValue().Set((double )ret);

}

void MasonStyleImpl::SetAspectRatio(v8::Local<v8::String> property,
                                  v8::Local<v8::Value> value,
                                  const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = (float) value->NumberValue(context).ToChecked();
    mason_style_set_aspect_ratio(ptr->style_, val);
}

void MasonStyleImpl::GetFlexDirection(v8::Local<v8::String> property,
                                    const v8::PropertyCallbackInfo<v8::Value> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto ret = mason_style_get_flex_direction(ptr->style_);

    info.GetReturnValue().Set(ret);

}

void MasonStyleImpl::SetFlexDirection(v8::Local<v8::String> property,
                                    v8::Local<v8::Value> value,
                                    const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_flex_direction(ptr->style_, val);
}

void MasonStyleImpl::GetGridAutoRows(v8::Local<v8::String> property,
                                      const v8::PropertyCallbackInfo<v8::Value> &info) {
    auto isolate = info.GetIsolate();
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().Set(0);
        return;
    }

    auto rows = mason_style_get_grid_auto_rows(ptr->style_);
    auto parsed = mason_util_parse_non_repeated_track_sizing_function(rows);
    info.GetReturnValue().Set(Helpers::ConvertToV8String(isolate, parsed));

}

void MasonStyleImpl::SetGridAutoRows(v8::Local<v8::String> property,
                                      v8::Local<v8::Value> value,
                                      const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_grid_auto_rows(ptr->style_, val);
}


void MasonStyleImpl::GetGridAutoColumns(v8::Local<v8::String> property,
                                     const v8::PropertyCallbackInfo<v8::Value> &info) {
    auto isolate = info.GetIsolate();
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().SetEmptyString();
        return;
    }

    auto columns = mason_style_get_grid_auto_columns(ptr->style_);
    auto parsed = mason_util_parse_non_repeated_track_sizing_function(columns);
    info.GetReturnValue().Set(Helpers::ConvertToV8String(isolate, parsed));
}

void MasonStyleImpl::SetGridAutoColumns(v8::Local<v8::String> property,
                                     v8::Local<v8::Value> value,
                                     const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_grid_auto_columns(ptr->style_, val);
}



void MasonStyleImpl::GetArea(v8::Local<v8::String> property,
                                        const v8::PropertyCallbackInfo<v8::Value> &info) {

    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().SetEmptyString();
        return;
    }

    auto row_start = mason_style_get_grid_row_start(ptr->style_);
    auto row_end = mason_style_get_grid_row_start(ptr->style_);

    auto col_start = mason_style_get_grid_column_start(ptr->style_);
    auto col_end = mason_style_get_grid_column_start(ptr->style_);

    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(context, Helpers::ConvertToV8String(isolate, "col_start_type"), v8::Int32::New(isolate, (int)col_start.value_type)).Check();
    object->Set(context, Helpers::ConvertToV8String(isolate,"col_start_value"), v8::Int32::New(isolate, (int)col_start.value)).Check();

    object->Set(context, Helpers::ConvertToV8String(isolate, "col_end_type"), v8::Int32::New(isolate, (int)col_end.value_type)).Check();
    object->Set(context, Helpers::ConvertToV8String(isolate,"col_end_value"), v8::Int32::New(isolate, (int)col_end.value)).Check();

    object->Set(context, Helpers::ConvertToV8String(isolate,"row_start_type"), v8::Int32::New(isolate, (int)row_start.value_type)).Check();
    object->Set(context, Helpers::ConvertToV8String(isolate,"row_start_value"), v8::Int32::New(isolate, (int)row_start.value)).Check();

    object->Set(context, Helpers::ConvertToV8String(isolate,"row_end_type"), v8::Int32::New(isolate, (int)row_end.value_type)).Check();
    object->Set(context, Helpers::ConvertToV8String(isolate,"row_end_value"), v8::Int32::New(isolate, (int)row_end.value)).Check();

    std::stringstream ss;
    if (col_start.value == col_end.value &&
        col_start.value_type == col_end.value_type)
    {
        if (col_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeAuto) {
            ss << "auto";
        } else {
            ss << col_start.value;
            if (col_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeSpan) {
                ss << " span";
            }
        }
    }
    else
    {
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
    object->Set(context, Helpers::ConvertToV8String(isolate,"colFormatted"), STRING_TO_V8_VALUE(ss.str().c_str())).Check();

    std::stringstream row_ss;
    if (row_start.value == row_end.value &&
        row_start.value_type == row_end.value_type)
    {
        if (row_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeAuto) {
            row_ss << "auto";
        } else {
            row_ss << row_start.value;
            if (row_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeSpan) {
                row_ss << " span";
            }
        }
    }
    else
    {
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
    object->Set(context, Helpers::ConvertToV8String(isolate,"rowFormatted"), STRING_TO_V8_VALUE(ss.str().c_str())).Check();

    info.GetReturnValue().Set(object);


}

void MasonStyleImpl::SetArea(v8::Local<v8::String> property,
                                        v8::Local<v8::Value> value,
                                        const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();


    auto object = value.As<v8::Object>();

    auto rowStartType = (int)object->Get(context,
                                         Helpers::ConvertToV8String(isolate, "row_start_type"))
            .ToLocalChecked()
            ->Int32Value(context)
            .FromJust();

    auto rowStartValue = (short)object->Get(context,
                                            Helpers::ConvertToV8String(isolate, "row_start_value"))
            .ToLocalChecked()
            ->Int32Value(context)
            .FromJust();

    auto rowEndType = (int)object->Get(context,
                                       Helpers::ConvertToV8String(isolate, "row_end_type"))
            .ToLocalChecked()
            ->Int32Value(context)
            .FromJust();
    auto rowEndValue = (short)object->Get(context,
                                          Helpers::ConvertToV8String(isolate, "row_end_value"))
            .ToLocalChecked()
            ->Int32Value(context)
            .FromJust();

    auto columnStartType = (int)object->Get(context,
                                            Helpers::ConvertToV8String(isolate, "col_start_value"))
            .ToLocalChecked()
            ->Int32Value(context)
            .FromJust();
    auto columnStartValue = (short)object->Get(context,
                                               Helpers::ConvertToV8String(isolate, "col_start_type"))
            .ToLocalChecked()
            ->Int32Value(context)
            .FromJust();

    auto columnEndType = (int)object->Get(context,
                                          Helpers::ConvertToV8String(isolate, "col_end_type"))
            .ToLocalChecked()
            ->Int32Value(context)
            .FromJust();
    auto columnEndValue = (short)object->Get(context,
                                             Helpers::ConvertToV8String(isolate, "col_end_value"))
            .ToLocalChecked()
            ->Int32Value(context)
            .FromJust();

    mason_style_set_grid_area(
            ptr->style_,
            jsToGridPlacement(rowStartValue, rowStartType),
            jsToGridPlacement(rowEndValue, rowEndType),
            jsToGridPlacement(columnStartValue, columnStartType),
            jsToGridPlacement(columnEndValue, columnEndType));

    // MASON_UPDATE_NODE(info[4])

}


void MasonStyleImpl::GetColumn(v8::Local<v8::String> property,
                                        const v8::PropertyCallbackInfo<v8::Value> &info) {

    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().SetEmptyString();
        return;
    }


    auto col_start = mason_style_get_grid_column_start(ptr->style_);
    auto col_end = mason_style_get_grid_column_start(ptr->style_);

    v8::Local<v8::Object> object = v8::Object::New((isolate));
    object->Set(context, Helpers::ConvertToV8String(isolate, "col_start_type"), v8::Int32::New(isolate, (int)col_start.value_type)).Check();
    object->Set(context, Helpers::ConvertToV8String(isolate, "col_start_value"), v8::Int32::New(isolate, (int)col_start.value)).Check();

    object->Set(context, Helpers::ConvertToV8String(isolate, "col_end_type"), v8::Int32::New(isolate, (int)col_end.value_type)).Check();
    object->Set(context, Helpers::ConvertToV8String(isolate, "col_end_value"), v8::Int32::New(isolate, (int)col_end.value)).Check();

    std::stringstream ss;
    if (col_start.value == col_end.value &&
        col_start.value_type == col_end.value_type)
    {
        if (col_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeAuto) {
            ss << "auto";
        } else {
            ss << col_start.value;
            if (col_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeSpan) {
                ss << " span";
            }
        }
    }
    else
    {
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

    object->Set(context, Helpers::ConvertToV8String(isolate, "colFormatted"), Helpers::ConvertToV8String(isolate, ss.c_str())).Check();

    info.GetReturnValue().Set(object);

}

void MasonStyleImpl::SetColumn(v8::Local<v8::String> property,
                                        v8::Local<v8::Value> value,
                                        const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();


    auto object = value.As<v8::Object>();

    auto columnStartType = (int)object->Get(context,
                                            Helpers::ConvertToV8String(isolate, "col_start_value"))
            .ToLocalChecked()
            ->Int32Value(context)
            .FromJust();
    auto columnStartValue = (short)object->Get(context,
                                               Helpers::ConvertToV8String(isolate, "col_start_type"))
            .ToLocalChecked()
            ->Int32Value(context)
            .FromJust();

    auto columnEndType = (int)object->Get(context,
                                          Helpers::ConvertToV8String(isolate, "col_end_type"))
            .ToLocalChecked()
            ->Int32Value(context)
            .FromJust();
    auto columnEndValue = (short)object->Get(context,
                                             Helpers::ConvertToV8String(isolate, "col_end_value"))
            .ToLocalChecked()
            ->Int32Value(context)
            .FromJust();

    mason_style_set_grid_column(
            ptr->style_,
            jsToGridPlacement(columnStartValue, columnStartType),
            jsToGridPlacement(columnEndValue, columnEndType));

   // MASON_UPDATE_NODE(info[4])
}


void MasonStyleImpl::GetRow(v8::Local<v8::String> property,
                               const v8::PropertyCallbackInfo<v8::Value> &info) {

    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().SetNull();
        return;
    }


    auto row_start = mason_style_get_grid_row_start(ptr->style_);
    auto row_end = mason_style_get_grid_row_start(ptr->style_);

    v8::Local<v8::Object> object = v8::Object::New((isolate));

    object->Set(context, Helpers::ConvertToV8String(isolate, "row_start_type"), v8::Int32::New(isolate, (int)row_start.value_type)).Check();
    object->Set(context, Helpers::ConvertToV8String(isolate, "row_start_value"), v8::Int32::New(isolate, (int)row_start.value)).Check();

    object->Set(context, Helpers::ConvertToV8String(isolate, "row_end_type"), v8::Int32::New(isolate, (int)row_end.value_type)).Check();
    object->Set(context, Helpers::ConvertToV8String(isolate, "row_end_value"), v8::Int32::New(isolate, (int)row_end.value)).Check();

    std::stringstream row_ss;
    if (row_start.value == row_end.value &&
        row_start.value_type == row_end.value_type)
    {
        if (row_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeAuto) {
            row_ss << "auto";
        } else {
            row_ss << row_start.value;
            if (row_start.value_type == CMasonGridPlacementType::MasonGridPlacementTypeSpan) {
                row_ss << " span";
            }
        }
    }
    else
    {
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
    object->Set(context, Helpers::ConvertToV8String(isolate, "rowFormatted"), Helpers::ConvertToV8String(isolate, row_ss.c_str())).Check();

    info.GetReturnValue().Set(object);

}

void MasonStyleImpl::SetRow(v8::Local<v8::String> property,
                               v8::Local<v8::Value> value,
                               const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();


    auto object = value.As<v8::Object>();

    auto rowStartType = (int)object->Get(context,
                                         Helpers::ConvertToV8String(isolate, "row_start_type"))
            .ToLocalChecked()
            ->Int32Value(context)
            .FromJust();

    auto rowStartValue = (short)object->Get(context,
                                            Helpers::ConvertToV8String(isolate, "row_start_value"))
            .ToLocalChecked()
            ->Int32Value(context)
            .FromJust();

    auto rowEndType = (int)object->Get(context,
                                       Helpers::ConvertToV8String(isolate, "row_end_type"))
            .ToLocalChecked()
            ->Int32Value(context)
            .FromJust();
    auto rowEndValue = (short)object->Get(context,
                                          Helpers::ConvertToV8String(isolate, "row_end_value"))
            .ToLocalChecked()
            ->Int32Value(context)
            .FromJust();

    mason_style_set_grid_row(
            ptr->style_,
            jsToGridPlacement(rowStartValue, rowStartType),
            jsToGridPlacement(rowEndValue, rowEndType));

  //  MASON_UPDATE_NODE(info[4])
}


void MasonStyleImpl::GetColumnStart(v8::Local<v8::String> property,
                           const v8::PropertyCallbackInfo<v8::Value> &info) {

    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().SetNull();
        return;
    }

    auto ret = mason_style_get_grid_column_start(ptr->style_);

}

void MasonStyleImpl::SetColumnStart(v8::Local<v8::String> property,
                            v8::Local<v8::Value> value,
                            const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();


    auto ret = mason_style_set_grid_column_start(ptr->style_);
}


void MasonStyleImpl::GetColumnEnd(v8::Local<v8::String> property,
                                    const v8::PropertyCallbackInfo<v8::Value> &info) {

    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().SetNull();
        return;
    }

    auto ret = mason_style_get_grid_column_start(ptr->style_);

}

void MasonStyleImpl::SetColumnEnd(v8::Local<v8::String> property,
                                    v8::Local<v8::Value> value,
                                    const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();


    auto ret = mason_style_set_grid_column_start(ptr->style_);
}


void MasonStyleImpl::GetRowStart(v8::Local<v8::String> property,
                               const v8::PropertyCallbackInfo<v8::Value> &info) {

    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().SetNull();
        return;
    }

    auto ret = mason_style_get_grid_column_start(ptr->style_);

}

void MasonStyleImpl::SetRowStart(v8::Local<v8::String> property,
                               v8::Local<v8::Value> value,
                               const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();


    auto ret = mason_style_set_grid_column_start(ptr->style_);
}

void MasonStyleImpl::GetRowEnd(v8::Local<v8::String> property,
                                  const v8::PropertyCallbackInfo<v8::Value> &info) {

    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().SetNull();
        return;
    }

    auto ret = mason_style_get_grid_column_start(ptr->style_);

}

void MasonStyleImpl::SetRowEnd(v8::Local<v8::String> property,
                                  v8::Local<v8::Value> value,
                                  const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();


    auto ret = mason_style_set_grid_column_start(ptr->style_);
}

void MasonStyleImpl::GetGridTemplateRows(v8::Local<v8::String> property,
                               const v8::PropertyCallbackInfo<v8::Value> &info) {

    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().SetNull();
        return;
    }

    auto ret = mason_style_get_grid_column_start(ptr->style_);

}

void MasonStyleImpl::SetGridTemplateRows(v8::Local<v8::String> property,
                               v8::Local<v8::Value> value,
                               const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();


    auto ret = mason_style_set_grid_column_start(ptr->style_);
}


void MasonStyleImpl::GetGridTemplateColumns(v8::Local<v8::String> property,
                                         const v8::PropertyCallbackInfo<v8::Value> &info) {

    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().SetNull();
        return;
    }

    auto ret = mason_style_get_grid_column_start(ptr->style_);

}

void MasonStyleImpl::SetGridTemplateColumns(v8::Local<v8::String> property,
                                         v8::Local<v8::Value> value,
                                         const v8::PropertyCallbackInfo<void> &info) {
    MasonStyleImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();


    auto ret = mason_style_set_grid_column_start(ptr->style_);
}
