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
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.AlignContent>;
          public getValue(): number;
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
          public static Normal: org.nativescript.mason.masonkit.AlignItems;
          public static Start: org.nativescript.mason.masonkit.AlignItems;
          public static End: org.nativescript.mason.masonkit.AlignItems;
          public static Center: org.nativescript.mason.masonkit.AlignItems;
          public static Baseline: org.nativescript.mason.masonkit.AlignItems;
          public static Stretch: org.nativescript.mason.masonkit.AlignItems;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.AlignItems;
          public getValue(): number;
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
          public static Normal: org.nativescript.mason.masonkit.AlignSelf;
          public static Start: org.nativescript.mason.masonkit.AlignSelf;
          public static End: org.nativescript.mason.masonkit.AlignSelf;
          public static Center: org.nativescript.mason.masonkit.AlignSelf;
          public static Baseline: org.nativescript.mason.masonkit.AlignSelf;
          public static Stretch: org.nativescript.mason.masonkit.AlignSelf;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.AlignSelf;
          public getValue(): number;
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
          public getCssValue(): string;
          public updateValue$masonkit_release(param0: number): void;
          public getValue$masonkit_release(): number;
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
          public static None: org.nativescript.mason.masonkit.Display;
          public static Flex: org.nativescript.mason.masonkit.Display;
          public static Grid: org.nativescript.mason.masonkit.Display;
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
        export class GridAutoFlow {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.GridAutoFlow>;
          public static Row: org.nativescript.mason.masonkit.GridAutoFlow;
          public static Column: org.nativescript.mason.masonkit.GridAutoFlow;
          public static RowDense: org.nativescript.mason.masonkit.GridAutoFlow;
          public static ColumnDense: org.nativescript.mason.masonkit.GridAutoFlow;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.GridAutoFlow;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.GridAutoFlow>;
        }
        export module GridAutoFlow {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.GridAutoFlow.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.GridAutoFlow;
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
          public getPlacementValue$masonkit_release(): number;
          public getType$masonkit_release(): number;
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
        export class GridTrackRepetition {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.GridTrackRepetition>;
          public static AutoFill: org.nativescript.mason.masonkit.GridTrackRepetition;
          public static AutoFit: org.nativescript.mason.masonkit.GridTrackRepetition;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.GridTrackRepetition>;
          public toInt(): number;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.GridTrackRepetition;
        }
        export module GridTrackRepetition {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.GridTrackRepetition.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.GridTrackRepetition;
          }
          export class WhenMappings {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.GridTrackRepetition.WhenMappings>;
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
          public getValue(): number;
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
        export class JustifyItems {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifyItems>;
          public static Normal: org.nativescript.mason.masonkit.JustifyItems;
          public static Start: org.nativescript.mason.masonkit.JustifyItems;
          public static End: org.nativescript.mason.masonkit.JustifyItems;
          public static Center: org.nativescript.mason.masonkit.JustifyItems;
          public static Baseline: org.nativescript.mason.masonkit.JustifyItems;
          public static Stretch: org.nativescript.mason.masonkit.JustifyItems;
          public getValue(): number;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.JustifyItems;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.JustifyItems>;
        }
        export module JustifyItems {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifyItems.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.JustifyItems;
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
          public getValue(): number;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.JustifySelf>;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.JustifySelf;
        }
        export module JustifySelf {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifySelf.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.JustifySelf;
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
            //	public fromFloatArray$masonkit_release(param0: androidNative.Array<number>, param1: number): any<java.lang.Integer,org.nativescript.mason.masonkit.Layout>;
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
          export class Flex extends org.nativescript.mason.masonkit.MaxSizing {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.Flex>;
            public getFlex(): number;
            public setFlex(param0: number): void;
            public constructor(param0: number);
            public hashCode(): number;
            public equals(param0: any): boolean;
            public copy(param0: number): org.nativescript.mason.masonkit.MaxSizing.Flex;
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
          export class Flex extends org.nativescript.mason.masonkit.MinMax {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.Flex>;
            public getFlex(): number;
            public copy(param0: number): org.nativescript.mason.masonkit.MinMax.Flex;
            public setFlex(param0: number): void;
            public constructor(param0: number);
            public hashCode(): number;
            public equals(param0: any): boolean;
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
          public setInBatch(param0: boolean): void;
          public insertChildBefore(param0: org.nativescript.mason.masonkit.Node, param1: org.nativescript.mason.masonkit.Node): void;
          public removeChildAt(param0: number): org.nativescript.mason.masonkit.Node;
          public getStyle(): org.nativescript.mason.masonkit.Style;
          public getOwner(): org.nativescript.mason.masonkit.Node;
          public getChildren(): androidNative.Array<org.nativescript.mason.masonkit.Node>;
          public removeMeasureFunction(): void;
          public constructor();
          public setMeasureFunction(param0: org.nativescript.mason.masonkit.MeasureFunc): void;
          public getInBatch(): boolean;
          public computeMinContent(): void;
          public addChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
          public computeAndLayout(): org.nativescript.mason.masonkit.Layout;
          public compute(): void;
          public isViewGroup(): boolean;
          public removeChildren(): void;
          public compute(param0: number, param1: number): void;
          public static getNodes$masonkit_release(): java.util.WeakHashMap<java.lang.Long, org.nativescript.mason.masonkit.Node>;
          public setData(param0: any): void;
          public setStyle(param0: org.nativescript.mason.masonkit.Style): void;
          public dirty(): void;
          public constructor(param0: org.nativescript.mason.masonkit.Style);
          public constructor(param0: org.nativescript.mason.masonkit.Style, param1: org.nativescript.mason.masonkit.MeasureFunc);
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
        export class Position {
          public static class: java.lang.Class<org.nativescript.mason.masonkit.Position>;
          public static Relative: org.nativescript.mason.masonkit.Position;
          public static Absolute: org.nativescript.mason.masonkit.Position;
          public static values(): androidNative.Array<org.nativescript.mason.masonkit.Position>;
          public static valueOf(param0: string): org.nativescript.mason.masonkit.Position;
        }
        export module Position {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.Position.Companion>;
            public fromInt(param0: number): org.nativescript.mason.masonkit.Position;
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
          public isDirty$masonkit_release(): boolean;
          public setGridRowStart(param0: org.nativescript.mason.masonkit.GridPlacement): void;
          public getFlexWrap(): org.nativescript.mason.masonkit.FlexWrap;
          public setJustifySelf(param0: org.nativescript.mason.masonkit.JustifySelf): void;
          public setMarginWithValueType(param0: number, param1: number): void;
          public setInsetTop(param0: number, param1: number): void;
          public setAlignContent(param0: org.nativescript.mason.masonkit.AlignContent): void;
          public setOverflow(param0: org.nativescript.mason.masonkit.Overflow): void;
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
          public setFlexWrap(param0: org.nativescript.mason.masonkit.FlexWrap): void;
          public setGap(param0: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>): void;
          public setMinSize(param0: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
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
          public nodeForView(param0: globalAndroid.view.View): org.nativescript.mason.masonkit.Node;
          public getAlignItems(): org.nativescript.mason.masonkit.AlignItems;
          public setInsetRight(param0: number, param1: number): void;
          public getGridRowStart(): org.nativescript.mason.masonkit.GridPlacement;
          public setMargin(param0: number, param1: number, param2: number, param3: number): void;
          public getGap(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>;
          public constructor(param0: globalAndroid.content.Context, param1: globalAndroid.util.AttributeSet);
          public setGridAutoColumns(param0: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
          public setMarginRight(param0: number, param1: number): void;
          public setMaxSizeHeight(param0: number, param1: number): void;
          public addView(param0: globalAndroid.view.View, param1: number, param2: globalAndroid.view.ViewGroup.LayoutParams): void;
          public setPadding(param0: number, param1: number, param2: number, param3: number): void;
          public getInBatch(): boolean;
          public getPosition(): org.nativescript.mason.masonkit.Position;
          public getFlexBasis(): org.nativescript.mason.masonkit.Dimension;
          public setMargin(param0: org.nativescript.mason.masonkit.LengthPercentageAuto, param1: org.nativescript.mason.masonkit.LengthPercentageAuto, param2: org.nativescript.mason.masonkit.LengthPercentageAuto, param3: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
          public setMinSizeHeight(param0: number, param1: number): void;
          public getJustifySelf(): org.nativescript.mason.masonkit.JustifySelf;
          public setBorderRight(param0: number, param1: number): void;
          public getInsetBottom(): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public setJustifyContent(param0: org.nativescript.mason.masonkit.JustifyContent): void;
          public getGridColumnStart(): org.nativescript.mason.masonkit.GridPlacement;
          public setSizeWidth(param0: number, param1: number): void;
          public getGridAutoColumns(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
          public setGridAutoFlow(param0: org.nativescript.mason.masonkit.GridAutoFlow): void;
          public getBorderCssValue(): string;
          public setBorderBottom(param0: number, param1: number): void;
          public setDirection(param0: org.nativescript.mason.masonkit.Direction): void;
          public setBorder(param0: number, param1: number, param2: number, param3: number, param4: number, param5: number, param6: number, param7: number): void;
          public getMinSizeCssValue(): string;
          public getOverflow(): org.nativescript.mason.masonkit.Overflow;
          public getBorderLeft(): org.nativescript.mason.masonkit.LengthPercentage;
          public getInset(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
          public getMaxSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
          public getGridRowEnd(): org.nativescript.mason.masonkit.GridPlacement;
          public addViews(param0: androidNative.Array<globalAndroid.view.View>): void;
          public getFlexGrow(): number;
          public setInsetWithValueType(param0: number, param1: number): void;
          public isNodeDirty(): boolean;
          public applyLayoutParams(param0: org.nativescript.mason.masonkit.View.LayoutParams, param1: org.nativescript.mason.masonkit.Node, param2: globalAndroid.view.View): void;
          public updateNodeAndStyle(): void;
          public setMinSize(param0: number, param1: number): void;
          public setSize(param0: number, param1: number): void;
          public setStyleFromString(param0: string): void;
          public getBorderBottom(): org.nativescript.mason.masonkit.LengthPercentage;
          public setMinSize(param0: org.nativescript.mason.masonkit.Dimension, param1: org.nativescript.mason.masonkit.Dimension): void;
          public getInsetRight(): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public getDirection(): org.nativescript.mason.masonkit.Direction;
          public setPaddingLeft(param0: number, param1: number): void;
          public setPaddingBottom(param0: number, param1: number): void;
          public setGridTemplateRows(param0: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
          public removeAllViewsInLayout(): void;
          public getMaxSizeHeight(): org.nativescript.mason.masonkit.Dimension;
          public setGridRowStart(param0: org.nativescript.mason.masonkit.GridPlacement): void;
          public getFlexWrap(): org.nativescript.mason.masonkit.FlexWrap;
          public setGap(param0: number, param1: number): void;
          public removeViewInLayout(param0: globalAndroid.view.View): void;
          public setJustifySelf(param0: org.nativescript.mason.masonkit.JustifySelf): void;
          public setMarginWithValueType(param0: number, param1: number): void;
          public setMaxSize(param0: number, param1: number): void;
          public getSizeWidth(): org.nativescript.mason.masonkit.Dimension;
          public addViews(param0: androidNative.Array<globalAndroid.view.View>, param1: number): void;
          public setInsetTop(param0: number, param1: number): void;
          public markNodeDirty(): void;
          public setAlignContent(param0: org.nativescript.mason.masonkit.AlignContent): void;
          public getStylePaddingLeft(): org.nativescript.mason.masonkit.LengthPercentage;
          public generateDefaultLayoutParams(): globalAndroid.view.ViewGroup.LayoutParams;
          public getMarginJsonValue(): string;
          public getInsetJsonValue(): string;
          public setOverflow(param0: org.nativescript.mason.masonkit.Overflow): void;
          public getMarginRight(): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public onMeasure(param0: number, param1: number): void;
          public invalidate(param0: globalAndroid.view.View): void;
          public getAlignContent(): org.nativescript.mason.masonkit.AlignContent;
          public getPadding(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
          public setSizeHeight(param0: number, param1: number): void;
          public generateLayoutParams(param0: globalAndroid.util.AttributeSet): globalAndroid.view.ViewGroup.LayoutParams;
          public setAspectRatio(param0: java.lang.Float): void;
          public getBorderTop(): org.nativescript.mason.masonkit.LengthPercentage;
          public constructor(param0: globalAndroid.content.Context);
          public removeViewAt(param0: number): void;
          public getBorder(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
          public getInsetLeft(): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public getBorderRight(): org.nativescript.mason.masonkit.LengthPercentage;
          public setFlexBasis(param0: org.nativescript.mason.masonkit.Dimension): void;
          public setFlexGrow(param0: number): void;
          public getSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
          public setBorderLeft(param0: number, param1: number): void;
          public setGridRow(param0: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
          public setFlexDirection(param0: org.nativescript.mason.masonkit.FlexDirection): void;
          public setPadding(param0: org.nativescript.mason.masonkit.LengthPercentage, param1: org.nativescript.mason.masonkit.LengthPercentage, param2: org.nativescript.mason.masonkit.LengthPercentage, param3: org.nativescript.mason.masonkit.LengthPercentage): void;
          public setGap(param0: number, param1: number, param2: number, param3: number): void;
          public configure(param0: kotlin.jvm.functions.Function1<org.nativescript.mason.masonkit.Node, kotlin.Unit>): void;
          public setJustifyItems(param0: org.nativescript.mason.masonkit.JustifyItems): void;
          public getAlignSelf(): org.nativescript.mason.masonkit.AlignSelf;
          public getGridAutoRows(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
          public getMarginBottom(): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public setMarginBottom(param0: number, param1: number): void;
          public setInBatch(param0: boolean): void;
          public getMasonNodePtr(): number;
          public getMasonStylePtr(): number;
          public getStyle(): org.nativescript.mason.masonkit.Style;
          public setPaddingRight(param0: number, param1: number): void;
          public setAlignItems(param0: org.nativescript.mason.masonkit.AlignItems): void;
          public getJustifyItems(): org.nativescript.mason.masonkit.JustifyItems;
          public getInsetCssValue(): string;
          public generateLayoutParams(param0: globalAndroid.view.ViewGroup.LayoutParams): globalAndroid.view.ViewGroup.LayoutParams;
          public setDisplay(param0: org.nativescript.mason.masonkit.Display): void;
          public getMaxSizeJsonValue(): string;
          public addView(param0: globalAndroid.view.View, param1: org.nativescript.mason.masonkit.Node): void;
          public setPosition(param0: number, param1: number, param2: number, param3: number): void;
          public setMaxSize(param0: org.nativescript.mason.masonkit.Dimension, param1: org.nativescript.mason.masonkit.Dimension): void;
          public getFlexDirection(): org.nativescript.mason.masonkit.FlexDirection;
          public getMinSizeHeight(): org.nativescript.mason.masonkit.Dimension;
          public getStylePaddingRight(): org.nativescript.mason.masonkit.LengthPercentage;
          public setMinSizeWidth(param0: number, param1: number): void;
          public getGridColumn(): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
          public setFlexShrink(param0: number): void;
          public setColumnGap(param0: number, param1: number): void;
          public checkLayoutParams(param0: globalAndroid.view.ViewGroup.LayoutParams): boolean;
          public setInset(param0: number, param1: number, param2: number, param3: number, param4: number, param5: number, param6: number, param7: number): void;
          public removeViews(param0: number, param1: number): void;
          public setFlexBasis(param0: number, param1: number): void;
          public setSize(param0: number, param1: number, param2: number, param3: number): void;
          public getStylePaddingTop(): org.nativescript.mason.masonkit.LengthPercentage;
          public setBorderWithValueType(param0: number, param1: number): void;
          public getDisplay(): org.nativescript.mason.masonkit.Display;
          public getMinSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
          public setPaddingWithValueType(param0: number, param1: number): void;
          public setBorderTop(param0: number, param1: number): void;
          public getMarginCssValue(): string;
          public setMarginLeft(param0: number, param1: number): void;
          public getMargin(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
          public setGridColumn(param0: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
          public getPaddingCssValue(): string;
          public setGridAutoRows(param0: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
          public getGapColumn(): org.nativescript.mason.masonkit.LengthPercentage;
          public getJustifyContent(): org.nativescript.mason.masonkit.JustifyContent;
          public getGapRow(): org.nativescript.mason.masonkit.LengthPercentage;
          public setGap(param0: org.nativescript.mason.masonkit.LengthPercentage, param1: org.nativescript.mason.masonkit.LengthPercentage): void;
          public getMinSizeWidth(): org.nativescript.mason.masonkit.Dimension;
          public getGridRow(): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
          public removeViewsInLayout(param0: number, param1: number): void;
          public getBorderJsonValue(): string;
          public setInsetBottom(param0: number, param1: number): void;
          public setGapRow(param0: number, param1: number): void;
          public setGridRowEnd(param0: org.nativescript.mason.masonkit.GridPlacement): void;
          public getMaxSizeCssValue(): string;
          public setFlexWrap(param0: org.nativescript.mason.masonkit.FlexWrap): void;
          public setBorder(param0: org.nativescript.mason.masonkit.LengthPercentage, param1: org.nativescript.mason.masonkit.LengthPercentage, param2: org.nativescript.mason.masonkit.LengthPercentage, param3: org.nativescript.mason.masonkit.LengthPercentage): void;
          public getInsetTop(): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public getSizeCssValue(): string;
          public setMaxSize(param0: number, param1: number, param2: number, param3: number): void;
          public getGridTemplateColumns(): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
          public setMargin(param0: number, param1: number, param2: number, param3: number, param4: number, param5: number, param6: number, param7: number): void;
          public setPadding(param0: number, param1: number, param2: number, param3: number, param4: number, param5: number, param6: number, param7: number): void;
          public setPosition(param0: org.nativescript.mason.masonkit.LengthPercentageAuto, param1: org.nativescript.mason.masonkit.LengthPercentageAuto, param2: org.nativescript.mason.masonkit.LengthPercentageAuto, param3: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
          public getGridAutoFlow(): org.nativescript.mason.masonkit.GridAutoFlow;
          public getMarginLeft(): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public setAlignSelf(param0: org.nativescript.mason.masonkit.AlignSelf): void;
          public getAspectRatio(): java.lang.Float;
          public setGridColumnEnd(param0: org.nativescript.mason.masonkit.GridPlacement): void;
          public setPaddingTop(param0: number, param1: number): void;
          public setBorder(param0: number, param1: number, param2: number, param3: number): void;
          public getStylePaddingBottom(): org.nativescript.mason.masonkit.LengthPercentage;
          public setInsetLeft(param0: number, param1: number): void;
          public getGridColumnEnd(): org.nativescript.mason.masonkit.GridPlacement;
          public setSize(param0: org.nativescript.mason.masonkit.Dimension, param1: org.nativescript.mason.masonkit.Dimension): void;
          public getMaxSizeWidth(): org.nativescript.mason.masonkit.Dimension;
          public constructor(param0: globalAndroid.content.Context, param1: globalAndroid.util.AttributeSet, param2: number);
          public removeView(param0: globalAndroid.view.View): void;
          public getPaddingJsonValue(): string;
          public getFlexShrink(): number;
          public setStyle(param0: org.nativescript.mason.masonkit.Style): void;
          public setPosition(param0: org.nativescript.mason.masonkit.Position): void;
          public setGapColumn(param0: number, param1: number): void;
          public removeAllViews(): void;
          public getMarginTop(): org.nativescript.mason.masonkit.LengthPercentageAuto;
          public getMasonPtr(): number;
          public setRowGap(param0: number, param1: number): void;
          public setMinSize(param0: number, param1: number, param2: number, param3: number): void;
          public getSizeJsonValue(): string;
          public getNode(): org.nativescript.mason.masonkit.Node;
          public setGridTemplateColumns(param0: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
          public onLayout(param0: boolean, param1: number, param2: number, param3: number, param4: number): void;
          public setMaxSizeWidth(param0: number, param1: number): void;
          public setGridColumnStart(param0: org.nativescript.mason.masonkit.GridPlacement): void;
          public getMinSizeJsonValue(): string;
          public getSizeHeight(): org.nativescript.mason.masonkit.Dimension;
          public getStyleAsString(): string;
        }
        export module View {
          export class Companion {
            public static class: java.lang.Class<org.nativescript.mason.masonkit.View.Companion>;
            public getGson$masonkit_release(): com.google.gson.Gson;
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
//org.nativescript.mason.masonkit.Line:1
//org.nativescript.mason.masonkit.Rect:1
//org.nativescript.mason.masonkit.Size:1
