//
//  NativeHelpers.swift
//  Mason
//
//  Created by Osei Fortune on 01/11/2025.
//

class NativeHelpers {
  static func nativeNodeAddChild(_ mason: NSCMason, _ parent: MasonNode, _ child: MasonNode){
    mason_node_add_child(mason.nativePtr, parent.nativePtr, child.nativePtr)
  }

}
