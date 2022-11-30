declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class AlignContent {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignContent>;
          public static FlexStart: org.nativescript.mason.masonkit.AlignContent;
          public static FlexEnd: org.nativescript.mason.masonkit.AlignContent;
          public static Center: org.nativescript.mason.masonkit.AlignContent;
          public static Stretch: org.nativescript.mason.masonkit.AlignContent;
          public static SpaceBetween: org.nativescript.mason.masonkit.AlignContent;
          public static SpaceAround: org.nativescript.mason.masonkit.AlignContent;
          public static SpaceEvenly: org.nativescript.mason.masonkit.AlignContent;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.AlignContent>;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.AlignContent;
        }
        export module AlignContent {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignContent.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.AlignContent;
          }
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class AlignItems {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignItems>;
          public static FlexStart: org.nativescript.mason.masonkit.AlignItems;
          public static FlexEnd: org.nativescript.mason.masonkit.AlignItems;
          public static Center: org.nativescript.mason.masonkit.AlignItems;
          public static Baseline: org.nativescript.mason.masonkit.AlignItems;
          public static Stretch: org.nativescript.mason.masonkit.AlignItems;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.AlignItems;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.AlignItems>;
        }
        export module AlignItems {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignItems.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.AlignItems;
          }
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class AlignSelf {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignSelf>;
          public static Auto: org.nativescript.mason.masonkit.AlignSelf;
          public static FlexStart: org.nativescript.mason.masonkit.AlignSelf;
          public static FlexEnd: org.nativescript.mason.masonkit.AlignSelf;
          public static Center: org.nativescript.mason.masonkit.AlignSelf;
          public static Baseline: org.nativescript.mason.masonkit.AlignSelf;
          public static Stretch: org.nativescript.mason.masonkit.AlignSelf;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.AlignSelf;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.AlignSelf>;
        }
        export module AlignSelf {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignSelf.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.AlignSelf;
          }
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export abstract class AvailableSpace {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.AvailableSpace>;
          public getValue$masonkit_release(): number;
          public getType$masonkit_release(): number;
        }
        export module AvailableSpace {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.AvailableSpace.Companion>;
            public fromTypeValue(param0: number, param1: number): org.nativescript.mason.masonkit.AvailableSpace;
          }
          export class Definite extends org.nativescript.mason.masonkit.AvailableSpace {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.AvailableSpace.Definite>;
            public copy(param0: number): org.nativescript.mason.masonkit.AvailableSpace.Definite;
            public constructor(param0: number);
            public hashCode(): number;
            public equals(param0: any): boolean;
            public getPoints(): number;
            public component1(): number;
            public toString(): string;
          }
          export class MaxContent extends org.nativescript.mason.masonkit.AvailableSpace {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.AvailableSpace.MaxContent>;
            public static INSTANCE: org.nativescript.mason.masonkit.AvailableSpace.MaxContent;
          }
          export class MinContent extends org.nativescript.mason.masonkit.AvailableSpace {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.AvailableSpace.MinContent>;
            public static INSTANCE: org.nativescript.mason.masonkit.AvailableSpace.MinContent;
          }
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class BuildConfig {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.BuildConfig>;
          public static DEBUG: boolean;
          public static LIBRARY_PACKAGE_NAME: string;
          public static BUILD_TYPE: string;
          public constructor();
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export abstract class Dimension {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.Dimension>;
          public updateValue$masonkit_release(param0: number): void;
          public getValue$masonkit_release(): number;
          public getType$masonkit_release(): number;
        }
        export module Dimension {
          export class Auto extends org.nativescript.mason.masonkit.Dimension {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Dimension.Auto>;
            public static INSTANCE: org.nativescript.mason.masonkit.Dimension.Auto;
          }
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Dimension.Companion>;
            public fromTypeValue(param0: number, param1: number): org.nativescript.mason.masonkit.Dimension;
          }
          export class Percent extends org.nativescript.mason.masonkit.Dimension {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Dimension.Percent>;
            public copy(param0: number): org.nativescript.mason.masonkit.Dimension.Percent;
            public getPercentage(): number;
            public constructor(param0: number);
            public setPercentage(param0: number): void;
            public hashCode(): number;
            public equals(param0: any): boolean;
            public component1(): number;
            public toString(): string;
          }
          export class Points extends org.nativescript.mason.masonkit.Dimension {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Dimension.Points>;
            public setPoints(param0: number): void;
            public constructor(param0: number);
            public hashCode(): number;
            public equals(param0: any): boolean;
            public getPoints(): number;
            public component1(): number;
            public copy(param0: number): org.nativescript.mason.masonkit.Dimension.Points;
            public toString(): string;
          }
          export class Undefined extends org.nativescript.mason.masonkit.Dimension {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Dimension.Undefined>;
            public static INSTANCE: org.nativescript.mason.masonkit.Dimension.Undefined;
          }
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class Direction {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.Direction>;
          public static Inherit: org.nativescript.mason.masonkit.Direction;
          public static LTR: org.nativescript.mason.masonkit.Direction;
          public static RTL: org.nativescript.mason.masonkit.Direction;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.Direction>;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.Direction;
        }
        export module Direction {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Direction.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.Direction;
          }
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class Display {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.Display>;
          public static Flex: org.nativescript.mason.masonkit.Display;
          public static None: org.nativescript.mason.masonkit.Display;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.Display>;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.Display;
        }
        export module Display {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Display.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.Display;
          }
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class FlexDirection {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.FlexDirection>;
          public static Row: org.nativescript.mason.masonkit.FlexDirection;
          public static Column: org.nativescript.mason.masonkit.FlexDirection;
          public static RowReverse: org.nativescript.mason.masonkit.FlexDirection;
          public static ColumnReverse: org.nativescript.mason.masonkit.FlexDirection;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.FlexDirection;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.FlexDirection>;
        }
        export module FlexDirection {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.FlexDirection.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.FlexDirection;
          }
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class FlexWrap {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.FlexWrap>;
          public static NoWrap: org.nativescript.mason.masonkit.FlexWrap;
          public static Wrap: org.nativescript.mason.masonkit.FlexWrap;
          public static WrapReverse: org.nativescript.mason.masonkit.FlexWrap;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.FlexWrap>;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.FlexWrap;
        }
        export module FlexWrap {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.FlexWrap.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.FlexWrap;
          }
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class JustifyContent {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifyContent>;
          public static FlexStart: org.nativescript.mason.masonkit.JustifyContent;
          public static FlexEnd: org.nativescript.mason.masonkit.JustifyContent;
          public static Center: org.nativescript.mason.masonkit.JustifyContent;
          public static SpaceBetween: org.nativescript.mason.masonkit.JustifyContent;
          public static SpaceAround: org.nativescript.mason.masonkit.JustifyContent;
          public static SpaceEvenly: org.nativescript.mason.masonkit.JustifyContent;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.JustifyContent>;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.JustifyContent;
        }
        export module JustifyContent {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifyContent.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.JustifyContent;
          }
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class Layout {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.Layout>;
          public component5(): number;
          public getX(): number;
          public getHeight(): number;
          public component3(): number;
          public copy(param0: number, param1: number, param2: number, param3: number, param4: number, param5: java.util.List<org.nativescript.mason.masonkit.Layout>): org.nativescript.mason.masonkit.Layout;
          public getWidth(): number;
          public component6(): java.util.List<org.nativescript.mason.masonkit.Layout>;
          public getY(): number;
          public equals(param0: any): boolean;
          public toString(): string;
          public getOrder(): number;
          public component4(): number;
          public constructor(param0: number, param1: number, param2: number, param3: number, param4: number, param5: java.util.List<org.nativescript.mason.masonkit.Layout>);
          public component1(): number;
          public component2(): number;
          public hashCode(): number;
          public getChildren(): java.util.List<org.nativescript.mason.masonkit.Layout>;
        }
        export module Layout {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Layout.Companion>;
            public fromFloatArray$masonkit_release(param0: androidNative.Array<number>, param1: number): android.util.Pair<java.lang.Integer, org.nativescript.mason.masonkit.Layout>;
          }
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class Mason {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.Mason>;
          public static getShared(): boolean;
          public static getInstance(): org.nativescript.mason.masonkit.Mason;
          public getNativePtr$masonkit_release(): number;
          public clear(): void;
          public setNativePtr$masonkit_release(param0: number): void;
          public static setShared(param0: boolean): void;
          public getNativePtr(): number;
        }
        export module Mason {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Mason.Companion>;
            public initLib$masonkit_release(): void;
            public getInstance(): org.nativescript.mason.masonkit.Mason;
            public getShared(): boolean;
            public setShared(param0: boolean): void;
          }
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class MeasureFunc {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.MeasureFunc>;
          /**
           * Constructs a new instance of the org.nativescript.mason.masonkit.MeasureFunc interface with the provided implementation. An empty constructor exists calling super() when extending the interface class.
           */
          public constructor(implementation: { measure(param0: org.nativescript.mason.masonkit.Size<java.lang.Float>, param1: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float> });
          public constructor();
          public measure(param0: org.nativescript.mason.masonkit.Size<java.lang.Float>, param1: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class MeasureFuncImpl {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.MeasureFuncImpl>;
          public constructor(param0: java.lang.ref.WeakReference<org.nativescript.mason.masonkit.MeasureFunc>);
          public measure(param0: number, param1: number): number;
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class MeasureOutput {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.MeasureOutput>;
          public static INSTANCE: org.nativescript.mason.masonkit.MeasureOutput;
          public make(param0: number, param1: number): number;
          public getWidth(param0: number): number;
          public getHeight(param0: number): number;
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class Node {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.Node>;
          public computeMaxContent(): void;
          public addChild(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Node;
          public getData(): any;
          public constructor(param0: org.nativescript.mason.masonkit.Style, param1: androidNative.Array<org.nativescript.mason.masonkit.Node>);
          public insertChildAfter(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Node): void;
          public removeChild(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Node;
          public getChildAt(param0: number): org.nativescript.mason.masonkit.Node;
          public getChildCount(): number;
          public setOwner$masonkit_release(param0: org.nativescript.mason.masonkit.Node): void;
          public isDirty(): boolean;
          public finalize(): void;
          public layout(): org.nativescript.mason.masonkit.Layout;
          public computeAndLayout(param0: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Layout;
          public updateNodeStyle$masonkit_release(): void;
          public insertChildBefore(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Node): void;
          public removeChildAt(param0: number): org.nativescript.mason.masonkit.Node;
          public getStyle(): org.nativescript.mason.masonkit.Style;
          public getOwner(): org.nativescript.mason.masonkit.Node;
          public getChildren(): androidNative.Array<org.nativescript.mason.masonkit.Node>;
          public removeMeasureFunction(): void;
          public constructor();
          public setMeasureFunction(param0: org.nativescript.mason.masonkit.MeasureFunc): void;
          public computeMinContent(): void;
          public addChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
          public computeAndLayout(): org.nativescript.mason.masonkit.Layout;
          public compute(): void;
          public compute(param0: number, param1: number): void;
          public setData(param0: any): void;
          public setStyle(param0: org.nativescript.mason.masonkit.Style): void;
          public dirty(): void;
          public constructor(param0: org.nativescript.mason.masonkit.Style);
          public constructor(param0: org.nativescript.mason.masonkit.Style, param1: org.nativescript.mason.masonkit.MeasureFunc);
        }
        export module Node {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Node.Companion>;
          }
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class Overflow {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.Overflow>;
          public static Visible: org.nativescript.mason.masonkit.Overflow;
          public static Hidden: org.nativescript.mason.masonkit.Overflow;
          public static Scroll: org.nativescript.mason.masonkit.Overflow;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.Overflow;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.Overflow>;
        }
        export module Overflow {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Overflow.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.Overflow;
          }
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class PositionType {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.PositionType>;
          public static Relative: org.nativescript.mason.masonkit.PositionType;
          public static Absolute: org.nativescript.mason.masonkit.PositionType;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.PositionType;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.PositionType>;
        }
        export module PositionType {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.PositionType.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.PositionType;
          }
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class Rect<T> extends java.lang.Object {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.Rect<any>>;
          public constructor(param0: T, param1: T, param2: T, param3: T);
          public getRight(): T;
          public component1(): T;
          public getBottom(): T;
          public component2(): T;
          public equals(param0: any): boolean;
          public toString(): string;
          public getLeft(): T;
          public component3(): T;
          public copy(param0: T, param1: T, param2: T, param3: T): org.nativescript.mason.masonkit.Rect<T>;
          public component4(): T;
          public getTop(): T;
          public hashCode(): number;
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class Size<T> extends java.lang.Object {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.Size<any>>;
          public setWidth(param0: T): void;
          public copy(param0: T, param1: T): org.nativescript.mason.masonkit.Size<T>;
          public equals(param0: any): boolean;
          public getWidth(): T;
          public toString(): string;
          public constructor(param0: T, param1: T);
          public getHeight(): T;
          public component1(): T;
          public hashCode(): number;
          public component2(): T;
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class Style {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.Style>;
          public getAlignSelf(): org.nativescript.mason.masonkit.AlignSelf;
          public getAlignItems(): org.nativescript.mason.masonkit.AlignItems;
          public finalize(): void;
          public setAlignItems(param0: org.nativescript.mason.masonkit.AlignItems): void;
          public setDisplay(param0: org.nativescript.mason.masonkit.Display): void;
          public updateStyle$masonkit_release(
            param0: number,
            param1: number,
            param2: number,
            param3: number,
            param4: number,
            param5: number,
            param6: number,
            param7: number,
            param8: number,
            param9: number,
            param10: number,
            param11: number,
            param12: number,
            param13: number,
            param14: number,
            param15: number,
            param16: number,
            param17: number,
            param18: number,
            param19: number,
            param20: number,
            param21: number,
            param22: number,
            param23: number,
            param24: number,
            param25: number,
            param26: number,
            param27: number,
            param28: number,
            param29: number,
            param30: number,
            param31: number,
            param32: number,
            param33: number,
            param34: number,
            param35: number,
            param36: number,
            param37: number,
            param38: number,
            param39: number,
            param40: number,
            param41: number,
            param42: number,
            param43: number,
            param44: number,
            param45: number,
            param46: number,
            param47: number,
            param48: number,
            param49: number,
            param50: number,
            param51: number,
            param52: number,
            param53: number,
            param54: number,
            param55: number,
            param56: number,
            param57: number,
            param58: number,
            param59: number,
            param60: number,
            param61: number,
            param62: number
          ): void;
          public constructor();
          public getFlexDirection(): org.nativescript.mason.masonkit.FlexDirection;
          public setPositionType(param0: org.nativescript.mason.masonkit.PositionType): void;
          public setFlexShrink(param0: number): void;
          public getFlexBasis(): org.nativescript.mason.masonkit.Dimension;
          public getPadding(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.Dimension>;
          public getDisplay(): org.nativescript.mason.masonkit.Display;
          public setJustifyContent(param0: org.nativescript.mason.masonkit.JustifyContent): void;
          public setPadding(param0: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.Dimension>): void;
          public getMinSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
          public setDirection(param0: org.nativescript.mason.masonkit.Direction): void;
          public getOverflow(): org.nativescript.mason.masonkit.Overflow;
          public getBorder(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.Dimension>;
          public getMaxSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
          public getFlexGrow(): number;
          public getPosition(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.Dimension>;
          public setSize(param0: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
          public getJustifyContent(): org.nativescript.mason.masonkit.JustifyContent;
          public getPositionType(): org.nativescript.mason.masonkit.PositionType;
          public getDirection(): org.nativescript.mason.masonkit.Direction;
          public getFlexGap(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
          public isDirty$masonkit_release(): boolean;
          public setFlexGap(param0: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
          public getFlexWrap(): org.nativescript.mason.masonkit.FlexWrap;
          public setFlexWrap(param0: org.nativescript.mason.masonkit.FlexWrap): void;
          public setMinSize(param0: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
          public setAlignContent(param0: org.nativescript.mason.masonkit.AlignContent): void;
          public setAlignSelf(param0: org.nativescript.mason.masonkit.AlignSelf): void;
          public getAspectRatio(): java.lang.Float;
          public setOverflow(param0: org.nativescript.mason.masonkit.Overflow): void;
          public getAlignContent(): org.nativescript.mason.masonkit.AlignContent;
          public setMaxSize(param0: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
          public setDirty$masonkit_release(param0: boolean): void;
          public setMargin(param0: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.Dimension>): void;
          public setAspectRatio(param0: java.lang.Float): void;
          public setBorder(param0: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.Dimension>): void;
          public getFlexShrink(): number;
          public getMargin(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.Dimension>;
          public getNativePtr$masonkit_release(): number;
          public setFlexBasis(param0: org.nativescript.mason.masonkit.Dimension): void;
          public setFlexGrow(param0: number): void;
          public getSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
          public setPosition(param0: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.Dimension>): void;
          public setFlexDirection(param0: org.nativescript.mason.masonkit.FlexDirection): void;
        }
        export module Style {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Style.Companion>;
          }
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class View {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.View>;
          public addViews(param0: androidNative.Array<globalAndroid.view.View>, param1: number, param2: globalAndroid.view.ViewGroup.LayoutParams): void;
          public onMeasure(param0: number, param1: number): void;
          public invalidate(param0: globalAndroid.view.View): void;
          public removeViewsInLayout(param0: number, param1: number): void;
          public nodeForView(param0: globalAndroid.view.View): org.nativescript.mason.masonkit.Node;
          public removeAllViewsInLayout(): void;
          public generateLayoutParams(param0: globalAndroid.util.AttributeSet): globalAndroid.view.ViewGroup.LayoutParams;
          public getStyle(): org.nativescript.mason.masonkit.Style;
          public constructor(param0: globalAndroid.content.Context, param1: globalAndroid.util.AttributeSet, param2: number);
          public removeView(param0: globalAndroid.view.View): void;
          public generateLayoutParams(param0: globalAndroid.view.ViewGroup.LayoutParams): globalAndroid.view.ViewGroup.LayoutParams;
          public setStyle(param0: org.nativescript.mason.masonkit.Style): void;
          public addView(param0: globalAndroid.view.View, param1: org.nativescript.mason.masonkit.Node): void;
          public constructor(param0: globalAndroid.content.Context, param1: globalAndroid.util.AttributeSet);
          public constructor(param0: globalAndroid.content.Context);
          public removeViewAt(param0: number): void;
          public removeViewInLayout(param0: globalAndroid.view.View): void;
          public removeAllViews(): void;
          public applyLayoutParams(param0: org.nativescript.mason.masonkit.View.LayoutParams, param1: org.nativescript.mason.masonkit.Node, param2: globalAndroid.view.View): void;
          public getNode(): org.nativescript.mason.masonkit.Node;
          public generateDefaultLayoutParams(): globalAndroid.view.ViewGroup.LayoutParams;
          public onLayout(param0: boolean, param1: number, param2: number, param3: number, param4: number): void;
          public addView(param0: globalAndroid.view.View, param1: number, param2: globalAndroid.view.ViewGroup.LayoutParams): void;
          public checkLayoutParams(param0: globalAndroid.view.ViewGroup.LayoutParams): boolean;
          public removeViews(param0: number, param1: number): void;
          public setStyleFromString(param0: string): void;
          public getStyleAsString(): string;
        }
        export module View {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.View.Companion>;
            public getNodesRef$masonkit_release(): java.util.WeakHashMap<globalAndroid.view.View, org.nativescript.mason.masonkit.Node>;
          }
          export class LayoutParams {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.View.LayoutParams>;
            public constructor(param0: globalAndroid.view.ViewGroup.LayoutParams);
            public getNumericAttributes$masonkit_release(): globalAndroid.util.SparseArray<java.lang.Float>;
            public setStringAttributes$masonkit_release(param0: globalAndroid.util.SparseArray<string>): void;
            public setNumericAttributes$masonkit_release(param0: globalAndroid.util.SparseArray<java.lang.Float>): void;
            public constructor(param0: globalAndroid.content.Context, param1: globalAndroid.util.AttributeSet);
            public constructor(param0: number, param1: number);
            public getStringAttributes$masonkit_release(): globalAndroid.util.SparseArray<string>;
          }
          export class ViewMeasureFunc extends org.nativescript.mason.masonkit.MeasureFunc {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.View.ViewMeasureFunc>;
            public measure(param0: org.nativescript.mason.masonkit.Size<java.lang.Float>, param1: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
            public constructor(param0: java.lang.ref.WeakReference<org.nativescript.mason.masonkit.Node>);
          }
        }
      }
    }
  }
}

//Generics information:
//org.nativescript.mason.masonkit.Rect:1
//org.nativescript.mason.masonkit.Size:1
