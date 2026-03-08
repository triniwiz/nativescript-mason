import XCTest
@testable import Mason

final class FontDescriptorsTests: XCTestCase {

  func test_copy_independence() {
    let shared = NSCFontFaceSet.instance.getOrNil("sans-serif")!
    // create a font face which will reference the shared descriptors
    let face = NSCFontFace(family: "sans-serif")
    XCTAssertTrue(face.fontDescriptors.isReadonly)

    let before = shared.fontDescriptors.featureSettings

    // mutate the new face → should trigger prepareMut() and copy descriptors
    face.setFontWeight(value: "700")

    // shared descriptors must remain unchanged
    XCTAssertEqual(shared.fontDescriptors.featureSettings, before)
    XCTAssertNotEqual(face.fontDescriptors.weight.rawValue, shared.fontDescriptors.weight.rawValue)
  }

  func test_descriptor_copy_performance() {
    let shared = NSCFontDescriptors(family: "sans-serif")
    measure {
      for _ in 0..<10000 {
        _ = shared.mutableCopy() as! NSCFontDescriptors
      }
    }
  }

  func test_fontFace_creation_performance() {
    measure {
      for _ in 0..<1000 {
        _ = NSCFontFace(family: "sans-serif")
      }
    }
  }
}
