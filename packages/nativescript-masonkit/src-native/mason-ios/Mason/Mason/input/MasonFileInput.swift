//
//  MasonFileInput.swift
//  Mason
//
//  Created by Osei Fortune on 08/01/2026.
//

import UIKit
import UniformTypeIdentifiers

private func utTypes(from accept: String?) -> [UTType] {
  guard let accept = accept, !accept.isEmpty else {
    return [.data]
  }
  
  let tokens = accept
    .split(separator: ",")
    .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
  
  var types: [UTType] = []
  
  for token in tokens {
    if token.hasSuffix("/*") {
      let prefix = token.dropLast(2)
      switch prefix {
      case "image": types.append(.image)
      case "video": types.append(.movie)
      case "audio": types.append(.audio)
      case "text":  types.append(.text)
      default: break
      }
    } else if token.hasPrefix(".") {
      let ext = String(token.dropFirst())
      if let t = UTType(filenameExtension: ext) {
        types.append(t)
      }
    } else if let t = UTType(token) {
      types.append(t)
    }
  }
  
  return types.isEmpty ? [.data] : types
}

class MasonFileInput: UIView, UIDocumentPickerDelegate, UIImagePickerControllerDelegate  {
  internal var owner: MasonInput?
  private let fileBtn = UIButton(type: .system)
  private let fileLabel = UILabel()
  
  var onPickFile: (() -> Void)?
  var onContentSizeChanged: (() -> Void)?
  
  var labelText: String {
    get { fileLabel.text ?? "" }
    set {
      fileLabel.text = newValue
      invalidateIntrinsicContentSize()
      setNeedsLayout()
      layoutIfNeeded()
      onContentSizeChanged?()
    }
  }
  
  override init(frame: CGRect) {
    super.init(frame: frame)
    setup()
  }
  
  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setup()
  }
  
  private func setup() {
    addSubview(fileBtn)
    addSubview(fileLabel)
    
    fileBtn.setTitle("Browse...", for: .normal)
    fileBtn.layer.borderWidth = 1
    fileBtn.layer.borderColor = UIColor.systemGray4.cgColor
    fileBtn.layer.cornerRadius = 4
    fileBtn.contentEdgeInsets = UIEdgeInsets(top: 2, left: 8, bottom: 2, right: 8)
    
    fileLabel.text = "No file selected"
    fileLabel.lineBreakMode = .byTruncatingTail
    
    fileBtn.addTarget(self, action: #selector(didTapButton), for: .touchUpInside)
  }
  
  @objc private func didTapButton() {
    guard let owner = owner else {
      pickFile()
      return
    }
    
    let click = MasonEvent(
      type: "click",
      options: MasonEventOptions(
        type: "click",
        bubbles: true,
        cancelable: true,
        isComposing: true
      )
    )
    click.target = owner
    owner.node.mason.dispatch(click, owner.node)
    
    if click.defaultPrevented {
      return
    }
    
    guard let pick = onPickFile else {
      pickFile()
      return
    }
    pick()
  }
  
  func configure(attributes: [NSAttributedString.Key: Any]) {
    fileBtn.setAttributedTitle(NSAttributedString(string: "Browse...", attributes: attributes), for: .normal)
    fileLabel.attributedText = NSAttributedString(string: fileLabel.text ?? "No file selected", attributes: attributes)
  }
  
  override func layoutSubviews() {
    super.layoutSubviews()
    
    let spacing: CGFloat = 8
    let btnSize = fileBtn.intrinsicContentSize
    let labelHeight = fileLabel.intrinsicContentSize.height
    
    let btnFrame = CGRect(
      x: 0,
      y: (bounds.height - btnSize.height) / 2,
      width: btnSize.width,
      height: btnSize.height
    )
    
    let labelFrame = CGRect(
      x: btnFrame.maxX + spacing,
      y: (bounds.height - labelHeight) / 2,
      width: bounds.width - btnFrame.maxX - spacing,
      height: labelHeight
    )
    
    fileBtn.frame = btnFrame
    fileLabel.frame = labelFrame
  }
  
  override var intrinsicContentSize: CGSize {
    let spacing: CGFloat = 8
    let btnSize = fileBtn.intrinsicContentSize
    let labelSize = fileLabel.intrinsicContentSize
    
    return CGSize(
      width: btnSize.width + spacing + labelSize.width,
      height: max(btnSize.height, labelSize.height)
    )
  }
  
  
  
  public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    
  }
  
  public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    guard !urls.isEmpty else { return }
    
    let payload = urls.map { url in
      url.lastPathComponent
    }
    
    if owner?.multiple ?? false {
      labelText = urls.count == 1
      ? urls[0].lastPathComponent
      : "\(urls.count) files selected"
    } else {
      labelText = urls.first?.lastPathComponent ?? ""
    }
    
    guard let owner = owner else { return }
    
    let change = MasonFileInputEvent(
      type: "change",
      data: payload.joined(separator: ","),
      options: MasonEventOptions(
        type: "change",
        bubbles: true,
        cancelable: false,
        isComposing: true
      ),
      rawData: urls
    )
    change.target = owner
    owner.node.mason.dispatch(change, owner.node)
  }
  
  @objc private func pickFile() {
    let types = utTypes(from: owner?.accept)
    let picker = UIDocumentPickerViewController(forOpeningContentTypes: types)
    picker.delegate = self
    picker.allowsMultipleSelection = owner?.multiple ?? false
    
    if let controller = parentViewController {
      controller.present(picker, animated: true)
    }
  }
}
