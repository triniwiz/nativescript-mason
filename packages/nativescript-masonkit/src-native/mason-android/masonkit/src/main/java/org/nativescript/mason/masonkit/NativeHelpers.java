package org.nativescript.mason.masonkit;

import dalvik.annotation.optimization.CriticalNative;
import dalvik.annotation.optimization.FastNative;

public class NativeHelpers {
  static {
    initLib();
  }

  static boolean didInit;


  static void initLib() {
    if (didInit) {
      return;
    }
    didInit = true;
    System.loadLibrary("masonnative");
  }


  /* Node */

  @CriticalNative
  static native long nativeNodeNew(
    long mason, boolean isAnonymous
  );

  @CriticalNative
  static native long nativeNodeNewText(
    long mason, boolean isAnonymous
  );

  static native long nativeNodeNewWithChildren(
    long mason,
    long[] children
  );

  static native long nativeNodeNewWithContext(
    long mason,
    Object context,
    boolean isAnonymous
  );

  static native long nativeNodeNewTextWithContext(
    long mason,
    Object context,
    boolean isAnonymous
  );

  @CriticalNative
  static native void nativeNodeDestroy(long mason);

  @CriticalNative
  static native void nativeNodeCompute(long mason, long node);

  @CriticalNative
  static native void nativeNodeComputeSize(long mason, long node, long size);

  @CriticalNative
  static native void nativeNodeComputeWH(long mason, long node, float width, float height);

  @CriticalNative
  static native void nativeNodeComputeMaxContent(long mason, long node);

  @CriticalNative
  static native void nativeNodeComputeMinContent(long mason, long node);

  @CriticalNative
  static native void nativeNodeAddChild(long mason, long node, long child);

  @CriticalNative
  static native void nativeNodeAddChildAt(long mason, long node, long child, int index);

  @CriticalNative
  static native long nativeNodeReplaceChildAt(long mason, long node, long child, int index);

  @CriticalNative
  static native void nativeNodeInsertChildBefore(long mason, long node, long child, long reference);

  @CriticalNative
  static native void nativeNodeInsertChildAfter(long mason, long node, long child, long reference);

  @CriticalNative
  static native long nativeNodeGetChildAt(long mason, long node, int index);

  @CriticalNative
  static native int nativeNodeGetChildCount(long mason, long node);

  @CriticalNative
  static native void nativeNodeMarkDirty(long mason, long node);

  @CriticalNative
  static native boolean nativeNodeDirty(long mason, long node);

  @CriticalNative
  static native void nativeNodeRemoveChildren(long mason, long node);

  @CriticalNative
  static native long nativeNodeRemoveChildAt(long mason, long node, int index);

  @CriticalNative
  static native long nativeNodeRemoveChild(long mason, long node, long child);

  @CriticalNative
  static native long nativeNodeSetStyle(long mason, long node, long style);

  @CriticalNative
  static native void nativeNodeRemoveContext(long mason, long node);

  @FastNative
  static native float[] nativeNodeComputeWithSizeAndLayout(long mason,
                                                           long node,
                                                           float width,
                                                           float height);

  @FastNative
  static native long[] nativeNodeGetChildren(long mason, long node);

  @FastNative
  static native float[] nativeNodeLayout(long mason, long node);

  static native void nativeNodeSetContext(long mason, long node, Object measureFunc);

  static native float[] nativeNodeComputeAndLayout(long mason, long node);

  static native void nativeNodeSetChildren(
    long mason,
    long node,
    long[] children
  );

  static native void nativeNodeSetSegments(long masonPtr, long nodePtr, InlineSegment[] segments);

  static native void nativeSetAndroidNode(long masonPtr, long nodePtr, Node node);

  @FastNative
  static native long nativeNodeNewImage(
    long mason
  );

  static native long nativeNodeNewImageWithContext(
    long mason,
    Object context
  );


  /* Node */

}
