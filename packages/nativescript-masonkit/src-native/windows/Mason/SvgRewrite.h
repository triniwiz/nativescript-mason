#pragma once
// SVG features Direct2D's renderer lacks, rewritten into what it draws (SvgPrepare.h runs these after
// <style> and <symbol>): <text> becomes glyph outline paths, markers become transformed groups, a
// <pattern> fill becomes tiled copies clipped to the shape, and a mask wraps the element and a copy
// of the mask's content in ids that CssMask.h composites. Geometry follows SvgParser.kt/.swift.
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cwchar>
#include <cwctype>
#include <optional>
#include <string>
#include <string_view>
#include <unordered_map>
#include <unordered_set>
#include <vector>
#include <d2d1.h>
#include <dwrite_3.h>
#include <winrt/Windows.Data.Xml.Dom.h>
#include "DWriteText.h"

namespace mason_svg
{
    // ---- Geometry ------------------------------------------------------------------------------

    struct Affine
    {
        float a{ 1.0f }, b{ 0.0f }, c{ 0.0f }, d{ 1.0f }, e{ 0.0f }, f{ 0.0f };

        // this · o: o applies first.
        Affine operator*(Affine const& o) const
        {
            return { a * o.a + c * o.b, b * o.a + d * o.b, a * o.c + c * o.d, b * o.c + d * o.d, a * o.e + c * o.f + e, b * o.e + d * o.f + f };
        }
        void Apply(float& x, float& y) const
        {
            const float nx = a * x + c * y + e;
            y = b * x + d * y + f;
            x = nx;
        }
        std::optional<Affine> Inverse() const
        {
            const float det = a * d - b * c;
            if (det == 0.0f || !std::isfinite(det)) return std::nullopt;
            return Affine{ d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det };
        }
        static Affine Translate(float x, float y) { return { 1.0f, 0.0f, 0.0f, 1.0f, x, y }; }
        static Affine Scale(float x, float y) { return { x, 0.0f, 0.0f, y, 0.0f, 0.0f }; }
        std::wstring Matrix() const
        {
            // Rotations leave float noise such as 8.7e-08 where there should be 0.
            auto v = [](float x) { return Format(std::fabs(x) < 1e-6f ? 0.0f : x); };
            return L"matrix(" + v(a) + L" " + v(b) + L" " + v(c) + L" " + v(d) + L" " + v(e) + L" " + v(f) + L")";
        }
    };

    struct Cmd
    {
        enum Kind : uint8_t { Move, Line, Cubic, Quad, Close } kind{ Move };
        // End point last: Move/Line (x, y), Quad (x1, y1, x, y), Cubic (x1, y1, x2, y2, x, y).
        float p[6]{};

        float X() const { return kind == Cubic ? p[4] : kind == Quad ? p[2] : p[0]; }
        float Y() const { return kind == Cubic ? p[5] : kind == Quad ? p[3] : p[1]; }
    };

    inline Cmd MoveCmd(float x, float y) { Cmd c; c.kind = Cmd::Move; c.p[0] = x; c.p[1] = y; return c; }
    inline Cmd LineCmd(float x, float y) { Cmd c; c.kind = Cmd::Line; c.p[0] = x; c.p[1] = y; return c; }
    inline Cmd QuadCmd(float x1, float y1, float x, float y) { Cmd c; c.kind = Cmd::Quad; c.p[0] = x1; c.p[1] = y1; c.p[2] = x; c.p[3] = y; return c; }
    inline Cmd CubicCmd(float x1, float y1, float x2, float y2, float x, float y)
    {
        Cmd c;
        c.kind = Cmd::Cubic;
        c.p[0] = x1; c.p[1] = y1; c.p[2] = x2; c.p[3] = y2; c.p[4] = x; c.p[5] = y;
        return c;
    }
    inline Cmd CloseCmd() { Cmd c; c.kind = Cmd::Close; return c; }

    inline bool Wsp(wchar_t c) { return c == L' ' || c == L'\t' || c == L'\n' || c == L'\r' || c == L'\f'; }

    inline constexpr std::wstring_view kPathLetters = L"MmLlHhVvCcSsQqTtAaZz";

    inline const std::unordered_map<std::wstring, float> kFontSizeKeywords{ { L"xx-small", 9.0f }, { L"x-small", 10.0f },
        { L"small", 13.0f }, { L"medium", 16.0f }, { L"large", 18.0f }, { L"x-large", 24.0f }, { L"xx-large", 32.0f }, { L"xxx-large", 48.0f } };

    // Text layout attributes the outline group drops.
    inline const std::unordered_set<std::wstring> kTextOnlyAttributes{ L"x", L"y", L"dx", L"dy", L"rotate", L"textLength", L"lengthAdjust",
        L"font-family", L"font-size", L"font-weight", L"font-style", L"font", L"text-anchor", L"dominant-baseline", L"letter-spacing",
        L"word-spacing", L"xml:space", L"white-space", L"id" };

    struct Scanner
    {
        std::wstring_view s;
        size_t i{ 0 };

        bool AtEnd() const { return i >= s.size(); }
        void SkipWsp() { while (i < s.size() && Wsp(s[i])) ++i; }
        void SkipCommaWsp()
        {
            SkipWsp();
            if (i < s.size() && s[i] == L',')
            {
                ++i;
                SkipWsp();
            }
        }
        // An SVG number: `-1`, `.5`, `1.5` (so `1.5.5` is two numbers), `1e-3`.
        bool Number(double& out)
        {
            const size_t n = s.size();
            size_t j = i;
            if (j < n && (s[j] == L'+' || s[j] == L'-')) ++j;
            int digits = 0;
            while (j < n && std::iswdigit(s[j])) { ++j; ++digits; }
            if (j < n && s[j] == L'.')
            {
                ++j;
                while (j < n && std::iswdigit(s[j])) { ++j; ++digits; }
            }
            if (digits == 0) return false;
            if (j < n && (s[j] == L'e' || s[j] == L'E'))
            {
                size_t k = j + 1;
                if (k < n && (s[k] == L'+' || s[k] == L'-')) ++k;
                if (k < n && std::iswdigit(s[k]))
                {
                    while (k < n && std::iswdigit(s[k])) ++k;
                    j = k;
                }
            }
            const std::wstring text(s.substr(i, j - i));
            out = std::wcstod(text.c_str(), nullptr);
            i = j;
            return std::isfinite(out);
        }
        bool Flag(bool& out)
        {
            if (i >= s.size() || (s[i] != L'0' && s[i] != L'1')) return false;
            out = s[i++] == L'1';
            return true;
        }
    };

    // An elliptical arc as cubics (SVG 1.1 F.6.5/F.6.6), at most 90 degrees each.
    inline void AppendArc(std::vector<Cmd>& out, double x1, double y1, double rx, double ry, double angle, bool large, bool sweep, double x2, double y2)
    {
        if (x1 == x2 && y1 == y2) return;
        rx = std::fabs(rx);
        ry = std::fabs(ry);
        if (rx == 0.0 || ry == 0.0)
        {
            out.push_back(LineCmd(static_cast<float>(x2), static_cast<float>(y2)));
            return;
        }
        constexpr double pi = 3.14159265358979323846;
        const double phi = std::fmod(angle, 360.0) * pi / 180.0;
        const double cp = std::cos(phi), sp = std::sin(phi);
        const double dx2 = (x1 - x2) / 2.0, dy2 = (y1 - y2) / 2.0;
        const double x1p = cp * dx2 + sp * dy2, y1p = -sp * dx2 + cp * dy2;
        const double lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
        if (lambda > 1.0)
        {
            rx *= std::sqrt(lambda);
            ry *= std::sqrt(lambda);
        }
        const double rx2 = rx * rx, ry2 = ry * ry;
        const double num = rx2 * ry2 - rx2 * y1p * y1p - ry2 * x1p * x1p;
        const double den = rx2 * y1p * y1p + ry2 * x1p * x1p;
        double coef = den == 0.0 ? 0.0 : std::sqrt((std::max)(0.0, num / den));
        if (large == sweep) coef = -coef;
        const double cxp = coef * (rx * y1p / ry), cyp = coef * -(ry * x1p / rx);
        const double cx = cp * cxp - sp * cyp + (x1 + x2) / 2.0, cy = sp * cxp + cp * cyp + (y1 + y2) / 2.0;
        const double ux = (x1p - cxp) / rx, uy = (y1p - cyp) / ry, vx = (-x1p - cxp) / rx, vy = (-y1p - cyp) / ry;
        const double theta1 = std::atan2(uy, ux);
        double dTheta = std::atan2(ux * vy - uy * vx, ux * vx + uy * vy);
        if (!sweep && dTheta > 0) dTheta -= 2 * pi;
        else if (sweep && dTheta < 0) dTheta += 2 * pi;
        const int segments = (std::max)(1, static_cast<int>(std::ceil(std::fabs(dTheta) / (pi / 2) - 1e-7)));
        const double delta = dTheta / segments, t = 4.0 / 3.0 * std::tan(delta / 4.0);
        auto mx = [&](double u, double v) { return static_cast<float>(cx + rx * cp * u - ry * sp * v); };
        auto my = [&](double u, double v) { return static_cast<float>(cy + rx * sp * u + ry * cp * v); };
        double a1 = theta1;
        for (int i = 0; i < segments; ++i)
        {
            const double a2 = a1 + delta;
            const double c1 = std::cos(a1), s1 = std::sin(a1), c2 = std::cos(a2), s2 = std::sin(a2);
            const bool last = i == segments - 1;
            out.push_back(CubicCmd(mx(c1 - t * s1, s1 + t * c1), my(c1 - t * s1, s1 + t * c1), mx(c2 + t * s2, s2 - t * c2),
                my(c2 + t * s2, s2 - t * c2), last ? static_cast<float>(x2) : mx(c2, s2), last ? static_cast<float>(y2) : my(c2, s2)));
            a1 = a2;
        }
    }

    // Absolute commands; `ends[i]` is false where command i ends inside an arc (not a vertex).
    inline std::vector<Cmd> ParsePath(std::wstring_view d, std::vector<bool>* ends = nullptr)
    {
        std::vector<Cmd> out;
        std::vector<size_t> arcInner;
        Scanner sc{ d };
        wchar_t cmd = 0;
        double cx = 0, cy = 0, sx = 0, sy = 0, ctrlX = 0, ctrlY = 0;
        bool lastCubic = false, lastQuad = false, needMove = false;
        auto ensureMove = [&]
        {
            if (needMove)
            {
                out.push_back(MoveCmd(static_cast<float>(cx), static_cast<float>(cy)));
                needMove = false;
            }
        };
        sc.SkipWsp();
        while (!sc.AtEnd())
        {
            const wchar_t ch = sc.s[sc.i];
            if (kPathLetters.find(ch) != std::wstring_view::npos)
            {
                cmd = ch;
                ++sc.i;
                sc.SkipWsp();
            }
            else if (cmd == 0 || cmd == L'Z' || cmd == L'z')
            {
                break;
            }
            if (out.empty() && cmd != L'M' && cmd != L'm') break;
            const bool rel = std::iswlower(cmd) != 0;
            const double ox = rel ? cx : 0, oy = rel ? cy : 0;
            double a = 0, b = 0, c2 = 0, d2 = 0, e2 = 0, f2 = 0;
            bool ok = true;
            switch (std::towupper(cmd))
            {
            case L'M':
                ok = sc.Number(a) && (sc.SkipCommaWsp(), sc.Number(b));
                if (!ok) break;
                cx = ox + a; cy = oy + b; sx = cx; sy = cy;
                out.push_back(MoveCmd(static_cast<float>(cx), static_cast<float>(cy)));
                needMove = false;
                lastCubic = lastQuad = false;
                cmd = rel ? L'l' : L'L';
                break;
            case L'L':
                ok = sc.Number(a) && (sc.SkipCommaWsp(), sc.Number(b));
                if (!ok) break;
                ensureMove();
                cx = ox + a; cy = oy + b;
                out.push_back(LineCmd(static_cast<float>(cx), static_cast<float>(cy)));
                lastCubic = lastQuad = false;
                break;
            case L'H':
                ok = sc.Number(a);
                if (!ok) break;
                ensureMove();
                cx = ox + a;
                out.push_back(LineCmd(static_cast<float>(cx), static_cast<float>(cy)));
                lastCubic = lastQuad = false;
                break;
            case L'V':
                ok = sc.Number(a);
                if (!ok) break;
                ensureMove();
                cy = oy + a;
                out.push_back(LineCmd(static_cast<float>(cx), static_cast<float>(cy)));
                lastCubic = lastQuad = false;
                break;
            case L'C':
            case L'S':
            {
                const bool smooth = std::towupper(cmd) == L'S';
                double x1 = cx, y1 = cy;
                if (smooth)
                {
                    if (lastCubic) { x1 = 2 * cx - ctrlX; y1 = 2 * cy - ctrlY; }
                }
                else
                {
                    ok = sc.Number(a) && (sc.SkipCommaWsp(), sc.Number(b));
                    if (!ok) break;
                    sc.SkipCommaWsp();
                    x1 = ox + a; y1 = oy + b;
                }
                ok = sc.Number(c2) && (sc.SkipCommaWsp(), sc.Number(d2)) && (sc.SkipCommaWsp(), sc.Number(e2)) && (sc.SkipCommaWsp(), sc.Number(f2));
                if (!ok) break;
                ensureMove();
                out.push_back(CubicCmd(static_cast<float>(x1), static_cast<float>(y1), static_cast<float>(ox + c2), static_cast<float>(oy + d2),
                    static_cast<float>(ox + e2), static_cast<float>(oy + f2)));
                ctrlX = ox + c2; ctrlY = oy + d2;
                cx = ox + e2; cy = oy + f2;
                lastCubic = true; lastQuad = false;
                break;
            }
            case L'Q':
            case L'T':
            {
                const bool smooth = std::towupper(cmd) == L'T';
                double x1 = cx, y1 = cy;
                if (smooth)
                {
                    if (lastQuad) { x1 = 2 * cx - ctrlX; y1 = 2 * cy - ctrlY; }
                }
                else
                {
                    ok = sc.Number(a) && (sc.SkipCommaWsp(), sc.Number(b));
                    if (!ok) break;
                    sc.SkipCommaWsp();
                    x1 = ox + a; y1 = oy + b;
                }
                ok = sc.Number(c2) && (sc.SkipCommaWsp(), sc.Number(d2));
                if (!ok) break;
                ensureMove();
                out.push_back(QuadCmd(static_cast<float>(x1), static_cast<float>(y1), static_cast<float>(ox + c2), static_cast<float>(oy + d2)));
                ctrlX = x1; ctrlY = y1;
                cx = ox + c2; cy = oy + d2;
                lastCubic = false; lastQuad = true;
                break;
            }
            case L'A':
            {
                double rx = 0, ry = 0, rot = 0;
                bool large = false, sweep = false;
                ok = sc.Number(rx) && (sc.SkipCommaWsp(), sc.Number(ry)) && (sc.SkipCommaWsp(), sc.Number(rot)) && (sc.SkipCommaWsp(), sc.Flag(large))
                    && (sc.SkipCommaWsp(), sc.Flag(sweep)) && (sc.SkipCommaWsp(), sc.Number(a)) && (sc.SkipCommaWsp(), sc.Number(b));
                if (!ok) break;
                ensureMove();
                const size_t before = out.size();
                AppendArc(out, cx, cy, rx, ry, rot, large, sweep, ox + a, oy + b);
                for (size_t k = before; k + 1 < out.size(); ++k) arcInner.push_back(k);
                cx = ox + a; cy = oy + b;
                lastCubic = lastQuad = false;
                break;
            }
            case L'Z':
                out.push_back(CloseCmd());
                cx = sx; cy = sy;
                needMove = true;
                lastCubic = lastQuad = false;
                break;
            default:
                ok = false;
                break;
            }
            if (!ok) break;
            sc.SkipCommaWsp();
        }
        if (ends)
        {
            ends->assign(out.size(), true);
            for (size_t k : arcInner) (*ends)[k] = false;
        }
        return out;
    }

    inline std::wstring PathData(std::vector<Cmd> const& cmds)
    {
        std::wstring d;
        d.reserve(cmds.size() * 24);
        for (auto const& c : cmds)
        {
            switch (c.kind)
            {
            case Cmd::Move: d += L"M" + Format(c.p[0]) + L" " + Format(c.p[1]); break;
            case Cmd::Line: d += L"L" + Format(c.p[0]) + L" " + Format(c.p[1]); break;
            case Cmd::Quad: d += L"Q" + Format(c.p[0]) + L" " + Format(c.p[1]) + L" " + Format(c.p[2]) + L" " + Format(c.p[3]); break;
            case Cmd::Cubic:
                d += L"C" + Format(c.p[0]) + L" " + Format(c.p[1]) + L" " + Format(c.p[2]) + L" " + Format(c.p[3]) + L" " + Format(c.p[4]) + L" " + Format(c.p[5]);
                break;
            case Cmd::Close: d += L"Z"; break;
            }
        }
        return d;
    }

    struct Box
    {
        float minX{ 0.0f }, minY{ 0.0f }, maxX{ 0.0f }, maxY{ 0.0f };
        float W() const { return maxX - minX; }
        float H() const { return maxY - minY; }
    };

    inline void Include(std::optional<Box>& b, float x, float y)
    {
        if (!b) b = Box{ x, y, x, y };
        else
        {
            b->minX = (std::min)(b->minX, x); b->minY = (std::min)(b->minY, y);
            b->maxX = (std::max)(b->maxX, x); b->maxY = (std::max)(b->maxY, y);
        }
    }

    inline std::optional<Box> Union(std::optional<Box> a, std::optional<Box> const& b)
    {
        if (b)
        {
            Include(a, b->minX, b->minY);
            Include(a, b->maxX, b->maxY);
        }
        return a;
    }

    inline std::optional<Box> Transformed(Affine const& m, Box const& b)
    {
        std::optional<Box> out;
        for (float x : { b.minX, b.maxX })
        {
            for (float y : { b.minY, b.maxY })
            {
                float px = x, py = y;
                m.Apply(px, py);
                Include(out, px, py);
            }
        }
        return out;
    }

    // Exact bounds: curve extremes from the roots of their derivatives.
    inline std::optional<Box> PathBounds(std::vector<Cmd> const& cmds)
    {
        std::optional<Box> b;
        auto roots = [](double a, double bb, double c, double (&out)[2]) -> int
        {
            int n = 0;
            auto keep = [&](double t) { if (t > 0.0 && t < 1.0) out[n++] = t; };
            if (std::fabs(a) < 1e-12)
            {
                if (std::fabs(bb) > 1e-12) keep(-c / bb);
            }
            else
            {
                const double disc = bb * bb - 4 * a * c;
                if (disc >= 0)
                {
                    keep((-bb + std::sqrt(disc)) / (2 * a));
                    keep((-bb - std::sqrt(disc)) / (2 * a));
                }
            }
            return n;
        };
        float px = 0, py = 0;
        for (auto const& c : cmds)
        {
            switch (c.kind)
            {
            case Cmd::Move:
            case Cmd::Line:
                Include(b, c.p[0], c.p[1]);
                px = c.p[0]; py = c.p[1];
                break;
            case Cmd::Cubic:
            {
                Include(b, c.p[4], c.p[5]);
                for (int axis = 0; axis < 2; ++axis)
                {
                    const double p0 = axis ? py : px, p1 = c.p[axis], p2 = c.p[2 + axis], p3 = c.p[4 + axis];
                    double ts[2];
                    const int n = roots(-p0 + 3 * p1 - 3 * p2 + p3, 2 * (p0 - 2 * p1 + p2), p1 - p0, ts);
                    for (int k = 0; k < n; ++k)
                    {
                        const double t = ts[k], u = 1 - t;
                        auto at = [&](double q0, double q1, double q2, double q3) { return static_cast<float>(u * u * u * q0 + 3 * u * u * t * q1 + 3 * u * t * t * q2 + t * t * t * q3); };
                        Include(b, at(px, c.p[0], c.p[2], c.p[4]), at(py, c.p[1], c.p[3], c.p[5]));
                    }
                }
                px = c.p[4]; py = c.p[5];
                break;
            }
            case Cmd::Quad:
            {
                Include(b, c.p[2], c.p[3]);
                for (int axis = 0; axis < 2; ++axis)
                {
                    const double p0 = axis ? py : px, p1 = c.p[axis], p2 = c.p[2 + axis];
                    double ts[2];
                    const int n = roots(0, 2 * (p0 - 2 * p1 + p2), 2 * (p1 - p0), ts);
                    for (int k = 0; k < n; ++k)
                    {
                        const double t = ts[k], u = 1 - t;
                        Include(b, static_cast<float>(u * u * px + 2 * u * t * c.p[0] + t * t * c.p[2]), static_cast<float>(u * u * py + 2 * u * t * c.p[1] + t * t * c.p[3]));
                    }
                }
                px = c.p[2]; py = c.p[3];
                break;
            }
            case Cmd::Close:
                break;
            }
        }
        return b;
    }

    inline std::vector<Cmd> Translated(std::vector<Cmd> cmds, float dx, float dy)
    {
        for (auto& c : cmds)
        {
            const int points = c.kind == Cmd::Cubic ? 3 : c.kind == Cmd::Quad ? 2 : c.kind == Cmd::Close ? 0 : 1;
            for (int k = 0; k < points; ++k)
            {
                c.p[k * 2] += dx;
                c.p[k * 2 + 1] += dy;
            }
        }
        return cmds;
    }

    // A transform list; nullopt if malformed.
    inline std::optional<Affine> ParseTransform(std::wstring_view s)
    {
        Affine result;
        size_t i = 0;
        constexpr float pi = 3.14159265358979323846f;
        while (i < s.size())
        {
            while (i < s.size() && (Wsp(s[i]) || s[i] == L',')) ++i;
            if (i >= s.size()) break;
            const size_t start = i;
            while (i < s.size() && std::iswalpha(s[i])) ++i;
            const std::wstring name(s.substr(start, i - start));
            while (i < s.size() && Wsp(s[i])) ++i;
            if (name.empty() || i >= s.size() || s[i] != L'(') return std::nullopt;
            const size_t close = s.find(L')', i);
            if (close == std::wstring_view::npos) return std::nullopt;
            const auto args = Numbers(std::wstring(s.substr(i + 1, close - i - 1)));
            i = close + 1;
            Affine t;
            if (name == L"matrix" && args.size() == 6) t = { args[0], args[1], args[2], args[3], args[4], args[5] };
            else if (name == L"translate" && (args.size() == 1 || args.size() == 2)) t = Affine::Translate(args[0], args.size() == 2 ? args[1] : 0.0f);
            else if (name == L"scale" && (args.size() == 1 || args.size() == 2)) t = Affine::Scale(args[0], args.size() == 2 ? args[1] : args[0]);
            else if (name == L"rotate" && (args.size() == 1 || args.size() == 3))
            {
                const float r = args[0] * pi / 180.0f;
                const Affine rot{ std::cos(r), std::sin(r), -std::sin(r), std::cos(r), 0.0f, 0.0f };
                t = args.size() == 3 ? Affine::Translate(args[1], args[2]) * rot * Affine::Translate(-args[1], -args[2]) : rot;
            }
            else if (name == L"skewX" && args.size() == 1) t = { 1.0f, 0.0f, std::tan(args[0] * pi / 180.0f), 1.0f, 0.0f, 0.0f };
            else if (name == L"skewY" && args.size() == 1) t = { 1.0f, std::tan(args[0] * pi / 180.0f), 0.0f, 1.0f, 0.0f, 0.0f };
            else return std::nullopt;
            result = result * t;
        }
        return result;
    }

    inline Affine TransformOf(dom::XmlElement const& el)
    {
        return ParseTransform(std::wstring{ el.GetAttribute(L"transform") }).value_or(Affine{});
    }

    // A length in user units: plain, px, the absolute units, em/ex at `em`, % of `percentBasis`.
    inline bool Length(std::wstring const& raw, float percentBasis, float& out, float em = 16.0f)
    {
        const std::wstring v = Trim(raw);
        if (v.empty()) return false;
        Scanner sc{ v };
        double n = 0;
        if (!sc.Number(n)) return false;
        std::wstring unit = Trim(std::wstring_view(v).substr(sc.i));
        for (auto& ch : unit) ch = static_cast<wchar_t>(std::towlower(ch));
        double scale = 1.0;
        if (unit.empty() || unit == L"px") scale = 1.0;
        else if (unit == L"%") scale = percentBasis / 100.0;
        else if (unit == L"pt") scale = 4.0 / 3.0;
        else if (unit == L"pc") scale = 16.0;
        else if (unit == L"in") scale = 96.0;
        else if (unit == L"cm") scale = 96.0 / 2.54;
        else if (unit == L"mm") scale = 96.0 / 25.4;
        else if (unit == L"em") scale = em;
        else if (unit == L"ex") scale = em / 2.0;
        else if (unit == L"rem") scale = 16.0;
        else return false;
        out = static_cast<float>(n * scale);
        return std::isfinite(out);
    }

    inline float LengthOr(std::wstring const& raw, float percentBasis, float fallback)
    {
        float v = fallback;
        return Length(raw, percentBasis, v) ? v : fallback;
    }

    // ---- Document helpers ----------------------------------------------------------------------

    inline std::optional<dom::XmlElement> ParentElement(dom::IXmlNode const& node)
    {
        auto parent = node.ParentNode();
        if (!parent || parent.NodeType() != dom::NodeType::ElementNode) return std::nullopt;
        return parent.as<dom::XmlElement>();
    }

    inline bool IsWithin(dom::XmlElement const& el, dom::XmlElement const& ancestor)
    {
        for (auto p = ParentElement(el); p; p = ParentElement(*p)) if (*p == ancestor) return true;
        return false;
    }

    // Sets a presentation property, dropping it from `style` (which would win over the attribute).
    inline void SetProperty(dom::XmlElement const& el, std::wstring const& name, std::wstring const& value)
    {
        const std::wstring style{ el.GetAttribute(L"style") };
        if (!style.empty())
        {
            std::wstring kept;
            for (auto const& d : ParseDeclarations(style))
            {
                if (d.name != name) kept += d.name + L":" + d.value + (d.important ? L" !important;" : L";");
            }
            if (kept.empty()) el.RemoveAttribute(L"style");
            else el.SetAttribute(L"style", kept);
        }
        if (value.empty()) el.RemoveAttribute(name);
        else el.SetAttribute(name, value);
    }

    inline bool InsideAny(dom::XmlElement const& el, std::initializer_list<std::wstring_view> names)
    {
        for (auto p = ParentElement(el); p; p = ParentElement(*p))
        {
            const std::wstring name = LocalName(*p);
            for (auto n : names) if (name == n) return true;
        }
        return false;
    }

    // An inherited property: the nearest value set on the element or an ancestor ("" if none).
    inline std::wstring Inherited(dom::XmlElement const& el, std::wstring const& name, std::wstring const& shorthand = {})
    {
        for (std::optional<dom::XmlElement> e = el; e; e = ParentElement(*e))
        {
            std::wstring v = StyleProperty(*e, name);
            if (v.empty() && !shorthand.empty()) v = StyleProperty(*e, shorthand);
            if (!v.empty() && v != L"inherit") return v;
        }
        return {};
    }

    struct Initial
    {
        wchar_t const* name;
        wchar_t const* value;
    };

    // Inherited paint properties, set explicitly on content moved out of its definition (marker,
    // pattern and mask contents inherit from where they're defined, not where they're drawn).
    inline constexpr Initial kInheritedPaint[] = {
        { L"fill", L"black" }, { L"fill-opacity", L"1" }, { L"fill-rule", L"nonzero" }, { L"stroke", L"none" },
        { L"stroke-opacity", L"1" }, { L"stroke-width", L"1" }, { L"stroke-linecap", L"butt" }, { L"stroke-linejoin", L"miter" },
        { L"stroke-miterlimit", L"4" }, { L"stroke-dasharray", L"none" }, { L"stroke-dashoffset", L"0" }, { L"visibility", L"visible" },
        { L"clip-rule", L"nonzero" },
    };

    inline void CopyInheritedPaint(dom::XmlElement const& from, dom::XmlElement const& to)
    {
        for (auto const& p : kInheritedPaint)
        {
            const std::wstring v = Inherited(from, p.name);
            to.SetAttribute(p.name, v.empty() ? p.value : v);
        }
    }

    inline dom::XmlElement Defs(Context& c)
    {
        auto defs = Create(c, L"defs");
        c.doc.DocumentElement().InsertBefore(defs, c.doc.DocumentElement().FirstChild());
        return defs;
    }

    inline std::wstring NewId(Context& c, wchar_t const* prefix)
    {
        return std::wstring(prefix) + std::to_wstring(++c.clips);
    }

    // A clipPath of one path in `defs`; returns its id.
    inline std::wstring ClipPathOf(Context& c, dom::XmlElement const& defs, std::wstring const& d, bool evenOdd = false)
    {
        const std::wstring id = NewId(c, L"__mason_clip_");
        auto clip = Create(c, L"clipPath");
        clip.SetAttribute(L"id", id);
        auto path = Create(c, L"path");
        path.SetAttribute(L"d", d);
        if (evenOdd) path.SetAttribute(L"clip-rule", L"evenodd");
        clip.AppendChild(path);
        defs.AppendChild(clip);
        return id;
    }

    inline std::wstring RectPath(float x, float y, float w, float h)
    {
        return L"M" + Format(x) + L" " + Format(y) + L"h" + Format(w) + L"v" + Format(h) + L"h" + Format(-w) + L"Z";
    }

    inline void InsertAfter(dom::IXmlNode const& node, dom::IXmlNode const& added)
    {
        auto parent = node.ParentNode();
        if (!parent) return;
        if (auto next = node.NextSibling()) parent.InsertBefore(added, next);
        else parent.AppendChild(added);
    }

    inline void CloneChildren(dom::XmlElement const& from, dom::XmlElement const& to)
    {
        auto children = from.ChildNodes();
        for (uint32_t i = 0; i < children.Size(); ++i)
        {
            auto child = children.Item(i);
            if (child.NodeType() == dom::NodeType::ElementNode) to.AppendChild(child.CloneNode(true));
        }
    }

    inline std::vector<dom::XmlElement> Elements(dom::XmlElement const& root, std::initializer_list<std::wstring_view> names)
    {
        std::vector<dom::XmlElement> out;
        ForEachElement(root, [&](dom::XmlElement const& el)
        {
            const std::wstring name = LocalName(el);
            for (auto n : names) if (name == n) { out.push_back(el); break; }
            return true;
        });
        return out;
    }

    inline std::optional<dom::XmlElement> RefTarget(Context& c, std::wstring const& value)
    {
        const std::wstring v = Trim(value);
        if (v.size() < 5 || _wcsnicmp(v.c_str(), L"url(", 4) != 0) return std::nullopt;
        const size_t close = v.find(L')');
        if (close == std::wstring::npos) return std::nullopt;
        std::wstring inner = Trim(std::wstring_view(v).substr(4, close - 4));
        if (!inner.empty() && (inner.front() == L'"' || inner.front() == L'\'')) inner = Trim(std::wstring_view(inner).substr(1, inner.size() >= 2 ? inner.size() - 2 : 0));
        if (inner.size() < 2 || inner[0] != L'#') return std::nullopt;
        auto it = c.ids.find(inner.substr(1));
        if (it == c.ids.end()) return std::nullopt;
        return it->second;
    }

    // What follows a paint's `url(...)`: its fallback colour, or "none".
    inline std::wstring PaintFallback(std::wstring const& value)
    {
        const size_t close = value.find(L')');
        const std::wstring rest = close == std::wstring::npos ? std::wstring{} : Trim(std::wstring_view(value).substr(close + 1));
        return rest.empty() ? std::wstring(L"none") : rest;
    }

    // ---- Shapes and bounds ---------------------------------------------------------------------

    inline constexpr float kKappa = 0.5522847498307936f;

    inline std::vector<Cmd> Ellipse(float cx, float cy, float rx, float ry)
    {
        if (rx <= 0 || ry <= 0) return {};
        const float kx = kKappa * rx, ky = kKappa * ry;
        return { MoveCmd(cx + rx, cy), CubicCmd(cx + rx, cy + ky, cx + kx, cy + ry, cx, cy + ry), CubicCmd(cx - kx, cy + ry, cx - rx, cy + ky, cx - rx, cy),
            CubicCmd(cx - rx, cy - ky, cx - kx, cy - ry, cx, cy - ry), CubicCmd(cx + kx, cy - ry, cx + rx, cy - ky, cx + rx, cy), CloseCmd() };
    }

    inline std::vector<Cmd> RectCmds(float x, float y, float w, float h, float rx, float ry)
    {
        if (w <= 0 || h <= 0) return {};
        rx = (std::min)(rx, w / 2);
        ry = (std::min)(ry, h / 2);
        if (rx <= 0 || ry <= 0) return { MoveCmd(x, y), LineCmd(x + w, y), LineCmd(x + w, y + h), LineCmd(x, y + h), CloseCmd() };
        const float kx = kKappa * rx, ky = kKappa * ry, r = x + w, b = y + h;
        return { MoveCmd(x + rx, y), LineCmd(r - rx, y), CubicCmd(r - rx + kx, y, r, y + ry - ky, r, y + ry), LineCmd(r, b - ry),
            CubicCmd(r, b - ry + ky, r - rx + kx, b, r - rx, b), LineCmd(x + rx, b), CubicCmd(x + rx - kx, b, x, b - ry + ky, x, b - ry),
            LineCmd(x, y + ry), CubicCmd(x, y + ry - ky, x + rx - kx, y, x + rx, y), CloseCmd() };
    }

    inline bool IsShape(std::wstring const& name)
    {
        return name == L"path" || name == L"rect" || name == L"circle" || name == L"ellipse" || name == L"line" || name == L"polyline" || name == L"polygon";
    }

    inline std::vector<Cmd> ShapeCommands(Context const& c, dom::XmlElement const& el, std::vector<bool>* ends = nullptr)
    {
        const std::wstring name = LocalName(el);
        auto attr = [&](wchar_t const* k) { return std::wstring{ el.GetAttribute(k) }; };
        auto lx = [&](wchar_t const* k, float def = 0.0f) { return LengthOr(attr(k), c.width, def); };
        auto ly = [&](wchar_t const* k, float def = 0.0f) { return LengthOr(attr(k), c.height, def); };
        if (name == L"path") return ParsePath(attr(L"d"), ends);
        if (name == L"rect")
        {
            float rx = -1, ry = -1;
            const bool hasRx = Length(attr(L"rx"), c.width, rx) && rx >= 0, hasRy = Length(attr(L"ry"), c.height, ry) && ry >= 0;
            if (!hasRx) rx = hasRy ? ry : 0;
            if (!hasRy) ry = rx;
            return RectCmds(lx(L"x"), ly(L"y"), lx(L"width"), ly(L"height"), rx, ry);
        }
        if (name == L"circle")
        {
            const float diag = std::sqrt((c.width * c.width + c.height * c.height) / 2);
            const float r = LengthOr(attr(L"r"), diag, 0);
            return Ellipse(lx(L"cx"), ly(L"cy"), r, r);
        }
        if (name == L"ellipse")
        {
            float rx = 0, ry = 0;
            const bool hx = Length(attr(L"rx"), c.width, rx), hy = Length(attr(L"ry"), c.height, ry);
            return Ellipse(lx(L"cx"), ly(L"cy"), hx ? rx : ry, hy ? ry : rx);
        }
        if (name == L"line") return { MoveCmd(lx(L"x1"), ly(L"y1")), LineCmd(lx(L"x2"), ly(L"y2")) };
        if (name == L"polyline" || name == L"polygon")
        {
            const auto nums = Numbers(attr(L"points"));
            std::vector<Cmd> out;
            if (nums.size() < 4) return out;
            for (size_t i = 0; i + 1 < nums.size(); i += 2) out.push_back(i == 0 ? MoveCmd(nums[i], nums[i + 1]) : LineCmd(nums[i], nums[i + 1]));
            if (name == L"polygon") out.push_back(CloseCmd());
            return out;
        }
        return {};
    }

    // Bounds of an element's geometry in its own user space (inside its transform).
    inline std::optional<Box> ElementBounds(Context& c, dom::XmlElement const& el, int depth = 0)
    {
        if (depth > 64 || StyleProperty(el, L"display") == L"none") return std::nullopt;
        const std::wstring name = LocalName(el);
        if (IsShape(name)) return PathBounds(ShapeCommands(c, el));
        if (name == L"image")
        {
            float w = 0, h = 0;
            if (!Length(std::wstring{ el.GetAttribute(L"width") }, c.width, w) || !Length(std::wstring{ el.GetAttribute(L"height") }, c.height, h)) return std::nullopt;
            const float x = LengthOr(std::wstring{ el.GetAttribute(L"x") }, c.width, 0), y = LengthOr(std::wstring{ el.GetAttribute(L"y") }, c.height, 0);
            return Box{ x, y, x + w, y + h };
        }
        if (name == L"use")
        {
            const std::wstring href = HrefOf(el);
            auto it = href.size() > 1 && href[0] == L'#' ? c.ids.find(href.substr(1)) : c.ids.end();
            if (it == c.ids.end()) return std::nullopt;
            auto inner = ElementBounds(c, it->second, depth + 1);
            if (!inner) return std::nullopt;
            const Affine t = Affine::Translate(LengthOr(std::wstring{ el.GetAttribute(L"x") }, c.width, 0), LengthOr(std::wstring{ el.GetAttribute(L"y") }, c.height, 0))
                * TransformOf(it->second);
            return Transformed(t, *inner);
        }
        if (name != L"g" && name != L"svg" && name != L"a" && name != L"switch") return std::nullopt;
        std::optional<Box> b;
        auto children = el.ChildNodes();
        for (uint32_t i = 0; i < children.Size(); ++i)
        {
            auto child = children.Item(i);
            if (child.NodeType() != dom::NodeType::ElementNode) continue;
            auto ce = child.as<dom::XmlElement>();
            if (auto cb = ElementBounds(c, ce, depth + 1)) b = Union(b, Transformed(TransformOf(ce), *cb));
        }
        return b;
    }

    // ---- Text ------------------------------------------------------------------------------------

    // Collects a glyph run's outline as commands, at an origin and scale.
    struct OutlineCollector : winrt::implements<OutlineCollector, ID2D1SimplifiedGeometrySink>
    {
        std::vector<Cmd>* out{ nullptr };
        float ox{ 0.0f }, oy{ 0.0f }, k{ 1.0f };

        void __stdcall SetFillMode(D2D1_FILL_MODE) noexcept override {}
        void __stdcall SetSegmentFlags(D2D1_PATH_SEGMENT) noexcept override {}
        void __stdcall BeginFigure(D2D1_POINT_2F p, D2D1_FIGURE_BEGIN) noexcept override { out->push_back(MoveCmd((ox + p.x) * k, (oy + p.y) * k)); }
        void __stdcall AddLines(D2D1_POINT_2F const* points, UINT32 count) noexcept override
        {
            for (UINT32 i = 0; i < count; ++i) out->push_back(LineCmd((ox + points[i].x) * k, (oy + points[i].y) * k));
        }
        void __stdcall AddBeziers(D2D1_BEZIER_SEGMENT const* beziers, UINT32 count) noexcept override
        {
            for (UINT32 i = 0; i < count; ++i)
            {
                auto const& b = beziers[i];
                out->push_back(CubicCmd((ox + b.point1.x) * k, (oy + b.point1.y) * k, (ox + b.point2.x) * k, (oy + b.point2.y) * k,
                    (ox + b.point3.x) * k, (oy + b.point3.y) * k));
            }
        }
        void __stdcall EndFigure(D2D1_FIGURE_END end) noexcept override { if (end == D2D1_FIGURE_END_CLOSED) out->push_back(CloseCmd()); }
        HRESULT __stdcall Close() noexcept override { return S_OK; }
    };

    // A text renderer that outlines each glyph run, the baseline at y 0.
    struct RunOutliner : winrt::implements<RunOutliner, IDWriteTextRenderer>
    {
        std::vector<Cmd> cmds;
        float baseline{ 0.0f }, k{ 1.0f };

        HRESULT __stdcall IsPixelSnappingDisabled(void*, BOOL* disabled) noexcept override
        {
            *disabled = TRUE;
            return S_OK;
        }
        HRESULT __stdcall GetCurrentTransform(void*, DWRITE_MATRIX* transform) noexcept override
        {
            *transform = DWRITE_MATRIX{ 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0.0f };
            return S_OK;
        }
        HRESULT __stdcall GetPixelsPerDip(void*, FLOAT* pixelsPerDip) noexcept override
        {
            *pixelsPerDip = 1.0f;
            return S_OK;
        }
        HRESULT __stdcall DrawGlyphRun(void*, FLOAT x, FLOAT y, DWRITE_MEASURING_MODE, DWRITE_GLYPH_RUN const* run,
            DWRITE_GLYPH_RUN_DESCRIPTION const*, ::IUnknown*) noexcept override
        {
            if (!run || !run->fontFace || run->glyphCount == 0) return S_OK;
            auto sink = winrt::make_self<OutlineCollector>();
            sink->out = &cmds;
            sink->ox = x;
            sink->oy = y - baseline;
            sink->k = k;
            run->fontFace->GetGlyphRunOutline(run->fontEmSize, run->glyphIndices, run->glyphAdvances, run->glyphOffsets, run->glyphCount,
                run->isSideways, run->bidiLevel % 2, sink.get());
            return S_OK;
        }
        HRESULT __stdcall DrawUnderline(void*, FLOAT, FLOAT, DWRITE_UNDERLINE const*, ::IUnknown*) noexcept override { return S_OK; }
        HRESULT __stdcall DrawStrikethrough(void*, FLOAT, FLOAT, DWRITE_STRIKETHROUGH const*, ::IUnknown*) noexcept override { return S_OK; }
        HRESULT __stdcall DrawInlineObject(void*, FLOAT, FLOAT, IDWriteInlineObject*, BOOL, BOOL, ::IUnknown*) noexcept override { return S_OK; }
    };

    struct TextRun
    {
        std::vector<Cmd> cmds;
        float advance{ 0.0f }, ascent{ 0.0f }, descent{ 0.0f }, xHeight{ 0.0f };
    };

    // Outlines are taken at this size and scaled, so tiny viewBox units keep their shape.
    inline constexpr float kShapeSize = 100.0f;

    // The first family in a font-family list the system has, generic names mapped as Chrome does.
    inline std::wstring ResolveFamily(std::wstring const& list)
    {
        std::vector<std::wstring> families;
        std::wstring current;
        wchar_t quote = 0;
        for (wchar_t ch : list + L",")
        {
            if (quote) { if (ch == quote) quote = 0; else current += ch; }
            else if (ch == L'"' || ch == L'\'') quote = ch;
            else if (ch == L',') { const std::wstring f = Trim(current); if (!f.empty()) families.push_back(f); current.clear(); }
            else current += ch;
        }
        families.push_back(L"serif");
        for (auto const& f : families)
        {
            std::wstring lower = f;
            for (auto& ch : lower) ch = static_cast<wchar_t>(std::towlower(ch));
            if (lower == L"serif" || lower == L"ui-serif") return L"Times New Roman";
            if (lower == L"sans-serif" || lower == L"ui-sans-serif" || lower == L"ui-rounded") return L"Arial";
            if (lower == L"system-ui" || lower == L"-apple-system") return L"Segoe UI";
            if (lower == L"monospace" || lower == L"ui-monospace") return L"Consolas";
            if (lower == L"cursive") return L"Comic Sans MS";
            if (lower == L"fantasy") return L"Impact";
            if (mason_dwrite::SystemHasFamily(f)) return f;
        }
        return L"Times New Roman";
    }

    inline TextRun ShapeText(std::wstring const& text, std::wstring const& family, int weight, bool italic, float size, float letterSpacing, float wordSpacing)
    {
        TextRun run;
        auto* factory = mason_dwrite::Factory();
        if (!factory || size <= 0.0f || text.empty()) return run;
        const float k = size / kShapeSize;
        const auto style = italic ? DWRITE_FONT_STYLE_ITALIC : DWRITE_FONT_STYLE_NORMAL;
        const auto w = static_cast<DWRITE_FONT_WEIGHT>((std::clamp)(weight, 1, 999));
        winrt::com_ptr<IDWriteTextFormat> format;
        if (FAILED(factory->CreateTextFormat(family.c_str(), nullptr, w, style, DWRITE_FONT_STRETCH_NORMAL, kShapeSize, L"en-us", format.put()))) return run;
        format->SetWordWrapping(DWRITE_WORD_WRAPPING_NO_WRAP);
        winrt::com_ptr<IDWriteTextLayout> layout;
        if (FAILED(factory->CreateTextLayout(text.c_str(), static_cast<UINT32>(text.size()), format.get(), mason_dwrite::kUnbounded, mason_dwrite::kUnbounded, layout.put()))) return run;
        if (letterSpacing != 0.0f || wordSpacing != 0.0f)
        {
            if (auto spaced = layout.try_as<IDWriteTextLayout1>())
            {
                if (letterSpacing != 0.0f) spaced->SetCharacterSpacing(0.0f, letterSpacing / k, 0.0f, { 0, static_cast<UINT32>(text.size()) });
                if (wordSpacing != 0.0f)
                {
                    for (UINT32 i = 0; i < text.size(); ++i)
                    {
                        if (text[i] == L' ' || text[i] == 0xA0) spaced->SetCharacterSpacing(0.0f, (letterSpacing + wordSpacing) / k, 0.0f, { i, 1 });
                    }
                }
            }
        }
        DWRITE_LINE_METRICS line{};
        UINT32 lines = 0;
        layout->GetLineMetrics(&line, 1, &lines);
        DWRITE_TEXT_METRICS metrics{};
        layout->GetMetrics(&metrics);
        auto outliner = winrt::make_self<RunOutliner>();
        outliner->baseline = line.baseline;
        outliner->k = k;
        layout->Draw(nullptr, outliner.get(), 0.0f, 0.0f);
        run.cmds = std::move(outliner->cmds);
        run.advance = metrics.widthIncludingTrailingWhitespace * k;
        run.ascent = 0.9f * size;
        run.descent = 0.25f * size;
        run.xHeight = 0.5f * size;
        winrt::com_ptr<IDWriteFontFamily> fontFamily = mason_dwrite::FamilyOf(mason_dwrite::Font{ nullptr, family });
        winrt::com_ptr<IDWriteFont> font;
        if (fontFamily && SUCCEEDED(fontFamily->GetFirstMatchingFont(w, DWRITE_FONT_STRETCH_NORMAL, style, font.put())))
        {
            DWRITE_FONT_METRICS m{};
            font->GetMetrics(&m);
            if (m.designUnitsPerEm > 0)
            {
                run.ascent = static_cast<float>(m.ascent) / m.designUnitsPerEm * size;
                run.descent = static_cast<float>(m.descent) / m.designUnitsPerEm * size;
                run.xHeight = static_cast<float>(m.xHeight) / m.designUnitsPerEm * size;
            }
        }
        return run;
    }

    struct TextStyle
    {
        std::wstring family;
        float size{ 16.0f };
        int weight{ 400 };
        bool italic{ false };
        int anchor{ 0 }; // 0 start, 1 middle, 2 end
        std::wstring baseline;
        float letterSpacing{ 0.0f }, wordSpacing{ 0.0f };
        bool preserve{ false };
    };

    inline float FontSizeOf(std::wstring const& raw, float parent)
    {
        std::wstring v = Trim(raw);
        for (auto& ch : v) ch = static_cast<wchar_t>(std::towlower(ch));
        if (auto it = kFontSizeKeywords.find(v); it != kFontSizeKeywords.end()) return it->second;
        if (v == L"larger") return parent * 1.2f;
        if (v == L"smaller") return parent / 1.2f;
        float out = parent;
        return Length(v, parent, out, parent) && out >= 0.0f ? out : parent;
    }

    inline int FontWeightOf(std::wstring const& raw, int parent)
    {
        const std::wstring v = Trim(raw);
        if (v == L"normal") return 400;
        if (v == L"bold") return 700;
        if (v == L"bolder") return parent < 350 ? 400 : parent < 550 ? 700 : 900;
        if (v == L"lighter") return parent < 550 ? 100 : parent < 750 ? 400 : 700;
        wchar_t* end = nullptr;
        const double n = std::wcstod(v.c_str(), &end);
        return end != v.c_str() && n >= 1 && n <= 1000 ? static_cast<int>(n) : parent;
    }

    // The text style at `el`, inherited down from the root (the `font` shorthand first).
    inline TextStyle TextStyleOf(dom::XmlElement const& el)
    {
        std::vector<dom::XmlElement> chain;
        for (std::optional<dom::XmlElement> e = el; e; e = ParentElement(*e)) chain.push_back(*e);
        TextStyle s;
        std::wstring families = L"serif";
        for (auto it = chain.rbegin(); it != chain.rend(); ++it)
        {
            const float parentSize = s.size;
            const int parentWeight = s.weight;
            const std::wstring font = StyleProperty(*it, L"font");
            if (!font.empty())
            {
                // [style || weight || variant] size[/line-height] family
                std::wstring rest = Trim(font);
                bool italic = false;
                int weight = 400;
                while (!rest.empty())
                {
                    const size_t sp = rest.find_first_of(L" \t\r\n");
                    const std::wstring token = rest.substr(0, sp);
                    const std::wstring after = sp == std::wstring::npos ? std::wstring{} : Trim(std::wstring_view(rest).substr(sp));
                    if (token == L"italic" || token == L"oblique") italic = true;
                    else if (token == L"normal" || token == L"small-caps" || token.find(L"condensed") != std::wstring::npos || token.find(L"expanded") != std::wstring::npos) {}
                    else if (token == L"bold" || token == L"bolder" || token == L"lighter" || (std::iswdigit(token[0]) && token.find_first_not_of(L"0123456789") == std::wstring::npos))
                    {
                        weight = FontWeightOf(token, parentWeight);
                    }
                    else
                    {
                        if (!after.empty())
                        {
                            s.size = FontSizeOf(token.substr(0, token.find(L'/')), parentSize);
                            s.italic = italic;
                            s.weight = weight;
                            families = after;
                        }
                        break;
                    }
                    rest = after;
                }
            }
            auto prop = [&](wchar_t const* name) { const std::wstring v = StyleProperty(*it, name); return v == L"inherit" ? std::wstring{} : v; };
            if (auto v = prop(L"font-family"); !v.empty()) families = v;
            if (auto v = prop(L"font-size"); !v.empty()) s.size = FontSizeOf(v, parentSize);
            if (auto v = prop(L"font-weight"); !v.empty()) s.weight = FontWeightOf(v, parentWeight);
            if (auto v = prop(L"font-style"); !v.empty()) s.italic = v == L"italic" || v == L"oblique";
            if (auto v = prop(L"text-anchor"); !v.empty()) s.anchor = v == L"middle" ? 1 : v == L"end" ? 2 : 0;
            if (auto v = prop(L"dominant-baseline"); !v.empty()) s.baseline = v;
            if (auto v = prop(L"letter-spacing"); !v.empty()) s.letterSpacing = v == L"normal" ? 0.0f : LengthOr(v, s.size, s.letterSpacing);
            if (auto v = prop(L"word-spacing"); !v.empty()) s.wordSpacing = v == L"normal" ? 0.0f : LengthOr(v, s.size, s.wordSpacing);
            if (auto v = std::wstring{ it->GetAttribute(L"xml:space") }; !v.empty()) s.preserve = v == L"preserve";
            if (auto v = prop(L"white-space"); !v.empty()) s.preserve = v == L"pre" || v == L"pre-wrap" || v == L"break-spaces";
        }
        s.family = ResolveFamily(families);
        return s;
    }

    inline float BaselineShift(std::wstring const& baseline, TextRun const& run)
    {
        if (baseline == L"middle") return run.xHeight / 2;
        if (baseline == L"central") return (run.ascent - run.descent) / 2;
        if (baseline == L"hanging") return run.ascent * 0.8f;
        if (baseline == L"text-top" || baseline == L"text-before-edge") return run.ascent;
        if (baseline == L"text-bottom" || baseline == L"text-after-edge" || baseline == L"ideographic") return -run.descent;
        if (baseline == L"mathematical") return run.ascent / 2;
        return 0.0f;
    }

    struct TextChar
    {
        std::wstring units; // one code point
        dom::XmlElement owner{ nullptr };
        size_t style{ 0 };
        std::optional<float> x, y;
        float dx{ 0.0f }, dy{ 0.0f };
    };

    struct TextRange
    {
        dom::XmlElement element{ nullptr };
        size_t start{ 0 }, end{ 0 };
    };

    inline void CollectText(dom::XmlElement const& el, size_t style, std::vector<TextStyle>& styles, std::vector<TextChar>& out,
        std::vector<TextRange>& ranges, bool& lastSpace, int depth)
    {
        if (depth > 64) return;
        const size_t slot = ranges.size();
        ranges.push_back({ el, out.size(), out.size() });
        auto children = el.ChildNodes();
        for (uint32_t i = 0; i < children.Size(); ++i)
        {
            auto child = children.Item(i);
            const auto type = child.NodeType();
            if (type == dom::NodeType::TextNode || type == dom::NodeType::CDataSectionNode)
            {
                const std::wstring text{ child.InnerText() };
                for (size_t k = 0; k < text.size(); ++k)
                {
                    std::wstring unit(1, text[k]);
                    if (text[k] >= 0xD800 && text[k] < 0xDC00 && k + 1 < text.size()) unit += text[++k];
                    const bool ws = unit == L" " || unit == L"\t" || unit == L"\n" || unit == L"\r";
                    if (styles[style].preserve)
                    {
                        out.push_back({ ws ? L" " : unit, el, style });
                        lastSpace = false;
                    }
                    else if (ws)
                    {
                        if (lastSpace) continue;
                        out.push_back({ L" ", el, style });
                        lastSpace = true;
                    }
                    else
                    {
                        out.push_back({ unit, el, style });
                        lastSpace = false;
                    }
                }
            }
            else if (type == dom::NodeType::ElementNode)
            {
                auto ce = child.as<dom::XmlElement>();
                const std::wstring name = LocalName(ce);
                if ((name != L"tspan" && name != L"a") || StyleProperty(ce, L"display") == L"none") continue;
                styles.push_back(TextStyleOf(ce));
                CollectText(ce, styles.size() - 1, styles, out, ranges, lastSpace, depth + 1);
            }
        }
        ranges[slot].end = out.size();
    }

    // Replaces each <text> with a group of glyph outline paths.
    inline void ExpandText(Context& c, dom::XmlElement const& root)
    {
        for (auto const& text : Elements(root, { L"text" }))
        {
            std::vector<TextStyle> styles{ TextStyleOf(text) };
            std::vector<TextChar> chars;
            std::vector<TextRange> ranges;
            bool lastSpace = true;
            CollectText(text, 0, styles, chars, ranges, lastSpace, 0);
            if (!chars.empty() && chars.back().units == L" " && !styles[chars.back().style].preserve) chars.pop_back();
            for (auto const& r : ranges)
            {
                const size_t stop = (std::min)(r.end, chars.size());
                auto list = [&](wchar_t const* name, float basis)
                {
                    std::vector<float> out;
                    const std::wstring raw{ r.element.GetAttribute(name) };
                    size_t i = 0;
                    while (i < raw.size())
                    {
                        while (i < raw.size() && (Wsp(raw[i]) || raw[i] == L',')) ++i;
                        size_t j = i;
                        while (j < raw.size() && !Wsp(raw[j]) && raw[j] != L',') ++j;
                        if (j == i) break;
                        float v = 0;
                        if (!Length(raw.substr(i, j - i), basis, v)) break;
                        out.push_back(v);
                        i = j;
                    }
                    return out;
                };
                const auto xs = list(L"x", c.width), ys = list(L"y", c.height), dxs = list(L"dx", c.width), dys = list(L"dy", c.height);
                for (size_t k = 0; r.start + k < stop; ++k)
                {
                    auto& ch = chars[r.start + k];
                    if (k < xs.size()) ch.x = xs[k];
                    if (k < ys.size()) ch.y = ys[k];
                    if (k < dxs.size()) ch.dx = dxs[k];
                    if (k < dys.size()) ch.dy = dys[k];
                }
            }

            struct Piece { std::vector<Cmd> cmds; dom::XmlElement owner{ nullptr }; };
            struct Chunk { size_t first; float startX, endX; int anchor; };
            std::vector<Piece> pieces;
            std::vector<Chunk> chunks;
            float px = 0, py = 0;
            for (size_t i = 0; i < chars.size();)
            {
                auto const& ch = chars[i];
                const float penX = px;
                if (ch.x) px = *ch.x;
                if (ch.y) py = *ch.y;
                px += ch.dx;
                py += ch.dy;
                if (i == 0 || ch.x || ch.y)
                {
                    if (!chunks.empty()) chunks.back().endX = penX;
                    chunks.push_back({ pieces.size(), px, px, styles[ch.style].anchor });
                }
                size_t j = i + 1;
                std::wstring run = ch.units;
                while (j < chars.size() && chars[j].owner == ch.owner && !chars[j].x && !chars[j].y && chars[j].dx == 0 && chars[j].dy == 0)
                {
                    run += chars[j].units;
                    ++j;
                }
                TextStyle const& st = styles[ch.style];
                TextRun shaped = ShapeText(run, st.family, st.weight, st.italic, st.size, st.letterSpacing, st.wordSpacing);
                const float shift = BaselineShift(st.baseline, shaped);
                if (!shaped.cmds.empty()) pieces.push_back({ Translated(std::move(shaped.cmds), px, py + shift), ch.owner });
                px += shaped.advance;
                i = j;
            }
            if (!chunks.empty()) chunks.back().endX = px;
            for (size_t n = 0; n < chunks.size(); ++n)
            {
                if (chunks[n].anchor == 0) continue;
                const float width = chunks[n].endX - chunks[n].startX;
                const float dx = chunks[n].anchor == 1 ? -width / 2 : -width;
                const size_t end = n + 1 < chunks.size() ? chunks[n + 1].first : pieces.size();
                for (size_t p = chunks[n].first; p < end; ++p) pieces[p].cmds = Translated(std::move(pieces[p].cmds), dx, 0);
            }

            // The text's own attributes stay on the group; a tspan's paint goes on its path.
            auto parent = text.ParentNode();
            if (!parent) continue;
            std::vector<dom::XmlElement> paths;
            for (auto const& piece : pieces)
            {
                auto path = Create(c, L"path");
                path.SetAttribute(L"d", PathData(piece.cmds));
                path.SetAttribute(L"fill-rule", L"nonzero");
                if (piece.owner != text) CopyInheritedPaint(piece.owner, path);
                paths.push_back(path);
            }
            const std::wstring id{ text.GetAttribute(L"id") };
            if (LocalName(parent.as<dom::XmlElement>()) == L"clipPath")
            {
                // A clip path takes shapes, not groups.
                const std::wstring transform{ text.GetAttribute(L"transform") };
                for (auto const& path : paths)
                {
                    if (!transform.empty()) path.SetAttribute(L"transform", transform);
                    parent.InsertBefore(path, text);
                }
                parent.RemoveChild(text);
                continue;
            }
            auto group = Create(c, L"g");
            auto attrs = text.Attributes();
            for (uint32_t i = 0; i < attrs.Size(); ++i)
            {
                auto attr = attrs.Item(i);
                const std::wstring name{ attr.NodeName() };
                if (kTextOnlyAttributes.count(name)) continue;
                group.SetAttribute(name, winrt::unbox_value_or<winrt::hstring>(attr.NodeValue(), L""));
            }
            for (auto const& path : paths) group.AppendChild(path);
            parent.ReplaceChild(group, text);
            if (!id.empty())
            {
                group.SetAttribute(L"id", id);
                c.ids.insert_or_assign(id, group);
            }
        }
    }

    // ---- Markers ---------------------------------------------------------------------------------

    struct Vertex
    {
        float x{ 0.0f }, y{ 0.0f };
        std::optional<float> in, out;

        float Auto() const
        {
            if (!in || !out) return in ? *in : out ? *out : 0.0f;
            float i = *in;
            if (std::fabs(i - *out) > 180.0f) i += 360.0f;
            return (i + *out) / 2.0f;
        }
    };

    inline std::optional<float> Direction(float x0, float y0, float x1, float y1)
    {
        if (x0 == x1 && y0 == y1) return std::nullopt;
        return static_cast<float>(std::atan2(y1 - y0, x1 - x0) * 180.0 / 3.14159265358979323846);
    }

    inline std::vector<Vertex> MarkerVertices(std::vector<Cmd> const& cmds, std::vector<bool> const* ends)
    {
        std::vector<Vertex> out;
        float cx = 0, cy = 0, sx = 0, sy = 0;
        int start = -1;
        for (size_t i = 0; i < cmds.size(); ++i)
        {
            auto const& c = cmds[i];
            std::optional<float> d0, d1;
            switch (c.kind)
            {
            case Cmd::Move:
                out.push_back({ c.p[0], c.p[1] });
                start = static_cast<int>(out.size()) - 1;
                cx = sx = c.p[0];
                cy = sy = c.p[1];
                continue;
            case Cmd::Close:
            {
                if (start < 0) continue;
                const auto d = Direction(cx, cy, sx, sy);
                auto& last = out.back();
                if (d && !last.out) last.out = d;
                const auto in = d ? d : last.in;
                out[start].in = in;
                out.push_back({ sx, sy, in, out[start].out });
                cx = sx; cy = sy;
                continue;
            }
            case Cmd::Line:
                d0 = d1 = Direction(cx, cy, c.p[0], c.p[1]);
                break;
            case Cmd::Quad:
                d0 = Direction(cx, cy, c.p[0], c.p[1]);
                if (!d0) d0 = Direction(cx, cy, c.p[2], c.p[3]);
                d1 = Direction(c.p[0], c.p[1], c.p[2], c.p[3]);
                if (!d1) d1 = Direction(cx, cy, c.p[2], c.p[3]);
                break;
            case Cmd::Cubic:
                d0 = Direction(cx, cy, c.p[0], c.p[1]);
                if (!d0) d0 = Direction(cx, cy, c.p[2], c.p[3]);
                if (!d0) d0 = Direction(cx, cy, c.p[4], c.p[5]);
                d1 = Direction(c.p[2], c.p[3], c.p[4], c.p[5]);
                if (!d1) d1 = Direction(c.p[0], c.p[1], c.p[4], c.p[5]);
                if (!d1) d1 = Direction(cx, cy, c.p[4], c.p[5]);
                break;
            }
            if (start < 0) continue;
            if (!out.back().out) out.back().out = d0;
            if (!ends || i >= ends->size() || (*ends)[i]) out.push_back({ c.X(), c.Y(), d1, std::nullopt });
            cx = c.X();
            cy = c.Y();
        }
        return out;
    }

    // Copies of each marker's content placed at the shape's vertices, after the shape.
    inline void ExpandMarkers(Context& c, dom::XmlElement const& root)
    {
        std::optional<dom::XmlElement> defs;
        for (auto const& shape : Elements(root, { L"path", L"line", L"polyline", L"polygon" }))
        {
            const std::wstring ids[3] = { Inherited(shape, L"marker-start", L"marker"), Inherited(shape, L"marker-mid", L"marker"),
                Inherited(shape, L"marker-end", L"marker") };
            std::optional<dom::XmlElement> markers[3];
            bool any = false;
            for (int k = 0; k < 3; ++k)
            {
                if (auto target = RefTarget(c, ids[k]); target && LocalName(*target) == L"marker")
                {
                    markers[k] = target;
                    any = true;
                }
            }
            if (!any) continue;
            std::vector<bool> ends;
            const auto cmds = ShapeCommands(c, shape, &ends);
            const auto vertices = MarkerVertices(cmds, LocalName(shape) == L"path" ? &ends : nullptr);
            if (vertices.empty()) continue;
            const float strokeWidth = LengthOr(Inherited(shape, L"stroke-width"), c.width, 1.0f);
            auto holder = Create(c, L"g");
            if (const std::wstring t{ shape.GetAttribute(L"transform") }; !t.empty()) holder.SetAttribute(L"transform", t);
            const size_t last = vertices.size() - 1;
            for (size_t i = 0; i < vertices.size(); ++i)
            {
                for (int k = 0; k < 3; ++k)
                {
                    const bool here = k == 0 ? i == 0 : k == 1 ? i > 0 && i < last : i == last;
                    if (!here || !markers[k]) continue;
                    auto const& marker = *markers[k];
                    // A marker drawn inside itself would never end.
                    if (IsWithin(shape, marker)) continue;
                    auto attr = [&](wchar_t const* name) { return std::wstring{ marker.GetAttribute(name) }; };
                    const float mw = LengthOr(attr(L"markerWidth"), c.width, 3.0f), mh = LengthOr(attr(L"markerHeight"), c.height, 3.0f);
                    if (mw <= 0 || mh <= 0) continue;
                    Affine vbT;
                    float vb[4] = { 0, 0, mw, mh };
                    const auto nums = Numbers(attr(L"viewBox"));
                    if (nums.size() == 4)
                    {
                        if (nums[2] <= 0 || nums[3] <= 0) continue;
                        std::copy(nums.begin(), nums.end(), vb);
                        if (auto t = ParseTransform(ViewBoxTransform(nums, attr(L"preserveAspectRatio"), mw, mh))) vbT = *t;
                    }
                    auto ref = [&](std::wstring const& raw, float lo, float size, wchar_t const* low, wchar_t const* high)
                    {
                        const std::wstring v = Trim(raw);
                        if (v.empty()) return 0.0f;
                        if (v == low) return lo;
                        if (v == L"center") return lo + size / 2;
                        if (v == high) return lo + size;
                        return LengthOr(v, size, 0.0f);
                    };
                    float rx = ref(attr(L"refX"), vb[0], vb[2], L"left", L"right"), ry = ref(attr(L"refY"), vb[1], vb[3], L"top", L"bottom");
                    vbT.Apply(rx, ry);
                    const float scale = Trim(attr(L"markerUnits")) == L"userSpaceOnUse" ? 1.0f : strokeWidth;
                    if (scale <= 0) continue;
                    const std::wstring orient = Trim(attr(L"orient"));
                    float angle = 0;
                    if (orient == L"auto") angle = vertices[i].Auto();
                    else if (orient == L"auto-start-reverse") angle = vertices[i].Auto() + (k == 0 ? 180.0f : 0.0f);
                    else if (!orient.empty())
                    {
                        Scanner sc{ orient };
                        double n = 0;
                        if (sc.Number(n))
                        {
                            const std::wstring unit = Trim(std::wstring_view(orient).substr(sc.i));
                            angle = static_cast<float>(unit == L"rad" ? n * 180.0 / 3.14159265358979323846 : unit == L"grad" ? n * 0.9 : unit == L"turn" ? n * 360.0 : n);
                        }
                    }
                    const float r = angle * 3.14159265358979323846f / 180.0f;
                    const Affine viewport = Affine{ std::cos(r) * scale, std::sin(r) * scale, -std::sin(r) * scale, std::cos(r) * scale, vertices[i].x, vertices[i].y }
                        * Affine::Translate(-rx, -ry);
                    auto place = Create(c, L"g");
                    place.SetAttribute(L"transform", viewport.Matrix());
                    const std::wstring overflow = StyleProperty(marker, L"overflow");
                    if (overflow != L"visible" && overflow != L"auto")
                    {
                        if (!defs) defs = Defs(c);
                        place.SetAttribute(L"clip-path", L"url(#" + ClipPathOf(c, *defs, RectPath(0, 0, mw, mh)) + L")");
                    }
                    auto content = Create(c, L"g");
                    content.SetAttribute(L"transform", vbT.Matrix());
                    CopyInheritedPaint(marker, content);
                    CloneChildren(marker, content);
                    place.AppendChild(content);
                    holder.AppendChild(place);
                }
            }
            if (holder.HasChildNodes()) InsertAfter(shape, holder);
        }
    }

    // ---- Patterns --------------------------------------------------------------------------------

    inline constexpr size_t kMaxPatternTiles = 4096;

    // A shape filled by a pattern becomes the shape's clip around tiled copies of the pattern content.
    inline void ExpandPatterns(Context& c, dom::XmlElement const& root)
    {
        std::optional<dom::XmlElement> defs;
        for (int pass = 0; pass < 3; ++pass)
        {
            bool changed = false;
            for (auto const& shape : Elements(root, { L"path", L"rect", L"circle", L"ellipse", L"line", L"polyline", L"polygon" }))
            {
                const std::wstring fill = Inherited(shape, L"fill"), stroke = Inherited(shape, L"stroke");
                auto fillTarget = RefTarget(c, fill);
                auto strokeTarget = RefTarget(c, stroke);
                const bool fillPattern = fillTarget && LocalName(*fillTarget) == L"pattern";
                const bool strokePattern = strokeTarget && LocalName(*strokeTarget) == L"pattern";
                if (!fillPattern && !strokePattern) continue;
                changed = true;
                // A pattern stroke has no clip shape here; it takes its fallback.
                if (strokePattern) SetProperty(shape, L"stroke", PaintFallback(stroke));
                if (!fillPattern) continue;

                std::vector<dom::XmlElement> chain;
                for (std::optional<dom::XmlElement> p = fillTarget; p && LocalName(*p) == L"pattern" && chain.size() < 16;)
                {
                    if (std::find(chain.begin(), chain.end(), *p) != chain.end()) break;
                    chain.push_back(*p);
                    const std::wstring href = HrefOf(*p);
                    auto it = href.size() > 1 && href[0] == L'#' ? c.ids.find(href.substr(1)) : c.ids.end();
                    p = it == c.ids.end() ? std::nullopt : std::optional<dom::XmlElement>(it->second);
                }
                auto attr = [&](wchar_t const* name) -> std::wstring
                {
                    for (auto const& p : chain) if (const std::wstring v = Trim(std::wstring{ p.GetAttribute(name) }); !v.empty()) return v;
                    return {};
                };
                std::optional<dom::XmlElement> content;
                for (auto const& p : chain)
                {
                    bool has = false;
                    auto kids = p.ChildNodes();
                    for (uint32_t i = 0; i < kids.Size() && !has; ++i) has = kids.Item(i).NodeType() == dom::NodeType::ElementNode;
                    if (has) { content = p; break; }
                }
                const auto cmds = ShapeCommands(c, shape);
                const auto box = PathBounds(cmds);
                const bool obbUnits = attr(L"patternUnits") != L"userSpaceOnUse";
                const auto vb = Numbers(attr(L"viewBox"));
                const bool obbContent = vb.size() != 4 && attr(L"patternContentUnits") == L"objectBoundingBox";
                float x = LengthOr(attr(L"x"), obbUnits ? 1.0f : c.width, 0), y = LengthOr(attr(L"y"), obbUnits ? 1.0f : c.height, 0);
                float w = LengthOr(attr(L"width"), obbUnits ? 1.0f : c.width, 0), h = LengthOr(attr(L"height"), obbUnits ? 1.0f : c.height, 0);
                const bool needBox = obbUnits || obbContent;
                bool usable = content.has_value() && box && cmds.size() >= 2 && (vb.size() != 4 || (vb[2] > 0 && vb[3] > 0));
                // A shape inside the pattern it paints with is a cycle.
                for (auto const& p : chain) usable = usable && !IsWithin(shape, p);
                if (usable && needBox) usable = box->W() > 0 && box->H() > 0;
                if (usable && obbUnits)
                {
                    x = box->minX + x * box->W();
                    y = box->minY + y * box->H();
                    w *= box->W();
                    h *= box->H();
                }
                usable = usable && w > 0 && h > 0;
                const Affine patternT = ParseTransform(attr(L"patternTransform")).value_or(Affine{});
                const auto inverse = patternT.Inverse();
                size_t tiles = 0;
                long i0 = 0, i1 = 0, j0 = 0, j1 = 0;
                if (usable && inverse)
                {
                    const auto local = Transformed(*inverse, *box);
                    i0 = static_cast<long>(std::floor((local->minX - x) / w)); i1 = static_cast<long>(std::ceil((local->maxX - x) / w));
                    j0 = static_cast<long>(std::floor((local->minY - y) / h)); j1 = static_cast<long>(std::ceil((local->maxY - y) / h));
                    tiles = static_cast<size_t>((std::max)(0L, i1 - i0)) * static_cast<size_t>((std::max)(0L, j1 - j0));
                }
                if (!usable || !inverse || tiles == 0 || tiles > kMaxPatternTiles)
                {
                    // Unusable patterns take the fallback, as in browsers.
                    SetProperty(shape, L"fill", PaintFallback(fill));
                    continue;
                }
                Affine contentT;
                if (vb.size() == 4)
                {
                    if (auto t = ParseTransform(ViewBoxTransform(vb, attr(L"preserveAspectRatio"), w, h))) contentT = *t;
                }
                else if (obbContent)
                {
                    contentT = Affine::Scale(box->W(), box->H());
                }
                if (!defs) defs = Defs(c);
                const std::wstring geometry = ClipPathOf(c, *defs, PathData(cmds), Inherited(shape, L"fill-rule") == L"evenodd");
                const std::wstring tileClip = ClipPathOf(c, *defs, RectPath(0, 0, w, h));

                // <g transform clip-path mask opacity> <g clip=shape opacity=fill-opacity> tiles </g> shape(fill none) </g>
                auto outer = Create(c, L"g");
                for (wchar_t const* name : { L"transform", L"clip-path", L"mask", L"opacity" })
                {
                    const std::wstring v = StyleProperty(shape, name);
                    if (v.empty()) continue;
                    outer.SetAttribute(name, v);
                    SetProperty(shape, name, {});
                }
                auto clipped = Create(c, L"g");
                clipped.SetAttribute(L"clip-path", L"url(#" + geometry + L")");
                if (const std::wstring o = Inherited(shape, L"fill-opacity"); !o.empty()) clipped.SetAttribute(L"opacity", o);
                for (long j = j0; j < j1; ++j)
                {
                    for (long i = i0; i < i1; ++i)
                    {
                        auto tile = Create(c, L"g");
                        tile.SetAttribute(L"transform", (patternT * Affine::Translate(x + i * w, y + j * h)).Matrix());
                        tile.SetAttribute(L"clip-path", L"url(#" + tileClip + L")");
                        auto inner = Create(c, L"g");
                        inner.SetAttribute(L"transform", contentT.Matrix());
                        CopyInheritedPaint(*content, inner);
                        CloneChildren(*content, inner);
                        tile.AppendChild(inner);
                        clipped.AppendChild(tile);
                    }
                }
                auto parent = shape.ParentNode();
                if (!parent) continue;
                parent.InsertBefore(outer, shape);
                outer.AppendChild(clipped);
                parent.RemoveChild(shape);
                SetProperty(shape, L"fill", L"none");
                outer.AppendChild(shape);
            }
            if (!changed) break;
        }
    }

    // ---- Masks -----------------------------------------------------------------------------------

    // Each masked element is wrapped in <g id="__mason_mask_k">, followed by a hidden copy of the
    // mask's content, <g id="__mason_maskc_k"> (luminance) or "__mason_maska_k" (alpha), clipped to
    // the mask region. CssMask.h draws the two offscreen and composites them.
    inline void ExpandMasks(Context& c, dom::XmlElement const& root)
    {
        std::optional<dom::XmlElement> defs;
        int next = 0;
        std::vector<dom::XmlElement> masked;
        ForEachElement(root, [&](dom::XmlElement const& el)
        {
            const std::wstring name = LocalName(el);
            if (name == L"defs" || name == L"mask" || name == L"pattern" || name == L"marker" || name == L"clipPath" || name == L"symbol") return false;
            if (RefTarget(c, StyleProperty(el, L"mask")))
            {
                masked.push_back(el);
                return false; // masks inside a masked element aren't composited separately
            }
            return true;
        });
        for (auto const& el : masked)
        {
            auto target = RefTarget(c, StyleProperty(el, L"mask"));
            SetProperty(el, L"mask", {});
            if (!target || LocalName(*target) != L"mask") continue;
            auto const& mask = *target;
            auto attr = [&](wchar_t const* name) { return std::wstring{ mask.GetAttribute(name) }; };
            const auto box = ElementBounds(c, el);
            const bool userUnits = Trim(attr(L"maskUnits")) == L"userSpaceOnUse";
            const bool contentBox = Trim(attr(L"maskContentUnits")) == L"objectBoundingBox";
            auto value = [&](wchar_t const* name, wchar_t const* def, float basis) { const std::wstring v = attr(name); return LengthOr(v.empty() ? def : v, basis, 0.0f); };
            float x = value(L"x", L"-10%", userUnits ? c.width : 1.0f), y = value(L"y", L"-10%", userUnits ? c.height : 1.0f);
            float w = value(L"width", L"120%", userUnits ? c.width : 1.0f), h = value(L"height", L"120%", userUnits ? c.height : 1.0f);
            bool hasContent = false;
            auto kids = mask.ChildNodes();
            for (uint32_t i = 0; i < kids.Size() && !hasContent; ++i) hasContent = kids.Item(i).NodeType() == dom::NodeType::ElementNode;
            const bool needBox = !userUnits || contentBox;
            bool visible = hasContent && (!needBox || (box && box->W() > 0 && box->H() > 0));
            if (visible && !userUnits)
            {
                x = box->minX + x * box->W();
                y = box->minY + y * box->H();
                w *= box->W();
                h *= box->H();
            }
            visible = visible && w > 0 && h > 0;
            if (!visible)
            {
                SetProperty(el, L"display", L"none");
                continue;
            }
            const int k = next++;
            auto parent = el.ParentNode();
            if (!parent) continue;
            auto wrapper = Create(c, L"g");
            wrapper.SetAttribute(L"id", L"__mason_mask_" + std::to_wstring(k));
            parent.InsertBefore(wrapper, el);
            parent.RemoveChild(el);
            wrapper.AppendChild(el);

            if (!defs) defs = Defs(c);
            const bool alpha = StyleProperty(mask, L"mask-type") == L"alpha";
            auto content = Create(c, L"g");
            content.SetAttribute(L"id", std::wstring(alpha ? L"__mason_maska_" : L"__mason_maskc_") + std::to_wstring(k));
            content.SetAttribute(L"display", L"none");
            if (const std::wstring t{ el.GetAttribute(L"transform") }; !t.empty()) content.SetAttribute(L"transform", t);
            auto region = Create(c, L"g");
            region.SetAttribute(L"clip-path", L"url(#" + ClipPathOf(c, *defs, RectPath(x, y, w, h)) + L")");
            auto inner = Create(c, L"g");
            if (contentBox) inner.SetAttribute(L"transform", (Affine::Translate(box->minX, box->minY) * Affine::Scale(box->W(), box->H())).Matrix());
            CopyInheritedPaint(mask, inner);
            CloneChildren(mask, inner);
            region.AppendChild(inner);
            content.AppendChild(region);
            InsertAfter(wrapper, content);
        }
    }

    inline bool NeedsRewrite(std::string_view svg)
    {
        for (std::string_view word : { "<text", ":text", "<pattern", ":pattern", "marker", "mask" })
        {
            if (svg.find(word) != std::string_view::npos) return true;
        }
        return false;
    }

    inline void Rewrite(Context& c, dom::XmlElement const& root)
    {
        ExpandText(c, root);
        ExpandMarkers(c, root);
        ExpandPatterns(c, root);
        ExpandMasks(c, root);
        // Their contents are copied where they draw; the definitions themselves must not render.
        for (auto const& el : Elements(root, { L"marker", L"pattern", L"mask", L"textPath" }))
        {
            if (auto parent = el.ParentNode()) parent.RemoveChild(el);
        }
    }
}
