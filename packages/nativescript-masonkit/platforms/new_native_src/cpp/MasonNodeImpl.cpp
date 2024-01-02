//
// Created by Osei Fortune on 01/01/2024.
//

#include "MasonNodeImpl.h"
#include "Caches.h"
#include "MasonStyleImpl.h"

void MasonNodeImpl::Init(v8::Isolate *isolate) {
    v8::Locker locker(isolate);
    v8::Isolate::Scope isolate_scope(isolate);
    v8::HandleScope handle_scope(isolate);

    auto ctor = GetCtor(isolate);
    auto context = isolate->GetCurrentContext();
    auto global = context->Global();
    auto func = ctor->GetFunction(context).ToLocalChecked();

    global->Set(context, Helpers::ConvertToV8String(isolate, "NSCMasonNode"), func);
}

MasonNodeImpl *MasonNodeImpl::GetPointer(v8::Local<v8::Object> object) {
    auto ptr = object->GetInternalField(0).As<v8::External>()->Value();
    if (ptr == nullptr) {
        return nullptr;
    }
    return static_cast<MasonNodeImpl *>(ptr);
}

v8::Local<v8::FunctionTemplate> MasonNodeImpl::GetCtor(v8::Isolate *isolate) {
    auto cache = Caches::Get(isolate);
    auto ctor = cache->MasonNodeTmpl.get();
    if (ctor != nullptr) {
        return ctor->Get(isolate);
    }

    v8::Local<v8::FunctionTemplate> ctorTmpl = v8::FunctionTemplate::New(isolate, nullptr);

    ctorTmpl->InstanceTemplate()->SetInternalFieldCount(1);
    ctorTmpl->SetClassName(Helpers::ConvertToV8String(isolate, "NSCMasonNode"));

    auto tmpl = ctorTmpl->InstanceTemplate();
    tmpl->SetInternalFieldCount(1);

    tmpl->SetAccessor(
            Helpers::ConvertToV8String(isolate, "style"),
            &GetStyle,
            &SetStyle
    );

    cache->MasonNodeTmpl =
            std::make_unique<v8::Persistent<v8::FunctionTemplate>>(isolate, ctorTmpl);

    return ctorTmpl;

}

MasonNodeImpl::MasonNodeImpl(void *node) : node_(node) {}


void MasonNodeImpl::GetStyle(v8::Local<v8::String> property,
                                        const v8::PropertyCallbackInfo<v8::Value> &info) {
    auto isolate = info.GetIsolate();
    MasonNodeImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        info.GetReturnValue().SetNull();
        return;
    }

    auto value = mason_node_get_style(ptr->node_);
   auto style = new MasonStyleImpl( )
    auto ret = ;
    info.GetReturnValue().Set(Helpers::ConvertToV8String(isolate, parsed));
}

void MasonNodeImpl::SetStyle(v8::Local<v8::String> property,
                                        v8::Local<v8::Value> value,
                                        const v8::PropertyCallbackInfo<void> &info) {
    MasonNodeImpl *ptr = GetPointer(info.This());
    if (ptr == nullptr) {
        return;
    }
    auto isolate = info.GetIsolate();
    auto context = isolate->GetCurrentContext();
    auto val = value->Int32Value(context).ToChecked();
    mason_style_set_grid_auto_columns(ptr->style_, val);
}


