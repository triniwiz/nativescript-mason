#if 0
#elif defined(__arm64__) && __arm64__
// Generated by Apple Swift version 5.7 (swiftlang-5.7.0.127.4 clang-1400.0.29.50)
#ifndef MASON_SWIFT_H
#define MASON_SWIFT_H
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wgcc-compat"

#if !defined(__has_include)
# define __has_include(x) 0
#endif
#if !defined(__has_attribute)
# define __has_attribute(x) 0
#endif
#if !defined(__has_feature)
# define __has_feature(x) 0
#endif
#if !defined(__has_warning)
# define __has_warning(x) 0
#endif

#if __has_include(<swift/objc-prologue.h>)
# include <swift/objc-prologue.h>
#endif

#pragma clang diagnostic ignored "-Wduplicate-method-match"
#pragma clang diagnostic ignored "-Wauto-import"
#if defined(__OBJC__)
#include <Foundation/Foundation.h>
#endif
#if defined(__cplusplus)
#include <cstdint>
#include <cstddef>
#include <cstdbool>
#else
#include <stdint.h>
#include <stddef.h>
#include <stdbool.h>
#endif

#if !defined(SWIFT_TYPEDEFS)
# define SWIFT_TYPEDEFS 1
# if __has_include(<uchar.h>)
#  include <uchar.h>
# elif !defined(__cplusplus)
typedef uint_least16_t char16_t;
typedef uint_least32_t char32_t;
# endif
typedef float swift_float2  __attribute__((__ext_vector_type__(2)));
typedef float swift_float3  __attribute__((__ext_vector_type__(3)));
typedef float swift_float4  __attribute__((__ext_vector_type__(4)));
typedef double swift_double2  __attribute__((__ext_vector_type__(2)));
typedef double swift_double3  __attribute__((__ext_vector_type__(3)));
typedef double swift_double4  __attribute__((__ext_vector_type__(4)));
typedef int swift_int2  __attribute__((__ext_vector_type__(2)));
typedef int swift_int3  __attribute__((__ext_vector_type__(3)));
typedef int swift_int4  __attribute__((__ext_vector_type__(4)));
typedef unsigned int swift_uint2  __attribute__((__ext_vector_type__(2)));
typedef unsigned int swift_uint3  __attribute__((__ext_vector_type__(3)));
typedef unsigned int swift_uint4  __attribute__((__ext_vector_type__(4)));
#endif

#if !defined(SWIFT_PASTE)
# define SWIFT_PASTE_HELPER(x, y) x##y
# define SWIFT_PASTE(x, y) SWIFT_PASTE_HELPER(x, y)
#endif
#if !defined(SWIFT_METATYPE)
# define SWIFT_METATYPE(X) Class
#endif
#if !defined(SWIFT_CLASS_PROPERTY)
# if __has_feature(objc_class_property)
#  define SWIFT_CLASS_PROPERTY(...) __VA_ARGS__
# else
#  define SWIFT_CLASS_PROPERTY(...)
# endif
#endif

#if __has_attribute(objc_runtime_name)
# define SWIFT_RUNTIME_NAME(X) __attribute__((objc_runtime_name(X)))
#else
# define SWIFT_RUNTIME_NAME(X)
#endif
#if __has_attribute(swift_name)
# define SWIFT_COMPILE_NAME(X) __attribute__((swift_name(X)))
#else
# define SWIFT_COMPILE_NAME(X)
#endif
#if __has_attribute(objc_method_family)
# define SWIFT_METHOD_FAMILY(X) __attribute__((objc_method_family(X)))
#else
# define SWIFT_METHOD_FAMILY(X)
#endif
#if __has_attribute(noescape)
# define SWIFT_NOESCAPE __attribute__((noescape))
#else
# define SWIFT_NOESCAPE
#endif
#if __has_attribute(ns_consumed)
# define SWIFT_RELEASES_ARGUMENT __attribute__((ns_consumed))
#else
# define SWIFT_RELEASES_ARGUMENT
#endif
#if __has_attribute(warn_unused_result)
# define SWIFT_WARN_UNUSED_RESULT __attribute__((warn_unused_result))
#else
# define SWIFT_WARN_UNUSED_RESULT
#endif
#if __has_attribute(noreturn)
# define SWIFT_NORETURN __attribute__((noreturn))
#else
# define SWIFT_NORETURN
#endif
#if !defined(SWIFT_CLASS_EXTRA)
# define SWIFT_CLASS_EXTRA
#endif
#if !defined(SWIFT_PROTOCOL_EXTRA)
# define SWIFT_PROTOCOL_EXTRA
#endif
#if !defined(SWIFT_ENUM_EXTRA)
# define SWIFT_ENUM_EXTRA
#endif
#if !defined(SWIFT_CLASS)
# if __has_attribute(objc_subclassing_restricted)
#  define SWIFT_CLASS(SWIFT_NAME) SWIFT_RUNTIME_NAME(SWIFT_NAME) __attribute__((objc_subclassing_restricted)) SWIFT_CLASS_EXTRA
#  define SWIFT_CLASS_NAMED(SWIFT_NAME) __attribute__((objc_subclassing_restricted)) SWIFT_COMPILE_NAME(SWIFT_NAME) SWIFT_CLASS_EXTRA
# else
#  define SWIFT_CLASS(SWIFT_NAME) SWIFT_RUNTIME_NAME(SWIFT_NAME) SWIFT_CLASS_EXTRA
#  define SWIFT_CLASS_NAMED(SWIFT_NAME) SWIFT_COMPILE_NAME(SWIFT_NAME) SWIFT_CLASS_EXTRA
# endif
#endif
#if !defined(SWIFT_RESILIENT_CLASS)
# if __has_attribute(objc_class_stub)
#  define SWIFT_RESILIENT_CLASS(SWIFT_NAME) SWIFT_CLASS(SWIFT_NAME) __attribute__((objc_class_stub))
#  define SWIFT_RESILIENT_CLASS_NAMED(SWIFT_NAME) __attribute__((objc_class_stub)) SWIFT_CLASS_NAMED(SWIFT_NAME)
# else
#  define SWIFT_RESILIENT_CLASS(SWIFT_NAME) SWIFT_CLASS(SWIFT_NAME)
#  define SWIFT_RESILIENT_CLASS_NAMED(SWIFT_NAME) SWIFT_CLASS_NAMED(SWIFT_NAME)
# endif
#endif

#if !defined(SWIFT_PROTOCOL)
# define SWIFT_PROTOCOL(SWIFT_NAME) SWIFT_RUNTIME_NAME(SWIFT_NAME) SWIFT_PROTOCOL_EXTRA
# define SWIFT_PROTOCOL_NAMED(SWIFT_NAME) SWIFT_COMPILE_NAME(SWIFT_NAME) SWIFT_PROTOCOL_EXTRA
#endif

#if !defined(SWIFT_EXTENSION)
# define SWIFT_EXTENSION(M) SWIFT_PASTE(M##_Swift_, __LINE__)
#endif

#if !defined(OBJC_DESIGNATED_INITIALIZER)
# if __has_attribute(objc_designated_initializer)
#  define OBJC_DESIGNATED_INITIALIZER __attribute__((objc_designated_initializer))
# else
#  define OBJC_DESIGNATED_INITIALIZER
# endif
#endif
#if !defined(SWIFT_ENUM_ATTR)
# if defined(__has_attribute) && __has_attribute(enum_extensibility)
#  define SWIFT_ENUM_ATTR(_extensibility) __attribute__((enum_extensibility(_extensibility)))
# else
#  define SWIFT_ENUM_ATTR(_extensibility)
# endif
#endif
#if !defined(SWIFT_ENUM)
# define SWIFT_ENUM(_type, _name, _extensibility) enum _name : _type _name; enum SWIFT_ENUM_ATTR(_extensibility) SWIFT_ENUM_EXTRA _name : _type
# if __has_feature(generalized_swift_name)
#  define SWIFT_ENUM_NAMED(_type, _name, SWIFT_NAME, _extensibility) enum _name : _type _name SWIFT_COMPILE_NAME(SWIFT_NAME); enum SWIFT_COMPILE_NAME(SWIFT_NAME) SWIFT_ENUM_ATTR(_extensibility) SWIFT_ENUM_EXTRA _name : _type
# else
#  define SWIFT_ENUM_NAMED(_type, _name, SWIFT_NAME, _extensibility) SWIFT_ENUM(_type, _name, _extensibility)
# endif
#endif
#if !defined(SWIFT_UNAVAILABLE)
# define SWIFT_UNAVAILABLE __attribute__((unavailable))
#endif
#if !defined(SWIFT_UNAVAILABLE_MSG)
# define SWIFT_UNAVAILABLE_MSG(msg) __attribute__((unavailable(msg)))
#endif
#if !defined(SWIFT_AVAILABILITY)
# define SWIFT_AVAILABILITY(plat, ...) __attribute__((availability(plat, __VA_ARGS__)))
#endif
#if !defined(SWIFT_WEAK_IMPORT)
# define SWIFT_WEAK_IMPORT __attribute__((weak_import))
#endif
#if !defined(SWIFT_DEPRECATED)
# define SWIFT_DEPRECATED __attribute__((deprecated))
#endif
#if !defined(SWIFT_DEPRECATED_MSG)
# define SWIFT_DEPRECATED_MSG(...) __attribute__((deprecated(__VA_ARGS__)))
#endif
#if __has_feature(attribute_diagnose_if_objc)
# define SWIFT_DEPRECATED_OBJC(Msg) __attribute__((diagnose_if(1, Msg, "warning")))
#else
# define SWIFT_DEPRECATED_OBJC(Msg) SWIFT_DEPRECATED_MSG(Msg)
#endif
#if defined(__OBJC__)
#if !defined(IBSegueAction)
# define IBSegueAction
#endif
#endif
#if !defined(SWIFT_EXTERN)
# if defined(__cplusplus)
#  define SWIFT_EXTERN extern "C"
# else
#  define SWIFT_EXTERN extern
# endif
#endif
#if !defined(SWIFT_CALL)
# define SWIFT_CALL __attribute__((swiftcall))
#endif
#if defined(__cplusplus)
#if !defined(SWIFT_NOEXCEPT)
# define SWIFT_NOEXCEPT noexcept
#endif
#else
#if !defined(SWIFT_NOEXCEPT)
# define SWIFT_NOEXCEPT 
#endif
#endif
#if defined(__cplusplus)
#if !defined(SWIFT_CXX_INT_DEFINED)
#define SWIFT_CXX_INT_DEFINED
namespace swift {
using Int = ptrdiff_t;
using UInt = size_t;
}
#endif
#endif
#if defined(__OBJC__)
#if __has_feature(modules)
#if __has_warning("-Watimport-in-framework-header")
#pragma clang diagnostic ignored "-Watimport-in-framework-header"
#endif
@import CoreFoundation;
@import Foundation;
@import ObjectiveC;
@import UIKit;
#endif

#endif
#pragma clang diagnostic ignored "-Wproperty-attribute-mismatch"
#pragma clang diagnostic ignored "-Wduplicate-method-arg"
#if __has_warning("-Wpragma-clang-attribute")
# pragma clang diagnostic ignored "-Wpragma-clang-attribute"
#endif
#pragma clang diagnostic ignored "-Wunknown-pragmas"
#pragma clang diagnostic ignored "-Wnullability"
#pragma clang diagnostic ignored "-Wdollar-in-identifier-extension"

#if __has_attribute(external_source_symbol)
# pragma push_macro("any")
# undef any
# pragma clang attribute push(__attribute__((external_source_symbol(language="Swift", defined_in="Mason",generated_declaration))), apply_to=any(function,enum,objc_interface,objc_category,objc_protocol))
# pragma pop_macro("any")
#endif

#if defined(__OBJC__)
typedef SWIFT_ENUM_NAMED(NSInteger, AlignContent, "AlignContent", open) {
  AlignContentFlexStart = 0,
  AlignContentFlexEnd = 1,
  AlignContentCenter = 2,
  AlignContentStretch = 3,
  AlignContentSpaceBetween = 4,
  AlignContentSpaceAround = 5,
  AlignContentSpaceEvenly = 6,
};

typedef SWIFT_ENUM_NAMED(NSInteger, AlignItems, "AlignItems", open) {
  AlignItemsFlexStart = 0,
  AlignItemsFlexEnd = 1,
  AlignItemsCenter = 2,
  AlignItemsBaseline = 3,
  AlignItemsStretch = 4,
};

typedef SWIFT_ENUM_NAMED(NSInteger, AlignSelf, "AlignSelf", open) {
  AlignSelfAuto = 0,
  AlignSelfFlexStart = 1,
  AlignSelfFlexEnd = 2,
  AlignSelfCenter = 3,
  AlignSelfBaseline = 4,
  AlignSelfStretch = 5,
};

typedef SWIFT_ENUM_NAMED(NSInteger, Direction, "Direction", open) {
  DirectionInherit = 0,
  DirectionLTR = 1,
  DirectionRTL = 2,
};

typedef SWIFT_ENUM_NAMED(NSInteger, Display, "Display", open) {
  DisplayFlex = 0,
  DisplayNone = 1,
};

typedef SWIFT_ENUM_NAMED(NSInteger, FlexDirection, "FlexDirection", open) {
  FlexDirectionRow = 0,
  FlexDirectionColumn = 1,
  FlexDirectionRowReverse = 2,
  FlexDirectionColumnReverse = 3,
};

typedef SWIFT_ENUM_NAMED(NSInteger, FlexWrap, "FlexWrap", open) {
  FlexWrapNoWrap = 0,
  FlexWrapWrap = 1,
  FlexWrapWrapReverse = 2,
};

typedef SWIFT_ENUM_NAMED(NSInteger, JustifyContent, "JustifyContent", open) {
  JustifyContentFlexStart = 0,
  JustifyContentFlexEnd = 1,
  JustifyContentCenter = 2,
  JustifyContentSpaceBetween = 3,
  JustifyContentSpaceAround = 4,
  JustifyContentSpaceEvenly = 5,
};

enum MasonDimensionCompatType : NSInteger;
@class NSString;

SWIFT_CLASS_NAMED("MasonDimensionCompat")
@interface MasonDimensionCompat : NSObject
- (nonnull instancetype)initWithPoints:(float)points OBJC_DESIGNATED_INITIALIZER;
- (nonnull instancetype)initWithPercent:(float)percent OBJC_DESIGNATED_INITIALIZER;
@property (nonatomic, readonly) enum MasonDimensionCompatType type;
@property (nonatomic, readonly) float value;
@property (nonatomic, readonly, copy) NSString * _Nonnull cssValue;
SWIFT_CLASS_PROPERTY(@property (nonatomic, class, readonly, strong) MasonDimensionCompat * _Nonnull Undefined;)
+ (MasonDimensionCompat * _Nonnull)Undefined SWIFT_WARN_UNUSED_RESULT;
SWIFT_CLASS_PROPERTY(@property (nonatomic, class, readonly, strong) MasonDimensionCompat * _Nonnull Auto;)
+ (MasonDimensionCompat * _Nonnull)Auto SWIFT_WARN_UNUSED_RESULT;
- (nonnull instancetype)init SWIFT_UNAVAILABLE;
+ (nonnull instancetype)new SWIFT_UNAVAILABLE_MSG("-init is unavailable");
@end

typedef SWIFT_ENUM_NAMED(NSInteger, MasonDimensionCompatType, "MasonDimensionCompatType", open) {
  MasonDimensionCompatTypePoints = 0,
  MasonDimensionCompatTypePercent = 1,
  MasonDimensionCompatTypeAuto = 2,
  MasonDimensionCompatTypeUndefined = 3,
};


SWIFT_CLASS_NAMED("MasonLayout")
@interface MasonLayout : NSObject
@property (nonatomic, readonly) NSInteger order;
@property (nonatomic, readonly) float x;
@property (nonatomic, readonly) float y;
@property (nonatomic, readonly) float width;
@property (nonatomic, readonly) float height;
@property (nonatomic, readonly, copy) NSArray<MasonLayout *> * _Nonnull children;
@property (nonatomic, readonly, copy) NSString * _Nonnull description;
- (nonnull instancetype)init SWIFT_UNAVAILABLE;
+ (nonnull instancetype)new SWIFT_UNAVAILABLE_MSG("-init is unavailable");
@end

@class MasonStyle;

SWIFT_CLASS_NAMED("MasonNode")
@interface MasonNode : NSObject
@property (nonatomic, readonly) void * _Null_unspecified nativePtr;
@property (nonatomic, strong) MasonStyle * _Nonnull style;
@property (nonatomic, readonly, copy) NSArray<MasonNode *> * _Nonnull children;
- (nonnull instancetype)init OBJC_DESIGNATED_INITIALIZER;
- (nonnull instancetype)initWithStyle:(MasonStyle * _Nonnull)style OBJC_DESIGNATED_INITIALIZER;
- (nonnull instancetype)initWithStyle:(MasonStyle * _Nonnull)style children:(NSArray<MasonNode *> * _Nonnull)children OBJC_DESIGNATED_INITIALIZER;
@end


SWIFT_CLASS_NAMED("MasonRectCompat")
@interface MasonRectCompat : NSObject
@property (nonatomic, strong) MasonDimensionCompat * _Nonnull left;
@property (nonatomic, strong) MasonDimensionCompat * _Nonnull right;
@property (nonatomic, strong) MasonDimensionCompat * _Nonnull top;
@property (nonatomic, strong) MasonDimensionCompat * _Nonnull bottom;
- (nonnull instancetype)init:(MasonDimensionCompat * _Nonnull)left :(MasonDimensionCompat * _Nonnull)right :(MasonDimensionCompat * _Nonnull)top :(MasonDimensionCompat * _Nonnull)bottom OBJC_DESIGNATED_INITIALIZER;
- (nonnull instancetype)init SWIFT_UNAVAILABLE;
+ (nonnull instancetype)new SWIFT_UNAVAILABLE_MSG("-init is unavailable");
@end


SWIFT_CLASS_NAMED("MasonSizeCompat")
@interface MasonSizeCompat : NSObject
@property (nonatomic, strong) MasonDimensionCompat * _Nonnull width;
@property (nonatomic, strong) MasonDimensionCompat * _Nonnull height;
- (nonnull instancetype)init SWIFT_UNAVAILABLE;
+ (nonnull instancetype)new SWIFT_UNAVAILABLE_MSG("-init is unavailable");
@end

enum PositionType : NSInteger;
enum Overflow : NSInteger;

SWIFT_CLASS_NAMED("MasonStyle")
@interface MasonStyle : NSObject
@property (nonatomic, readonly) void * _Null_unspecified nativePtr;
- (nonnull instancetype)init OBJC_DESIGNATED_INITIALIZER;
@property (nonatomic) enum Display display;
@property (nonatomic) enum PositionType positionType;
@property (nonatomic) enum Direction direction;
@property (nonatomic) enum FlexDirection flexDirection;
@property (nonatomic) enum FlexWrap flexWrap;
@property (nonatomic) enum Overflow overflow;
@property (nonatomic) enum AlignItems alignItems;
@property (nonatomic) enum AlignSelf alignSelf;
@property (nonatomic) enum AlignContent alignContent;
@property (nonatomic) enum JustifyContent justifyContent;
@property (nonatomic, strong) MasonRectCompat * _Nonnull positionCompat;
- (void)setPositionLeft:(float)value :(NSInteger)type;
- (void)setPositionRight:(float)value :(NSInteger)type;
- (void)setPositionTop:(float)value :(NSInteger)type;
- (void)setPositionBottom:(float)value :(NSInteger)type;
- (void)setPositionWithValueType:(float)value :(NSInteger)type;
@property (nonatomic, strong) MasonRectCompat * _Nonnull marginCompat;
- (void)setMarginLeft:(float)value :(NSInteger)type;
- (void)setMarginRight:(float)value :(NSInteger)type;
- (void)setMarginTop:(float)value :(NSInteger)type;
- (void)setMarginBottom:(float)value :(NSInteger)type;
- (void)setMarginWithValueType:(float)value :(NSInteger)type;
@property (nonatomic, strong) MasonRectCompat * _Nonnull paddingCompat;
- (void)setPaddingLeft:(float)value :(NSInteger)type;
- (void)setPaddingRight:(float)value :(NSInteger)type;
- (void)setPaddingTop:(float)value :(NSInteger)type;
- (void)setPaddingBottom:(float)value :(NSInteger)type;
- (void)setPaddingWithValueType:(float)value :(NSInteger)type;
@property (nonatomic, strong) MasonRectCompat * _Nonnull borderCompat;
- (void)setBorderLeft:(float)value :(NSInteger)type;
- (void)setBorderRight:(float)value :(NSInteger)type;
- (void)setBorderTop:(float)value :(NSInteger)type;
- (void)setBorderBottom:(float)value :(NSInteger)type;
- (void)setBorderWithValueType:(float)value :(NSInteger)type;
@property (nonatomic) float flexGrow;
@property (nonatomic) float flexShrink;
@property (nonatomic, strong) MasonSizeCompat * _Nonnull minSizeCompat;
- (void)setMinSizeWidth:(float)value :(NSInteger)type;
- (void)setMinSizeHeight:(float)value :(NSInteger)type;
@property (nonatomic, strong) MasonSizeCompat * _Nonnull sizeCompat;
- (void)setSizeWidth:(float)value :(NSInteger)type;
- (void)setSizeHeight:(float)value :(NSInteger)type;
@property (nonatomic, strong) MasonSizeCompat * _Nonnull maxSizeCompat;
- (void)setMaxSizeWidth:(float)value :(NSInteger)type;
- (void)setMaxSizeHeight:(float)value :(NSInteger)type;
@property (nonatomic, strong) MasonSizeCompat * _Nonnull flexGapCompat;
- (void)setFlexGapWidth:(float)value :(NSInteger)type;
- (void)setFlexGapHeight:(float)value :(NSInteger)type;
@end

@class NSCoder;

SWIFT_CLASS_NAMED("MasonView")
@interface MasonView : UIView
@property (nonatomic, readonly, strong) MasonNode * _Nonnull node;
- (nonnull instancetype)initWithFrame:(CGRect)frame OBJC_DESIGNATED_INITIALIZER;
- (nullable instancetype)initWithCoder:(NSCoder * _Nonnull)coder SWIFT_UNAVAILABLE;
@property (nonatomic, strong) MasonStyle * _Nonnull style;
- (void)setPadding:(float)left :(float)top :(float)right :(float)bottom;
- (void)setBorder:(float)left :(float)top :(float)right :(float)bottom;
- (void)setMargin:(float)left :(float)top :(float)right :(float)bottom;
- (void)setPosition:(float)left :(float)top :(float)right :(float)bottom;
- (void)setMinSize:(float)width :(float)height;
- (void)setSize:(float)width :(float)height;
- (void)setMaxSize:(float)width :(float)height;
- (void)setFlexGap:(float)width :(float)height;
- (void)layoutSubviews;
- (MasonNode * _Nonnull)nodeForViewWithView:(UIView * _Nonnull)view SWIFT_WARN_UNUSED_RESULT;
- (void)addSubview:(UIView * _Nonnull)view;
- (void)addSubviews:(NSArray<UIView *> * _Nonnull)views;
- (void)addSubviews:(NSArray<UIView *> * _Nonnull)views at:(NSInteger)index;
- (void)insertSubview:(UIView * _Nonnull)view atIndex:(NSInteger)index;
- (void)removeFromSuperview;
@end


SWIFT_CLASS_NAMED("MeasureOutput")
@interface MeasureOutput : NSObject
- (nonnull instancetype)init OBJC_DESIGNATED_INITIALIZER;
@end

typedef SWIFT_ENUM_NAMED(NSInteger, Overflow, "Overflow", open) {
  OverflowVisible = 0,
  OverflowHidden = 1,
  OverflowScroll = 2,
};

typedef SWIFT_ENUM_NAMED(NSInteger, PositionType, "PositionType", open) {
  PositionTypeRelative = 0,
  PositionTypeAbsolute = 1,
};


SWIFT_CLASS_NAMED("TSCMason")
@interface Mason : NSObject
@property (nonatomic, readonly) void * _Null_unspecified nativePtr;
- (nonnull instancetype)init OBJC_DESIGNATED_INITIALIZER;
- (void)clear;
@end

#endif
#if defined(__cplusplus)
#endif
#if __has_attribute(external_source_symbol)
# pragma clang attribute pop
#endif
#pragma clang diagnostic pop
#endif

#else
#error unsupported Swift architecture
#endif
