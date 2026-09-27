#pragma once

// A gradient's `in <colorspace> [<hue-method> hue]`. XAML brushes only interpolate in sRGB,
// so ExpandInterpolatedStops resamples each segment in the requested space.

#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <cwctype>
#include <optional>
#include <string>
#include <string_view>
#include <vector>

namespace mason_color
{
    enum class Space { Srgb, SrgbLinear, Oklab, Oklch, Lab, Lch, XyzD65, XyzD50, Hsl, Hwb };
    enum class HueMethod { Shorter, Longer, Increasing, Decreasing };

    struct Interpolation
    {
        Space space = Space::Srgb;
        HueMethod hue = HueMethod::Shorter;
    };

    struct Stop
    {
        float offset;
        uint32_t argb;
    };

    using Vec3 = std::array<double, 3>;
    using Mat3 = std::array<Vec3, 3>;

    namespace detail
    {
        // Keeps each channel within ~1/255 of the exact curve.
        constexpr int kSamplesPerSegment = 8;
        constexpr double kPi = 3.14159265358979323846;

        // Matrices from CSS Color 4 §18.
        constexpr Mat3 kLinearSrgbToXyz{ {
            { 0.41239079926595934, 0.357584339383878, 0.1804807884018343 },
            { 0.21263900587151027, 0.715168678767756, 0.07219231536073371 },
            { 0.01933081871559182, 0.11919477979462598, 0.9505321522496607 },
        } };
        constexpr Mat3 kXyzToLinearSrgb{ {
            { 3.2409699419045226, -1.537383177570094, -0.4986107602930034 },
            { -0.9692436362808796, 1.8759675015077202, 0.04155505740717559 },
            { 0.05563007969699366, -0.20397695888897652, 1.0569715142428786 },
        } };
        constexpr Mat3 kD65ToD50{ {
            { 1.0479298208405488, 0.022946793341019088, -0.05019222954313557 },
            { 0.029627815688159344, 0.990434484573249, -0.01707382502938514 },
            { -0.009243058152591178, 0.015055144896577895, 0.7518742899580008 },
        } };
        constexpr Mat3 kD50ToD65{ {
            { 0.9554734527042182, -0.023098536874261423, 0.0632593086610217 },
            { -0.028369706963208136, 1.0099954580106629, 0.021041398966943008 },
            { 0.012314001688319899, -0.020507696433477912, 1.3303659366080753 },
        } };
        constexpr Vec3 kD50White{ 0.3457 / 0.3585, 1.0, (1.0 - 0.3457 - 0.3585) / 0.3585 };
        constexpr double kLabE = 216.0 / 24389.0;
        constexpr double kLabK = 24389.0 / 27.0;

        inline Vec3 Mul(Mat3 const& m, Vec3 const& v)
        {
            return { m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
                     m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
                     m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2] };
        }

        inline double ToLinear(double c)
        {
            const double a = std::abs(c);
            return a <= 0.04045 ? c / 12.92 : std::copysign(std::pow((a + 0.055) / 1.055, 2.4), c);
        }

        inline double FromLinear(double c)
        {
            const double a = std::abs(c);
            return a <= 0.0031308 ? c * 12.92 : std::copysign(1.055 * std::pow(a, 1.0 / 2.4) - 0.055, c);
        }

        inline Vec3 Linear(Vec3 const& v) { return { ToLinear(v[0]), ToLinear(v[1]), ToLinear(v[2]) }; }
        inline Vec3 Gamma(Vec3 const& v) { return { FromLinear(v[0]), FromLinear(v[1]), FromLinear(v[2]) }; }

        inline Vec3 Oklab(Vec3 const& lin)
        {
            const double l = std::cbrt(0.4122214708 * lin[0] + 0.5363325363 * lin[1] + 0.0514459929 * lin[2]);
            const double m = std::cbrt(0.2119034982 * lin[0] + 0.6806995451 * lin[1] + 0.1073969566 * lin[2]);
            const double s = std::cbrt(0.0883024619 * lin[0] + 0.2817188376 * lin[1] + 0.6299787005 * lin[2]);
            return { 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
                     1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
                     0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s };
        }

        inline Vec3 OklabToLinear(Vec3 const& lab)
        {
            const double l = std::pow(lab[0] + 0.3963377774 * lab[1] + 0.2158037573 * lab[2], 3);
            const double m = std::pow(lab[0] - 0.1055613458 * lab[1] - 0.0638541728 * lab[2], 3);
            const double s = std::pow(lab[0] - 0.0894841775 * lab[1] - 1.2914855480 * lab[2], 3);
            return { 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
                     -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
                     -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s };
        }

        inline Vec3 Lab(Vec3 const& xyzD50)
        {
            Vec3 f{};
            for (int i = 0; i < 3; ++i)
            {
                const double n = xyzD50[i] / kD50White[i];
                f[i] = n > kLabE ? std::cbrt(n) : (kLabK * n + 16) / 116;
            }
            return { 116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2]) };
        }

        inline Vec3 LabToXyz(Vec3 const& lab)
        {
            const double fy = (lab[0] + 16) / 116;
            const double fx = lab[1] / 500 + fy;
            const double fz = fy - lab[2] / 200;
            const double x = std::pow(fx, 3) > kLabE ? std::pow(fx, 3) : (116 * fx - 16) / kLabK;
            const double y = lab[0] > kLabK * kLabE ? std::pow(fy, 3) : lab[0] / kLabK;
            const double z = std::pow(fz, 3) > kLabE ? std::pow(fz, 3) : (116 * fz - 16) / kLabK;
            return { x * kD50White[0], y * kD50White[1], z * kD50White[2] };
        }

        inline Vec3 Polar(Vec3 const& v)
        {
            double h = std::atan2(v[2], v[1]) * 180 / kPi;
            if (h < 0) h += 360;
            return { v[0], std::hypot(v[1], v[2]), h };
        }

        inline Vec3 Rectangular(Vec3 const& v)
        {
            const double rad = v[2] * kPi / 180;
            return { v[0], v[1] * std::cos(rad), v[1] * std::sin(rad) };
        }

        inline Vec3 Hsl(Vec3 const& rgb)
        {
            const double r = rgb[0], g = rgb[1], b = rgb[2];
            const double mx = (std::max)({ r, g, b });
            const double mn = (std::min)({ r, g, b });
            const double l = (mx + mn) / 2;
            const double d = mx - mn;
            double h = 0, s = 0;
            if (d != 0)
            {
                s = (l == 0 || l == 1) ? 0 : (mx - l) / (std::min)(l, 1 - l);
                if (mx == r) h = (g - b) / d + (g < b ? 6 : 0);
                else if (mx == g) h = (b - r) / d + 2;
                else h = (r - g) / d + 4;
                h *= 60;
            }
            return { h, s * 100, l * 100 };
        }

        inline Vec3 HslToRgb(Vec3 const& v)
        {
            const double h = v[0], s = v[1] / 100, l = v[2] / 100;
            auto f = [&](double n) {
                const double k = std::fmod(n + h / 30, 12);
                return l - s * (std::min)(l, 1 - l) * (std::max)(-1.0, (std::min)({ k - 3, 9 - k, 1.0 }));
            };
            return { f(0), f(8), f(4) };
        }

        inline Vec3 Hwb(Vec3 const& rgb)
        {
            return { Hsl(rgb)[0], (std::min)({ rgb[0], rgb[1], rgb[2] }) * 100, (1 - (std::max)({ rgb[0], rgb[1], rgb[2] })) * 100 };
        }

        inline Vec3 HwbToRgb(Vec3 const& v)
        {
            const double w = v[1] / 100, b = v[2] / 100;
            if (w + b >= 1)
            {
                const double gray = w / (w + b);
                return { gray, gray, gray };
            }
            Vec3 rgb = HslToRgb({ v[0], 100, 50 });
            for (auto& c : rgb) c = c * (1 - w - b) + w;
            return rgb;
        }

        inline Vec3 FromSrgb(Space space, Vec3 const& rgb)
        {
            switch (space)
            {
            case Space::SrgbLinear: return Linear(rgb);
            case Space::Oklab: return Oklab(Linear(rgb));
            case Space::Oklch: return Polar(Oklab(Linear(rgb)));
            case Space::Lab: return Lab(Mul(kD65ToD50, Mul(kLinearSrgbToXyz, Linear(rgb))));
            case Space::Lch: return Polar(Lab(Mul(kD65ToD50, Mul(kLinearSrgbToXyz, Linear(rgb)))));
            case Space::XyzD65: return Mul(kLinearSrgbToXyz, Linear(rgb));
            case Space::XyzD50: return Mul(kD65ToD50, Mul(kLinearSrgbToXyz, Linear(rgb)));
            case Space::Hsl: return Hsl(rgb);
            case Space::Hwb: return Hwb(rgb);
            default: return rgb;
            }
        }

        inline Vec3 ToSrgb(Space space, Vec3 const& v)
        {
            switch (space)
            {
            case Space::SrgbLinear: return Gamma(v);
            case Space::Oklab: return Gamma(OklabToLinear(v));
            case Space::Oklch: return Gamma(OklabToLinear(Rectangular(v)));
            case Space::Lab: return Gamma(Mul(kXyzToLinearSrgb, Mul(kD50ToD65, LabToXyz(v))));
            case Space::Lch: return Gamma(Mul(kXyzToLinearSrgb, Mul(kD50ToD65, LabToXyz(Rectangular(v)))));
            case Space::XyzD65: return Gamma(Mul(kXyzToLinearSrgb, v));
            case Space::XyzD50: return Gamma(Mul(kXyzToLinearSrgb, Mul(kD50ToD65, v)));
            case Space::Hsl: return HslToRgb(v);
            case Space::Hwb: return HwbToRgb(v);
            default: return v;
            }
        }

        inline int HueIndex(Space space)
        {
            switch (space)
            {
            case Space::Oklch:
            case Space::Lch: return 2;
            case Space::Hsl:
            case Space::Hwb: return 0;
            default: return -1;
            }
        }

        inline bool IsAchromatic(Space space, Vec3 const& v)
        {
            // HWB's hue is powerless when whiteness + blackness reach 100%.
            return space == Space::Hwb ? v[1] + v[2] >= 100 - 1e-4 : std::abs(v[1]) < 1e-4;
        }

        inline std::wstring Lower(std::wstring_view s)
        {
            std::wstring out(s);
            for (auto& c : out) c = static_cast<wchar_t>(std::towlower(c));
            return out;
        }
    }

    // The text after `in`, e.g. "oklch longer hue". Unknown spaces fall back to sRGB.
    inline std::optional<Interpolation> ParseInterpolation(std::wstring_view text)
    {
        std::vector<std::wstring> tokens;
        size_t pos = 0;
        while (pos < text.size())
        {
            while (pos < text.size() && std::iswspace(text[pos])) ++pos;
            size_t end = pos;
            while (end < text.size() && !std::iswspace(text[end])) ++end;
            if (end > pos) tokens.push_back(detail::Lower(text.substr(pos, end - pos)));
            pos = end;
        }
        if (tokens.empty()) return std::nullopt;

        Interpolation result{};
        const std::wstring& name = tokens[0];
        if (name == L"srgb-linear") result.space = Space::SrgbLinear;
        else if (name == L"oklab") result.space = Space::Oklab;
        else if (name == L"oklch") result.space = Space::Oklch;
        else if (name == L"lab") result.space = Space::Lab;
        else if (name == L"lch") result.space = Space::Lch;
        else if (name == L"xyz" || name == L"xyz-d65") result.space = Space::XyzD65;
        else if (name == L"xyz-d50") result.space = Space::XyzD50;
        else if (name == L"hsl") result.space = Space::Hsl;
        else if (name == L"hwb") result.space = Space::Hwb;

        if (tokens.size() >= 3 && tokens[2] == L"hue")
        {
            if (tokens[1] == L"longer") result.hue = HueMethod::Longer;
            else if (tokens[1] == L"increasing") result.hue = HueMethod::Increasing;
            else if (tokens[1] == L"decreasing") result.hue = HueMethod::Decreasing;
        }
        return result;
    }

    // Premultiplied, per CSS Color 4 §12.
    inline uint32_t InterpolateArgb(uint32_t from, uint32_t to, double t, Interpolation const& method)
    {
        using namespace detail;
        auto channels = [](uint32_t c) -> Vec3 {
            return { ((c >> 16) & 0xFF) / 255.0, ((c >> 8) & 0xFF) / 255.0, (c & 0xFF) / 255.0 };
        };
        const double fromAlpha = ((from >> 24) & 0xFF) / 255.0;
        const double toAlpha = ((to >> 24) & 0xFF) / 255.0;
        Vec3 a = FromSrgb(method.space, channels(from));
        Vec3 b = FromSrgb(method.space, channels(to));

        const int hue = HueIndex(method.space);
        if (hue >= 0)
        {
            // A powerless hue (grey or transparent) takes the other endpoint's.
            const bool aGray = IsAchromatic(method.space, a) || fromAlpha == 0;
            const bool bGray = IsAchromatic(method.space, b) || toAlpha == 0;
            if (aGray && !bGray) a[hue] = b[hue];
            if (bGray && !aGray) b[hue] = a[hue];
            const double d = b[hue] - a[hue];
            switch (method.hue)
            {
            case HueMethod::Shorter: if (d > 180) a[hue] += 360; else if (d < -180) b[hue] += 360; break;
            case HueMethod::Longer: if (d > 0 && d < 180) a[hue] += 360; else if (d > -180 && d <= 0) b[hue] += 360; break;
            case HueMethod::Increasing: if (d < 0) b[hue] += 360; break;
            case HueMethod::Decreasing: if (d > 0) a[hue] += 360; break;
            }
        }

        for (int i = 0; i < 3; ++i)
        {
            if (i == hue) continue;
            a[i] *= fromAlpha;
            b[i] *= toAlpha;
        }
        const double alpha = fromAlpha + (toAlpha - fromAlpha) * t;
        Vec3 mixed{};
        for (int i = 0; i < 3; ++i)
        {
            mixed[i] = a[i] + (b[i] - a[i]) * t;
            if (i != hue && alpha > 0) mixed[i] /= alpha;
        }
        if (hue >= 0) mixed[hue] = std::fmod(std::fmod(mixed[hue], 360) + 360, 360);

        const Vec3 rgb = ToSrgb(method.space, mixed);
        auto ch = [](double v) { return static_cast<uint32_t>(std::lround(std::clamp(v, 0.0, 1.0) * 255.0)); };
        return (ch(alpha) << 24) | (ch(rgb[0]) << 16) | (ch(rgb[1]) << 8) | ch(rgb[2]);
    }

    inline std::vector<Stop> ExpandInterpolatedStops(std::vector<Stop> const& stops, Interpolation const& method)
    {
        if (method.space == Space::Srgb || stops.size() < 2) return stops;
        std::vector<Stop> out;
        out.reserve(stops.size() * detail::kSamplesPerSegment);
        for (size_t i = 0; i < stops.size(); ++i)
        {
            out.push_back(stops[i]);
            if (i + 1 == stops.size()) break;
            const float p0 = stops[i].offset;
            const float p1 = stops[i + 1].offset;
            if (p1 - p0 <= 1e-6f) continue; // hard stop
            for (int k = 1; k < detail::kSamplesPerSegment; ++k)
            {
                const double t = static_cast<double>(k) / detail::kSamplesPerSegment;
                out.push_back({ static_cast<float>(p0 + (p1 - p0) * t), InterpolateArgb(stops[i].argb, stops[i + 1].argb, t, method) });
            }
        }
        return out;
    }
}
