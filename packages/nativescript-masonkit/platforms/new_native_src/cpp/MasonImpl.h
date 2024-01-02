//
// Created by Osei Fortune on 01/01/2024.
//

#ifndef MASON_IMPL_H
#define MASON_IMPL_H

#include "Common.h"
#include "Helpers.h"

class MasonImpl {
private:
    void *mason_;

public:

    ~MasonImpl() {
        if (mason_ != nullptr) {
            mason_destroy(mason_);
            mason_ = nullptr;
        }
    }

    void *GetMason() {
        return mason_;
    }

    MasonImpl(void *mason);

    static void Init(v8::Isolate *isolate);

    static MasonImpl *GetPointer(v8::Local<v8::Object> object);

    static v8::Local<v8::FunctionTemplate> GetCtor(v8::Isolate *isolate);

    static void Clear(const v8::FunctionCallbackInfo<v8::Value> &args);
};


#endif //MASON_IMPL_H
