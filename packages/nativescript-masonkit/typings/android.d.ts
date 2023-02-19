declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class AlignContent {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignContent>;
          public static Normal: org.nativescript.mason.masonkit.AlignContent;
          public static Start: org.nativescript.mason.masonkit.AlignContent;
          public static End: org.nativescript.mason.masonkit.AlignContent;
          public static Center: org.nativescript.mason.masonkit.AlignContent;
          public static Stretch: org.nativescript.mason.masonkit.AlignContent;
          public static SpaceBetween: org.nativescript.mason.masonkit.AlignContent;
          public static SpaceAround: org.nativescript.mason.masonkit.AlignContent;
          public static SpaceEvenly: org.nativescript.mason.masonkit.AlignContent;
          public static FlexStart: org.nativescript.mason.masonkit.AlignContent;
          public static FlexEnd: org.nativescript.mason.masonkit.AlignContent;
          public getCssValue(): string;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.AlignContent>;
          public getValue(): number;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.AlignContent;
        }
        export module AlignContent {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignContent.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.AlignContent;
          }
          export class WhenMappings {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignContent.WhenMappings>;
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
          public static Normal: org.nativescript.mason.masonkit.AlignItems;
          public static Start: org.nativescript.mason.masonkit.AlignItems;
          public static End: org.nativescript.mason.masonkit.AlignItems;
          public static Center: org.nativescript.mason.masonkit.AlignItems;
          public static Baseline: org.nativescript.mason.masonkit.AlignItems;
          public static Stretch: org.nativescript.mason.masonkit.AlignItems;
          public static FlexStart: org.nativescript.mason.masonkit.AlignItems;
          public static FlexEnd: org.nativescript.mason.masonkit.AlignItems;
          public getCssValue(): string;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.AlignItems;
          public getValue(): number;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.AlignItems>;
        }
        export module AlignItems {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignItems.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.AlignItems;
          }
          export class WhenMappings {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignItems.WhenMappings>;
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
          public static Normal: org.nativescript.mason.masonkit.AlignSelf;
          public static Start: org.nativescript.mason.masonkit.AlignSelf;
          public static End: org.nativescript.mason.masonkit.AlignSelf;
          public static Center: org.nativescript.mason.masonkit.AlignSelf;
          public static Baseline: org.nativescript.mason.masonkit.AlignSelf;
          public static Stretch: org.nativescript.mason.masonkit.AlignSelf;
          public static FlexStart: org.nativescript.mason.masonkit.AlignSelf;
          public static FlexEnd: org.nativescript.mason.masonkit.AlignSelf;
          public getCssValue(): string;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.AlignSelf;
          public getValue(): number;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.AlignSelf>;
        }
        export module AlignSelf {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignSelf.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.AlignSelf;
          }
          export class WhenMappings {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignSelf.WhenMappings>;
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
          public static fromTypeValue(param0: number, param1: number): org.nativescript.mason.masonkit.AvailableSpace;
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
          public getCssValue(): string;
          public updateValue$masonkit_release(param0: number): void;
          public getValue$masonkit_release(): number;
          public isZero(): boolean;
          public static fromTypeValue(param0: number, param1: number): org.nativescript.mason.masonkit.Dimension;
          public getType$masonkit_release(): number;
          public getJsonValue(): string;
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
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class DimensionSerializer extends com.google.gson.JsonSerializer<org.nativescript.mason.masonkit.Dimension> {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.DimensionSerializer>;
          public constructor();
          public serialize(param0: org.nativescript.mason.masonkit.Dimension, param1: java.lang.reflect.Type, param2: com.google.gson.JsonSerializationContext): com.google.gson.JsonElement;
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
          public getCssValue(): string;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.Direction>;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.Direction;
        }
        export module Direction {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Direction.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.Direction;
          }
          export class WhenMappings {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Direction.WhenMappings>;
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
          public static None: org.nativescript.mason.masonkit.Display;
          public static Flex: org.nativescript.mason.masonkit.Display;
          public static Grid: org.nativescript.mason.masonkit.Display;
          public getCssValue(): string;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.Display>;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.Display;
        }
        export module Display {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Display.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.Display;
          }
          export class WhenMappings {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Display.WhenMappings>;
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
          public getCssValue(): string;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.FlexDirection;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.FlexDirection>;
        }
        export module FlexDirection {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.FlexDirection.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.FlexDirection;
          }
          export class WhenMappings {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.FlexDirection.WhenMappings>;
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
          public getCssValue(): string;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.FlexWrap>;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.FlexWrap;
        }
        export module FlexWrap {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.FlexWrap.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.FlexWrap;
          }
          export class WhenMappings {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.FlexWrap.WhenMappings>;
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
        export class GridAutoFlow {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.GridAutoFlow>;
          public static Row: org.nativescript.mason.masonkit.GridAutoFlow;
          public static Column: org.nativescript.mason.masonkit.GridAutoFlow;
          public static RowDense: org.nativescript.mason.masonkit.GridAutoFlow;
          public static ColumnDense: org.nativescript.mason.masonkit.GridAutoFlow;
          public getCssValue(): string;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.GridAutoFlow;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.GridAutoFlow>;
        }
        export module GridAutoFlow {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.GridAutoFlow.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.GridAutoFlow;
          }
          export class WhenMappings {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.GridAutoFlow.WhenMappings>;
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
        export abstract class GridPlacement {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.GridPlacement>;
          public getCssValue(): string;
          public getPlacementValue$masonkit_release(): number;
          public getType$masonkit_release(): number;
          public getJsonValue(): string;
        }
        export module GridPlacement {
          export class Auto extends org.nativescript.mason.masonkit.GridPlacement {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.GridPlacement.Auto>;
            public static INSTANCE: org.nativescript.mason.masonkit.GridPlacement.Auto;
          }
          export class Line extends org.nativescript.mason.masonkit.GridPlacement {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.GridPlacement.Line>;
            public constructor(param0: number);
            public copy(param0: number): org.nativescript.mason.masonkit.GridPlacement.Line;
            public hashCode(): number;
            public equals(param0: any): boolean;
            public component1(): number;
            public setValue(param0: number): void;
            public toString(): string;
            public getValue(): number;
          }
          export class Span extends org.nativescript.mason.masonkit.GridPlacement {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.GridPlacement.Span>;
            public constructor(param0: number);
            public copy(param0: number): org.nativescript.mason.masonkit.GridPlacement.Span;
            public hashCode(): number;
            public equals(param0: any): boolean;
            public component1(): number;
            public setValue(param0: number): void;
            public toString(): string;
            public getValue(): number;
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
        export abstract class GridTrackRepetition {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.GridTrackRepetition>;
          public getType(): number;
          public getCssValue(): string;
          public getValue(): number;
          public toInt(): number;
          public static fromInt(param0: number, param1: number): org.nativescript.mason.masonkit.GridTrackRepetition;
        }
        export module GridTrackRepetition {
          export class AutoFill extends org.nativescript.mason.masonkit.GridTrackRepetition {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.GridTrackRepetition.AutoFill>;
            public static INSTANCE: org.nativescript.mason.masonkit.GridTrackRepetition.AutoFill;
          }
          export class AutoFit extends org.nativescript.mason.masonkit.GridTrackRepetition {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.GridTrackRepetition.AutoFit>;
            public static INSTANCE: org.nativescript.mason.masonkit.GridTrackRepetition.AutoFit;
          }
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.GridTrackRepetition.Companion>;
            public fromInt(param0: number, param1: number): org.nativescript.mason.masonkit.GridTrackRepetition;
          }
          export class Count extends org.nativescript.mason.masonkit.GridTrackRepetition {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.GridTrackRepetition.Count>;
            public constructor(param0: number);
            public hashCode(): number;
            public equals(param0: any): boolean;
            public getCount(): number;
            public copy(param0: number): org.nativescript.mason.masonkit.GridTrackRepetition.Count;
            public component1(): number;
            public toString(): string;
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
          public static Normal: org.nativescript.mason.masonkit.JustifyContent;
          public static Start: org.nativescript.mason.masonkit.JustifyContent;
          public static End: org.nativescript.mason.masonkit.JustifyContent;
          public static Center: org.nativescript.mason.masonkit.JustifyContent;
          public static Stretch: org.nativescript.mason.masonkit.JustifyContent;
          public static SpaceBetween: org.nativescript.mason.masonkit.JustifyContent;
          public static SpaceAround: org.nativescript.mason.masonkit.JustifyContent;
          public static SpaceEvenly: org.nativescript.mason.masonkit.JustifyContent;
          public static FlexStart: org.nativescript.mason.masonkit.JustifyContent;
          public static FlexEnd: org.nativescript.mason.masonkit.JustifyContent;
          public getCssValue(): string;
          public getValue(): number;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.JustifyContent>;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.JustifyContent;
        }
        export module JustifyContent {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifyContent.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.JustifyContent;
          }
          export class WhenMappings {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifyContent.WhenMappings>;
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
        export class JustifyItems {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifyItems>;
          public static Normal: org.nativescript.mason.masonkit.JustifyItems;
          public static Start: org.nativescript.mason.masonkit.JustifyItems;
          public static End: org.nativescript.mason.masonkit.JustifyItems;
          public static Center: org.nativescript.mason.masonkit.JustifyItems;
          public static Baseline: org.nativescript.mason.masonkit.JustifyItems;
          public static Stretch: org.nativescript.mason.masonkit.JustifyItems;
          public static FlexStart: org.nativescript.mason.masonkit.JustifyItems;
          public static FlexEnd: org.nativescript.mason.masonkit.JustifyItems;
          public getCssValue(): string;
          public getValue(): number;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.JustifyItems;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.JustifyItems>;
        }
        export module JustifyItems {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifyItems.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.JustifyItems;
          }
          export class WhenMappings {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifyItems.WhenMappings>;
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
        export class JustifySelf {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifySelf>;
          public static Normal: org.nativescript.mason.masonkit.JustifySelf;
          public static Start: org.nativescript.mason.masonkit.JustifySelf;
          public static End: org.nativescript.mason.masonkit.JustifySelf;
          public static Center: org.nativescript.mason.masonkit.JustifySelf;
          public static Baseline: org.nativescript.mason.masonkit.JustifySelf;
          public static Stretch: org.nativescript.mason.masonkit.JustifySelf;
          public static FlexStart: org.nativescript.mason.masonkit.JustifySelf;
          public static FlexEnd: org.nativescript.mason.masonkit.JustifySelf;
          public getCssValue(): string;
          public getValue(): number;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.JustifySelf>;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.JustifySelf;
        }
        export module JustifySelf {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifySelf.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.JustifySelf;
          }
          export class WhenMappings {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifySelf.WhenMappings>;
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
            //public fromFloatArray$masonkit_release(param0: androidNative.Array<number>, param1: number): any<java.lang.Integer,org.nativescript.mason.masonkit.Layout>;
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
        export abstract class LengthPercentage {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentage>;
          public getCssValue(): string;
          public static fromTypeValue(param0: number, param1: number): org.nativescript.mason.masonkit.LengthPercentage;
          public updateValue$masonkit_release(param0: number): void;
          public getValue$masonkit_release(): number;
          public getType$masonkit_release(): number;
          public getJsonValue(): string;
        }
        export module LengthPercentage {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentage.Companion>;
            public fromTypeValue(param0: number, param1: number): org.nativescript.mason.masonkit.LengthPercentage;
          }
          export class Percent extends org.nativescript.mason.masonkit.LengthPercentage {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentage.Percent>;
            public getPercentage(): number;
            public constructor(param0: number);
            public setPercentage(param0: number): void;
            public hashCode(): number;
            public equals(param0: any): boolean;
            public copy(param0: number): org.nativescript.mason.masonkit.LengthPercentage.Percent;
            public component1(): number;
            public toString(): string;
          }
          export class Points extends org.nativescript.mason.masonkit.LengthPercentage {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentage.Points>;
            public setPoints(param0: number): void;
            public constructor(param0: number);
            public hashCode(): number;
            public equals(param0: any): boolean;
            public getPoints(): number;
            public component1(): number;
            public toString(): string;
            public copy(param0: number): org.nativescript.mason.masonkit.LengthPercentage.Points;
          }
          export class Zero extends org.nativescript.mason.masonkit.LengthPercentage {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentage.Zero>;
            public static INSTANCE: org.nativescript.mason.masonkit.LengthPercentage.Zero;
            public static points: number;
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
        export abstract class LengthPercentageAuto {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAuto>;
          public getCssValue(): string;
          public updateValue$masonkit_release(param0: number): void;
          public getValue$masonkit_release(): number;
          public getType$masonkit_release(): number;
          public static fromTypeValue(param0: number, param1: number): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public getJsonValue(): string;
        }
        export module LengthPercentageAuto {
          export class Auto extends org.nativescript.mason.masonkit.LengthPercentageAuto {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAuto.Auto>;
            public static INSTANCE: org.nativescript.mason.masonkit.LengthPercentageAuto.Auto;
          }
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAuto.Companion>;
            public fromTypeValue(param0: number, param1: number): org.nativescript.mason.masonkit.LengthPercentageAuto;
          }
          export class Percent extends org.nativescript.mason.masonkit.LengthPercentageAuto {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAuto.Percent>;
            public getPercentage(): number;
            public copy(param0: number): org.nativescript.mason.masonkit.LengthPercentageAuto.Percent;
            public constructor(param0: number);
            public setPercentage(param0: number): void;
            public hashCode(): number;
            public equals(param0: any): boolean;
            public component1(): number;
            public toString(): string;
          }
          export class Points extends org.nativescript.mason.masonkit.LengthPercentageAuto {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAuto.Points>;
            public setPoints(param0: number): void;
            public constructor(param0: number);
            public hashCode(): number;
            public equals(param0: any): boolean;
            public getPoints(): number;
            public copy(param0: number): org.nativescript.mason.masonkit.LengthPercentageAuto.Points;
            public component1(): number;
            public toString(): string;
          }
          export class Zero extends org.nativescript.mason.masonkit.LengthPercentageAuto {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAuto.Zero>;
            public static INSTANCE: org.nativescript.mason.masonkit.LengthPercentageAuto.Zero;
            public static points: number;
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
        export class LengthPercentageAutoSerializer extends com.google.gson.JsonSerializer<org.nativescript.mason.masonkit.LengthPercentageAuto> {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAutoSerializer>;
          public constructor();
          public serialize(param0: org.nativescript.mason.masonkit.LengthPercentageAuto, param1: java.lang.reflect.Type, param2: com.google.gson.JsonSerializationContext): com.google.gson.JsonElement;
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class LengthPercentageSerializer extends com.google.gson.JsonSerializer<org.nativescript.mason.masonkit.LengthPercentage> {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageSerializer>;
          public constructor();
          public serialize(param0: org.nativescript.mason.masonkit.LengthPercentage, param1: java.lang.reflect.Type, param2: com.google.gson.JsonSerializationContext): com.google.gson.JsonElement;
        }
      }
    }
  }
}

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class Line<T> extends java.lang.Object {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.Line<any>>;
          public equals(param0: any): boolean;
          public toString(): string;
          public constructor(param0: T, param1: T);
          public static fromStartAndEndValues(param0: number, param1: number, param2: number, param3: number): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
          public getStart(): T;
          public getEnd(): T;
          public component1(): T;
          public copy(param0: T, param1: T): org.nativescript.mason.masonkit.Line<T>;
          public hashCode(): number;
          public component2(): T;
        }
        export module Line {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Line.Companion>;
            public fromStartAndEndValues(param0: number, param1: number, param2: number, param3: number): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
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
            public getGson$masonkit_release(): com.google.gson.Gson;
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
        export abstract class MaxSizing {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing>;
          public getType(): number;
          public static fromTypeValue(param0: number, param1: number): org.nativescript.mason.masonkit.MaxSizing;
          public getValue(): number;
        }
        export module MaxSizing {
          export class Auto extends org.nativescript.mason.masonkit.MaxSizing {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.Auto>;
            public static INSTANCE: org.nativescript.mason.masonkit.MaxSizing.Auto;
          }
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.Companion>;
            public fromTypeValue(param0: number, param1: number): org.nativescript.mason.masonkit.MaxSizing;
          }
          export class FitContent extends org.nativescript.mason.masonkit.MaxSizing {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.FitContent>;
            public getFitContent(): number;
            public constructor(param0: number);
            public setFitContent(param0: number): void;
            public hashCode(): number;
            public equals(param0: any): boolean;
            public component1(): number;
            public toString(): string;
            public copy(param0: number): org.nativescript.mason.masonkit.MaxSizing.FitContent;
          }
          export class FitContentPercent extends org.nativescript.mason.masonkit.MaxSizing {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.FitContentPercent>;
            public getFitContent(): number;
            public constructor(param0: number);
            public setFitContent(param0: number): void;
            public copy(param0: number): org.nativescript.mason.masonkit.MaxSizing.FitContentPercent;
            public hashCode(): number;
            public equals(param0: any): boolean;
            public component1(): number;
            public toString(): string;
          }
          export class Fraction extends org.nativescript.mason.masonkit.MaxSizing {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.Fraction>;
            public constructor(param0: number);
            public hashCode(): number;
            public equals(param0: any): boolean;
            public copy(param0: number): org.nativescript.mason.masonkit.MaxSizing.Fraction;
            public setFraction(param0: number): void;
            public getFraction(): number;
            public component1(): number;
            public toString(): string;
          }
          export class MaxContent extends org.nativescript.mason.masonkit.MaxSizing {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.MaxContent>;
            public static INSTANCE: org.nativescript.mason.masonkit.MaxSizing.MaxContent;
          }
          export class MinContent extends org.nativescript.mason.masonkit.MaxSizing {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.MinContent>;
            public static INSTANCE: org.nativescript.mason.masonkit.MaxSizing.MinContent;
          }
          export class Percent extends org.nativescript.mason.masonkit.MaxSizing {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.Percent>;
            public copy(param0: number): org.nativescript.mason.masonkit.MaxSizing.Percent;
            public getPercentage(): number;
            public constructor(param0: number);
            public setPercentage(param0: number): void;
            public hashCode(): number;
            public equals(param0: any): boolean;
            public component1(): number;
            public toString(): string;
          }
          export class Points extends org.nativescript.mason.masonkit.MaxSizing {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.Points>;
            public setPoints(param0: number): void;
            public constructor(param0: number);
            public hashCode(): number;
            public equals(param0: any): boolean;
            public getPoints(): number;
            public component1(): number;
            public copy(param0: number): org.nativescript.mason.masonkit.MaxSizing.Points;
            public toString(): string;
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
        export abstract class MinMax {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax>;
          public getCssValue(): string;
          public getMax(): org.nativescript.mason.masonkit.MaxSizing;
          public getMaxValue(): number;
          public static fromTypeValue(param0: number, param1: number, param2: number, param3: number): org.nativescript.mason.masonkit.MinMax;
          public getMaxType(): number;
          public getMin(): org.nativescript.mason.masonkit.MinSizing;
          public getMinType(): number;
          public getMinValue(): number;
        }
        export module MinMax {
          export class Auto extends org.nativescript.mason.masonkit.MinMax {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.Auto>;
            public static INSTANCE: org.nativescript.mason.masonkit.MinMax.Auto;
          }
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.Companion>;
            public fromTypeValue(param0: number, param1: number, param2: number, param3: number): org.nativescript.mason.masonkit.MinMax;
          }
          export class FitContent extends org.nativescript.mason.masonkit.MinMax {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.FitContent>;
            public setPoints(param0: number): void;
            public copy(param0: number): org.nativescript.mason.masonkit.MinMax.FitContent;
            public constructor(param0: number);
            public hashCode(): number;
            public equals(param0: any): boolean;
            public getPoints(): number;
            public component1(): number;
            public toString(): string;
          }
          export class FitContentPercent extends org.nativescript.mason.masonkit.MinMax {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.FitContentPercent>;
            public constructor(param0: number);
            public hashCode(): number;
            public equals(param0: any): boolean;
            public setPercent(param0: number): void;
            public copy(param0: number): org.nativescript.mason.masonkit.MinMax.FitContentPercent;
            public component1(): number;
            public getPercent(): number;
            public toString(): string;
          }
          export class Fraction extends org.nativescript.mason.masonkit.MinMax {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.Fraction>;
            public copy(param0: number): org.nativescript.mason.masonkit.MinMax.Fraction;
            public constructor(param0: number);
            public hashCode(): number;
            public equals(param0: any): boolean;
            public setFraction(param0: number): void;
            public getFraction(): number;
            public component1(): number;
            public toString(): string;
          }
          export class MaxContent extends org.nativescript.mason.masonkit.MinMax {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.MaxContent>;
            public static INSTANCE: org.nativescript.mason.masonkit.MinMax.MaxContent;
          }
          export class MinContent extends org.nativescript.mason.masonkit.MinMax {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.MinContent>;
            public static INSTANCE: org.nativescript.mason.masonkit.MinMax.MinContent;
          }
          export class Percent extends org.nativescript.mason.masonkit.MinMax {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.Percent>;
            public getPercentage(): number;
            public constructor(param0: number);
            public setPercentage(param0: number): void;
            public hashCode(): number;
            public equals(param0: any): boolean;
            public component1(): number;
            public copy(param0: number): org.nativescript.mason.masonkit.MinMax.Percent;
            public toString(): string;
          }
          export class Points extends org.nativescript.mason.masonkit.MinMax {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.Points>;
            public constructor(param0: number);
            public hashCode(): number;
            public equals(param0: any): boolean;
            public getPoints(): number;
            public component1(): number;
            public copy(param0: number): org.nativescript.mason.masonkit.MinMax.Points;
            public toString(): string;
          }
          export class Values extends org.nativescript.mason.masonkit.MinMax {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.Values>;
            public hashCode(): number;
            public equals(param0: any): boolean;
            public getMinVal(): org.nativescript.mason.masonkit.MinSizing;
            public component1(): org.nativescript.mason.masonkit.MinSizing;
            public component2(): org.nativescript.mason.masonkit.MaxSizing;
            public constructor(param0: org.nativescript.mason.masonkit.MinSizing, param1: org.nativescript.mason.masonkit.MaxSizing);
            public copy(param0: org.nativescript.mason.masonkit.MinSizing, param1: org.nativescript.mason.masonkit.MaxSizing): org.nativescript.mason.masonkit.MinMax.Values;
            public getMaxVal(): org.nativescript.mason.masonkit.MaxSizing;
            public toString(): string;
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
        export abstract class MinSizing {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.MinSizing>;
          public getType(): number;
          public getValue(): number;
          public static fromTypeValue(param0: number, param1: number): org.nativescript.mason.masonkit.MinSizing;
        }
        export module MinSizing {
          export class Auto extends org.nativescript.mason.masonkit.MinSizing {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinSizing.Auto>;
            public static INSTANCE: org.nativescript.mason.masonkit.MinSizing.Auto;
          }
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinSizing.Companion>;
            public fromTypeValue(param0: number, param1: number): org.nativescript.mason.masonkit.MinSizing;
          }
          export class MaxContent extends org.nativescript.mason.masonkit.MinSizing {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinSizing.MaxContent>;
            public static INSTANCE: org.nativescript.mason.masonkit.MinSizing.MaxContent;
          }
          export class MinContent extends org.nativescript.mason.masonkit.MinSizing {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinSizing.MinContent>;
            public static INSTANCE: org.nativescript.mason.masonkit.MinSizing.MinContent;
          }
          export class Percent extends org.nativescript.mason.masonkit.MinSizing {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinSizing.Percent>;
            public getPercentage(): number;
            public constructor(param0: number);
            public setPercentage(param0: number): void;
            public copy(param0: number): org.nativescript.mason.masonkit.MinSizing.Percent;
            public hashCode(): number;
            public equals(param0: any): boolean;
            public component1(): number;
            public toString(): string;
          }
          export class Points extends org.nativescript.mason.masonkit.MinSizing {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinSizing.Points>;
            public setPoints(param0: number): void;
            public copy(param0: number): org.nativescript.mason.masonkit.MinSizing.Points;
            public constructor(param0: number);
            public hashCode(): number;
            public equals(param0: any): boolean;
            public getPoints(): number;
            public component1(): number;
            public toString(): string;
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
        export class Node {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.Node>;
          public configure(param0: kotlin.jvm.functions.Function1<org.nativescript.mason.masonkit.Node, kotlin.Unit>): void;
          public computeMaxContent(): void;
          public addChild(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Node;
          public getData(): any;
          public constructor(param0: org.nativescript.mason.masonkit.Style, param1: androidNative.Array<org.nativescript.mason.masonkit.Node>);
          public rootCompute(): void;
          public insertChildAfter(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Node): void;
          public removeChild(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Node;
          public getChildAt(param0: number): org.nativescript.mason.masonkit.Node;
          public getChildCount(): number;
          public setOwner$masonkit_release(param0: org.nativescript.mason.masonkit.Node): void;
          public isDirty(): boolean;
          public finalize(): void;
          public layout(): org.nativescript.mason.masonkit.Layout;
          public updateNodeStyle$masonkit_release(): void;
          public setInBatch(param0: boolean): void;
          public insertChildBefore(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Node): void;
          public removeChildAt(param0: number): org.nativescript.mason.masonkit.Node;
          public getStyle(): org.nativescript.mason.masonkit.Style;
          public getOwner(): org.nativescript.mason.masonkit.Node;
          public getChildren(): androidNative.Array<org.nativescript.mason.masonkit.Node>;
          public computeWithViewSize(): void;
          public rootComputeMinContent(): void;
          public removeMeasureFunction(): void;
          public rootComputeWithViewSize(): void;
          public constructor();
          public getRoot(): org.nativescript.mason.masonkit.Node;
          public setMeasureFunction(param0: org.nativescript.mason.masonkit.MeasureFunc): void;
          public getInBatch(): boolean;
          public computeMinContent(): void;
          public addChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
          public computeAndLayout(param0: java.lang.Float): org.nativescript.mason.masonkit.Layout;
          public computeAndLayout(): org.nativescript.mason.masonkit.Layout;
          public compute(): void;
          public isViewGroup(): boolean;
          public removeChildren(): void;
          public compute(param0: number, param1: number): void;
          public static getNodes$masonkit_release(): java.util.WeakHashMap<java.lang.Long, org.nativescript.mason.masonkit.Node>;
          public setData(param0: any): void;
          public setStyle(param0: org.nativescript.mason.masonkit.Style): void;
          public dirty(): void;
          public rootComputeMaxContent(): void;
          public constructor(param0: org.nativescript.mason.masonkit.Style);
          public computeAndLayout(param0: java.lang.Float, param1: java.lang.Float): org.nativescript.mason.masonkit.Layout;
          public constructor(param0: org.nativescript.mason.masonkit.Style, param1: org.nativescript.mason.masonkit.MeasureFunc);
          public rootCompute(param0: number, param1: number): void;
          public getNativePtr(): number;
        }
        export module Node {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Node.Companion>;
            public getNodes$masonkit_release(): java.util.WeakHashMap<java.lang.Long, org.nativescript.mason.masonkit.Node>;
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
        export class NodeHelper {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.NodeHelper>;
          public static INSTANCE: org.nativescript.mason.masonkit.NodeHelper;
          public getAlignSelf(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.AlignSelf;
          public setAspectRatio(param0: org.nativescript.mason.masonkit.Node, param1: java.lang.Float): void;
          public setSizeWidth(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getInsetLeft(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public setAlignContent(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.AlignContent): void;
          public setMaxSize(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getBorderBottom(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
          public setBorderBottom(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setGridColumnStart(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.GridPlacement): void;
          public getMinSizeHeight(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Dimension;
          public getGridAutoRows(param0: org.nativescript.mason.masonkit.Node): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
          public getFlexDirection(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.FlexDirection;
          public getDisplay(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Display;
          public getBorder(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
          public getMarginJsonValue(param0: org.nativescript.mason.masonkit.Node): string;
          public setMargin(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.LengthPercentageAuto, param2: org.nativescript.mason.masonkit.LengthPercentageAuto, param3: org.nativescript.mason.masonkit.LengthPercentageAuto, param4: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
          public getPosition(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Position;
          public getInsetRight(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public setGap(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number, param3: number, param4: number): void;
          public setPosition(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number, param3: number, param4: number): void;
          public getMinSize(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
          public setGridRowStart(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.GridPlacement): void;
          public setMinSizeHeight(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getPadding(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
          public setMarginBottom(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setBorder(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.LengthPercentage, param2: org.nativescript.mason.masonkit.LengthPercentage, param3: org.nativescript.mason.masonkit.LengthPercentage, param4: org.nativescript.mason.masonkit.LengthPercentage): void;
          public getAlignItems(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.AlignItems;
          public setFlexBasis(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Dimension): void;
          public setFlexBasis(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setMargin(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number, param3: number, param4: number, param5: number, param6: number, param7: number, param8: number): void;
          public getGridRowStart(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.GridPlacement;
          public getGridAutoColumns(param0: org.nativescript.mason.masonkit.Node): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
          public setPaddingBottom(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setMinSizeHeight(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Dimension): void;
          public setJustifyItems(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.JustifyItems): void;
          public getBorderLeft(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
          public getInsetJsonValue(param0: org.nativescript.mason.masonkit.Node): string;
          public setBorderTop(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setGridRowEnd(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.GridPlacement): void;
          public getMarginLeft(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public getStylePaddingLeft(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
          public getSizeJsonValue(param0: org.nativescript.mason.masonkit.Node): string;
          public getStylePaddingBottom(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
          public setBorderLeft(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getGap(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>;
          public setMaxSizeWidth(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getStylePaddingTop(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
          public getMargin(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
          public setGridAutoColumns(param0: org.nativescript.mason.masonkit.Node, param1: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
          public getSize(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
          public getJustifyContent(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.JustifyContent;
          public getMarginTop(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public getBorderJsonValue(param0: org.nativescript.mason.masonkit.Node): string;
          public setMinSize(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setInsetLeft(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setBorderRight(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getGapColumn(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
          public getGridTemplateRows(param0: org.nativescript.mason.masonkit.Node): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
          public getBorderCssValue(param0: org.nativescript.mason.masonkit.Node): string;
          public getMinSizeJsonValue(param0: org.nativescript.mason.masonkit.Node): string;
          public setFlexWrap(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.FlexWrap): void;
          public getInsetCssValue(param0: org.nativescript.mason.masonkit.Node): string;
          public getInsetBottom(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public getGridColumnStart(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.GridPlacement;
          public getJustifyItems(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.JustifyItems;
          public setInset(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number, param3: number, param4: number, param5: number, param6: number, param7: number, param8: number): void;
          public getFlexWrap(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.FlexWrap;
          public getMaxSizeWidth(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Dimension;
          public setGridAutoRows(param0: org.nativescript.mason.masonkit.Node, param1: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
          public setJustifyContent(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.JustifyContent): void;
          public setGapRow(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getMarginRight(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public getSizeHeight(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Dimension;
          public setSize(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number, param3: number, param4: number): void;
          public getPaddingCssValue(param0: org.nativescript.mason.masonkit.Node): string;
          public setRowGap(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setPadding(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number, param3: number, param4: number, param5: number, param6: number, param7: number, param8: number): void;
          public getGridTemplateColumns(param0: org.nativescript.mason.masonkit.Node): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
          public getMinSizeCssValue(param0: org.nativescript.mason.masonkit.Node): string;
          public setMaxSize(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Dimension, param2: org.nativescript.mason.masonkit.Dimension): void;
          public setMaxSizeHeight(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Dimension): void;
          public getMaxSizeHeight(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Dimension;
          public getAlignContent(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.AlignContent;
          public setPadding(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.LengthPercentage, param2: org.nativescript.mason.masonkit.LengthPercentage, param3: org.nativescript.mason.masonkit.LengthPercentage, param4: org.nativescript.mason.masonkit.LengthPercentage): void;
          public setMarginWithValueType(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getGridRowEnd(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.GridPlacement;
          public setColumnGap(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getInsetTop(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public setMaxSizeHeight(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setPadding(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number, param3: number, param4: number): void;
          public setMarginRight(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getFlexBasis(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Dimension;
          public setMinSize(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number, param3: number, param4: number): void;
          public getInset(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
          public setSizeHeight(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getFlexGrow(param0: org.nativescript.mason.masonkit.Node): number;
          public setGridColumnEnd(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.GridPlacement): void;
          public getMarginCssValue(param0: org.nativescript.mason.masonkit.Node): string;
          public setInsetWithValueType(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setJustifySelf(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.JustifySelf): void;
          public getFlexShrink(param0: org.nativescript.mason.masonkit.Node): number;
          public setInsetTop(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setGap(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.LengthPercentage, param2: org.nativescript.mason.masonkit.LengthPercentage): void;
          public getBorderRight(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
          public setGridTemplateColumns(param0: org.nativescript.mason.masonkit.Node, param1: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
          public setMinSizeWidth(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setGridColumn(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
          public setPaddingTop(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setGapColumn(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getSizeCssValue(param0: org.nativescript.mason.masonkit.Node): string;
          public setOverflow(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Overflow): void;
          public setInsetBottom(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getGridColumn(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
          public setMinSize(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Dimension, param2: org.nativescript.mason.masonkit.Dimension): void;
          public getGridAutoFlow(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.GridAutoFlow;
          public setInsetRight(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getMinSizeWidth(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Dimension;
          public getStylePaddingRight(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
          public setSize(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Dimension, param2: org.nativescript.mason.masonkit.Dimension): void;
          public getOverflow(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Overflow;
          public setBorderWithValueType(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getDirection(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Direction;
          public getMaxSizeJsonValue(param0: org.nativescript.mason.masonkit.Node): string;
          public setGap(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setBorder(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number, param3: number, param4: number): void;
          public setFlexShrink(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
          public getMarginBottom(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public getMaxSize(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
          public getJustifySelf(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.JustifySelf;
          public setAlignSelf(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.AlignSelf): void;
          public setDisplay(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Display): void;
          public getSizeWidth(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Dimension;
          public setFlexGrow(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
          public setBorder(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number, param3: number, param4: number, param5: number, param6: number, param7: number, param8: number): void;
          public setAlignItems(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.AlignItems): void;
          public setMarginTop(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setMinSizeWidth(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Dimension): void;
          public setSize(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setFlexDirection(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.FlexDirection): void;
          public setGridTemplateRows(param0: org.nativescript.mason.masonkit.Node, param1: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
          public getMaxSizeCssValue(param0: org.nativescript.mason.masonkit.Node): string;
          public getPaddingJsonValue(param0: org.nativescript.mason.masonkit.Node): string;
          public setPaddingWithValueType(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getGapRow(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
          public getGridColumnEnd(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.GridPlacement;
          public getBorderTop(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
          public getGridRow(param0: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
          public setDirection(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Direction): void;
          public setMargin(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number, param3: number, param4: number): void;
          public setPaddingRight(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setSizeWidth(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Dimension): void;
          public setMaxSize(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number, param3: number, param4: number): void;
          public setMaxSizeWidth(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Dimension): void;
          public configure(param0: org.nativescript.mason.masonkit.Node, param1: kotlin.jvm.functions.Function1<org.nativescript.mason.masonkit.Node, kotlin.Unit>): void;
          public setMarginLeft(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public getAspectRatio(param0: org.nativescript.mason.masonkit.Node): java.lang.Float;
          public setGridAutoFlow(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.GridAutoFlow): void;
          public setPosition(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Position): void;
          public setPaddingLeft(param0: org.nativescript.mason.masonkit.Node, param1: number, param2: number): void;
          public setPosition(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.LengthPercentageAuto, param2: org.nativescript.mason.masonkit.LengthPercentageAuto, param3: org.nativescript.mason.masonkit.LengthPercentageAuto, param4: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
          public setGridRow(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
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
          public getCssValue(): string;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.Overflow;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.Overflow>;
        }
        export module Overflow {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Overflow.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.Overflow;
          }
          export class WhenMappings {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Overflow.WhenMappings>;
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
        export class Position {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.Position>;
          public static Relative: org.nativescript.mason.masonkit.Position;
          public static Absolute: org.nativescript.mason.masonkit.Position;
          public getCssValue(): string;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.Position>;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.Position;
        }
        export module Position {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Position.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.Position;
          }
          export class WhenMappings {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Position.WhenMappings>;
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
          public setHeight(param0: T): void;
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
          public getGridTemplateRows(): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
          public setMarginTop(param0: number, param1: number): void;
          public getAlignItems(): org.nativescript.mason.masonkit.AlignItems;
          public finalize(): void;
          public setInsetRight(param0: number, param1: number): void;
          public getGridRowStart(): org.nativescript.mason.masonkit.GridPlacement;
          public getGap(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>;
          public setGridAutoColumns(param0: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
          public constructor();
          public setMarginRight(param0: number, param1: number): void;
          public setBorder(param0: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>): void;
          public setMaxSizeHeight(param0: number, param1: number): void;
          public getPosition(): org.nativescript.mason.masonkit.Position;
          public getFlexBasis(): org.nativescript.mason.masonkit.Dimension;
          public setSizeHeight(param0: org.nativescript.mason.masonkit.Dimension): void;
          public setMinSizeHeight(param0: number, param1: number): void;
          public getJustifySelf(): org.nativescript.mason.masonkit.JustifySelf;
          public setBorderRight(param0: number, param1: number): void;
          public setJustifyContent(param0: org.nativescript.mason.masonkit.JustifyContent): void;
          public getGridColumnStart(): org.nativescript.mason.masonkit.GridPlacement;
          public setSizeWidth(param0: number, param1: number): void;
          public getGridAutoColumns(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
          public setGridAutoFlow(param0: org.nativescript.mason.masonkit.GridAutoFlow): void;
          public setBorderBottom(param0: number, param1: number): void;
          public setDirection(param0: org.nativescript.mason.masonkit.Direction): void;
          public setMinSizeWidth(param0: org.nativescript.mason.masonkit.Dimension): void;
          public getOverflow(): org.nativescript.mason.masonkit.Overflow;
          public getInset(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
          public setMargin(param0: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>): void;
          public getMaxSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
          public getGridRowEnd(): org.nativescript.mason.masonkit.GridPlacement;
          public setInsetWithValueType(param0: number, param1: number): void;
          public getFlexGrow(): number;
          public setSize(param0: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
          public setPadding(param0: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>): void;
          public getDirection(): org.nativescript.mason.masonkit.Direction;
          public setPaddingLeft(param0: number, param1: number): void;
          public setPaddingBottom(param0: number, param1: number): void;
          public setGridTemplateRows(param0: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
          public setMaxSizeWidth(param0: org.nativescript.mason.masonkit.Dimension): void;
          public isDirty$masonkit_release(): boolean;
          public setGridRowStart(param0: org.nativescript.mason.masonkit.GridPlacement): void;
          public getFlexWrap(): org.nativescript.mason.masonkit.FlexWrap;
          public setJustifySelf(param0: org.nativescript.mason.masonkit.JustifySelf): void;
          public setMarginWithValueType(param0: number, param1: number): void;
          public setInsetTop(param0: number, param1: number): void;
          public setAlignContent(param0: org.nativescript.mason.masonkit.AlignContent): void;
          public setOverflow(param0: org.nativescript.mason.masonkit.Overflow): void;
          public setMinSizeHeight(param0: org.nativescript.mason.masonkit.Dimension): void;
          public getAlignContent(): org.nativescript.mason.masonkit.AlignContent;
          public setMaxSize(param0: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
          public getPadding(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
          public setSizeHeight(param0: number, param1: number): void;
          public setDirty$masonkit_release(param0: boolean): void;
          public setAspectRatio(param0: java.lang.Float): void;
          public getBorder(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
          public setFlexBasis(param0: org.nativescript.mason.masonkit.Dimension): void;
          public setFlexGrow(param0: number): void;
          public getSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
          public setBorderLeft(param0: number, param1: number): void;
          public setGridRow(param0: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
          public setFlexDirection(param0: org.nativescript.mason.masonkit.FlexDirection): void;
          public setGap(param0: number, param1: number, param2: number, param3: number): void;
          public setJustifyItems(param0: org.nativescript.mason.masonkit.JustifyItems): void;
          public getAlignSelf(): org.nativescript.mason.masonkit.AlignSelf;
          public getGridAutoRows(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
          public setMarginBottom(param0: number, param1: number): void;
          public setPaddingRight(param0: number, param1: number): void;
          public setAlignItems(param0: org.nativescript.mason.masonkit.AlignItems): void;
          public getJustifyItems(): org.nativescript.mason.masonkit.JustifyItems;
          public setDisplay(param0: org.nativescript.mason.masonkit.Display): void;
          public getFlexDirection(): org.nativescript.mason.masonkit.FlexDirection;
          public setMinSizeWidth(param0: number, param1: number): void;
          public getGridColumn(): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
          public setFlexShrink(param0: number): void;
          public setFlexBasis(param0: number, param1: number): void;
          public setMaxSizeHeight(param0: org.nativescript.mason.masonkit.Dimension): void;
          public setBorderWithValueType(param0: number, param1: number): void;
          public getDisplay(): org.nativescript.mason.masonkit.Display;
          public getMinSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
          public setPaddingWithValueType(param0: number, param1: number): void;
          public setBorderTop(param0: number, param1: number): void;
          public setMarginLeft(param0: number, param1: number): void;
          public getMargin(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
          public setGridColumn(param0: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
          public setGridAutoRows(param0: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
          public getJustifyContent(): org.nativescript.mason.masonkit.JustifyContent;
          public getGridRow(): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
          public setInsetBottom(param0: number, param1: number): void;
          public setGapRow(param0: number, param1: number): void;
          public setGridRowEnd(param0: org.nativescript.mason.masonkit.GridPlacement): void;
          public setSizeWidth(param0: org.nativescript.mason.masonkit.Dimension): void;
          public setFlexWrap(param0: org.nativescript.mason.masonkit.FlexWrap): void;
          public setGap(param0: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>): void;
          public setMinSize(param0: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
          public toString(): string;
          public getGridTemplateColumns(): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
          public getGridAutoFlow(): org.nativescript.mason.masonkit.GridAutoFlow;
          public setAlignSelf(param0: org.nativescript.mason.masonkit.AlignSelf): void;
          public setInset(param0: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>): void;
          public getAspectRatio(): java.lang.Float;
          public setGridColumnEnd(param0: org.nativescript.mason.masonkit.GridPlacement): void;
          public setPaddingTop(param0: number, param1: number): void;
          public setInsetLeft(param0: number, param1: number): void;
          public getGridColumnEnd(): org.nativescript.mason.masonkit.GridPlacement;
          public getFlexShrink(): number;
          public setPosition(param0: org.nativescript.mason.masonkit.Position): void;
          public setGapColumn(param0: number, param1: number): void;
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
            param62: number,
            param63: androidNative.Array<org.nativescript.mason.masonkit.MinMax>,
            param64: androidNative.Array<org.nativescript.mason.masonkit.MinMax>,
            param65: number,
            param66: number,
            param67: number,
            param68: number,
            param69: number,
            param70: number,
            param71: number,
            param72: number,
            param73: number,
            param74: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>,
            param75: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>
          ): void;
          public setGridTemplateColumns(param0: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
          public setMaxSizeWidth(param0: number, param1: number): void;
          public setGridColumnStart(param0: org.nativescript.mason.masonkit.GridPlacement): void;
          public getNativePtr(): number;
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
        export abstract class TrackSizingFunction {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.TrackSizingFunction>;
          public getCssValue(): string;
          public isRepeating(): boolean;
        }
        export module TrackSizingFunction {
          export class AutoRepeat extends org.nativescript.mason.masonkit.TrackSizingFunction {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.TrackSizingFunction.AutoRepeat>;
            public component1(): org.nativescript.mason.masonkit.GridTrackRepetition;
            public component2(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
            public constructor(param0: org.nativescript.mason.masonkit.GridTrackRepetition, param1: androidNative.Array<org.nativescript.mason.masonkit.MinMax>);
            public getGridTrackRepetition(): org.nativescript.mason.masonkit.GridTrackRepetition;
            public equals(param0: any): boolean;
            public hashCode(): number;
            public getValue(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
            public gridTrackRepetitionNativeType(): number;
            public gridTrackRepetitionNativeValue(): number;
            public toString(): string;
            public copy(param0: org.nativescript.mason.masonkit.GridTrackRepetition, param1: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): org.nativescript.mason.masonkit.TrackSizingFunction.AutoRepeat;
          }
          export class Single extends org.nativescript.mason.masonkit.TrackSizingFunction {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.TrackSizingFunction.Single>;
            public constructor(param0: org.nativescript.mason.masonkit.MinMax);
            public copy(param0: org.nativescript.mason.masonkit.MinMax): org.nativescript.mason.masonkit.TrackSizingFunction.Single;
            public hashCode(): number;
            public equals(param0: any): boolean;
            public component1(): org.nativescript.mason.masonkit.MinMax;
            public getValue(): org.nativescript.mason.masonkit.MinMax;
            public toString(): string;
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
          public getGridTemplateRows(): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
          public setMarginTop(param0: number, param1: number): void;
          public setMargin(param0: number, param1: number, param2: number, param3: number): void;
          public addView(param0: globalAndroid.view.View, param1: number, param2: globalAndroid.view.ViewGroup.LayoutParams): void;
          public getInBatch(): boolean;
          public getPosition(): org.nativescript.mason.masonkit.Position;
          public getFlexBasis(): org.nativescript.mason.masonkit.Dimension;
          public setMargin(param0: org.nativescript.mason.masonkit.LengthPercentageAuto, param1: org.nativescript.mason.masonkit.LengthPercentageAuto, param2: org.nativescript.mason.masonkit.LengthPercentageAuto, param3: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
          public setMinSizeHeight(param0: number, param1: number): void;
          public getJustifySelf(): org.nativescript.mason.masonkit.JustifySelf;
          public setJustifyContent(param0: org.nativescript.mason.masonkit.JustifyContent): void;
          public getGridColumnStart(): org.nativescript.mason.masonkit.GridPlacement;
          public setSizeWidth(param0: number, param1: number): void;
          public setGridAutoFlow(param0: org.nativescript.mason.masonkit.GridAutoFlow): void;
          public setBorderBottom(param0: number, param1: number): void;
          public setDirection(param0: org.nativescript.mason.masonkit.Direction): void;
          public setBorder(param0: number, param1: number, param2: number, param3: number, param4: number, param5: number, param6: number, param7: number): void;
          public getBorderLeft(): org.nativescript.mason.masonkit.LengthPercentage;
          public getInset(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
          public getMaxSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
          public getGridRowEnd(): org.nativescript.mason.masonkit.GridPlacement;
          public addViews(param0: androidNative.Array<globalAndroid.view.View>): void;
          public getFlexGrow(): number;
          public applyLayoutParams(param0: org.nativescript.mason.masonkit.View.LayoutParams, param1: org.nativescript.mason.masonkit.Node, param2: globalAndroid.view.View): void;
          public updateNodeAndStyle(): void;
          public setStyleFromString(param0: string): void;
          public getBorderBottom(): org.nativescript.mason.masonkit.LengthPercentage;
          public getInsetRight(): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public getDirection(): org.nativescript.mason.masonkit.Direction;
          public getMaxSizeHeight(): org.nativescript.mason.masonkit.Dimension;
          public setGridRowStart(param0: org.nativescript.mason.masonkit.GridPlacement): void;
          public getFlexWrap(): org.nativescript.mason.masonkit.FlexWrap;
          public setJustifySelf(param0: org.nativescript.mason.masonkit.JustifySelf): void;
          public addViews(param0: androidNative.Array<globalAndroid.view.View>, param1: number): void;
          public getStylePaddingLeft(): org.nativescript.mason.masonkit.LengthPercentage;
          public generateDefaultLayoutParams(): globalAndroid.view.ViewGroup.LayoutParams;
          public getMarginJsonValue(): string;
          public getInsetJsonValue(): string;
          public getMarginRight(): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public invalidate(param0: globalAndroid.view.View): void;
          public getAlignContent(): org.nativescript.mason.masonkit.AlignContent;
          public setAspectRatio(param0: java.lang.Float): void;
          public removeViewAt(param0: number): void;
          public getInsetLeft(): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public setGap(param0: number, param1: number, param2: number, param3: number): void;
          public setJustifyItems(param0: org.nativescript.mason.masonkit.JustifyItems): void;
          public getMarginBottom(): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public setMarginBottom(param0: number, param1: number): void;
          public setInBatch(param0: boolean): void;
          public setPaddingRight(param0: number, param1: number): void;
          public getInsetCssValue(): string;
          public getMaxSizeJsonValue(): string;
          public addView(param0: globalAndroid.view.View, param1: org.nativescript.mason.masonkit.Node): void;
          public getFlexDirection(): org.nativescript.mason.masonkit.FlexDirection;
          public getStylePaddingRight(): org.nativescript.mason.masonkit.LengthPercentage;
          public setMinSizeWidth(param0: number, param1: number): void;
          public setFlexShrink(param0: number): void;
          public setSize(param0: number, param1: number, param2: number, param3: number): void;
          public setBorderWithValueType(param0: number, param1: number): void;
          public setPaddingWithValueType(param0: number, param1: number): void;
          public setBorderTop(param0: number, param1: number): void;
          public getMargin(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
          public getPaddingCssValue(): string;
          public getGapRow(): org.nativescript.mason.masonkit.LengthPercentage;
          public getGridRow(): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
          public setGridRowEnd(param0: org.nativescript.mason.masonkit.GridPlacement): void;
          public getInsetTop(): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public getSizeCssValue(): string;
          public getGridTemplateColumns(): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
          public setPadding(param0: number, param1: number, param2: number, param3: number, param4: number, param5: number, param6: number, param7: number): void;
          public getGridAutoFlow(): org.nativescript.mason.masonkit.GridAutoFlow;
          public getAspectRatio(): java.lang.Float;
          public setPaddingTop(param0: number, param1: number): void;
          public setInsetLeft(param0: number, param1: number): void;
          public constructor(param0: globalAndroid.content.Context, param1: globalAndroid.util.AttributeSet, param2: number);
          public getPaddingJsonValue(): string;
          public getFlexShrink(): number;
          public setStyle(param0: org.nativescript.mason.masonkit.Style): void;
          public setPosition(param0: org.nativescript.mason.masonkit.Position): void;
          public removeAllViews(): void;
          public getMarginTop(): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public getMasonPtr(): number;
          public getNode(): org.nativescript.mason.masonkit.Node;
          public setGridTemplateColumns(param0: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
          public onLayout(param0: boolean, param1: number, param2: number, param3: number, param4: number): void;
          public setGridColumnStart(param0: org.nativescript.mason.masonkit.GridPlacement): void;
          public getMinSizeJsonValue(): string;
          public getStyleAsString(): string;
          public nodeForView(param0: globalAndroid.view.View): org.nativescript.mason.masonkit.Node;
          public getAlignItems(): org.nativescript.mason.masonkit.AlignItems;
          public setInsetRight(param0: number, param1: number): void;
          public getGridRowStart(): org.nativescript.mason.masonkit.GridPlacement;
          public getGap(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>;
          public constructor(param0: globalAndroid.content.Context, param1: globalAndroid.util.AttributeSet);
          public setGridAutoColumns(param0: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
          public setMarginRight(param0: number, param1: number): void;
          public setMaxSizeHeight(param0: number, param1: number): void;
          public setPadding(param0: number, param1: number, param2: number, param3: number): void;
          public setBorderRight(param0: number, param1: number): void;
          public getInsetBottom(): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public getGridAutoColumns(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
          public getBorderCssValue(): string;
          public getMinSizeCssValue(): string;
          public getOverflow(): org.nativescript.mason.masonkit.Overflow;
          public setInsetWithValueType(param0: number, param1: number): void;
          public isNodeDirty(): boolean;
          public setMinSize(param0: number, param1: number): void;
          public setSize(param0: number, param1: number): void;
          public setMinSize(param0: org.nativescript.mason.masonkit.Dimension, param1: org.nativescript.mason.masonkit.Dimension): void;
          public setPaddingLeft(param0: number, param1: number): void;
          public setPaddingBottom(param0: number, param1: number): void;
          public setGridTemplateRows(param0: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
          public static createGridView(param0: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
          public removeAllViewsInLayout(): void;
          public setGap(param0: number, param1: number): void;
          public removeViewInLayout(param0: globalAndroid.view.View): void;
          public setMarginWithValueType(param0: number, param1: number): void;
          public setMaxSize(param0: number, param1: number): void;
          public getSizeWidth(): org.nativescript.mason.masonkit.Dimension;
          public setInsetTop(param0: number, param1: number): void;
          public markNodeDirty(): void;
          public setAlignContent(param0: org.nativescript.mason.masonkit.AlignContent): void;
          public setOverflow(param0: org.nativescript.mason.masonkit.Overflow): void;
          public onMeasure(param0: number, param1: number): void;
          public getPadding(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
          public setSizeHeight(param0: number, param1: number): void;
          public generateLayoutParams(param0: globalAndroid.util.AttributeSet): globalAndroid.view.ViewGroup.LayoutParams;
          public getBorderTop(): org.nativescript.mason.masonkit.LengthPercentage;
          public constructor(param0: globalAndroid.content.Context);
          public getBorder(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
          public getBorderRight(): org.nativescript.mason.masonkit.LengthPercentage;
          public setFlexBasis(param0: org.nativescript.mason.masonkit.Dimension): void;
          public setFlexGrow(param0: number): void;
          public getSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
          public setBorderLeft(param0: number, param1: number): void;
          public setGridRow(param0: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
          public setFlexDirection(param0: org.nativescript.mason.masonkit.FlexDirection): void;
          public setPadding(param0: org.nativescript.mason.masonkit.LengthPercentage, param1: org.nativescript.mason.masonkit.LengthPercentage, param2: org.nativescript.mason.masonkit.LengthPercentage, param3: org.nativescript.mason.masonkit.LengthPercentage): void;
          public configure(param0: kotlin.jvm.functions.Function1<org.nativescript.mason.masonkit.Node, kotlin.Unit>): void;
          public getAlignSelf(): org.nativescript.mason.masonkit.AlignSelf;
          public getGridAutoRows(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
          public getMasonNodePtr(): number;
          public getMasonStylePtr(): number;
          public getStyle(): org.nativescript.mason.masonkit.Style;
          public setAlignItems(param0: org.nativescript.mason.masonkit.AlignItems): void;
          public getJustifyItems(): org.nativescript.mason.masonkit.JustifyItems;
          public generateLayoutParams(param0: globalAndroid.view.ViewGroup.LayoutParams): globalAndroid.view.ViewGroup.LayoutParams;
          public setDisplay(param0: org.nativescript.mason.masonkit.Display): void;
          public setPosition(param0: number, param1: number, param2: number, param3: number): void;
          public setMaxSize(param0: org.nativescript.mason.masonkit.Dimension, param1: org.nativescript.mason.masonkit.Dimension): void;
          public getMinSizeHeight(): org.nativescript.mason.masonkit.Dimension;
          public getGridColumn(): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
          public setColumnGap(param0: number, param1: number): void;
          public checkLayoutParams(param0: globalAndroid.view.ViewGroup.LayoutParams): boolean;
          public setInset(param0: number, param1: number, param2: number, param3: number, param4: number, param5: number, param6: number, param7: number): void;
          public removeViews(param0: number, param1: number): void;
          public setFlexBasis(param0: number, param1: number): void;
          public getStylePaddingTop(): org.nativescript.mason.masonkit.LengthPercentage;
          public getDisplay(): org.nativescript.mason.masonkit.Display;
          public getMinSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
          public getMarginCssValue(): string;
          public setMarginLeft(param0: number, param1: number): void;
          public setGridColumn(param0: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
          public setGridAutoRows(param0: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
          public getGapColumn(): org.nativescript.mason.masonkit.LengthPercentage;
          public getJustifyContent(): org.nativescript.mason.masonkit.JustifyContent;
          public setGap(param0: org.nativescript.mason.masonkit.LengthPercentage, param1: org.nativescript.mason.masonkit.LengthPercentage): void;
          public getMinSizeWidth(): org.nativescript.mason.masonkit.Dimension;
          public removeViewsInLayout(param0: number, param1: number): void;
          public getBorderJsonValue(): string;
          public setInsetBottom(param0: number, param1: number): void;
          public setGapRow(param0: number, param1: number): void;
          public getMaxSizeCssValue(): string;
          public setFlexWrap(param0: org.nativescript.mason.masonkit.FlexWrap): void;
          public setBorder(param0: org.nativescript.mason.masonkit.LengthPercentage, param1: org.nativescript.mason.masonkit.LengthPercentage, param2: org.nativescript.mason.masonkit.LengthPercentage, param3: org.nativescript.mason.masonkit.LengthPercentage): void;
          public setMaxSize(param0: number, param1: number, param2: number, param3: number): void;
          public static createFlexView(param0: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
          public setMargin(param0: number, param1: number, param2: number, param3: number, param4: number, param5: number, param6: number, param7: number): void;
          public setPosition(param0: org.nativescript.mason.masonkit.LengthPercentageAuto, param1: org.nativescript.mason.masonkit.LengthPercentageAuto, param2: org.nativescript.mason.masonkit.LengthPercentageAuto, param3: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
          public getMarginLeft(): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public setAlignSelf(param0: org.nativescript.mason.masonkit.AlignSelf): void;
          public setGridColumnEnd(param0: org.nativescript.mason.masonkit.GridPlacement): void;
          public setBorder(param0: number, param1: number, param2: number, param3: number): void;
          public getStylePaddingBottom(): org.nativescript.mason.masonkit.LengthPercentage;
          public getGridColumnEnd(): org.nativescript.mason.masonkit.GridPlacement;
          public setSize(param0: org.nativescript.mason.masonkit.Dimension, param1: org.nativescript.mason.masonkit.Dimension): void;
          public getMaxSizeWidth(): org.nativescript.mason.masonkit.Dimension;
          public removeView(param0: globalAndroid.view.View): void;
          public setGapColumn(param0: number, param1: number): void;
          public setRowGap(param0: number, param1: number): void;
          public setMinSize(param0: number, param1: number, param2: number, param3: number): void;
          public getSizeJsonValue(): string;
          public setMaxSizeWidth(param0: number, param1: number): void;
          public getSizeHeight(): org.nativescript.mason.masonkit.Dimension;
        }
        export module View {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.View.Companion>;
            public createGridView(param0: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
            public createFlexView(param0: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
            public getGson$masonkit_release(): com.google.gson.Gson;
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

declare module org {
  export module nativescript {
    export module mason {
      export module masonkit {
        export class ViewLayoutFactory {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.ViewLayoutFactory>;
          public onCreateView(param0: string, param1: globalAndroid.content.Context, param2: globalAndroid.util.AttributeSet): globalAndroid.view.View;
          public constructor();
          public static getInstance(): org.nativescript.mason.masonkit.ViewLayoutFactory;
        }
        export module ViewLayoutFactory {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.ViewLayoutFactory.Companion>;
            public getInstance(): org.nativescript.mason.masonkit.ViewLayoutFactory;
          }
        }
      }
    }
  }
}

//Generics information:
//org.nativescript.mason.masonkit.Line:1
//org.nativescript.mason.masonkit.Rect:1
//org.nativescript.mason.masonkit.Size:1
