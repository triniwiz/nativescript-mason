//
// Created by Osei Fortune on 01/01/2024.
//

#include "MasonImpl.h"
#include "Caches.h"


void MasonImpl::Init(v8::Isolate *isolate) {
    v8::Locker locker(isolate);
    v8::Isolate::Scope isolate_scope(isolate);
    v8::HandleScope handle_scope(isolate);

    auto ctor = GetCtor(isolate);
    auto context = isolate->GetCurrentContext();
    auto global = context->Global();
    auto func = ctor->GetFunction(context).ToLocalChecked();

    global->Set(context, Helpers::ConvertToV8String(isolate, "NSCMason"), func);
}

MasonImpl *MasonImpl::GetPointer(v8::Local<v8::Object> object) {
    auto ptr = object->GetInternalField(0).As<v8::External>()->Value();
    if (ptr == nullptr) {
        return nullptr;
    }
    return static_cast<MasonImpl *>(ptr);
}

v8::Local<v8::FunctionTemplate> MasonImpl::GetCtor(v8::Isolate *isolate) {
    auto cache = Caches::Get(isolate);
    auto ctor = cache->MasonTmpl.get();
    if (ctor != nullptr) {
        return ctor->Get(isolate);
    }

    v8::Local<v8::FunctionTemplate> ctorTmpl = v8::FunctionTemplate::New(isolate, nullptr);

    ctorTmpl->InstanceTemplate()->SetInternalFieldCount(1);
    ctorTmpl->SetClassName(Helpers::ConvertToV8String(isolate, "NSCMason"));

    auto tmpl = ctorTmpl->InstanceTemplate();
    tmpl->SetInternalFieldCount(1);


    tmpl->Set(
            Helpers::ConvertToV8String(isolate, "clear"),
            v8::FunctionTemplate::New(isolate, &Clear));


    cache->MasonTmpl =
            std::make_unique<v8::Persistent<v8::FunctionTemplate>>(isolate, ctorTmpl);

    return ctorTmpl;

}

MasonImpl::MasonImpl(void *mason) : mason_(mason) {}


void MasonImpl::Clear(const v8::FunctionCallbackInfo<v8::Value> &args) {
    auto ptr = GetPointer(args.This());
    if (ptr != nullptr) {
        mason_clear(ptr->mason_);
    }
}


