import XCTest
@testable import Mason

final class MasonTextNodeTests: XCTestCase {

  func test_text_node_processing_uppercase_and_whitespace() {
    let mason = NSCMason.shared
    let textView = MasonText(mason: mason)
    textView.textTransform = .Uppercase
    textView.whiteSpace = .Normal

    let tn = MasonTextNode(mason: mason, data: "hello   world\nnext")
    // attach to the container so processing uses the container style
    tn.container = textView

    let attributed = tn.attributed()
    let s = attributed.string
    // Uppercase + collapse whitespace + preserve newline => newline preserved, spaces collapsed to single spaces
    XCTAssertTrue(s.contains("HELLO WORLD"))
  }

  func test_text_node_mutation_methods() {
    let mason = NSCMason.shared
    let tn = MasonTextNode(mason: mason, data: "abc")

    tn.appendData("def")
    XCTAssertEqual(tn.data, "abcdef")

    tn.insertData("X", at: 3)
    XCTAssertEqual(tn.data, "abcXdef")

    tn.replaceData(offset: 2, count: 3, with: "YY")
    XCTAssertEqual(tn.data, "abYYef")

    tn.deleteData(offset: 1, count: 2)
    XCTAssertEqual(tn.data, "aYef")
  }

}
