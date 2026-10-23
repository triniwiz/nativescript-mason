#pragma once
// Direct2D's SVG renderer ignores <style>, class and <symbol> and only follows xlink:href, so those
// are rewritten into style="", groups and xlink:href first, as SvgParser.kt/.swift read them. Text,
// markers, patterns and masks follow (SvgRewrite.h).
#include <algorithm>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <cwctype>
#include <string>
#include <string_view>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
#include <winrt/Windows.Data.Xml.Dom.h>

namespace mason_svg
{
    namespace dom = winrt::Windows::Data::Xml::Dom;

    inline constexpr wchar_t kXlink[] = L"http://www.w3.org/1999/xlink";

    struct Declaration
    {
        std::wstring name, value;
        bool important{ false };
    };

    struct Selector
    {
        std::wstring type;
        std::vector<std::wstring> ids, classes;
        int Specificity() const { return static_cast<int>(ids.size()) * 1000000 + static_cast<int>(classes.size()) * 1000 + (type.empty() ? 0 : 1); }
    };

    struct Rule
    {
        Selector selector;
        std::vector<Declaration> declarations;
        int order{ 0 };
    };

    inline std::wstring Trim(std::wstring_view s)
    {
        size_t a = 0, b = s.size();
        while (a < b && std::iswspace(s[a])) ++a;
        while (b > a && std::iswspace(s[b - 1])) --b;
        return std::wstring(s.substr(a, b - a));
    }

    inline bool IdentChar(wchar_t c) { return std::iswalnum(c) || c == L'-' || c == L'_' || c > 0x7F; }

    inline bool ParseSelector(std::wstring_view raw, Selector& out)
    {
        const std::wstring s = Trim(raw);
        if (s.empty()) return false;
        size_t i = 0;
        if (s[0] == L'*') i = 1;
        else if (IdentChar(s[0]))
        {
            while (i < s.size() && IdentChar(s[i])) ++i;
            out.type = s.substr(0, i);
        }
        while (i < s.size())
        {
            const wchar_t c = s[i];
            if (c != L'.' && c != L'#') return false;
            const size_t start = ++i;
            while (i < s.size() && IdentChar(s[i])) ++i;
            if (i == start) return false;
            (c == L'.' ? out.classes : out.ids).push_back(s.substr(start, i - start));
        }
        return true;
    }

    inline std::vector<Declaration> ParseDeclarations(std::wstring_view text)
    {
        std::vector<Declaration> out;
        auto take = [&](std::wstring_view decl)
        {
            const size_t colon = decl.find(L':');
            if (colon == std::wstring_view::npos || colon == 0) return;
            Declaration d;
            d.name = Trim(decl.substr(0, colon));
            for (auto& c : d.name) c = static_cast<wchar_t>(std::towlower(c));
            d.value = Trim(decl.substr(colon + 1));
            const size_t bang = d.value.rfind(L'!');
            if (bang != std::wstring::npos)
            {
                std::wstring flag = Trim(std::wstring_view(d.value).substr(bang + 1));
                for (auto& c : flag) c = static_cast<wchar_t>(std::towlower(c));
                if (flag == L"important")
                {
                    d.important = true;
                    d.value = Trim(std::wstring_view(d.value).substr(0, bang));
                }
            }
            if (!d.name.empty() && !d.value.empty()) out.push_back(std::move(d));
        };
        int depth = 0;
        wchar_t quote = 0;
        size_t start = 0;
        for (size_t i = 0; i < text.size(); ++i)
        {
            const wchar_t c = text[i];
            if (quote) { if (c == quote) quote = 0; }
            else if (c == L'"' || c == L'\'') quote = c;
            else if (c == L'(') ++depth;
            else if (c == L')') { if (depth > 0) --depth; }
            else if (c == L';' && depth == 0)
            {
                take(text.substr(start, i - start));
                start = i + 1;
            }
        }
        take(text.substr(start));
        return out;
    }

    inline std::vector<Rule> ParseSheet(std::wstring css)
    {
        for (size_t open; (open = css.find(L"/*")) != std::wstring::npos;)
        {
            const size_t close = css.find(L"*/", open + 2);
            css.replace(open, close == std::wstring::npos ? std::wstring::npos : close + 2 - open, L" ");
        }
        std::vector<Rule> rules;
        int order = 0;
        size_t i = 0;
        const size_t n = css.size();
        while (i < n)
        {
            while (i < n && std::iswspace(css[i])) ++i;
            if (i >= n) break;
            if (css[i] == L'@')
            {
                const size_t semi = (std::min)(css.find(L';', i), n);
                const size_t brace = (std::min)(css.find(L'{', i), n);
                if (semi < brace)
                {
                    i = semi + 1;
                    continue;
                }
                int depth = 0;
                size_t j = brace;
                for (; j < n; ++j)
                {
                    if (css[j] == L'{') ++depth;
                    else if (css[j] == L'}' && --depth == 0) break;
                }
                i = j + 1;
                continue;
            }
            const size_t open = css.find(L'{', i);
            if (open == std::wstring::npos) break;
            const size_t close = (std::min)(css.find(L'}', open), n);
            const auto declarations = ParseDeclarations(std::wstring_view(css).substr(open + 1, close - open - 1));
            std::wstring_view selectors = std::wstring_view(css).substr(i, open - i);
            for (size_t s = 0; s <= selectors.size();)
            {
                size_t comma = selectors.find(L',', s);
                if (comma == std::wstring_view::npos) comma = selectors.size();
                Selector selector;
                if (ParseSelector(selectors.substr(s, comma - s), selector)) rules.push_back({ std::move(selector), declarations, order++ });
                s = comma + 1;
            }
            i = close + 1;
        }
        return rules;
    }

    inline std::wstring LocalName(dom::IXmlNode const& node)
    {
        std::wstring name{ node.NodeName() };
        const size_t colon = name.find(L':');
        return colon == std::wstring::npos ? name : name.substr(colon + 1);
    }

    template <typename F>
    inline void ForEachElement(dom::IXmlNode const& node, F&& visit)
    {
        auto children = node.ChildNodes();
        std::vector<dom::IXmlNode> list;
        list.reserve(children.Size());
        for (uint32_t i = 0; i < children.Size(); ++i) list.push_back(children.Item(i));
        for (auto const& child : list)
        {
            if (child.NodeType() != dom::NodeType::ElementNode) continue;
            if (visit(child.as<dom::XmlElement>())) ForEachElement(child, visit);
        }
    }

    inline bool Matches(Selector const& s, std::wstring const& name, std::wstring const& id, std::vector<std::wstring> const& classes)
    {
        if (!s.type.empty() && s.type != name) return false;
        for (auto const& want : s.ids) if (want != id) return false;
        for (auto const& want : s.classes) if (std::find(classes.begin(), classes.end(), want) == classes.end()) return false;
        return true;
    }

    inline bool IsGeometry(std::wstring const& name)
    {
        static const std::unordered_set<std::wstring> names{ L"x", L"y", L"width", L"height", L"cx", L"cy", L"r", L"rx", L"ry", L"d",
            L"points", L"x1", L"y1", L"x2", L"y2", L"transform", L"viewbox" };
        return names.count(name) != 0;
    }

    inline void Cascade(dom::XmlElement const& root, std::vector<Rule> const& rules)
    {
        ForEachElement(root, [&](dom::XmlElement const& el)
        {
            const std::wstring name = LocalName(el);
            const std::wstring id = Trim(std::wstring{ el.GetAttribute(L"id") });
            std::vector<std::wstring> classes;
            const std::wstring cls{ el.GetAttribute(L"class") };
            for (size_t i = 0; i < cls.size();)
            {
                while (i < cls.size() && std::iswspace(cls[i])) ++i;
                const size_t start = i;
                while (i < cls.size() && !std::iswspace(cls[i])) ++i;
                if (i > start) classes.push_back(cls.substr(start, i - start));
            }
            std::vector<Rule const*> matched;
            for (auto const& rule : rules) if (Matches(rule.selector, name, id, classes)) matched.push_back(&rule);
            if (matched.empty()) return true;
            std::stable_sort(matched.begin(), matched.end(), [](Rule const* a, Rule const* b)
            {
                const int sa = a->selector.Specificity(), sb = b->selector.Specificity();
                return sa != sb ? sa < sb : a->order < b->order;
            });
            const auto inline_ = ParseDeclarations(std::wstring{ el.GetAttribute(L"style") });
            std::vector<std::pair<std::wstring, std::wstring>> out;
            auto put = [&](Declaration const& d)
            {
                for (auto& [n, v] : out)
                {
                    if (n == d.name)
                    {
                        v = d.value;
                        return;
                    }
                }
                out.emplace_back(d.name, d.value);
            };
            for (auto* r : matched) for (auto const& d : r->declarations) if (!d.important && !IsGeometry(d.name)) put(d);
            for (auto const& d : inline_) if (!d.important) put(d);
            for (auto* r : matched) for (auto const& d : r->declarations) if (d.important && !IsGeometry(d.name)) put(d);
            for (auto const& d : inline_) if (d.important) put(d);
            std::wstring style;
            for (auto const& [n, v] : out) style += n + L":" + v + L";";
            el.SetAttribute(L"style", style);
            return true;
        });
    }

    inline bool Number(std::wstring const& text, float reference, float& out)
    {
        const std::wstring t = Trim(text);
        if (t.empty()) return false;
        wchar_t* end = nullptr;
        const double v = std::wcstod(t.c_str(), &end);
        if (end == t.c_str()) return false;
        const std::wstring unit = Trim(end);
        if (unit == L"%") out = static_cast<float>(v) / 100.0f * reference;
        else if (unit.empty() || unit == L"px") out = static_cast<float>(v);
        else return false;
        return std::isfinite(out);
    }

    inline std::vector<float> Numbers(std::wstring const& text)
    {
        std::vector<float> out;
        const wchar_t* p = text.c_str();
        while (*p)
        {
            while (*p && (std::iswspace(*p) || *p == L',')) ++p;
            if (!*p) break;
            wchar_t* end = nullptr;
            const double v = std::wcstod(p, &end);
            if (end == p) break;
            out.push_back(static_cast<float>(v));
            p = end;
        }
        return out;
    }

    inline std::wstring Format(float v)
    {
        wchar_t buffer[32];
        std::swprintf(buffer, 32, L"%g", v);
        return buffer;
    }

    inline std::wstring ViewBoxTransform(std::vector<float> const& vb, std::wstring const& aspect, float w, float h)
    {
        const float sx = w / vb[2], sy = h / vb[3];
        std::wstring align = L"xMidYMid";
        bool slice = false;
        {
            const std::wstring a = Trim(aspect);
            const size_t space = a.find_first_of(L" \t\r\n");
            if (!a.empty()) align = a.substr(0, space);
            slice = space != std::wstring::npos && Trim(std::wstring_view(a).substr(space)) == L"slice";
        }
        float a = sx, d = sy, e = -vb[0] * sx, f = -vb[1] * sy;
        if (align != L"none")
        {
            const float s = slice ? (std::max)(sx, sy) : (std::min)(sx, sy);
            auto weight = [&](size_t at) { return align.size() == 8 ? (align.compare(at, 3, L"Min") == 0 ? 0.0f : align.compare(at, 3, L"Max") == 0 ? 1.0f : 0.5f) : 0.5f; };
            a = d = s;
            e = -vb[0] * s + (w - vb[2] * s) * weight(1);
            f = -vb[1] * s + (h - vb[3] * s) * weight(5);
        }
        return L"matrix(" + Format(a) + L" 0 0 " + Format(d) + L" " + Format(e) + L" " + Format(f) + L")";
    }

    inline std::wstring HrefOf(dom::XmlElement const& el)
    {
        std::wstring href{ el.GetAttribute(L"href") };
        if (href.empty()) href = std::wstring{ el.GetAttribute(L"xlink:href") };
        return Trim(href);
    }

    inline std::wstring StyleProperty(dom::XmlElement const& el, std::wstring const& name)
    {
        std::wstring value{ el.GetAttribute(name) };
        for (auto const& d : ParseDeclarations(std::wstring{ el.GetAttribute(L"style") })) if (d.name == name) value = d.value;
        return Trim(value);
    }

    struct Context
    {
        dom::XmlDocument doc{ nullptr };
        winrt::Windows::Foundation::IInspectable ns{ nullptr };
        std::unordered_map<std::wstring, dom::XmlElement> ids;
        float width{ 0.0f }, height{ 0.0f };
        int clips{ 0 };
    };

    inline dom::XmlElement Create(Context& c, wchar_t const* name)
    {
        return c.ns ? c.doc.CreateElementNS(c.ns, name) : c.doc.CreateElement(name);
    }

    inline void ExpandUses(Context& c, dom::IXmlNode const& scope, std::vector<std::wstring>& stack);

    inline void ExpandSymbol(Context& c, dom::XmlElement const& use, dom::XmlElement const& symbol, std::vector<std::wstring>& stack)
    {
        auto parent = use.ParentNode();
        if (!parent) return;
        float w = c.width, h = c.height, x = 0.0f, y = 0.0f;
        Number(std::wstring{ use.GetAttribute(L"width") }, c.width, w);
        Number(std::wstring{ use.GetAttribute(L"height") }, c.height, h);
        Number(std::wstring{ use.GetAttribute(L"x") }, c.width, x);
        Number(std::wstring{ use.GetAttribute(L"y") }, c.height, y);
        if (w <= 0.0f || h <= 0.0f)
        {
            parent.RemoveChild(use);
            return;
        }
        auto outer = Create(c, L"g");
        auto attrs = use.Attributes();
        for (uint32_t i = 0; i < attrs.Size(); ++i)
        {
            auto attr = attrs.Item(i);
            const std::wstring name{ attr.NodeName() };
            if (name == L"x" || name == L"y" || name == L"width" || name == L"height" || name == L"href" || name == L"xlink:href" || name == L"id" || name == L"transform") continue;
            outer.SetAttribute(name, winrt::unbox_value_or<winrt::hstring>(attr.NodeValue(), L""));
        }
        const std::wstring transform = Trim(std::wstring{ use.GetAttribute(L"transform") });
        outer.SetAttribute(L"transform", (transform.empty() ? L"" : transform + L" ") + L"translate(" + Format(x) + L" " + Format(y) + L")");

        dom::XmlElement holder = outer;
        const std::wstring overflow = StyleProperty(symbol, L"overflow");
        if (overflow != L"visible" && overflow != L"auto")
        {
            const std::wstring id = L"__mason_symbol_clip_" + std::to_wstring(++c.clips);
            auto defs = Create(c, L"defs");
            auto clipPath = Create(c, L"clipPath");
            clipPath.SetAttribute(L"id", id);
            auto rect = Create(c, L"rect");
            rect.SetAttribute(L"width", Format(w));
            rect.SetAttribute(L"height", Format(h));
            clipPath.AppendChild(rect);
            defs.AppendChild(clipPath);
            outer.AppendChild(defs);
            auto clipped = Create(c, L"g");
            clipped.SetAttribute(L"clip-path", L"url(#" + id + L")");
            outer.AppendChild(clipped);
            holder = clipped;
        }
        auto inner = Create(c, L"g");
        auto symbolAttrs = symbol.Attributes();
        for (uint32_t i = 0; i < symbolAttrs.Size(); ++i)
        {
            auto attr = symbolAttrs.Item(i);
            const std::wstring name{ attr.NodeName() };
            if (name == L"id" || name == L"viewBox" || name == L"preserveAspectRatio" || name == L"x" || name == L"y" || name == L"width"
                || name == L"height" || name == L"overflow" || name == L"refX" || name == L"refY" || name.rfind(L"xmlns", 0) == 0) continue;
            inner.SetAttribute(name, winrt::unbox_value_or<winrt::hstring>(attr.NodeValue(), L""));
        }
        const auto vb = Numbers(std::wstring{ symbol.GetAttribute(L"viewBox") });
        if (vb.size() == 4 && vb[2] > 0.0f && vb[3] > 0.0f)
        {
            inner.SetAttribute(L"transform", ViewBoxTransform(vb, std::wstring{ symbol.GetAttribute(L"preserveAspectRatio") }, w, h));
        }
        auto children = symbol.ChildNodes();
        for (uint32_t i = 0; i < children.Size(); ++i) inner.AppendChild(children.Item(i).CloneNode(true));
        holder.AppendChild(inner);
        parent.ReplaceChild(outer, use);
        ExpandUses(c, inner, stack);
    }

    inline void ExpandUses(Context& c, dom::IXmlNode const& scope, std::vector<std::wstring>& stack)
    {
        if (stack.size() > 16) return;
        std::vector<dom::XmlElement> uses;
        ForEachElement(scope, [&](dom::XmlElement const& el)
        {
            if (LocalName(el) == L"use") uses.push_back(el);
            return LocalName(el) != L"symbol";
        });
        for (auto const& use : uses)
        {
            const std::wstring href = HrefOf(use);
            if (href.size() < 2 || href[0] != L'#') continue;
            const std::wstring id = href.substr(1);
            auto it = c.ids.find(id);
            if (it == c.ids.end() || LocalName(it->second) != L"symbol") continue;
            if (std::find(stack.begin(), stack.end(), id) != stack.end())
            {
                if (auto parent = use.ParentNode()) parent.RemoveChild(use);
                continue;
            }
            stack.push_back(id);
            ExpandSymbol(c, use, it->second, stack);
            stack.pop_back();
        }
    }

}

#include "SvgRewrite.h"

namespace mason_svg
{
    inline bool HasBareHref(std::string_view svg)
    {
        for (size_t i = svg.find("href"); i != std::string_view::npos; i = svg.find("href", i + 4))
        {
            if (i > 0 && (svg[i - 1] == ' ' || svg[i - 1] == '\t' || svg[i - 1] == '\n' || svg[i - 1] == '\r')) return true;
        }
        return false;
    }

    inline bool Needs(std::string_view svg)
    {
        return svg.find("<style") != std::string_view::npos || svg.find("<symbol") != std::string_view::npos || svg.find(":style") != std::string_view::npos
            || svg.find(":symbol") != std::string_view::npos || HasBareHref(svg) || NeedsRewrite(svg);
    }

    // Parses SVG text, past a BOM and XML declaration; throws on malformed XML.
    inline dom::XmlDocument LoadSvgXml(std::string_view text)
    {
        if (text.starts_with("\xEF\xBB\xBF")) text.remove_prefix(3);
        const size_t lead = text.find_first_not_of(" \t\r\n");
        if (lead != std::string_view::npos && text.substr(lead).starts_with("<?xml"))
        {
            const size_t end = text.find("?>", lead);
            if (end != std::string_view::npos) text.remove_prefix(end + 2);
        }
        dom::XmlDocument doc;
        dom::XmlLoadSettings settings;
        settings.ProhibitDtd(false);
        settings.ResolveExternals(false);
        settings.ValidateOnParse(false);
        settings.ElementContentWhiteSpace(true);
        doc.LoadXml(winrt::to_hstring(text), settings);
        return doc;
    }

    // An SVG's own size in CSS px: width/height, the other side from the viewBox's ratio, else the
    // viewBox's size. 0 x 0 when it has none or doesn't parse.
    inline std::pair<float, float> IntrinsicSize(std::string const& svg)
    {
        try
        {
            auto root = LoadSvgXml(svg).DocumentElement();
            if (!root) return { 0.0f, 0.0f };
            auto dimension = [&](wchar_t const* name)
            {
                const std::wstring v = Trim(std::wstring{ root.GetAttribute(name) });
                float out = 0.0f;
                return !v.empty() && v.back() != L'%' && Length(v, 0.0f, out) && out > 0.0f ? out : 0.0f;
            };
            float w = dimension(L"width"), h = dimension(L"height");
            const auto vb = Numbers(std::wstring{ root.GetAttribute(L"viewBox") });
            if (vb.size() == 4 && vb[2] > 0.0f && vb[3] > 0.0f)
            {
                if (w <= 0.0f && h <= 0.0f) return { vb[2], vb[3] };
                if (w <= 0.0f) w = h * vb[2] / vb[3];
                if (h <= 0.0f) h = w * vb[3] / vb[2];
            }
            return { w, h };
        }
        catch (...)
        {
            return { 0.0f, 0.0f };
        }
    }

    inline std::string Resolve(std::string svg)
    {
        if (!Needs(svg)) return svg;
        try
        {
            Context c;
            c.doc = LoadSvgXml(svg);
            auto root = c.doc.DocumentElement();
            if (!root || LocalName(root) != L"svg") return svg;
            c.ns = root.NamespaceUri();

            std::wstring css;
            std::vector<dom::XmlElement> sheets;
            ForEachElement(root, [&](dom::XmlElement const& el)
            {
                if (LocalName(el) != L"style") return true;
                sheets.push_back(el);
                return false;
            });
            for (auto const& sheet : sheets)
            {
                css += std::wstring{ sheet.InnerText() } + L"\n";
                if (auto parent = sheet.ParentNode()) parent.RemoveChild(sheet);
            }
            for (wchar_t const* marker : { L"<!--", L"-->" })
            {
                for (size_t at; (at = css.find(marker)) != std::wstring::npos;) css.replace(at, std::wcslen(marker), L" ");
            }
            const auto rules = ParseSheet(css);
            if (!rules.empty()) Cascade(root, rules);

            ForEachElement(root, [&](dom::XmlElement const& el)
            {
                const std::wstring id = Trim(std::wstring{ el.GetAttribute(L"id") });
                if (!id.empty()) c.ids.try_emplace(id, el);
                return true;
            });
            const auto vb = Numbers(std::wstring{ root.GetAttribute(L"viewBox") });
            if (vb.size() == 4)
            {
                c.width = vb[2];
                c.height = vb[3];
            }
            else
            {
                Number(std::wstring{ root.GetAttribute(L"width") }, 0.0f, c.width);
                Number(std::wstring{ root.GetAttribute(L"height") }, 0.0f, c.height);
            }
            std::vector<std::wstring> stack;
            ExpandUses(c, root, stack);
            Rewrite(c, root);

            std::vector<dom::XmlElement> symbols, linked;
            ForEachElement(root, [&](dom::XmlElement const& el)
            {
                const std::wstring name = LocalName(el);
                if (name == L"symbol")
                {
                    symbols.push_back(el);
                    return false;
                }
                if (!std::wstring{ el.GetAttribute(L"href") }.empty() && std::wstring{ el.GetAttribute(L"xlink:href") }.empty()) linked.push_back(el);
                return true;
            });
            for (auto const& symbol : symbols)
            {
                if (auto parent = symbol.ParentNode()) parent.RemoveChild(symbol);
            }
            if (!linked.empty() && std::wstring{ root.GetAttribute(L"xmlns:xlink") }.empty()) root.SetAttribute(L"xmlns:xlink", kXlink);
            for (auto const& el : linked)
            {
                el.SetAttributeNS(winrt::box_value(winrt::hstring{ kXlink }), L"xlink:href", el.GetAttribute(L"href"));
            }
            return winrt::to_string(c.doc.GetXml());
        }
        catch (...)
        {
            return svg;
        }
    }
}
