//
// Created by Osei Fortune on 01/01/2024.
//

#ifndef MASON_CACHES_H
#define MASON_CACHES_H

#include "Common.h"
#include "ConcurrentMap.h"

class Caches {
public:
    Caches(v8::Isolate *isolate);

    ~Caches();

    static std::shared_ptr<Caches> Get(v8::Isolate *isolate);

    static void Remove(v8::Isolate *isolate);

    void SetContext(v8::Local<v8::Context> context);

    v8::Local<v8::Context> GetContext();


    std::unique_ptr<v8::Persistent<v8::FunctionTemplate>> MasonTmpl = std::unique_ptr<v8::Persistent<v8::FunctionTemplate>>(
            nullptr);

    std::unique_ptr<v8::Persistent<v8::FunctionTemplate>> MasonNodeTmpl = std::unique_ptr<v8::Persistent<v8::FunctionTemplate>>(
            nullptr);

    std::unique_ptr<v8::Persistent<v8::FunctionTemplate>> MasonStyleTmpl = std::unique_ptr<v8::Persistent<v8::FunctionTemplate>>(
            nullptr);
private:
    static std::shared_ptr<ConcurrentMap<v8::Isolate *,
            std::shared_ptr<Caches>>>
    perIsolateCaches_;
    v8::Isolate *isolate_;
    std::shared_ptr<v8::Persistent<v8::Context>> context_;
};

#endif //MASON_CACHES_H
