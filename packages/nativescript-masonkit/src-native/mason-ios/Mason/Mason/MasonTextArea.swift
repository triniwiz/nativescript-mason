//
//  MasonTextArea.swift
//  Mason
//
//  Created by Osei Fortune on 20/03/2026.
//

import UIKit

@objc(MasonTextArea)
@objcMembers
public class MasonTextArea: MasonTextInput, MasonEventTarget, MasonElement, MasonElementObjc, StyleChangeListener {

	public let node: MasonNode
	public let mason: NSCMason

	public var uiView: UIView { return self }
	public var style: MasonStyle { return node.style }

	private var _rows: Int = 2
	public var rows: Int {
		get { return _rows }
		set {
			let v = max(1, newValue)
			if v == _rows { return }
			_rows = v
			requestLayout()
		}
	}

	private var _cols: Int = 20
	public var cols: Int {
		get { return _cols }
		set {
			let v = max(1, newValue)
			if v == _cols { return }
			_cols = v
			requestLayout()
		}
	}

	public var name: String = ""

	public var maxLength: Int = -1

	public var value: String {
		get { return text ?? "" }
		set {
			if text == newValue { return }
			text = newValue
			requestLayout()
		}
	}

	// MARK: - Initializers

	public init(mason doc: NSCMason) {
		mason = doc
		node = doc.createNode()
		super.init(frame: .zero, textContainer: nil)
		commonSetup()
	}

	required public init?(coder: NSCoder) {
		mason = NSCMason.shared
		node = mason.createNode()
		super.init(coder: coder)
		commonSetup()
	}

	private func commonSetup() {
		node.view = self

		node.style.prepareMut()
		node.style.setUInt8(StyleKeys.ITEM_IS_REPLACED, 1)

		// Owner for events
		owner = self

		isOpaque = false
		backgroundColor = .clear

		// Fixed rows by default, with internal scrolling only after content overflows.
		singleLineBehavior = false
		isScrollEnabled = false
		textContainer.maximumNumberOfLines = 0
		textContainer.lineBreakMode = .byWordWrapping

		let insetPt: CGFloat = 2
		setBaseTextContainerInset(UIEdgeInsets(top: insetPt, left: insetPt, bottom: insetPt, right: insetPt))
		textContainer.lineFragmentPadding = 0

		// Default style
		configure { style in
			style.display = Display.InlineBlock
			style.boxSizing = BoxSizing.BorderBox
			let s = NSCMason.scale
			style.padding = MasonRect(.Points(2 * s), .Points(2 * s), .Points(2 * s), .Points(2 * s))
			style.fontSize = Constants.DEFAULT_FONT_SIZE
			style.background = "#FFFFFF"
			style.border = "1 solid #767676"
			style.borderRadius = "4"
			style.textAlign = TextAlign.Left
			style.syncFontMetrics()
		}

		// Initial visual state
		textColor = UIColor.colorFromARGB(style.resolvedColor)
		if style.font.uiFont == nil { style.font.loadSync(nil) }
		if let f = style.font.uiFont { font = f }

		style.setStyleChangeListener(listener: self)

		node.measureFunc = { [weak self] known, available in
			guard let self = self else { return .zero }

			let f = self.font ?? self.placeholderLabel.font ?? UIFont.systemFont(ofSize: UIFont.systemFontSize)
			let scale = CGFloat(NSCMason.scale)
			guard scale > 0 else { return .zero }

			let attrs: [NSAttributedString.Key: Any] = [.font: f]
			let charWidthPt = max(
				("0" as NSString).size(withAttributes: attrs).width,
				("W" as NSString).size(withAttributes: attrs).width
			)
			let lineHeightPt = f.lineHeight

			let inset = self.textContainerInset
			let horizontalPaddingPt = inset.left + inset.right
				+ self.textContainer.lineFragmentPadding * 2
			let verticalPaddingPt = inset.top + inset.bottom

			let intrinsicWidthPx  = (charWidthPt * CGFloat(self.cols) + horizontalPaddingPt) * scale
			let intrinsicHeightPx = (lineHeightPt * CGFloat(self._rows) + verticalPaddingPt) * scale

			let finalWidth: CGFloat
			if let kw = known?.width, kw.isFinite, kw >= 0 {
				finalWidth = kw
			} else {
				finalWidth = intrinsicWidthPx
			}

			let finalHeight: CGFloat
			if let kh = known?.height, kh.isFinite, kh >= 0 {
				finalHeight = kh
			} else {
				finalHeight = intrinsicHeightPx
			}

			return CGSize(width: finalWidth, height: finalHeight)
		}

		node.setMeasureFunction(node.measureFunc!)
	}

	private func syncInternalScrollEnabled() {
		guard !singleLineBehavior else { return }

		guard bounds.width > 0, bounds.height > 0 else {
			isScrollEnabled = false
			return
		}

		let fittingSize = sizeThatFits(CGSize(width: bounds.width, height: CGFloat.greatestFiniteMagnitude))
		let shouldScroll = fittingSize.height > bounds.height + 0.5 || fittingSize.width > bounds.width + 0.5
		if isScrollEnabled != shouldScroll {
			isScrollEnabled = shouldScroll
		}
		if !shouldScroll && contentOffset != .zero {
			contentOffset = .zero
		}
	}

	// MARK: - Drawing

	public override func draw(_ rect: CGRect) {
		guard let context = UIGraphicsGetCurrentContext() else {
			super.draw(rect)
			return
		}

		let hasBackground = style.mBackground.color != nil || !style.mBackground.layers.isEmpty
		let hasBorder = !style.mBorderRender.css.isEmpty

		style.mBorderRender.resolve(for: bounds)
		let borderWidths = style.mBorderRender.cachedWidths

		// Draw mason background behind the text content
		if hasBackground {
			let innerRect = bounds.inset(by: UIEdgeInsets(
				top: borderWidths.top,
				left: borderWidths.left,
				bottom: borderWidths.bottom,
				right: borderWidths.right
			))

			context.saveGState()
			if style.mBorderRender.hasRadii() {
				let innerRadius = style.mBorderRender.radius.insetByBorderWidths(borderWidths)
				let innerPath = style.mBorderRender.getClipPath(rect: innerRect, radius: innerRadius)
				context.addPath(innerPath.cgPath)
				context.clip()
			}
			style.mBackground.draw(on: self, in: context, rect: innerRect)
			context.restoreGState()
		}

		// Draw border on top
		// NOTE: do NOT call super.draw(rect) here. UITextView (UIScrollView) fills
		// the CGContext with backgroundColor (.clear) inside super.draw(), which
		// erases the Mason background already drawn above. Text is rendered by
		// UITextView's private _UITextContainerView subview independently of draw().
		if hasBorder {
			style.mBorderRender.draw(in: context, rect: bounds)
		}
	}

	// MARK: - Layout

	public override func layoutSubviews() {
		super.layoutSubviews()
		style.updateShadowLayer(for: bounds)
		autoComputeIfRoot()

		syncInternalScrollEnabled()
	}

	// MARK: - Text changes

	public override func textViewDidChange(_ textView: UITextView) {
		super.textViewDidChange(textView)
		node.markDirty()
		syncInternalScrollEnabled()
		setNeedsDisplay()
	}

	// MARK: - Style changes

	public func onStyleChange(_ low: UInt64, _ high: UInt64) {
		let state = StateKeys(low: low, high: high)
		let fontColor = state.contains(.color)
		let fontSize = state.contains(.fontSize)
		let fontChange = state.contains(.fontWeight) || state.contains(.fontStyle) || state.contains(.fontFamily)
		let textAlign = state.contains(.textAlign)

		if fontColor {
			textColor = UIColor.colorFromARGB(style.resolvedColor)
		}

		if fontSize || fontChange {
			if style.font.uiFont == nil { style.font.loadSync(nil) }
			if let f = style.font.uiFont { font = f }
		}

		if textAlign {
			switch style.resolvedTextAlign {
			case .Auto:
				textAlignment = .natural
			case .Left:
				textAlignment = .left
			case .Right:
				textAlignment = .right
			case .Center:
				textAlignment = .center
			case .Justify:
				textAlignment = .justified
			case .Start:
				let isLTR = UIView.userInterfaceLayoutDirection(for: .unspecified) == .leftToRight
				textAlignment = isLTR ? .left : .right
			case .End:
				let isLTR = UIView.userInterfaceLayoutDirection(for: .unspecified) == .leftToRight
				textAlignment = isLTR ? .right : .left
			}
		}

		if fontColor || fontSize || fontChange || textAlign {
			requestLayout()
			setNeedsDisplay()
		}
	}

	// MARK: - Input validation

	public override func textView(_ textView: UITextView, shouldChangeTextIn range: NSRange, replacementText text: String) -> Bool {
		let allowed = super.textView(textView, shouldChangeTextIn: range, replacementText: text)
		if !allowed { return false }

		if maxLength > -1 {
			let current = textView.text ?? ""
			guard let swRange = Range(range, in: current) else { return allowed }
			let updated = current.replacingCharacters(in: swRange, with: text)
			if updated.count > maxLength { return false }
		}

		return true
	}

}
