#pragma once
// SVG sources prepared for Direct2D the way CSS images are (Css.cpp), for <img>.
#include <string>
#include "CssMask.h"

namespace mason_css
{
    // A `data:image/svg+xml` URL or a local .svg file; an empty Image for anything else.
    mason_cssmask::Image LoadSvgImage(std::wstring const& source);
    // SVG text, as fetched.
    mason_cssmask::Image PrepareSvgImage(std::string svg);
}
