package org.nativescript.mason.masonkit;

import androidx.annotation.NonNull;

abstract class InlineSegment {
  int kind = -1;

  private InlineSegment() {
    // Prevent direct instantiation
  }

  // Represents a text segment
  static final class Text extends InlineSegment {
    public final float width;
    public final float ascent;
    public final float descent;

    public Text(float width, float ascent, float descent) {
      this.width = width;
      this.ascent = ascent;
      this.descent = descent;
      this.kind = 0;
    }

    @NonNull
    @Override
    public String toString() {
      return "Text(width=" + width +
        ", ascent=" + ascent +
        ", descent=" + descent + ")";
    }

    @Override
    public boolean equals(Object o) {
      if (this == o) return true;
      if (!(o instanceof Text other)) return false;
      return Float.compare(width, other.width) == 0 &&
        Float.compare(ascent, other.ascent) == 0 &&
        Float.compare(descent, other.descent) == 0;
    }

    @Override
    public int hashCode() {
      int result = Float.hashCode(width);
      result = 31 * result + Float.hashCode(ascent);
      result = 31 * result + Float.hashCode(descent);
      return result;
    }
  }

  // Represents an inline child segment
  static final class InlineChild extends InlineSegment {
    public final long nodePtr;
    public final float descent;

    public InlineChild(long nodePtr, float descent) {
      this.nodePtr = nodePtr;
      this.descent = descent;
      this.kind = 1;
    }

    @NonNull
    @Override
    public String toString() {
      return "InlineChild(nodePtr=" + nodePtr +
        ", descent=" + descent + ")";
    }

    @Override
    public boolean equals(Object o) {
      if (this == o) return true;
      if (!(o instanceof InlineChild other)) return false;
      return nodePtr == other.nodePtr &&
        Float.compare(descent, other.descent) == 0;
    }

    @Override
    public int hashCode() {
      int result = Long.hashCode(nodePtr);
      result = 31 * result + Float.hashCode(descent);
      return result;
    }
  }
}
