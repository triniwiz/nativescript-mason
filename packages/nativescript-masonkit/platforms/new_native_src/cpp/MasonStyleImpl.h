//
// Created by Osei Fortune on 01/01/2024.
//

#ifndef MASON_STYLEIMPL_H
#define MASON_STYLEIMPL_H

#include "Common.h"
#include "Helpers.h"

class MasonStyleImpl {
private:
    void *style_;

public:

    void* GetStyle() {
        return style_;
    }

    ~MasonStyleImpl() {
        if (style_ != nullptr) {
            mason_style_destroy(style_);
            style_ = nullptr;
        }
    }

    MasonStyleImpl(void *style_);

    static void Init(v8::Isolate *isolate);

    static MasonStyleImpl *GetPointer(v8::Local<v8::Object> object);

    static v8::Local<v8::FunctionTemplate> GetCtor(v8::Isolate *isolate);

    static void GetDisplay(v8::Local<v8::String> property,
                                const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetDisplay(v8::Local<v8::String> property,
                                v8::Local<v8::Value> value,
                                const v8::PropertyCallbackInfo<void> &info);

    static void GetScrollbarWidth(v8::Local<v8::String> property,
                           const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetScrollbarWidth(v8::Local<v8::String> property,
                           v8::Local<v8::Value> value,
                           const v8::PropertyCallbackInfo<void> &info);


    static void GetOverflow(v8::Local<v8::String> property,
                                  const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetOverflow(v8::Local<v8::String> property,
                                  v8::Local<v8::Value> value,
                                  const v8::PropertyCallbackInfo<void> &info);


    static void GetOverflowX(v8::Local<v8::String> property,
                            const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetOverflowX(v8::Local<v8::String> property,
                            v8::Local<v8::Value> value,
                            const v8::PropertyCallbackInfo<void> &info);


    static void GetOverflowY(v8::Local<v8::String> property,
                             const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetOverflowY(v8::Local<v8::String> property,
                             v8::Local<v8::Value> value,
                             const v8::PropertyCallbackInfo<void> &info);

    static void GetPosition(v8::Local<v8::String> property,
                             const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetPosition(v8::Local<v8::String> property,
                             v8::Local<v8::Value> value,
                             const v8::PropertyCallbackInfo<void> &info);

    static void GetFlexWrap(v8::Local<v8::String> property,
                            const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetFlexWrap(v8::Local<v8::String> property,
                            v8::Local<v8::Value> value,
                            const v8::PropertyCallbackInfo<void> &info);

    static void GetAlignItems(v8::Local<v8::String> property,
                            const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetAlignItems(v8::Local<v8::String> property,
                            v8::Local<v8::Value> value,
                            const v8::PropertyCallbackInfo<void> &info);

    static void GetAlignContent(v8::Local<v8::String> property,
                          const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetAlignContent(v8::Local<v8::String> property,
                          v8::Local<v8::Value> value,
                          const v8::PropertyCallbackInfo<void> &info);

    static void GetAlignSelf(v8::Local<v8::String> property,
                                const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetAlignSelf(v8::Local<v8::String> property,
                                v8::Local<v8::Value> value,
                                const v8::PropertyCallbackInfo<void> &info);

    static void GetJustifyItems(v8::Local<v8::String> property,
                             const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetJustifyItems(v8::Local<v8::String> property,
                             v8::Local<v8::Value> value,
                             const v8::PropertyCallbackInfo<void> &info);

    static void GetJustifySelf(v8::Local<v8::String> property,
                                const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetJustifySelf(v8::Local<v8::String> property,
                                v8::Local<v8::Value> value,
                                const v8::PropertyCallbackInfo<void> &info);

    static void GetJustifyContent(v8::Local<v8::String> property,
                                const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetJustifyContent(v8::Local<v8::String> property,
                                v8::Local<v8::Value> value,
                                const v8::PropertyCallbackInfo<void> &info);

    static void GetInset(v8::Local<v8::String> property,
                                  const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetInset(v8::Local<v8::String> property,
                                  v8::Local<v8::Value> value,
                                  const v8::PropertyCallbackInfo<void> &info);

    static void GetInsetLeft(v8::Local<v8::String> property,
                            const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetInsetLeft(v8::Local<v8::String> property,
                            v8::Local<v8::Value> value,
                            const v8::PropertyCallbackInfo<void> &info);


    static void GetInsetTop(v8::Local<v8::String> property,
                         const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetInsetTop(v8::Local<v8::String> property,
                         v8::Local<v8::Value> value,
                         const v8::PropertyCallbackInfo<void> &info);

    static void GetInsetRight(v8::Local<v8::String> property,
                            const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetInsetRight(v8::Local<v8::String> property,
                            v8::Local<v8::Value> value,
                            const v8::PropertyCallbackInfo<void> &info);


    static void GetInsetBottom(v8::Local<v8::String> property,
                              const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetInsetBottom(v8::Local<v8::String> property,
                              v8::Local<v8::Value> value,
                              const v8::PropertyCallbackInfo<void> &info);

    static void GetMargin(v8::Local<v8::String> property,
                         const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetMargin(v8::Local<v8::String> property,
                         v8::Local<v8::Value> value,
                         const v8::PropertyCallbackInfo<void> &info);


    static void GetMarginLeft(v8::Local<v8::String> property,
                             const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetMarginLeft(v8::Local<v8::String> property,
                             v8::Local<v8::Value> value,
                             const v8::PropertyCallbackInfo<void> &info);


    static void GetMarginTop(v8::Local<v8::String> property,
                            const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetMarginTop(v8::Local<v8::String> property,
                            v8::Local<v8::Value> value,
                            const v8::PropertyCallbackInfo<void> &info);

    static void GetMarginRight(v8::Local<v8::String> property,
                              const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetMarginRight(v8::Local<v8::String> property,
                              v8::Local<v8::Value> value,
                              const v8::PropertyCallbackInfo<void> &info);


    static void GetMarginBottom(v8::Local<v8::String> property,
                               const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetMarginBottom(v8::Local<v8::String> property,
                               v8::Local<v8::Value> value,
                               const v8::PropertyCallbackInfo<void> &info);


    static void GetPadding(v8::Local<v8::String> property,
                          const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetPadding(v8::Local<v8::String> property,
                          v8::Local<v8::Value> value,
                          const v8::PropertyCallbackInfo<void> &info);


    static void GetPaddingLeft(v8::Local<v8::String> property,
                              const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetPaddingLeft(v8::Local<v8::String> property,
                              v8::Local<v8::Value> value,
                              const v8::PropertyCallbackInfo<void> &info);


    static void GetPaddingTop(v8::Local<v8::String> property,
                             const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetPaddingTop(v8::Local<v8::String> property,
                             v8::Local<v8::Value> value,
                             const v8::PropertyCallbackInfo<void> &info);

    static void GetPaddingRight(v8::Local<v8::String> property,
                               const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetPaddingRight(v8::Local<v8::String> property,
                               v8::Local<v8::Value> value,
                               const v8::PropertyCallbackInfo<void> &info);


    static void GetPaddingBottom(v8::Local<v8::String> property,
                                const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetPaddingBottom(v8::Local<v8::String> property,
                                v8::Local<v8::Value> value,
                                const v8::PropertyCallbackInfo<void> &info);


    static void GetBorder(v8::Local<v8::String> property,
                           const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetBorder(v8::Local<v8::String> property,
                           v8::Local<v8::Value> value,
                           const v8::PropertyCallbackInfo<void> &info);


    static void GetBorderLeft(v8::Local<v8::String> property,
                               const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetBorderLeft(v8::Local<v8::String> property,
                               v8::Local<v8::Value> value,
                               const v8::PropertyCallbackInfo<void> &info);


    static void GetBorderTop(v8::Local<v8::String> property,
                              const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetBorderTop(v8::Local<v8::String> property,
                              v8::Local<v8::Value> value,
                              const v8::PropertyCallbackInfo<void> &info);

    static void GetBorderRight(v8::Local<v8::String> property,
                                const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetBorderRight(v8::Local<v8::String> property,
                                v8::Local<v8::Value> value,
                                const v8::PropertyCallbackInfo<void> &info);


    static void GetBorderBottom(v8::Local<v8::String> property,
                                 const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetBorderBottom(v8::Local<v8::String> property,
                                 v8::Local<v8::Value> value,
                                 const v8::PropertyCallbackInfo<void> &info);


    static void GetFlexGrow(v8::Local<v8::String> property,
                                const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetFlexGrow(v8::Local<v8::String> property,
                                v8::Local<v8::Value> value,
                                const v8::PropertyCallbackInfo<void> &info);

    static void GetFlexShrink(v8::Local<v8::String> property,
                            const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetFlexShrink(v8::Local<v8::String> property,
                            v8::Local<v8::Value> value,
                            const v8::PropertyCallbackInfo<void> &info);

    static void GetFlexBasis(v8::Local<v8::String> property,
                              const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetFlexBasis(v8::Local<v8::String> property,
                              v8::Local<v8::Value> value,
                              const v8::PropertyCallbackInfo<void> &info);

    static void GetGap(v8::Local<v8::String> property,
                             const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetGap(v8::Local<v8::String> property,
                             v8::Local<v8::Value> value,
                             const v8::PropertyCallbackInfo<void> &info);

    static void GetRowGap(v8::Local<v8::String> property,
                       const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetRowGap(v8::Local<v8::String> property,
                       v8::Local<v8::Value> value,
                       const v8::PropertyCallbackInfo<void> &info);

    static void GetColumnGap(v8::Local<v8::String> property,
                          const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetColumnGap(v8::Local<v8::String> property,
                          v8::Local<v8::Value> value,
                          const v8::PropertyCallbackInfo<void> &info);

    static void GetAspectRatio(v8::Local<v8::String> property,
                             const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetAspectRatio(v8::Local<v8::String> property,
                             v8::Local<v8::Value> value,
                             const v8::PropertyCallbackInfo<void> &info);

    static void GetFlexDirection(v8::Local<v8::String> property,
                               const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetFlexDirection(v8::Local<v8::String> property,
                               v8::Local<v8::Value> value,
                               const v8::PropertyCallbackInfo<void> &info);

    static void GetGridAutoRows(v8::Local<v8::String> property,
                                 const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetGridAutoRows(v8::Local<v8::String> property,
                                 v8::Local<v8::Value> value,
                                 const v8::PropertyCallbackInfo<void> &info);

    static void GetGridAutoColumns(v8::Local<v8::String> property,
                                const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetGridAutoColumns(v8::Local<v8::String> property,
                                v8::Local<v8::Value> value,
                                const v8::PropertyCallbackInfo<void> &info);

    static void GetArea(v8::Local<v8::String> property,
                                   const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetArea(v8::Local<v8::String> property,
                                   v8::Local<v8::Value> value,
                                   const v8::PropertyCallbackInfo<void> &info);

    static void GetColumn(v8::Local<v8::String> property,
                        const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetColumn(v8::Local<v8::String> property,
                        v8::Local<v8::Value> value,
                        const v8::PropertyCallbackInfo<void> &info);

    static void GetRow(v8::Local<v8::String> property,
                          const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetRow(v8::Local<v8::String> property,
                          v8::Local<v8::Value> value,
                          const v8::PropertyCallbackInfo<void> &info);

    static void GetColumnStart(v8::Local<v8::String> property,
                       const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetColumnStart(v8::Local<v8::String> property,
                       v8::Local<v8::Value> value,
                       const v8::PropertyCallbackInfo<void> &info);

    static void GetColumnEnd(v8::Local<v8::String> property,
                               const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetColumnEnd(v8::Local<v8::String> property,
                               v8::Local<v8::Value> value,
                               const v8::PropertyCallbackInfo<void> &info);

    static void GetRowStart(v8::Local<v8::String> property,
                               const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetRowStart(v8::Local<v8::String> property,
                               v8::Local<v8::Value> value,
                               const v8::PropertyCallbackInfo<void> &info);

    static void GetRowEnd(v8::Local<v8::String> property,
                             const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetRowEnd(v8::Local<v8::String> property,
                             v8::Local<v8::Value> value,
                             const v8::PropertyCallbackInfo<void> &info);

    static void GetGridTemplateRows(v8::Local<v8::String> property,
                          const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetGridTemplateRows(v8::Local<v8::String> property,
                          v8::Local<v8::Value> value,
                          const v8::PropertyCallbackInfo<void> &info);

    static void GetGridTemplateColumns(v8::Local<v8::String> property,
                                    const v8::PropertyCallbackInfo<v8::Value> &info);

    static void SetGridTemplateColumns(v8::Local<v8::String> property,
                                    v8::Local<v8::Value> value,
                                    const v8::PropertyCallbackInfo<void> &info);

};


#endif //MASON_STYLEIMPL_H
