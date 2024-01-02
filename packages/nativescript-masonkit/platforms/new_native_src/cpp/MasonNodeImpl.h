//
// Created by Osei Fortune on 01/01/2024.
//

#ifndef MASON_NODEIMPL_H
#define MASON_NODEIMPL_H

#include "Common.h"
#include "Helpers.h"

class MasonNodeImpl {
private:
    void *node_;
    void *style_;

public:

    void *GetNode() const {
        return node_;
    }

    ~MasonNodeImpl() {
        if (node_ != nullptr) {
            mason_node_destroy(node_);
            node_ = nullptr;
        }
    }

    MasonNodeImpl(void *node);

    static void Init(v8::Isolate *isolate);

    static MasonNodeImpl *GetPointer(v8::Local<v8::Object> object);

    static v8::Local<v8::FunctionTemplate> GetCtor(v8::Isolate *isolate);

    static void GetStyle(v8::Local<v8::String> property,
                                       const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetStyle(v8::Local<v8::String> property,
                                       v8::Local<v8::Value> value,
                                       const v8::PropertyCallbackInfo<void> &info);

};


#endif //MASON_NODEIMPL_H
