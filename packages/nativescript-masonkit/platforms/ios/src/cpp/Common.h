//
// Created by Osei Fortune on 10/06/2022.
//

#pragma once
#include <stdint.h>
#include <string.h>

#ifdef __APPLE__
#include <NativeScript/include/v8.h>

#ifdef __cplusplus
extern "C" {
#endif

// #include <Mason/mason_ios.h>
#include <Mason/mason_native.h>

#ifdef __cplusplus
}
#endif
#endif

#ifdef __ANDROID__
#include "include/v8/v8.h"
#include "include/mason_android.h"
#include "include/mason_native.h"
#include <android/log.h>
#include <thread>
#endif

