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
  private let stack: UIStackView
  
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
    stack = UIStackView(arrangedSubviews: [fileBtn, fileLabel])
    super.init(frame: frame)
    setup()
  }
  
  required init?(coder: NSCoder) {
    stack = UIStackView(arrangedSubviews: [fileBtn, fileLabel])
    super.init(coder: coder)
    setup()
  }
  
  private func setup() {
    clipsToBounds = false
    
    fileBtn.setTitle("Browse...", for: .normal)
    fileBtn.layer.borderWidth = 1
    fileBtn.layer.borderColor = UIColor.systemGray4.cgColor
    fileBtn.layer.cornerRadius = 4
    fileBtn.contentEdgeInsets = UIEdgeInsets(top: 2, left: 8, bottom: 2, right: 8)
    fileBtn.setContentHuggingPriority(.required, for: .horizontal)
    fileBtn.setContentCompressionResistancePriority(.required, for: .horizontal)
    
    fileLabel.text = "No file selected"
    fileLabel.lineBreakMode = .byTruncatingTail
    fileLabel.setContentHuggingPriority(.defaultLow, for: .horizontal)
    fileLabel.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
    
    stack.axis = .horizontal
    stack.spacing = 8
    stack.alignment = .center
    stack.distribution = .fill
    stack.clipsToBounds = false
    
    addSubview(stack)
    
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
            composed: true
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
    stack.frame = bounds
  }
  
  override var intrinsicContentSize: CGSize {
    let btnSize = fileBtn.intrinsicContentSize
    let labelSize = fileLabel.intrinsicContentSize
    let width = btnSize.width + 8 + labelSize.width
    let height = max(btnSize.height, labelSize.height)
    return CGSize(width: width, height: height)
  }
  
  override func sizeThatFits(_ size: CGSize) -> CGSize {
    let fitting = stack.systemLayoutSizeFitting(
      CGSize(width: size.width, height: UIView.layoutFittingCompressedSize.height),
      withHorizontalFittingPriority: .fittingSizeLevel,
      verticalFittingPriority: .fittingSizeLevel
    )
    return fitting
  }
  
  public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
    
  }
  
  public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
    guard !urls.isEmpty else { return }

       if owner?.multiple ?? false {
           labelText = urls.count == 1
               ? urls[0].lastPathComponent
               : "\(urls.count) files selected"
       } else {
           labelText = urls.first?.lastPathComponent ?? ""
       }

       guard let owner = owner else { return }

       let change = MasonEvent(
           type: "change",
           options: MasonEventOptions(
               type: "change",
               bubbles: true,
               cancelable: false,
               composed: true
           )
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
