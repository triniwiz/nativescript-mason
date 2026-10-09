#pragma once
#include <algorithm>
#include <string>
#include <string_view>
#include <unordered_map>
#include <vector>
#include <windows.h>
#include "HyphenEnUs.h"

namespace mason_hyphen
{
    inline constexpr wchar_t kSoftHyphen = 0x00AD;
    inline constexpr wchar_t kWordJoiner = 0x2060;

    struct Patterns
    {
        std::unordered_map<std::string, std::vector<uint8_t>> values;
        std::unordered_map<std::string, std::vector<size_t>> exceptions;
        size_t longest{ 0 };
        size_t leftMin{ 2 };
        size_t rightMin{ 3 };
    };

    inline Patterns Load(std::string_view patterns, std::string_view exceptions)
    {
        Patterns out;
        size_t pos = 0;
        while (pos < patterns.size())
        {
            size_t end = patterns.find(' ', pos);
            if (end == std::string_view::npos) end = patterns.size();
            const std::string_view token = patterns.substr(pos, end - pos);
            pos = end + 1;
            if (token.empty()) continue;
            std::string letters;
            std::vector<uint8_t> values{ 0 };
            for (char ch : token)
            {
                if (ch >= '0' && ch <= '9') values.back() = static_cast<uint8_t>(ch - '0');
                else
                {
                    letters += ch;
                    values.push_back(0);
                }
            }
            out.longest = (std::max)(out.longest, letters.size());
            out.values.emplace(std::move(letters), std::move(values));
        }
        pos = 0;
        while (pos < exceptions.size())
        {
            size_t end = exceptions.find(' ', pos);
            if (end == std::string_view::npos) end = exceptions.size();
            const std::string_view token = exceptions.substr(pos, end - pos);
            pos = end + 1;
            std::string word;
            std::vector<size_t> breaks;
            for (char ch : token)
            {
                if (ch == '-') breaks.push_back(word.size());
                else word += ch;
            }
            if (!word.empty()) out.exceptions.emplace(std::move(word), std::move(breaks));
        }
        return out;
    }

    inline Patterns const& English()
    {
        static const Patterns patterns = Load(kEnUsPatterns, kEnUsExceptions);
        return patterns;
    }

    inline bool EnglishLocale()
    {
        static const bool english = []
        {
            wchar_t name[LOCALE_NAME_MAX_LENGTH]{};
            if (GetUserDefaultLocaleName(name, LOCALE_NAME_MAX_LENGTH) == 0) return false;
            return (name[0] == L'e' || name[0] == L'E') && (name[1] == L'n' || name[1] == L'N') && (name[2] == 0 || name[2] == L'-');
        }();
        return english;
    }

    inline std::vector<size_t> Breaks(Patterns const& p, std::string_view word)
    {
        std::vector<size_t> out;
        if (word.size() < p.leftMin + p.rightMin) return out;
        if (auto it = p.exceptions.find(std::string(word)); it != p.exceptions.end()) return it->second;
        std::string dotted;
        dotted.reserve(word.size() + 2);
        dotted += '.';
        dotted += word;
        dotted += '.';
        std::vector<uint8_t> points(dotted.size() + 1, 0);
        std::string key;
        for (size_t i = 0; i < dotted.size(); ++i)
        {
            key.clear();
            for (size_t j = i; j < dotted.size() && j - i < p.longest; ++j)
            {
                key += dotted[j];
                auto it = p.values.find(key);
                if (it == p.values.end()) continue;
                auto const& values = it->second;
                for (size_t k = 0; k < values.size(); ++k) points[i + k] = (std::max)(points[i + k], values[k]);
            }
        }
        for (size_t before = p.leftMin; before + p.rightMin <= word.size(); ++before)
        {
            if (points[before + 1] % 2 == 1) out.push_back(before);
        }
        return out;
    }

    inline bool IsAsciiLetter(wchar_t ch)
    {
        return (ch >= L'a' && ch <= L'z') || (ch >= L'A' && ch <= L'Z');
    }

    inline bool IsWordChar(wchar_t ch)
    {
        return IsAsciiLetter(ch) || IsCharAlphaNumericW(ch) || ch == kSoftHyphen;
    }

    inline std::wstring Hyphenated(std::wstring_view text)
    {
        auto const& p = English();
        std::wstring out;
        out.reserve(text.size() + text.size() / 4);
        size_t pos = 0;
        while (pos < text.size())
        {
            if (!IsWordChar(text[pos]))
            {
                out += text[pos++];
                continue;
            }
            size_t end = pos;
            bool plain = true;
            while (end < text.size() && IsWordChar(text[end]))
            {
                if (!IsAsciiLetter(text[end])) plain = false;
                ++end;
            }
            const std::wstring_view word = text.substr(pos, end - pos);
            pos = end;
            if (!plain || word.size() < p.leftMin + p.rightMin)
            {
                out += word;
                continue;
            }
            std::string lower(word.size(), '\0');
            for (size_t i = 0; i < word.size(); ++i) lower[i] = static_cast<char>(word[i] | 0x20);
            const auto breaks = Breaks(p, lower);
            size_t next = 0;
            for (size_t i = 0; i < word.size(); ++i)
            {
                if (next < breaks.size() && breaks[next] == i)
                {
                    out += kSoftHyphen;
                    ++next;
                }
                out += word[i];
            }
        }
        return out;
    }

    inline std::wstring Apply(std::wstring_view text, uint8_t hyphens)
    {
        if (hyphens == 2 && EnglishLocale()) return Hyphenated(text);
        std::wstring out(text);
        if (hyphens == 1) std::replace(out.begin(), out.end(), kSoftHyphen, kWordJoiner);
        return out;
    }

    inline bool Needed(std::wstring_view text, uint8_t hyphens)
    {
        return hyphens == 2 || (hyphens == 1 && text.find(kSoftHyphen) != std::wstring_view::npos);
    }
}
