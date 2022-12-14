// This file is generated by TypeBuilder_h.template.

// Copyright (c) 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef v8_inspector_protocol_Page_h
#define v8_inspector_protocol_Page_h

#include "src/inspector/protocol/Protocol.h"
// For each imported domain we generate a ValueConversions struct instead of a full domain definition
// and include Domain::API version from there.
#include "src/inspector/protocol/Debugger.h"
#include "src/inspector/protocol/DOM.h"
#include "src/inspector/protocol/Network.h"
#include "src/inspector/protocol/Runtime.h"

namespace v8_inspector {
namespace protocol {
namespace Page {
using FrameId = String;
class Frame;
class FrameResource;
class FrameResourceTree;
class FrameTree;
using ScriptIdentifier = String;
class LayoutViewport;
class VisualViewport;
class Viewport;
class FontFamilies;
class FontSizes;
using ClientNavigationReason = String;

// ------------- Forward and enum declarations.

namespace ClientNavigationReasonEnum {
 extern const char FormSubmissionGet[];
 extern const char FormSubmissionPost[];
 extern const char HttpHeaderRefresh[];
 extern const char ScriptInitiated[];
 extern const char MetaTagRefresh[];
 extern const char PageBlockInterstitial[];
 extern const char Reload[];
} // namespace ClientNavigationReasonEnum

namespace CaptureScreenshot {
namespace FormatEnum {
 extern const char* Jpeg;
 extern const char* Png;
} // FormatEnum
} // CaptureScreenshot

namespace CaptureSnapshot {
namespace FormatEnum {
 extern const char* Mhtml;
} // FormatEnum
} // CaptureSnapshot

namespace PrintToPDF {
namespace TransferModeEnum {
 extern const char* ReturnAsBase64;
 extern const char* ReturnAsStream;
} // TransferModeEnum
} // PrintToPDF

namespace SetDownloadBehavior {
namespace BehaviorEnum {
 extern const char* Deny;
 extern const char* Allow;
 extern const char* Default;
} // BehaviorEnum
} // SetDownloadBehavior

namespace SetTouchEmulationEnabled {
namespace ConfigurationEnum {
 extern const char* Mobile;
 extern const char* Desktop;
} // ConfigurationEnum
} // SetTouchEmulationEnabled

namespace StartScreencast {
namespace FormatEnum {
 extern const char* Jpeg;
 extern const char* Png;
} // FormatEnum
} // StartScreencast

namespace SetWebLifecycleState {
namespace StateEnum {
 extern const char* Frozen;
 extern const char* Active;
} // StateEnum
} // SetWebLifecycleState

namespace FileChooserOpened {
namespace ModeEnum {
 extern const char* SelectSingle;
 extern const char* SelectMultiple;
} // ModeEnum
} // FileChooserOpened

namespace FrameScheduledNavigation {
namespace ReasonEnum {
 extern const char* FormSubmissionGet;
 extern const char* FormSubmissionPost;
 extern const char* HttpHeaderRefresh;
 extern const char* ScriptInitiated;
 extern const char* MetaTagRefresh;
 extern const char* PageBlockInterstitial;
 extern const char* Reload;
} // ReasonEnum
} // FrameScheduledNavigation

// ------------- Type and builder declarations.

class  Frame : public ::v8_crdtp::ProtocolObject<Frame> {
public:
    ~Frame() override { }

    String getId() { return m_id; }
    void setId(const String& value) { m_id = value; }

    bool hasParentId() { return m_parentId.isJust(); }
    String getParentId(const String& defaultValue) { return m_parentId.isJust() ? m_parentId.fromJust() : defaultValue; }
    void setParentId(const String& value) { m_parentId = value; }

    String getLoaderId() { return m_loaderId; }
    void setLoaderId(const String& value) { m_loaderId = value; }

    bool hasName() { return m_name.isJust(); }
    String getName(const String& defaultValue) { return m_name.isJust() ? m_name.fromJust() : defaultValue; }
    void setName(const String& value) { m_name = value; }

    String getUrl() { return m_url; }
    void setUrl(const String& value) { m_url = value; }

    bool hasUrlFragment() { return m_urlFragment.isJust(); }
    String getUrlFragment(const String& defaultValue) { return m_urlFragment.isJust() ? m_urlFragment.fromJust() : defaultValue; }
    void setUrlFragment(const String& value) { m_urlFragment = value; }

    String getSecurityOrigin() { return m_securityOrigin; }
    void setSecurityOrigin(const String& value) { m_securityOrigin = value; }

    String getMimeType() { return m_mimeType; }
    void setMimeType(const String& value) { m_mimeType = value; }

    bool hasUnreachableUrl() { return m_unreachableUrl.isJust(); }
    String getUnreachableUrl(const String& defaultValue) { return m_unreachableUrl.isJust() ? m_unreachableUrl.fromJust() : defaultValue; }
    void setUnreachableUrl(const String& value) { m_unreachableUrl = value; }

    template<int STATE>
    class FrameBuilder {
    public:
        enum {
            NoFieldsSet = 0,
            IdSet = 1 << 1,
            LoaderIdSet = 1 << 2,
            UrlSet = 1 << 3,
            SecurityOriginSet = 1 << 4,
            MimeTypeSet = 1 << 5,
            AllFieldsSet = (IdSet | LoaderIdSet | UrlSet | SecurityOriginSet | MimeTypeSet | 0)};


        FrameBuilder<STATE | IdSet>& setId(const String& value)
        {
            static_assert(!(STATE & IdSet), "property id should not be set yet");
            m_result->setId(value);
            return castState<IdSet>();
        }

        FrameBuilder<STATE>& setParentId(const String& value)
        {
            m_result->setParentId(value);
            return *this;
        }

        FrameBuilder<STATE | LoaderIdSet>& setLoaderId(const String& value)
        {
            static_assert(!(STATE & LoaderIdSet), "property loaderId should not be set yet");
            m_result->setLoaderId(value);
            return castState<LoaderIdSet>();
        }

        FrameBuilder<STATE>& setName(const String& value)
        {
            m_result->setName(value);
            return *this;
        }

        FrameBuilder<STATE | UrlSet>& setUrl(const String& value)
        {
            static_assert(!(STATE & UrlSet), "property url should not be set yet");
            m_result->setUrl(value);
            return castState<UrlSet>();
        }

        FrameBuilder<STATE>& setUrlFragment(const String& value)
        {
            m_result->setUrlFragment(value);
            return *this;
        }

        FrameBuilder<STATE | SecurityOriginSet>& setSecurityOrigin(const String& value)
        {
            static_assert(!(STATE & SecurityOriginSet), "property securityOrigin should not be set yet");
            m_result->setSecurityOrigin(value);
            return castState<SecurityOriginSet>();
        }

        FrameBuilder<STATE | MimeTypeSet>& setMimeType(const String& value)
        {
            static_assert(!(STATE & MimeTypeSet), "property mimeType should not be set yet");
            m_result->setMimeType(value);
            return castState<MimeTypeSet>();
        }

        FrameBuilder<STATE>& setUnreachableUrl(const String& value)
        {
            m_result->setUnreachableUrl(value);
            return *this;
        }

        std::unique_ptr<Frame> build()
        {
            static_assert(STATE == AllFieldsSet, "state should be AllFieldsSet");
            return std::move(m_result);
        }

    private:
        friend class Frame;
        FrameBuilder() : m_result(new Frame()) { }

        template<int STEP> FrameBuilder<STATE | STEP>& castState()
        {
            return *reinterpret_cast<FrameBuilder<STATE | STEP>*>(this);
        }

        std::unique_ptr<protocol::Page::Frame> m_result;
    };

    static FrameBuilder<0> create()
    {
        return FrameBuilder<0>();
    }

private:
    DECLARE_SERIALIZATION_SUPPORT();

    Frame()
    {
    }

    String m_id;
    Maybe<String> m_parentId;
    String m_loaderId;
    Maybe<String> m_name;
    String m_url;
    Maybe<String> m_urlFragment;
    String m_securityOrigin;
    String m_mimeType;
    Maybe<String> m_unreachableUrl;
};


class  FrameResource : public ::v8_crdtp::ProtocolObject<FrameResource> {
public:
    ~FrameResource() override { }

    String getUrl() { return m_url; }
    void setUrl(const String& value) { m_url = value; }

    String getType() { return m_type; }
    void setType(const String& value) { m_type = value; }

    String getMimeType() { return m_mimeType; }
    void setMimeType(const String& value) { m_mimeType = value; }

    bool hasLastModified() { return m_lastModified.isJust(); }
    double getLastModified(double defaultValue) { return m_lastModified.isJust() ? m_lastModified.fromJust() : defaultValue; }
    void setLastModified(double value) { m_lastModified = value; }

    bool hasContentSize() { return m_contentSize.isJust(); }
    double getContentSize(double defaultValue) { return m_contentSize.isJust() ? m_contentSize.fromJust() : defaultValue; }
    void setContentSize(double value) { m_contentSize = value; }

    bool hasFailed() { return m_failed.isJust(); }
    bool getFailed(bool defaultValue) { return m_failed.isJust() ? m_failed.fromJust() : defaultValue; }
    void setFailed(bool value) { m_failed = value; }

    bool hasCanceled() { return m_canceled.isJust(); }
    bool getCanceled(bool defaultValue) { return m_canceled.isJust() ? m_canceled.fromJust() : defaultValue; }
    void setCanceled(bool value) { m_canceled = value; }

    template<int STATE>
    class FrameResourceBuilder {
    public:
        enum {
            NoFieldsSet = 0,
            UrlSet = 1 << 1,
            TypeSet = 1 << 2,
            MimeTypeSet = 1 << 3,
            AllFieldsSet = (UrlSet | TypeSet | MimeTypeSet | 0)};


        FrameResourceBuilder<STATE | UrlSet>& setUrl(const String& value)
        {
            static_assert(!(STATE & UrlSet), "property url should not be set yet");
            m_result->setUrl(value);
            return castState<UrlSet>();
        }

        FrameResourceBuilder<STATE | TypeSet>& setType(const String& value)
        {
            static_assert(!(STATE & TypeSet), "property type should not be set yet");
            m_result->setType(value);
            return castState<TypeSet>();
        }

        FrameResourceBuilder<STATE | MimeTypeSet>& setMimeType(const String& value)
        {
            static_assert(!(STATE & MimeTypeSet), "property mimeType should not be set yet");
            m_result->setMimeType(value);
            return castState<MimeTypeSet>();
        }

        FrameResourceBuilder<STATE>& setLastModified(double value)
        {
            m_result->setLastModified(value);
            return *this;
        }

        FrameResourceBuilder<STATE>& setContentSize(double value)
        {
            m_result->setContentSize(value);
            return *this;
        }

        FrameResourceBuilder<STATE>& setFailed(bool value)
        {
            m_result->setFailed(value);
            return *this;
        }

        FrameResourceBuilder<STATE>& setCanceled(bool value)
        {
            m_result->setCanceled(value);
            return *this;
        }

        std::unique_ptr<FrameResource> build()
        {
            static_assert(STATE == AllFieldsSet, "state should be AllFieldsSet");
            return std::move(m_result);
        }

    private:
        friend class FrameResource;
        FrameResourceBuilder() : m_result(new FrameResource()) { }

        template<int STEP> FrameResourceBuilder<STATE | STEP>& castState()
        {
            return *reinterpret_cast<FrameResourceBuilder<STATE | STEP>*>(this);
        }

        std::unique_ptr<protocol::Page::FrameResource> m_result;
    };

    static FrameResourceBuilder<0> create()
    {
        return FrameResourceBuilder<0>();
    }

private:
    DECLARE_SERIALIZATION_SUPPORT();

    FrameResource()
    {
    }

    String m_url;
    String m_type;
    String m_mimeType;
    Maybe<double> m_lastModified;
    Maybe<double> m_contentSize;
    Maybe<bool> m_failed;
    Maybe<bool> m_canceled;
};


class  FrameResourceTree : public ::v8_crdtp::ProtocolObject<FrameResourceTree> {
public:
    ~FrameResourceTree() override { }

    protocol::Page::Frame* getFrame() { return m_frame.get(); }
    void setFrame(std::unique_ptr<protocol::Page::Frame> value) { m_frame = std::move(value); }

    bool hasChildFrames() { return m_childFrames.isJust(); }
    protocol::Array<protocol::Page::FrameResourceTree>* getChildFrames(protocol::Array<protocol::Page::FrameResourceTree>* defaultValue) { return m_childFrames.isJust() ? m_childFrames.fromJust() : defaultValue; }
    void setChildFrames(std::unique_ptr<protocol::Array<protocol::Page::FrameResourceTree>> value) { m_childFrames = std::move(value); }

    protocol::Array<protocol::Page::FrameResource>* getResources() { return m_resources.get(); }
    void setResources(std::unique_ptr<protocol::Array<protocol::Page::FrameResource>> value) { m_resources = std::move(value); }

    template<int STATE>
    class FrameResourceTreeBuilder {
    public:
        enum {
            NoFieldsSet = 0,
            FrameSet = 1 << 1,
            ResourcesSet = 1 << 2,
            AllFieldsSet = (FrameSet | ResourcesSet | 0)};


        FrameResourceTreeBuilder<STATE | FrameSet>& setFrame(std::unique_ptr<protocol::Page::Frame> value)
        {
            static_assert(!(STATE & FrameSet), "property frame should not be set yet");
            m_result->setFrame(std::move(value));
            return castState<FrameSet>();
        }

        FrameResourceTreeBuilder<STATE>& setChildFrames(std::unique_ptr<protocol::Array<protocol::Page::FrameResourceTree>> value)
        {
            m_result->setChildFrames(std::move(value));
            return *this;
        }

        FrameResourceTreeBuilder<STATE | ResourcesSet>& setResources(std::unique_ptr<protocol::Array<protocol::Page::FrameResource>> value)
        {
            static_assert(!(STATE & ResourcesSet), "property resources should not be set yet");
            m_result->setResources(std::move(value));
            return castState<ResourcesSet>();
        }

        std::unique_ptr<FrameResourceTree> build()
        {
            static_assert(STATE == AllFieldsSet, "state should be AllFieldsSet");
            return std::move(m_result);
        }

    private:
        friend class FrameResourceTree;
        FrameResourceTreeBuilder() : m_result(new FrameResourceTree()) { }

        template<int STEP> FrameResourceTreeBuilder<STATE | STEP>& castState()
        {
            return *reinterpret_cast<FrameResourceTreeBuilder<STATE | STEP>*>(this);
        }

        std::unique_ptr<protocol::Page::FrameResourceTree> m_result;
    };

    static FrameResourceTreeBuilder<0> create()
    {
        return FrameResourceTreeBuilder<0>();
    }

private:
    DECLARE_SERIALIZATION_SUPPORT();

    FrameResourceTree()
    {
    }

    std::unique_ptr<protocol::Page::Frame> m_frame;
    Maybe<protocol::Array<protocol::Page::FrameResourceTree>> m_childFrames;
    std::unique_ptr<protocol::Array<protocol::Page::FrameResource>> m_resources;
};


class  FrameTree : public ::v8_crdtp::ProtocolObject<FrameTree> {
public:
    ~FrameTree() override { }

    protocol::Page::Frame* getFrame() { return m_frame.get(); }
    void setFrame(std::unique_ptr<protocol::Page::Frame> value) { m_frame = std::move(value); }

    bool hasChildFrames() { return m_childFrames.isJust(); }
    protocol::Array<protocol::Page::FrameTree>* getChildFrames(protocol::Array<protocol::Page::FrameTree>* defaultValue) { return m_childFrames.isJust() ? m_childFrames.fromJust() : defaultValue; }
    void setChildFrames(std::unique_ptr<protocol::Array<protocol::Page::FrameTree>> value) { m_childFrames = std::move(value); }

    template<int STATE>
    class FrameTreeBuilder {
    public:
        enum {
            NoFieldsSet = 0,
            FrameSet = 1 << 1,
            AllFieldsSet = (FrameSet | 0)};


        FrameTreeBuilder<STATE | FrameSet>& setFrame(std::unique_ptr<protocol::Page::Frame> value)
        {
            static_assert(!(STATE & FrameSet), "property frame should not be set yet");
            m_result->setFrame(std::move(value));
            return castState<FrameSet>();
        }

        FrameTreeBuilder<STATE>& setChildFrames(std::unique_ptr<protocol::Array<protocol::Page::FrameTree>> value)
        {
            m_result->setChildFrames(std::move(value));
            return *this;
        }

        std::unique_ptr<FrameTree> build()
        {
            static_assert(STATE == AllFieldsSet, "state should be AllFieldsSet");
            return std::move(m_result);
        }

    private:
        friend class FrameTree;
        FrameTreeBuilder() : m_result(new FrameTree()) { }

        template<int STEP> FrameTreeBuilder<STATE | STEP>& castState()
        {
            return *reinterpret_cast<FrameTreeBuilder<STATE | STEP>*>(this);
        }

        std::unique_ptr<protocol::Page::FrameTree> m_result;
    };

    static FrameTreeBuilder<0> create()
    {
        return FrameTreeBuilder<0>();
    }

private:
    DECLARE_SERIALIZATION_SUPPORT();

    FrameTree()
    {
    }

    std::unique_ptr<protocol::Page::Frame> m_frame;
    Maybe<protocol::Array<protocol::Page::FrameTree>> m_childFrames;
};


class  LayoutViewport : public ::v8_crdtp::ProtocolObject<LayoutViewport> {
public:
    ~LayoutViewport() override { }

    int getPageX() { return m_pageX; }
    void setPageX(int value) { m_pageX = value; }

    int getPageY() { return m_pageY; }
    void setPageY(int value) { m_pageY = value; }

    int getClientWidth() { return m_clientWidth; }
    void setClientWidth(int value) { m_clientWidth = value; }

    int getClientHeight() { return m_clientHeight; }
    void setClientHeight(int value) { m_clientHeight = value; }

    template<int STATE>
    class LayoutViewportBuilder {
    public:
        enum {
            NoFieldsSet = 0,
            PageXSet = 1 << 1,
            PageYSet = 1 << 2,
            ClientWidthSet = 1 << 3,
            ClientHeightSet = 1 << 4,
            AllFieldsSet = (PageXSet | PageYSet | ClientWidthSet | ClientHeightSet | 0)};


        LayoutViewportBuilder<STATE | PageXSet>& setPageX(int value)
        {
            static_assert(!(STATE & PageXSet), "property pageX should not be set yet");
            m_result->setPageX(value);
            return castState<PageXSet>();
        }

        LayoutViewportBuilder<STATE | PageYSet>& setPageY(int value)
        {
            static_assert(!(STATE & PageYSet), "property pageY should not be set yet");
            m_result->setPageY(value);
            return castState<PageYSet>();
        }

        LayoutViewportBuilder<STATE | ClientWidthSet>& setClientWidth(int value)
        {
            static_assert(!(STATE & ClientWidthSet), "property clientWidth should not be set yet");
            m_result->setClientWidth(value);
            return castState<ClientWidthSet>();
        }

        LayoutViewportBuilder<STATE | ClientHeightSet>& setClientHeight(int value)
        {
            static_assert(!(STATE & ClientHeightSet), "property clientHeight should not be set yet");
            m_result->setClientHeight(value);
            return castState<ClientHeightSet>();
        }

        std::unique_ptr<LayoutViewport> build()
        {
            static_assert(STATE == AllFieldsSet, "state should be AllFieldsSet");
            return std::move(m_result);
        }

    private:
        friend class LayoutViewport;
        LayoutViewportBuilder() : m_result(new LayoutViewport()) { }

        template<int STEP> LayoutViewportBuilder<STATE | STEP>& castState()
        {
            return *reinterpret_cast<LayoutViewportBuilder<STATE | STEP>*>(this);
        }

        std::unique_ptr<protocol::Page::LayoutViewport> m_result;
    };

    static LayoutViewportBuilder<0> create()
    {
        return LayoutViewportBuilder<0>();
    }

private:
    DECLARE_SERIALIZATION_SUPPORT();

    LayoutViewport()
    {
          m_pageX = 0;
          m_pageY = 0;
          m_clientWidth = 0;
          m_clientHeight = 0;
    }

    int m_pageX;
    int m_pageY;
    int m_clientWidth;
    int m_clientHeight;
};


class  VisualViewport : public ::v8_crdtp::ProtocolObject<VisualViewport> {
public:
    ~VisualViewport() override { }

    double getOffsetX() { return m_offsetX; }
    void setOffsetX(double value) { m_offsetX = value; }

    double getOffsetY() { return m_offsetY; }
    void setOffsetY(double value) { m_offsetY = value; }

    double getPageX() { return m_pageX; }
    void setPageX(double value) { m_pageX = value; }

    double getPageY() { return m_pageY; }
    void setPageY(double value) { m_pageY = value; }

    double getClientWidth() { return m_clientWidth; }
    void setClientWidth(double value) { m_clientWidth = value; }

    double getClientHeight() { return m_clientHeight; }
    void setClientHeight(double value) { m_clientHeight = value; }

    double getScale() { return m_scale; }
    void setScale(double value) { m_scale = value; }

    bool hasZoom() { return m_zoom.isJust(); }
    double getZoom(double defaultValue) { return m_zoom.isJust() ? m_zoom.fromJust() : defaultValue; }
    void setZoom(double value) { m_zoom = value; }

    template<int STATE>
    class VisualViewportBuilder {
    public:
        enum {
            NoFieldsSet = 0,
            OffsetXSet = 1 << 1,
            OffsetYSet = 1 << 2,
            PageXSet = 1 << 3,
            PageYSet = 1 << 4,
            ClientWidthSet = 1 << 5,
            ClientHeightSet = 1 << 6,
            ScaleSet = 1 << 7,
            AllFieldsSet = (OffsetXSet | OffsetYSet | PageXSet | PageYSet | ClientWidthSet | ClientHeightSet | ScaleSet | 0)};


        VisualViewportBuilder<STATE | OffsetXSet>& setOffsetX(double value)
        {
            static_assert(!(STATE & OffsetXSet), "property offsetX should not be set yet");
            m_result->setOffsetX(value);
            return castState<OffsetXSet>();
        }

        VisualViewportBuilder<STATE | OffsetYSet>& setOffsetY(double value)
        {
            static_assert(!(STATE & OffsetYSet), "property offsetY should not be set yet");
            m_result->setOffsetY(value);
            return castState<OffsetYSet>();
        }

        VisualViewportBuilder<STATE | PageXSet>& setPageX(double value)
        {
            static_assert(!(STATE & PageXSet), "property pageX should not be set yet");
            m_result->setPageX(value);
            return castState<PageXSet>();
        }

        VisualViewportBuilder<STATE | PageYSet>& setPageY(double value)
        {
            static_assert(!(STATE & PageYSet), "property pageY should not be set yet");
            m_result->setPageY(value);
            return castState<PageYSet>();
        }

        VisualViewportBuilder<STATE | ClientWidthSet>& setClientWidth(double value)
        {
            static_assert(!(STATE & ClientWidthSet), "property clientWidth should not be set yet");
            m_result->setClientWidth(value);
            return castState<ClientWidthSet>();
        }

        VisualViewportBuilder<STATE | ClientHeightSet>& setClientHeight(double value)
        {
            static_assert(!(STATE & ClientHeightSet), "property clientHeight should not be set yet");
            m_result->setClientHeight(value);
            return castState<ClientHeightSet>();
        }

        VisualViewportBuilder<STATE | ScaleSet>& setScale(double value)
        {
            static_assert(!(STATE & ScaleSet), "property scale should not be set yet");
            m_result->setScale(value);
            return castState<ScaleSet>();
        }

        VisualViewportBuilder<STATE>& setZoom(double value)
        {
            m_result->setZoom(value);
            return *this;
        }

        std::unique_ptr<VisualViewport> build()
        {
            static_assert(STATE == AllFieldsSet, "state should be AllFieldsSet");
            return std::move(m_result);
        }

    private:
        friend class VisualViewport;
        VisualViewportBuilder() : m_result(new VisualViewport()) { }

        template<int STEP> VisualViewportBuilder<STATE | STEP>& castState()
        {
            return *reinterpret_cast<VisualViewportBuilder<STATE | STEP>*>(this);
        }

        std::unique_ptr<protocol::Page::VisualViewport> m_result;
    };

    static VisualViewportBuilder<0> create()
    {
        return VisualViewportBuilder<0>();
    }

private:
    DECLARE_SERIALIZATION_SUPPORT();

    VisualViewport()
    {
          m_offsetX = 0;
          m_offsetY = 0;
          m_pageX = 0;
          m_pageY = 0;
          m_clientWidth = 0;
          m_clientHeight = 0;
          m_scale = 0;
    }

    double m_offsetX;
    double m_offsetY;
    double m_pageX;
    double m_pageY;
    double m_clientWidth;
    double m_clientHeight;
    double m_scale;
    Maybe<double> m_zoom;
};


class  Viewport : public ::v8_crdtp::ProtocolObject<Viewport> {
public:
    ~Viewport() override { }

    double getX() { return m_x; }
    void setX(double value) { m_x = value; }

    double getY() { return m_y; }
    void setY(double value) { m_y = value; }

    double getWidth() { return m_width; }
    void setWidth(double value) { m_width = value; }

    double getHeight() { return m_height; }
    void setHeight(double value) { m_height = value; }

    double getScale() { return m_scale; }
    void setScale(double value) { m_scale = value; }

    template<int STATE>
    class ViewportBuilder {
    public:
        enum {
            NoFieldsSet = 0,
            XSet = 1 << 1,
            YSet = 1 << 2,
            WidthSet = 1 << 3,
            HeightSet = 1 << 4,
            ScaleSet = 1 << 5,
            AllFieldsSet = (XSet | YSet | WidthSet | HeightSet | ScaleSet | 0)};


        ViewportBuilder<STATE | XSet>& setX(double value)
        {
            static_assert(!(STATE & XSet), "property x should not be set yet");
            m_result->setX(value);
            return castState<XSet>();
        }

        ViewportBuilder<STATE | YSet>& setY(double value)
        {
            static_assert(!(STATE & YSet), "property y should not be set yet");
            m_result->setY(value);
            return castState<YSet>();
        }

        ViewportBuilder<STATE | WidthSet>& setWidth(double value)
        {
            static_assert(!(STATE & WidthSet), "property width should not be set yet");
            m_result->setWidth(value);
            return castState<WidthSet>();
        }

        ViewportBuilder<STATE | HeightSet>& setHeight(double value)
        {
            static_assert(!(STATE & HeightSet), "property height should not be set yet");
            m_result->setHeight(value);
            return castState<HeightSet>();
        }

        ViewportBuilder<STATE | ScaleSet>& setScale(double value)
        {
            static_assert(!(STATE & ScaleSet), "property scale should not be set yet");
            m_result->setScale(value);
            return castState<ScaleSet>();
        }

        std::unique_ptr<Viewport> build()
        {
            static_assert(STATE == AllFieldsSet, "state should be AllFieldsSet");
            return std::move(m_result);
        }

    private:
        friend class Viewport;
        ViewportBuilder() : m_result(new Viewport()) { }

        template<int STEP> ViewportBuilder<STATE | STEP>& castState()
        {
            return *reinterpret_cast<ViewportBuilder<STATE | STEP>*>(this);
        }

        std::unique_ptr<protocol::Page::Viewport> m_result;
    };

    static ViewportBuilder<0> create()
    {
        return ViewportBuilder<0>();
    }

private:
    DECLARE_SERIALIZATION_SUPPORT();

    Viewport()
    {
          m_x = 0;
          m_y = 0;
          m_width = 0;
          m_height = 0;
          m_scale = 0;
    }

    double m_x;
    double m_y;
    double m_width;
    double m_height;
    double m_scale;
};


class  FontFamilies : public ::v8_crdtp::ProtocolObject<FontFamilies> {
public:
    ~FontFamilies() override { }

    bool hasStandard() { return m_standard.isJust(); }
    String getStandard(const String& defaultValue) { return m_standard.isJust() ? m_standard.fromJust() : defaultValue; }
    void setStandard(const String& value) { m_standard = value; }

    bool hasFixed() { return m_fixed.isJust(); }
    String getFixed(const String& defaultValue) { return m_fixed.isJust() ? m_fixed.fromJust() : defaultValue; }
    void setFixed(const String& value) { m_fixed = value; }

    bool hasSerif() { return m_serif.isJust(); }
    String getSerif(const String& defaultValue) { return m_serif.isJust() ? m_serif.fromJust() : defaultValue; }
    void setSerif(const String& value) { m_serif = value; }

    bool hasSansSerif() { return m_sansSerif.isJust(); }
    String getSansSerif(const String& defaultValue) { return m_sansSerif.isJust() ? m_sansSerif.fromJust() : defaultValue; }
    void setSansSerif(const String& value) { m_sansSerif = value; }

    bool hasCursive() { return m_cursive.isJust(); }
    String getCursive(const String& defaultValue) { return m_cursive.isJust() ? m_cursive.fromJust() : defaultValue; }
    void setCursive(const String& value) { m_cursive = value; }

    bool hasFantasy() { return m_fantasy.isJust(); }
    String getFantasy(const String& defaultValue) { return m_fantasy.isJust() ? m_fantasy.fromJust() : defaultValue; }
    void setFantasy(const String& value) { m_fantasy = value; }

    bool hasPictograph() { return m_pictograph.isJust(); }
    String getPictograph(const String& defaultValue) { return m_pictograph.isJust() ? m_pictograph.fromJust() : defaultValue; }
    void setPictograph(const String& value) { m_pictograph = value; }

    template<int STATE>
    class FontFamiliesBuilder {
    public:
        enum {
            NoFieldsSet = 0,
            AllFieldsSet = (0)};


        FontFamiliesBuilder<STATE>& setStandard(const String& value)
        {
            m_result->setStandard(value);
            return *this;
        }

        FontFamiliesBuilder<STATE>& setFixed(const String& value)
        {
            m_result->setFixed(value);
            return *this;
        }

        FontFamiliesBuilder<STATE>& setSerif(const String& value)
        {
            m_result->setSerif(value);
            return *this;
        }

        FontFamiliesBuilder<STATE>& setSansSerif(const String& value)
        {
            m_result->setSansSerif(value);
            return *this;
        }

        FontFamiliesBuilder<STATE>& setCursive(const String& value)
        {
            m_result->setCursive(value);
            return *this;
        }

        FontFamiliesBuilder<STATE>& setFantasy(const String& value)
        {
            m_result->setFantasy(value);
            return *this;
        }

        FontFamiliesBuilder<STATE>& setPictograph(const String& value)
        {
            m_result->setPictograph(value);
            return *this;
        }

        std::unique_ptr<FontFamilies> build()
        {
            static_assert(STATE == AllFieldsSet, "state should be AllFieldsSet");
            return std::move(m_result);
        }

    private:
        friend class FontFamilies;
        FontFamiliesBuilder() : m_result(new FontFamilies()) { }

        template<int STEP> FontFamiliesBuilder<STATE | STEP>& castState()
        {
            return *reinterpret_cast<FontFamiliesBuilder<STATE | STEP>*>(this);
        }

        std::unique_ptr<protocol::Page::FontFamilies> m_result;
    };

    static FontFamiliesBuilder<0> create()
    {
        return FontFamiliesBuilder<0>();
    }

private:
    DECLARE_SERIALIZATION_SUPPORT();

    FontFamilies()
    {
    }

    Maybe<String> m_standard;
    Maybe<String> m_fixed;
    Maybe<String> m_serif;
    Maybe<String> m_sansSerif;
    Maybe<String> m_cursive;
    Maybe<String> m_fantasy;
    Maybe<String> m_pictograph;
};


class  FontSizes : public ::v8_crdtp::ProtocolObject<FontSizes> {
public:
    ~FontSizes() override { }

    bool hasStandard() { return m_standard.isJust(); }
    int getStandard(int defaultValue) { return m_standard.isJust() ? m_standard.fromJust() : defaultValue; }
    void setStandard(int value) { m_standard = value; }

    bool hasFixed() { return m_fixed.isJust(); }
    int getFixed(int defaultValue) { return m_fixed.isJust() ? m_fixed.fromJust() : defaultValue; }
    void setFixed(int value) { m_fixed = value; }

    template<int STATE>
    class FontSizesBuilder {
    public:
        enum {
            NoFieldsSet = 0,
            AllFieldsSet = (0)};


        FontSizesBuilder<STATE>& setStandard(int value)
        {
            m_result->setStandard(value);
            return *this;
        }

        FontSizesBuilder<STATE>& setFixed(int value)
        {
            m_result->setFixed(value);
            return *this;
        }

        std::unique_ptr<FontSizes> build()
        {
            static_assert(STATE == AllFieldsSet, "state should be AllFieldsSet");
            return std::move(m_result);
        }

    private:
        friend class FontSizes;
        FontSizesBuilder() : m_result(new FontSizes()) { }

        template<int STEP> FontSizesBuilder<STATE | STEP>& castState()
        {
            return *reinterpret_cast<FontSizesBuilder<STATE | STEP>*>(this);
        }

        std::unique_ptr<protocol::Page::FontSizes> m_result;
    };

    static FontSizesBuilder<0> create()
    {
        return FontSizesBuilder<0>();
    }

private:
    DECLARE_SERIALIZATION_SUPPORT();

    FontSizes()
    {
    }

    Maybe<int> m_standard;
    Maybe<int> m_fixed;
};


// ------------- Backend interface.

class  Backend {
public:
    virtual ~Backend() { }

    virtual DispatchResponse addScriptToEvaluateOnLoad(const String& in_scriptSource, String* out_identifier) = 0;
    virtual DispatchResponse addScriptToEvaluateOnNewDocument(const String& in_source, Maybe<String> in_worldName, String* out_identifier) = 0;
    virtual DispatchResponse createIsolatedWorld(const String& in_frameId, Maybe<String> in_worldName, Maybe<bool> in_grantUniveralAccess, int* out_executionContextId) = 0;
    virtual DispatchResponse disable() = 0;
    virtual DispatchResponse enable() = 0;
    virtual DispatchResponse getInstallabilityErrors(std::unique_ptr<protocol::Array<String>>* out_errors) = 0;
    virtual DispatchResponse getManifestIcons(Maybe<Binary>* out_primaryIcon) = 0;
    virtual DispatchResponse getFrameTree(std::unique_ptr<protocol::Page::FrameTree>* out_frameTree) = 0;
    virtual DispatchResponse getLayoutMetrics(std::unique_ptr<protocol::Page::LayoutViewport>* out_layoutViewport, std::unique_ptr<protocol::Page::VisualViewport>* out_visualViewport, std::unique_ptr<protocol::DOM::Rect>* out_contentSize) = 0;
    class  GetResourceContentCallback {
    public:
        virtual void sendSuccess(const String& content, bool base64Encoded) = 0;
        virtual void sendFailure(const DispatchResponse&) = 0;
        virtual void fallThrough() = 0;
        virtual ~GetResourceContentCallback() { }
    };
    virtual void getResourceContent(const String& in_frameId, const String& in_url, std::unique_ptr<GetResourceContentCallback> callback) = 0;
    virtual DispatchResponse getResourceTree(std::unique_ptr<protocol::Page::FrameResourceTree>* out_frameTree) = 0;
    virtual DispatchResponse reload(Maybe<bool> in_ignoreCache, Maybe<String> in_scriptToEvaluateOnLoad) = 0;
    virtual DispatchResponse removeScriptToEvaluateOnLoad(const String& in_identifier) = 0;
    virtual DispatchResponse removeScriptToEvaluateOnNewDocument(const String& in_identifier) = 0;
    class  SearchInResourceCallback {
    public:
        virtual void sendSuccess(std::unique_ptr<protocol::Array<protocol::Debugger::SearchMatch>> result) = 0;
        virtual void sendFailure(const DispatchResponse&) = 0;
        virtual void fallThrough() = 0;
        virtual ~SearchInResourceCallback() { }
    };
    virtual void searchInResource(const String& in_frameId, const String& in_url, const String& in_query, Maybe<bool> in_caseSensitive, Maybe<bool> in_isRegex, std::unique_ptr<SearchInResourceCallback> callback) = 0;
    virtual DispatchResponse setAdBlockingEnabled(bool in_enabled) = 0;
    virtual DispatchResponse setBypassCSP(bool in_enabled) = 0;
    virtual DispatchResponse setFontFamilies(std::unique_ptr<protocol::Page::FontFamilies> in_fontFamilies) = 0;
    virtual DispatchResponse setFontSizes(std::unique_ptr<protocol::Page::FontSizes> in_fontSizes) = 0;
    virtual DispatchResponse setDocumentContent(const String& in_frameId, const String& in_html) = 0;
    virtual DispatchResponse setLifecycleEventsEnabled(bool in_enabled) = 0;
    virtual DispatchResponse startScreencast(Maybe<String> in_format, Maybe<int> in_quality, Maybe<int> in_maxWidth, Maybe<int> in_maxHeight, Maybe<int> in_everyNthFrame) = 0;
    virtual DispatchResponse stopLoading() = 0;
    virtual DispatchResponse stopScreencast() = 0;
    virtual DispatchResponse setProduceCompilationCache(bool in_enabled) = 0;
    virtual DispatchResponse addCompilationCache(const String& in_url, const Binary& in_data) = 0;
    virtual DispatchResponse clearCompilationCache() = 0;
    virtual DispatchResponse generateTestReport(const String& in_message, Maybe<String> in_group) = 0;
    virtual DispatchResponse waitForDebugger() = 0;
    virtual DispatchResponse setInterceptFileChooserDialog(bool in_enabled) = 0;

};

// ------------- Frontend interface.

class  Frontend {
public:
  explicit Frontend(FrontendChannel* frontend_channel) : frontend_channel_(frontend_channel) {}
    void domContentEventFired(double timestamp);
    void fileChooserOpened(const String& frameId, int backendNodeId, const String& mode);
    void frameAttached(const String& frameId, const String& parentFrameId, Maybe<protocol::Runtime::StackTrace> stack = Maybe<protocol::Runtime::StackTrace>());
    void frameClearedScheduledNavigation(const String& frameId);
    void frameDetached(const String& frameId);
    void frameNavigated(std::unique_ptr<protocol::Page::Frame> frame);
    void frameResized();
    void frameRequestedNavigation(const String& frameId, const String& reason, const String& url);
    void frameScheduledNavigation(const String& frameId, double delay, const String& reason, const String& url);
    void frameStartedLoading(const String& frameId);
    void frameStoppedLoading(const String& frameId);
    void downloadWillBegin(const String& frameId, const String& url);
    void lifecycleEvent(const String& frameId, const String& loaderId, const String& name, double timestamp);
    void loadEventFired(double timestamp);
    void navigatedWithinDocument(const String& frameId, const String& url);
    void windowOpen(const String& url, const String& windowName, std::unique_ptr<protocol::Array<String>> windowFeatures, bool userGesture);
    void compilationCacheProduced(const String& url, const Binary& data);

  void flush();
  void sendRawNotification(std::unique_ptr<Serializable>);
 private:
  FrontendChannel* frontend_channel_;
};

// ------------- Dispatcher.

class  Dispatcher {
public:
    static void wire(UberDispatcher*, Backend*);

private:
    Dispatcher() { }
};

// ------------- Metainfo.

class  Metainfo {
public:
    using BackendClass = Backend;
    using FrontendClass = Frontend;
    using DispatcherClass = Dispatcher;
    static const char domainName[];
    static const char commandPrefix[];
    static const char version[];
};

} // namespace Page
} // namespace v8_inspector
} // namespace protocol

#endif // !defined(v8_inspector_protocol_Page_h)
