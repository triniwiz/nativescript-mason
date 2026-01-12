//
//  MasonRangeInput.swift
//  Mason
//
//  Created by Osei Fortune on 08/01/2026.
//

import UIKit


class MasonRangeInput: UISlider {
  internal var owner: MasonElement?
    private var isTrackingUser = false

    override init(frame: CGRect) {
        super.init(frame: frame)
        setup()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    private func setup() {
        addTarget(self, action: #selector(handleTouchDown), for: .touchDown)
        addTarget(self, action: #selector(handleValueChanged), for: .valueChanged)
        addTarget(
            self,
            action: #selector(handleTouchEnd),
            for: [.touchUpInside, .touchUpOutside, .touchCancel]
        )
    }

    override func point(inside point: CGPoint, with event: UIEvent?) -> Bool {
        bounds.insetBy(dx: -10, dy: -10).contains(point)
    }

    // MARK: - Event handlers

    @objc private func handleTouchDown() {
        isTrackingUser = true
    }

    @objc private func handleValueChanged() {
        guard let owner = owner, isTrackingUser else { return }

        let input = MasonInputEvent(
            type: "input",
            data: String(value),
            inputType: "insertReplacementText",
            options: MasonEventOptions(
                isComposing: true
            )
        ).apply{ event in
          event.bubbles = true
          event.cancelable = false
        }
      
        input.target = owner
        owner.node.mason.dispatch(input, owner.node)
    }

    @objc private func handleTouchEnd() {
        guard let owner = owner, isTrackingUser else { return }

        isTrackingUser = false

        let change = MasonInputEvent(
            type: "change",
            data: String(value),
            inputType: "insertReplacementText",
            options: MasonEventOptions(
                isComposing: true
            )
        ).apply{ event in
          event.bubbles = true
          event.cancelable = false
        }
        change.target = owner
        owner.node.mason.dispatch(change, owner.node)
    }
}

internal func thumbImage(diameter: CGFloat, color: UIColor) -> UIImage {
    let renderer = UIGraphicsImageRenderer(size: CGSize(width: diameter, height: diameter))
    return renderer.image { ctx in
        ctx.cgContext.setFillColor(color.cgColor)
        ctx.cgContext.fillEllipse(in: CGRect(x: 0, y: 0, width: diameter, height: diameter))
    }
}

internal func rangeThumbImage(
    diameter: CGFloat = 18,
    innerScale: CGFloat = 0.75,
    outerColor: UIColor = .white,
    innerColor: UIColor = .systemGreen,
    borderColor: UIColor = .systemGray,
    borderWidth: CGFloat = 1
) -> UIImage {

    let size = CGSize(width: diameter, height: diameter)
    let renderer = UIGraphicsImageRenderer(size: size)

    return renderer.image { ctx in
        let rect = CGRect(origin: .zero, size: size)

        // Outer circle (white)
        ctx.cgContext.setFillColor(outerColor.cgColor)
        ctx.cgContext.fillEllipse(in: rect)

        // Optional subtle border (web-like)
        ctx.cgContext.setStrokeColor(borderColor.cgColor)
        ctx.cgContext.setLineWidth(borderWidth)
        ctx.cgContext.strokeEllipse(in: rect.insetBy(dx: borderWidth / 2, dy: borderWidth / 2))

        // Inner circle (green)
        let innerDiameter = diameter * innerScale
        let innerRect = CGRect(
            x: (diameter - innerDiameter) / 2,
            y: (diameter - innerDiameter) / 2,
            width: innerDiameter,
            height: innerDiameter
        )

        ctx.cgContext.setFillColor(innerColor.cgColor)
        ctx.cgContext.fillEllipse(in: innerRect)
    }
}


internal func rangeTrackImage(
    height: CGFloat = 4,
    fillColor: UIColor,
    borderColor: UIColor = .systemGray,
    borderWidth: CGFloat = 1
) -> UIImage {

    // Width must be > height so caps can stretch cleanly
    let width: CGFloat = height * 3
    let size = CGSize(width: width, height: height + borderWidth * 2)

    let renderer = UIGraphicsImageRenderer(size: size)
    let image = renderer.image { ctx in
        let rect = CGRect(
            x: borderWidth,
            y: borderWidth,
            width: width - borderWidth * 2,
            height: height
        )

        let radius = rect.height / 2

        // Border
        let borderPath = UIBezierPath(
            roundedRect: rect.insetBy(dx: -borderWidth, dy: -borderWidth),
            cornerRadius: radius + borderWidth
        )
        borderColor.setStroke()
        borderPath.lineWidth = borderWidth
        borderPath.stroke()

        // Fill
        let fillPath = UIBezierPath(
            roundedRect: rect,
            cornerRadius: radius
        )
        fillColor.setFill()
        fillPath.fill()
    }

    return image.resizableImage(
        withCapInsets: UIEdgeInsets(
            top: size.height / 2,
            left: size.width / 2,
            bottom: size.height / 2,
            right: size.width / 2
        )
    )
}
