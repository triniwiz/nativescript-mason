cmake_minimum_required(VERSION 3.15.0)
set(CMAKE_VERBOSE_MAKEFILE ON)

project(masonnativev8)

set(CMAKE_CXX_STANDARD 17)


#option(ENABLE_LTO "Enable cross language linking time optimization" ON)
#if (ENABLE_LTO)
#  include(CheckIPOSupported)
#  check_ipo_supported(RESULT supported OUTPUT error)
#  if (supported)
#    message(STATUS "IPO / LTO enabled")
#    set(CMAKE_INTERPROCEDURAL_OPTIMIZATION TRUE)
#    add_link_options(-fuse-ld=lld)
#  else ()
#    message(STATUS "IPO / LTO not supported: <${error}>")
#  endif ()
#endif ()


if ("${ANDROID_ABI}" MATCHES "armeabi-v7a$")
  set(RUST_BUILD_TARGET "armv7-linux-androideabi")
elseif ("${ANDROID_ABI}" MATCHES "arm64-v8a$")
  set(RUST_BUILD_TARGET "aarch64-linux-android")
elseif ("${ANDROID_ABI}" MATCHES "x86_64$")
  set(RUST_BUILD_TARGET "x86_64-linux-android")
elseif ("${ANDROID_ABI}" MATCHES "x86$")
  set(RUST_BUILD_TARGET "i686-linux-android")
endif ()



set(COMMON_CMAKE_ARGUMENTS "-std=c++17 -Werror -Wno-unused-result -mstackrealign -fexceptions -fno-builtin-stpcpy -fno-rtti -DV8_31BIT_SMIS_ON_64BIT_ARCH -DV8_ENABLE_REGEXP_INTERPRETER_THREADED_DISPATCH -DV8_EMBEDDED_BUILTINS")

if ("${ANDROID_ABI}" MATCHES "arm64-v8a$" OR "${ANDROID_ABI}" MATCHES "x86_64$")
  # Enable pointer compression on 64 bit platforms
  set(COMMON_CMAKE_ARGUMENTS "${COMMON_CMAKE_ARGUMENTS} -DV8_COMPRESS_POINTERS")
endif ()

set(CPP_DIR ../../../platforms/ios/src/cpp)

include_directories(
        masonnativev8
        PUBLIC
        ${PROJECT_SOURCE_DIR}/src/main/cpp/include/libc++
        ${PROJECT_SOURCE_DIR}/src/main/cpp/include
        ${PROJECT_SOURCE_DIR}/src/main/cpp
        ${CPP_DIR}
        ${CPP_DIR}/include

)

set(CMAKE_CXX_FLAGS ${COMMON_CMAKE_ARGUMENTS})


add_library(
        masonnativev8

        SHARED

        src/main/cpp/MasonV8Module.cpp
        src/main/cpp/Install.cpp
#        ${CPP_DIR}/Caches.cpp
#        ${CPP_DIR}/Helpers.cpp
#        ${CPP_DIR}/MasonImpl.cpp
#        ${CPP_DIR}/MasonNodeImpl.cpp
#        ${CPP_DIR}/MasonStyleImpl.cpp
)


set_target_properties(
        masonnativev8 PROPERTIES
        CXX_STANDARD 17
        CXX_EXTENSIONS OFF
        POSITION_INDEPENDENT_CODE ON
        LINK_FLAGS -Wl,--allow-multiple-definition
)


MESSAGE("# General cmake Info")
MESSAGE("# PROJECT_SOURCE_DIR: " ${PROJECT_SOURCE_DIR})
MESSAGE("# CMAKE_VERSION: " ${CMAKE_VERSION})
MESSAGE("# CMAKE_C_COMPILER_ID: " ${CMAKE_C_COMPILER_ID})
MESSAGE("# CMAKE_CXX_COMPILER_ID: " ${CMAKE_CXX_COMPILER_ID})
MESSAGE("# CMAKE_C_FLAGS: " ${CMAKE_C_FLAGS})
MESSAGE("# CMAKE_CXX_FLAGS: " ${CMAKE_CXX_FLAGS})

find_library(system-log log)

add_custom_command(TARGET masonnativev8 POST_BUILD COMMAND ${CMAKE_STRIP} --strip-unneeded $<TARGET_FILE:masonnativev8>)

if ("${ANDROID_ABI}" MATCHES "armeabi-v7a" OR "${ANDROID_ABI}" MATCHES "x86" AND NOT "${ANDROID_ABI}" MATCHES "x86_64")
  # On API Level 19 and lower we need to link with android_support
  # because it contains some implementation of functions such as "strtoll" and "strtoul"
  target_link_libraries(masonnativev8
          ${system-log}
          ${PROJECT_SOURCE_DIR}/src/main/libs/${ANDROID_ABI}/libNativeScript.so
          ${ANDROID_NDK_ROOT}/sources/cxx-stl/llvm-libc++/libs/${ANDROID_ABI}/libandroid_support.a
          ${PROJECT_SOURCE_DIR}/src/main/jniLibs/${ANDROID_ABI}/libmasonnative.so
          android
          )

else ()
  target_link_libraries(masonnativev8
          ${system-log}
          ${PROJECT_SOURCE_DIR}/src/main/libs/${ANDROID_ABI}/libNativeScript.so
          ${PROJECT_SOURCE_DIR}/src/main/jniLibs/${ANDROID_ABI}/libmasonnative.so
          android
          )
endif ()
