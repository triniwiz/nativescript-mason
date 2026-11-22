//
//  InputAppearanceTests.swift
//  MasonTests
//
//  Mirrors `InputAppearanceTest.kt` for the parsing; keep the two in step.
//

import XCTest
import UIKit
@testable import Mason

final class InputAppearanceTests: XCTestCase {

  func testNoneTurnsTheNativeControlOff() {
    XCTAssertEqual(MasonInputAppearance(css: "none"), .None)
    XCTAssertEqual(MasonInputAppearance(css: " NONE "), .None)
  }

  func testEveryOtherKeywordIsAuto() {
    for value in ["auto", "menulist-button", "textfield", "button", "initial", "", "nonee"] {
      XCTAssertEqual(MasonInputAppearance(css: value), .Auto, value)
    }
  }

  func testNoneStopsDrawingTheCheckboxAndAutoRestoresIt() {
    let input = MasonInput(mason: NSCMason.shared, type: .Checkbox)
    XCTAssertTrue(input.drawsNativeControl)
    XCTAssertTrue(input.checkboxInput.drawsControl)

    input.cssAppearance = .None
    XCTAssertFalse(input.drawsNativeControl)
    XCTAssertFalse(input.checkboxInput.drawsControl)

    input.cssAppearance = .Auto
    XCTAssertTrue(input.checkboxInput.drawsControl)
  }

  func testNoneFollowsATypeChange() {
    let input = MasonInput(mason: NSCMason.shared, type: .Text)
    input.cssAppearance = .None
    // Only a checkbox or radio has a native control to drop.
    XCTAssertTrue(input.drawsNativeControl)

    input.type = .Radio
    XCTAssertFalse(input.drawsNativeControl)
    XCTAssertFalse(input.radioInput.drawsControl)
  }

  func testCheckedChangesAreReportedOnce() {
    let input = MasonInput(mason: NSCMason.shared, type: .Checkbox)
    var reported: [Bool] = []
    input.onCheckedChange = { reported.append($0) }

    input.checked = true
    input.checked = true
    input.checked = false

    XCTAssertEqual(reported, [true, false])
  }

  func testATapIsReported() {
    let input = MasonInput(mason: NSCMason.shared, type: .Checkbox)
    input.cssAppearance = .None
    var reported: [Bool] = []
    input.onCheckedChange = { reported.append($0) }

    input.checkboxInput.setCheckedFromUser(true)

    XCTAssertTrue(input.checked)
    XCTAssertEqual(reported, [true])
  }

  // MARK: text-shadow

  private struct Ink {
    var minX = Int.max, maxX = Int.min, minY = Int.max, maxY = Int.min, count = 0
    mutating func add(_ x: Int, _ y: Int) {
      minX = min(minX, x); maxX = max(maxX, x); minY = min(minY, y); maxY = max(maxY, y); count += 1
    }
  }

  /// Renders the input as it shows on screen and collects the pixels close to each colour.
  private func paint(_ input: MasonInput, _ colors: [(r: Int, g: Int, b: Int)], height: CGFloat = 80, below: CGFloat = 0) -> [Ink] {
    let window = UIWindow(frame: CGRect(x: 0, y: 0, width: 400, height: 200))
    window.isHidden = false
    input.frame = CGRect(x: 0, y: 0, width: 300, height: height)
    window.addSubview(input)
    input.setNeedsLayout()
    input.layoutIfNeeded()
    input.textInput.setNeedsLayout()
    input.textInput.layoutIfNeeded()
    RunLoop.current.run(until: Date().addingTimeInterval(0.05))

    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    let area = CGRect(x: 0, y: 0, width: input.bounds.width, height: input.bounds.height + below)
    let image = UIGraphicsImageRenderer(bounds: area, format: format).image { _ in
      // The test host has no window scene, so draw the layer tree instead of the screen.
      func display(_ layer: CALayer) { layer.displayIfNeeded(); layer.sublayers?.forEach(display) }
      display(input.layer)
      input.layer.render(in: UIGraphicsGetCurrentContext()!)
    }
    input.removeFromSuperview()

    let cg = image.cgImage!
    let width = cg.width, height = cg.height
    var pixels = [UInt8](repeating: 0, count: width * height * 4)
    pixels.withUnsafeMutableBytes { raw in
      let ctx = CGContext(data: raw.baseAddress, width: width, height: height, bitsPerComponent: 8,
                          bytesPerRow: width * 4, space: CGColorSpaceCreateDeviceRGB(),
                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
      ctx.draw(cg, in: CGRect(x: 0, y: 0, width: width, height: height))
    }
    var inks = Array(repeating: Ink(), count: colors.count)
    for y in 0..<height {
      for x in 0..<width {
        // CGContext rows run bottom-up; flip back to view space.
        let i = ((height - 1 - y) * width + x) * 4
        guard pixels[i + 3] > 200 else { continue }
        for (n, c) in colors.enumerated()
        where abs(Int(pixels[i]) - c.r) < 40 && abs(Int(pixels[i + 1]) - c.g) < 40 && abs(Int(pixels[i + 2]) - c.b) < 40 {
          inks[n].add(x, y)
        }
      }
    }
    return inks
  }

  private func shadowedInput(_ type: MasonInputType, shadow: String) -> MasonInput {
    let input = MasonInput(mason: NSCMason.shared, type: type)
    input.style.fontSize = 40
    input.style.color = 0xFF0000FF // blue text
    input.style.textShadow = shadow
    return input
  }

  private let blue = (r: 0, g: 0, b: 255)
  private let red = (r: 255, g: 0, b: 0)
  private let green = (r: 0, g: 255, b: 0)

  func testTextShadowPaintsUnderTheValue() {
    let input = shadowedInput(.Text, shadow: "0 6px 0 #ff0000")
    input.value = "WWW"
    let ink = paint(input, [blue, red])
    XCTAssertGreaterThan(ink[0].count, 0, "the text itself paints")
    XCTAssertGreaterThan(ink[1].count, 0, "the shadow paints")
    // A positive y offset puts the shadow below the glyphs, as on the web.
    XCTAssertGreaterThan(ink[1].maxY, ink[0].maxY)
  }

  func testEveryTextShadowLayerPaints() {
    // An outline made of shadows: one to the left, one to the right.
    let input = shadowedInput(.Text, shadow: "-6px 0 0 #ff0000, 6px 0 0 #00ff00")
    input.value = "WWW"
    let ink = paint(input, [blue, red, green])
    XCTAssertGreaterThan(ink[1].count, 0, "the first shadow paints")
    XCTAssertGreaterThan(ink[2].count, 0, "the second shadow paints")
    XCTAssertLessThan(ink[1].minX, ink[0].minX)
    XCTAssertGreaterThan(ink[2].maxX, ink[0].maxX)
  }

  func testTextShadowPaintsUnderThePlaceholder() {
    let input = shadowedInput(.Text, shadow: "-6px 0 0 #ff0000, 6px 0 0 #00ff00")
    input.placeholderColor = .blue
    input.placeholder = "WWW"
    let ink = paint(input, [blue, red, green])
    XCTAssertGreaterThan(ink[0].count, 0, "the placeholder itself paints")
    XCTAssertGreaterThan(ink[1].count, 0, "the first shadow paints")
    XCTAssertGreaterThan(ink[2].count, 0, "the second shadow paints")
    XCTAssertLessThan(ink[1].minX, ink[0].minX)
    XCTAssertGreaterThan(ink[2].maxX, ink[0].maxX)
  }

  func testClearingTextShadowStopsPaintingIt() {
    let input = shadowedInput(.Text, shadow: "0 6px 0 #ff0000")
    input.value = "WWW"
    XCTAssertGreaterThan(paint(input, [red])[0].count, 0)
    input.style.textShadow = ""
    XCTAssertEqual(paint(input, [red])[0].count, 0)
  }

  func testPasswordTakesTheFirstTextShadow() {
    let input = shadowedInput(.Password, shadow: "0 6px 0 #ff0000, 0 -6px 0 #00ff00")
    input.value = "secret"
    let ink = paint(input, [blue, red])
    XCTAssertGreaterThan(ink[0].count, 0, "the bullets paint")
    XCTAssertGreaterThan(ink[1].count, 0, "the first shadow paints")
  }

  func testTheFieldKeepsUIKitsLayoutDelegateWorking() throws {
    let input = shadowedInput(.Text, shadow: "0 6px 0 #ff0000")
    let delegate = try XCTUnwrap(input.textInput.textLayoutManager?.delegate as? NSObject)
    // UIKit styles links through its own delegate; the shadow delegate passes that on.
    XCTAssertTrue(delegate.responds(to: NSSelectorFromString("textLayoutManager:renderingAttributesForLink:atLocation:defaultAttributes:")))
  }

  func testTextAreaPaintsItsTextShadow() {
    let area = MasonTextArea(mason: NSCMason.shared)
    area.style.textShadow = "0 6px 0 #ff0000"
    XCTAssertEqual(area.textShadows.count, 1)
    XCTAssertEqual(area.placeholderLabel.textShadows.count, 1)
    area.style.textShadow = ""
    XCTAssertTrue(area.textShadows.isEmpty)
  }

  func testTextShadowPaintsIntoThePadding() {
    // As in browsers, a single-line field clips its text at the padding box, not the content box.
    let input = shadowedInput(.Text, shadow: "0 30px 0 #ff0000")
    input.value = "ggg"
    // The line paints its shadow past the text view (the content box)...
    let ink = paint(input, [red], height: 60, below: 40)
    XCTAssertGreaterThan(ink[0].maxY, Int(input.textInput.frame.maxY))
    // ...and the view leaves it showing. layer.render(in:) draws past masksToBounds, so this
    // is checked on the view rather than in the pixels.
    XCTAssertFalse(input.textInput.clipsToBounds)

    input.style.textShadow = ""
    XCTAssertTrue(input.textInput.clipsToBounds)
  }
}
