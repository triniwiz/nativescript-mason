//
//  TransformViewController.swift
//  MasonDemo
//
//  Created for transform examples
//

import UIKit
import Mason

class TransformViewController: UIViewController {

  let mason = NSCMason.shared
  let scale = NSCMason.scale

  override func viewDidLoad() {
    super.viewDidLoad()

    view.backgroundColor = .systemBackground

    // ── Root Mason view (flex column, fills safe area) ───────────────────
    let root = mason.createView()
    root.style.display = .Flex
    root.style.flexDirection = .Column
    root.style.setSizeWidth(1, 2)   // 100%
    root.style.setSizeHeight(1, 2)  // 100%

    view.addSubview(root.uiView)
    root.uiView.translatesAutoresizingMaskIntoConstraints = false
    NSLayoutConstraint.activate([
      root.uiView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
      root.uiView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      root.uiView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      root.uiView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
    ])

    // ── Title ────────────────────────────────────────────────────────────
    let title = mason.createTextView()
    title.textContent = "Transform Demo"
    title.style.fontSize = 18
    title.style.setSizeHeight(44 * scale, 1)
    title.style.setSizeWidth(1, 2) // 100% width
    title.style.align = .Center
    root.addView(title)

    // ── Preview area (flex: 1, centered) ─────────────────────────────────
    let preview = mason.createView()
    preview.style.display = .Flex
    preview.style.flexGrow = 1
    preview.style.justifyContent = .Center
    preview.style.alignItems = .Center
    preview.style.background = "#F0F0F0"

    // The box that will receive transforms
    let box = mason.createView()
    box.style.setSizeWidth(240 * scale, 1)
    box.style.setSizeHeight(140 * scale, 1)
    box.style.background =  "#2196F3"
    box.style.borderRadius = "8px"
    box.style.display = .Flex
    box.style.justifyContent = .Center
    box.style.alignItems = .Center

    let label = mason.createTextView()
    label.textContent = "Transformed"
    label.style.setColor(css: "#FFFFFF")
    label.style.fontSize = 18
    box.addView(label)

    // Default transform
    box.style.transform = "translate(24,12) rotate(8deg) scale(1.02)"

    preview.addView(box)
    root.addView(preview)

    // ── Controls area ────────────────────────────────────────────────────
    let controls = mason.createView()
    controls.style.display = .Flex
    controls.style.flexDirection = .Column
    controls.style.setPaddingWithValueType(12 * scale, 1)
    controls.style.setGapRow(8 * scale, 1)
    controls.style.setGapColumn(8 * scale, 1)

    // Presets row (horizontal scroll)
    let presetsScroll = mason.createScrollView()
    presetsScroll.style.display = .Flex
    presetsScroll.style.overflowX = .Scroll
    presetsScroll.style.overflowY = .Hidden

    let presetsRow = mason.createView()
    presetsRow.style.display = .Flex
    presetsRow.style.flexDirection = .Row
    presetsRow.style.flexWrap = .NoWrap
    presetsRow.style.setGapColumn(8 * scale, 1)

    // Transform input (declare early so closures can capture it)
    let transformInput = mason.createInput()
    transformInput.value = "translate(24,12) rotate(8deg) scale(1.02)"
    transformInput.placeholder = "enter transform() or matrix()"
    transformInput.style.flexGrow = 1
    transformInput.style.setMinSizeWidth(120 * scale, 1)

    let presets = [
      "translate(0,0)",
      "rotate(15deg)",
      "scale(1.3)",
      "matrix(1,2,3,4,20,10)",
      "matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,30,40,0,1)",
      "translate(40,-10) rotate(-12deg) scale(0.9)"
    ]

    for p in presets {
      let btn = mason.createButton()
      btn.textContent = p
      btn.addAction(UIAction { _ in
        box.style.transform = p
        transformInput.value = p
      }, for: .touchUpInside)
      presetsRow.addView(btn)
    }

    presetsScroll.addView(presetsRow)
    controls.addView(presetsScroll)

    // Input row
    let inputRow = mason.createView()
    inputRow.style.display = .Flex
    inputRow.style.flexDirection = .Row
    inputRow.style.alignItems = .Center
    inputRow.style.setGapColumn(8 * scale, 1)

    let applyBtn = mason.createButton()
    applyBtn.textContent = "Apply"
    applyBtn.addAction(UIAction { _ in
      box.style.transform = transformInput.value
    }, for: .touchUpInside)

    inputRow.addView(transformInput)
    inputRow.addView(applyBtn)
    controls.addView(inputRow)

    root.addView(controls)
  }
}
