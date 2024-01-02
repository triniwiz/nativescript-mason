//
// Created by Osei Fortune on 01/01/2024.
//
#pragma once

#ifndef MASON_COMMON_H
#define MASON_COMMON_H

#include <stdint.h>
#include <string.h>

#ifdef __ANDROID__
#include <android/log.h>
#include "include/mason_native.h"
#include "include/v8.h"
#endif

#ifdef __APPLE__
#include <NativeScript/include/v8.h>

#ifdef __cplusplus
extern "C" {
#endif

#include "include/mason_native.h"

#ifdef __cplusplus
}
#endif

#endif


#endif //MASON_COMMON_H
