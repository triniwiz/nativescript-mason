//
//  Br.swift
//  Mason
//
//  Created by Osei Fortune on 29/12/2025.
//

@objc(MasonBr)
@objcMembers
public class MasonBr: MasonTextNode {
  public override init(mason doc: NSCMason, data text: String, attributes attrs: [NSAttributedString.Key : Any]? = nil) {
    super.init(mason: doc, data: "", attributes: attrs)
    isPlaceholder = true
  }
}
