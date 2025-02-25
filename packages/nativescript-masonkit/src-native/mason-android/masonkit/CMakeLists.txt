cmake_minimum_required(VERSION 3.4.1)
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

get_filename_component(PROJECT_ROOT_DIR ${PROJECT_SOURCE_DIR} DIRECTORY)

get_filename_component(PROJECT_NATIVE_ROOT_DIR "${PROJECT_ROOT_DIR}/../../../../.." DIRECTORY)

set(PROJECT_NATIVE_ROOT_DIR "${PROJECT_NATIVE_ROOT_DIR}")

set(CARGO_MANIFEST ${PROJECT_NATIVE_ROOT_DIR}/Cargo.toml)
set(CARGO_TARGET_DIR ${PROJECT_NATIVE_ROOT_DIR}/target)
set(CURRENT_TARGET_DIR ${CARGO_TARGET_DIR}/${RUST_BUILD_TARGET})


set(COMMON_CMAKE_ARGUMENTS "-std=c++17 -pthread -Werror -Wno-unused-result -mstackrealign -fexceptions -fno-builtin-stpcpy -DV8_31BIT_SMIS_ON_64BIT_ARCH -Wno-vla-extension -Wno-deprecated")



set(RUST_BUILD_TYPE)
set(MASON_ANDROID_LIB ${CURRENT_TARGET_DIR}/debug)
set(COMMON_CMAKE_ARGUMENTS "${COMMON_CMAKE_ARGUMENTS} -O3")

#if (CMAKE_BUILD_TYPE STREQUAL "Debug")
#  set(RUST_BUILD_TYPE)
#  set(MASON_ANDROID_LIB ${CURRENT_TARGET_DIR}/debug)
#else ()
#  set(RUST_BUILD_TYPE --release)
#  set(MASON_ANDROID_LIB ${CURRENT_TARGET_DIR}/release)
#  set(COMMON_CMAKE_ARGUMENTS "${COMMON_CMAKE_ARGUMENTS} -O3")
#endif ()

set(MASON_ANDROID_LIB ${MASON_ANDROID_LIB}/${CMAKE_STATIC_LIBRARY_PREFIX}masonnative${CMAKE_SHARED_LIBRARY_SUFFIX})


if ("${ANDROID_ABI}" MATCHES "arm64-v8a$" OR "${ANDROID_ABI}" MATCHES "x86_64$")
  # Enable pointer compression on 64 bit platforms
  set(COMMON_CMAKE_ARGUMENTS "${COMMON_CMAKE_ARGUMENTS} -DV8_COMPRESS_POINTERS")
endif ()

set(CPP_DIR ../../../platforms/ios/src/cpp)

add_definitions(-DTARGET_OS_ANDROID)

include_directories(
        masonnativev8
        PUBLIC
        ${PROJECT_SOURCE_DIR}/src/main/cpp/include/libc++
        ${PROJECT_SOURCE_DIR}/src/main/cpp/include
        ${PROJECT_SOURCE_DIR}/src/main/cpp/include/v8
        ${PROJECT_SOURCE_DIR}/src/main/cpp
        ${CPP_DIR}
        ${CPP_DIR}/include

)

set(CMAKE_CXX_FLAGS ${COMMON_CMAKE_ARGUMENTS})


set(MASON_C ${PROJECT_NATIVE_ROOT_DIR}/mason-c)
set(MASON_ANDROID ${PROJECT_NATIVE_ROOT_DIR}/mason-android)
set(MASON_INCLUDE ${PROJECT_SOURCE_DIR}/src/main/cpp/include)

add_custom_command(
        OUTPUT ${CANVAS_INCLUDE}/canvas_android.h
        COMMAND cbindgen --config ${CANVAS_C}/cbindgen.toml ${MASON_C}/src/lib.rs -l c > ${CANVAS_INCLUDE}/canvas_native.h
        USES_TERMINAL
)


add_library(
        masonnativev8

        SHARED

        ${CPP_DIR}/MasonV8JSIModule.cpp
        ${CPP_DIR}/Install.cpp
        ${CPP_DIR}/OneByteStringResource.cpp
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

add_custom_command(TARGET masonnativev8
        PRE_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy
        ${MASON_ANDROID_LIB}
        ${CMAKE_LIBRARY_OUTPUT_DIRECTORY}/libmasonnative.so
)


if ("${ANDROID_ABI}" MATCHES "armeabi-v7a" OR "${ANDROID_ABI}" MATCHES "x86" AND NOT "${ANDROID_ABI}" MATCHES "x86_64")
  # On API Level 19 and lower we need to link with android_support
  # because it contains some implementation of functions such as "strtoll" and "strtoul"
  target_link_libraries(masonnativev8
          ${system-log}
          ${PROJECT_SOURCE_DIR}/src/main/jniLibs/${ANDROID_ABI}/libNativeScript.so
          ${ANDROID_NDK_ROOT}/sources/cxx-stl/llvm-libc++/libs/${ANDROID_ABI}/libandroid_support.a
          ${MASON_ANDROID_LIB}
          android
  )

else ()
  target_link_libraries(masonnativev8
          ${system-log}
          ${PROJECT_SOURCE_DIR}/src/main/jniLibs/${ANDROID_ABI}/libNativeScript.so
          ${MASON_ANDROID_LIB}
          android
  )
endif ()

## API 35 support
if("${ANDROID_ABI}" MATCHES "arm64-v8a$" OR "${ANDROID_ABI}" MATCHES "x86_64$")
  target_link_options(masonnativev8 PRIVATE "-Wl,-z,max-page-size=16384")
endif()


add_custom_command(TARGET masonnativev8 POST_BUILD COMMAND ${CMAKE_STRIP} --strip-unneeded $<TARGET_FILE:masonnativev8>)
