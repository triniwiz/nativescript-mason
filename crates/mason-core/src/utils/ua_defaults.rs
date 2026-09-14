//! User-agent default (font-size, margin) table for block text elements
//! (`<p>`, `<h1>`-`<h6>`, `<blockquote>`, `<pre>`). Single source of truth for
//! values that used to be hardcoded independently in MasonText.swift (iOS)
//! and TextView.kt (Android). Values are unscaled CSS px; callers apply their
//! own device-scale/density multiplier.

/// `font_size` of `0.0` means "not overridden by this tag - inherit the
/// current default font size".
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct UaDefault {
    pub font_size: f32,
    pub margin_top: f32,
    pub margin_bottom: f32,
    pub margin_left: f32,
    pub margin_right: f32,
}

const fn ua(
    font_size: f32,
    margin_top: f32,
    margin_bottom: f32,
    margin_left: f32,
    margin_right: f32,
) -> UaDefault {
    UaDefault {
        font_size,
        margin_top,
        margin_bottom,
        margin_left,
        margin_right,
    }
}

/// Looks up the UA default (font-size, margin) for a lowercase tag name
/// ("p", "h1".."h6", "blockquote", "pre"). Returns `None` for tags with no
/// UA default in this table.
pub fn ua_default_for_tag(tag: &str) -> Option<UaDefault> {
    match tag {
        "p" => Some(ua(0.0, 16.0, 16.0, 0.0, 0.0)), // 1em
        "h1" => Some(ua(32.0, 21.44, 21.44, 0.0, 0.0)), // 2em / 0.67em
        "h2" => Some(ua(24.0, 19.92, 19.92, 0.0, 0.0)), // 1.5em / 0.83em
        "h3" => Some(ua(19.0, 18.72, 18.72, 0.0, 0.0)), // 1.17em ~= 18.72
        "h4" => Some(ua(16.0, 21.28, 21.28, 0.0, 0.0)), // 1em / 1.33em
        "h5" => Some(ua(13.0, 22.18, 22.18, 0.0, 0.0)), // 0.83em ~= 13.28 / 1.67em
        "h6" => Some(ua(11.0, 24.98, 24.98, 0.0, 0.0)), // 0.67em ~= 10.72 / 2.33em
        "blockquote" => Some(ua(0.0, 16.0, 16.0, 40.0, 40.0)), // 1em 40px
        "pre" => Some(ua(0.0, 16.0, 16.0, 0.0, 0.0)), // 1em
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn p() {
        assert_eq!(
            ua_default_for_tag("p"),
            Some(UaDefault {
                font_size: 0.0,
                margin_top: 16.0,
                margin_bottom: 16.0,
                margin_left: 0.0,
                margin_right: 0.0,
            })
        );
    }

    #[test]
    fn h1() {
        assert_eq!(
            ua_default_for_tag("h1"),
            Some(UaDefault {
                font_size: 32.0,
                margin_top: 21.44,
                margin_bottom: 21.44,
                margin_left: 0.0,
                margin_right: 0.0,
            })
        );
    }

    #[test]
    fn h2() {
        assert_eq!(
            ua_default_for_tag("h2"),
            Some(UaDefault {
                font_size: 24.0,
                margin_top: 19.92,
                margin_bottom: 19.92,
                margin_left: 0.0,
                margin_right: 0.0,
            })
        );
    }

    #[test]
    fn h3() {
        assert_eq!(
            ua_default_for_tag("h3"),
            Some(UaDefault {
                font_size: 19.0,
                margin_top: 18.72,
                margin_bottom: 18.72,
                margin_left: 0.0,
                margin_right: 0.0,
            })
        );
    }

    #[test]
    fn h4() {
        assert_eq!(
            ua_default_for_tag("h4"),
            Some(UaDefault {
                font_size: 16.0,
                margin_top: 21.28,
                margin_bottom: 21.28,
                margin_left: 0.0,
                margin_right: 0.0,
            })
        );
    }

    #[test]
    fn h5() {
        assert_eq!(
            ua_default_for_tag("h5"),
            Some(UaDefault {
                font_size: 13.0,
                margin_top: 22.18,
                margin_bottom: 22.18,
                margin_left: 0.0,
                margin_right: 0.0,
            })
        );
    }

    #[test]
    fn h6() {
        assert_eq!(
            ua_default_for_tag("h6"),
            Some(UaDefault {
                font_size: 11.0,
                margin_top: 24.98,
                margin_bottom: 24.98,
                margin_left: 0.0,
                margin_right: 0.0,
            })
        );
    }

    #[test]
    fn blockquote() {
        assert_eq!(
            ua_default_for_tag("blockquote"),
            Some(UaDefault {
                font_size: 0.0,
                margin_top: 16.0,
                margin_bottom: 16.0,
                margin_left: 40.0,
                margin_right: 40.0,
            })
        );
    }

    #[test]
    fn pre() {
        assert_eq!(
            ua_default_for_tag("pre"),
            Some(UaDefault {
                font_size: 0.0,
                margin_top: 16.0,
                margin_bottom: 16.0,
                margin_left: 0.0,
                margin_right: 0.0,
            })
        );
    }

    #[test]
    fn unknown_tag() {
        assert_eq!(ua_default_for_tag("span"), None);
    }
}
