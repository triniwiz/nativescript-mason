import UIKit
import Mason

class BugViewController: UIViewController {
  let mason = NSCMason.shared
  let body = NSCMason.shared.createScrollView()
  let scale = Float(UIScreen.main.scale)

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .systemBackground

    body.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(body)

    NSLayoutConstraint.activate([
      body.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
      body.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      body.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      body.bottomAnchor.constraint(equalTo: view.bottomAnchor)
    ])

    // create compact red-tile grid
    let root = mason.createView()
    root.style.overflowY = .Scroll
    root.display = .Flex
    root.flexDirection = .Column
    root.style.padding = MasonRect(uniform: .Points(8 * scale))

    let container = mason.createView()
    container.display = .Flex
    container.flexDirection = .Row
    container.style.flexWrap = .Wrap
    container.style.gap = MasonSize(.Points(0), .Points(0))

    // compute grid based on screen px and add ~50dip padding to height
    let boxPoints: Float = 10.0
    let boxPx = boxPoints * scale
    let maxWidthPx = Float(UIScreen.main.bounds.width) * scale
    let maxHeightPx = Float(UIScreen.main.bounds.height) * scale + (50.0 * scale)

    let cols = max(1, Int(floor(Double(maxWidthPx / boxPx))))
    let rows = max(1, Int(floor(Double(maxHeightPx / boxPx))))

    for _ in 0..<rows {
      for _ in 0..<cols {
        let v = mason.createView()
        v.style.setSizePoints(boxPx, boxPx)
        let rand = Int.random(in: 0...0xFFFFFF)
        let hex = String(format: "#%06X", rand)
        v.style.background = hex
        v.style.border = "1px solid #000000"
        container.addView(v)
      }
    }

    root.addView(container)
    body.addView(root)
  }
}
