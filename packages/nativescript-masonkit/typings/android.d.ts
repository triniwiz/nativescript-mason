declare namespace dalvik {
	export namespace annotation {
		export namespace optimization {
			export class CriticalNative {
				public static class: java.lang.Class<dalvik.annotation.optimization.CriticalNative>;
				/**
				 * Constructs a new instance of the dalvik.annotation.optimization.CriticalNative interface with the provided implementation. An empty constructor exists calling super() when extending the interface class.
				 */
				public constructor(implementation: {
				});
				public constructor();
			}
		}
	}
}

declare namespace dalvik {
	export namespace annotation {
		export namespace optimization {
			export class FastNative {
				public static class: java.lang.Class<dalvik.annotation.optimization.FastNative>;
				/**
				 * Constructs a new instance of the dalvik.annotation.optimization.FastNative interface with the provided implementation. An empty constructor exists calling super() when extending the interface class.
				 */
				public constructor(implementation: {
				});
				public constructor();
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
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
					public static valueOf(value: string): org.nativescript.mason.masonkit.AlignContent;
					public getValue(): number;
				}
				export namespace AlignContent {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignContent.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.AlignContent;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignContent.WhenMappings>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
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
					public getValue(): number;
					public static valueOf(value: string): org.nativescript.mason.masonkit.AlignItems;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.AlignItems>;
				}
				export namespace AlignItems {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignItems.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.AlignItems;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignItems.WhenMappings>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
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
					public getValue(): number;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.AlignSelf>;
					public static valueOf(value: string): org.nativescript.mason.masonkit.AlignSelf;
				}
				export namespace AlignSelf {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignSelf.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.AlignSelf;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.AlignSelf.WhenMappings>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export abstract class AvailableSpace {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.AvailableSpace>;
					public static fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.AvailableSpace;
					public getValue$masonkit_release(): number;
					public getType$masonkit_release(): number;
				}
				export namespace AvailableSpace {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.AvailableSpace.Companion>;
						public fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.AvailableSpace;
					}
					export class Definite extends org.nativescript.mason.masonkit.AvailableSpace {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.AvailableSpace.Definite>;
						public equals(other: any): boolean;
						public constructor(points: number);
						public hashCode(): number;
						public getPoints(): number;
						public component1(): number;
						public copy(points: number): org.nativescript.mason.masonkit.AvailableSpace.Definite;
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

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class BuildConfig {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.BuildConfig>;
					public static DEBUG: boolean = 0;
					public static LIBRARY_PACKAGE_NAME = "org.nativescript.mason.masonkit";
					public static BUILD_TYPE = "release";
					public constructor();
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export abstract class Dimension {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Dimension>;
					public getCssValue(): string;
					public getValue$masonkit_release(): number;
					public static fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.Dimension;
					public isZero(): boolean;
					public getType$masonkit_release(): number;
					public updateValue$masonkit_release(value: number): void;
					public getJsonValue(): string;
				}
				export namespace Dimension {
					export class Auto extends org.nativescript.mason.masonkit.Dimension {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Dimension.Auto>;
						public static INSTANCE: org.nativescript.mason.masonkit.Dimension.Auto;
					}
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Dimension.Companion>;
						public fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.Dimension;
					}
					export class Percent extends org.nativescript.mason.masonkit.Dimension {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Dimension.Percent>;
						public equals(other: any): boolean;
						public constructor(percentage: number);
						public getPercentage(): number;
						public copy(percentage: number): org.nativescript.mason.masonkit.Dimension.Percent;
						public setPercentage(value: number): void;
						public hashCode(): number;
						public component1(): number;
						public toString(): string;
					}
					export class Points extends org.nativescript.mason.masonkit.Dimension {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Dimension.Points>;
						public equals(other: any): boolean;
						public copy(points: number): org.nativescript.mason.masonkit.Dimension.Points;
						public constructor(points: number);
						public hashCode(): number;
						public getPoints(): number;
						public component1(): number;
						public toString(): string;
						public setPoints(value: number): void;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class DimensionSerializer extends com.google.gson.JsonSerializer<org.nativescript.mason.masonkit.Dimension> {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.DimensionSerializer>;
					public constructor();
					public serialize(this_: org.nativescript.mason.masonkit.Dimension, src: java.lang.reflect.Type, typeOfSrc: com.google.gson.JsonSerializationContext): com.google.gson.JsonElement;
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class Direction {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Direction>;
					public static Inherit: org.nativescript.mason.masonkit.Direction;
					public static LTR: org.nativescript.mason.masonkit.Direction;
					public static RTL: org.nativescript.mason.masonkit.Direction;
					public getCssValue(): string;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.Direction>;
					public static valueOf(value: string): org.nativescript.mason.masonkit.Direction;
				}
				export namespace Direction {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Direction.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.Direction;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Direction.WhenMappings>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class Display {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Display>;
					public static None: org.nativescript.mason.masonkit.Display;
					public static Flex: org.nativescript.mason.masonkit.Display;
					public static Grid: org.nativescript.mason.masonkit.Display;
					public static Block: org.nativescript.mason.masonkit.Display;
					public getCssValue(): string;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.Display>;
					public static valueOf(value: string): org.nativescript.mason.masonkit.Display;
				}
				export namespace Display {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Display.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.Display;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Display.WhenMappings>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class FlexDirection {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.FlexDirection>;
					public static Row: org.nativescript.mason.masonkit.FlexDirection;
					public static Column: org.nativescript.mason.masonkit.FlexDirection;
					public static RowReverse: org.nativescript.mason.masonkit.FlexDirection;
					public static ColumnReverse: org.nativescript.mason.masonkit.FlexDirection;
					public getCssValue(): string;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.FlexDirection>;
					public static valueOf(value: string): org.nativescript.mason.masonkit.FlexDirection;
				}
				export namespace FlexDirection {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.FlexDirection.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.FlexDirection;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.FlexDirection.WhenMappings>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class FlexWrap {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.FlexWrap>;
					public static NoWrap: org.nativescript.mason.masonkit.FlexWrap;
					public static Wrap: org.nativescript.mason.masonkit.FlexWrap;
					public static WrapReverse: org.nativescript.mason.masonkit.FlexWrap;
					public getCssValue(): string;
					public static valueOf(value: string): org.nativescript.mason.masonkit.FlexWrap;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.FlexWrap>;
				}
				export namespace FlexWrap {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.FlexWrap.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.FlexWrap;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.FlexWrap.WhenMappings>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class GridAutoFlow {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.GridAutoFlow>;
					public static Row: org.nativescript.mason.masonkit.GridAutoFlow;
					public static Column: org.nativescript.mason.masonkit.GridAutoFlow;
					public static RowDense: org.nativescript.mason.masonkit.GridAutoFlow;
					public static ColumnDense: org.nativescript.mason.masonkit.GridAutoFlow;
					public getCssValue(): string;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.GridAutoFlow>;
					public static valueOf(value: string): org.nativescript.mason.masonkit.GridAutoFlow;
				}
				export namespace GridAutoFlow {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.GridAutoFlow.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.GridAutoFlow;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.GridAutoFlow.WhenMappings>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export abstract class GridPlacement {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.GridPlacement>;
					public getCssValue(): string;
					public getPlacementValue$masonkit_release(): number;
					public getType$masonkit_release(): number;
					public getJsonValue(): string;
				}
				export namespace GridPlacement {
					export class Auto extends org.nativescript.mason.masonkit.GridPlacement {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.GridPlacement.Auto>;
						public static INSTANCE: org.nativescript.mason.masonkit.GridPlacement.Auto;
					}
					export class Line extends org.nativescript.mason.masonkit.GridPlacement {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.GridPlacement.Line>;
						public equals(other: any): boolean;
						public hashCode(): number;
						public setValue(value: number): void;
						public constructor(value: number);
						public component1(): number;
						public toString(): string;
						public getValue(): number;
						public copy(value: number): org.nativescript.mason.masonkit.GridPlacement.Line;
					}
					export class Span extends org.nativescript.mason.masonkit.GridPlacement {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.GridPlacement.Span>;
						public equals(other: any): boolean;
						public copy(value: number): org.nativescript.mason.masonkit.GridPlacement.Span;
						public hashCode(): number;
						public setValue(value: number): void;
						public constructor(value: number);
						public component1(): number;
						public toString(): string;
						public getValue(): number;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export abstract class GridTrackRepetition {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.GridTrackRepetition>;
					public getType(): number;
					public getCssValue(): string;
					public getValue(): number;
					public toInt(): number;
					public static fromInt(type: number, value: number): org.nativescript.mason.masonkit.GridTrackRepetition;
				}
				export namespace GridTrackRepetition {
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
						public fromInt(type: number, value: number): org.nativescript.mason.masonkit.GridTrackRepetition;
					}
					export class Count extends org.nativescript.mason.masonkit.GridTrackRepetition {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.GridTrackRepetition.Count>;
						public equals(other: any): boolean;
						public constructor(count: number);
						public copy(count: number): org.nativescript.mason.masonkit.GridTrackRepetition.Count;
						public hashCode(): number;
						public getCount(): number;
						public component1(): number;
						public toString(): string;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
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
					public static valueOf(value: string): org.nativescript.mason.masonkit.JustifyContent;
					public getCssValue(): string;
					public getValue(): number;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.JustifyContent>;
				}
				export namespace JustifyContent {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifyContent.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.JustifyContent;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifyContent.WhenMappings>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
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
					public static valueOf(value: string): org.nativescript.mason.masonkit.JustifyItems;
					public getValue(): number;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.JustifyItems>;
				}
				export namespace JustifyItems {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifyItems.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.JustifyItems;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifyItems.WhenMappings>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
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
					public static valueOf(value: string): org.nativescript.mason.masonkit.JustifySelf;
					public getValue(): number;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.JustifySelf>;
				}
				export namespace JustifySelf {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifySelf.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.JustifySelf;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.JustifySelf.WhenMappings>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class Layout {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Layout>;
					public component5(): number;
					public getX(): number;
					public getHeight(): number;
					public component3(): number;
					public copy(order: number, x: number, y: number, width: number, height: number, children: java.util.List<org.nativescript.mason.masonkit.Layout>): org.nativescript.mason.masonkit.Layout;
					public constructor(order: number, x: number, y: number, width: number, height: number, children: java.util.List<org.nativescript.mason.masonkit.Layout>);
					public equals(other: any): boolean;
					public getWidth(): number;
					public component6(): java.util.List<org.nativescript.mason.masonkit.Layout>;
					public getY(): number;
					public toString(): string;
					public getOrder(): number;
					public component4(): number;
					public component1(): number;
					public component2(): number;
					public hashCode(): number;
					public getChildren(): java.util.List<org.nativescript.mason.masonkit.Layout>;
				}
				export namespace Layout {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Layout.Companion>;
						// public fromFloatArray$masonkit_release(i: androidNative.Array<number>, offset: number): any<java.lang.Integer,org.nativescript.mason.masonkit.Layout>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export abstract class LengthPercentage {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentage>;
					public getCssValue(): string;
					public getValue$masonkit_release(): number;
					public static fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.LengthPercentage;
					public getType$masonkit_release(): number;
					public updateValue$masonkit_release(value: number): void;
					public getJsonValue(): string;
				}
				export namespace LengthPercentage {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentage.Companion>;
						public fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.LengthPercentage;
					}
					export class Percent extends org.nativescript.mason.masonkit.LengthPercentage {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentage.Percent>;
						public equals(other: any): boolean;
						public constructor(percentage: number);
						public getPercentage(): number;
						public copy(percentage: number): org.nativescript.mason.masonkit.LengthPercentage.Percent;
						public setPercentage(value: number): void;
						public hashCode(): number;
						public component1(): number;
						public toString(): string;
					}
					export class Points extends org.nativescript.mason.masonkit.LengthPercentage {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentage.Points>;
						public equals(other: any): boolean;
						public constructor(points: number);
						public hashCode(): number;
						public getPoints(): number;
						public copy(points: number): org.nativescript.mason.masonkit.LengthPercentage.Points;
						public component1(): number;
						public toString(): string;
						public setPoints(value: number): void;
					}
					export class Zero extends org.nativescript.mason.masonkit.LengthPercentage {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentage.Zero>;
						public static INSTANCE: org.nativescript.mason.masonkit.LengthPercentage.Zero;
						public static points = 0.0;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export abstract class LengthPercentageAuto {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public static fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getCssValue(): string;
					public getValue$masonkit_release(): number;
					public getType$masonkit_release(): number;
					public updateValue$masonkit_release(value: number): void;
					public getJsonValue(): string;
				}
				export namespace LengthPercentageAuto {
					export class Auto extends org.nativescript.mason.masonkit.LengthPercentageAuto {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAuto.Auto>;
						public static INSTANCE: org.nativescript.mason.masonkit.LengthPercentageAuto.Auto;
					}
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAuto.Companion>;
						public fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.LengthPercentageAuto;
					}
					export class Percent extends org.nativescript.mason.masonkit.LengthPercentageAuto {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAuto.Percent>;
						public equals(other: any): boolean;
						public constructor(percentage: number);
						public getPercentage(): number;
						public setPercentage(value: number): void;
						public hashCode(): number;
						public copy(percentage: number): org.nativescript.mason.masonkit.LengthPercentageAuto.Percent;
						public component1(): number;
						public toString(): string;
					}
					export class Points extends org.nativescript.mason.masonkit.LengthPercentageAuto {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAuto.Points>;
						public equals(other: any): boolean;
						public constructor(points: number);
						public hashCode(): number;
						public copy(points: number): org.nativescript.mason.masonkit.LengthPercentageAuto.Points;
						public getPoints(): number;
						public component1(): number;
						public toString(): string;
						public setPoints(value: number): void;
					}
					export class Zero extends org.nativescript.mason.masonkit.LengthPercentageAuto {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAuto.Zero>;
						public static INSTANCE: org.nativescript.mason.masonkit.LengthPercentageAuto.Zero;
						public static points = 0.0;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class LengthPercentageAutoSerializer extends com.google.gson.JsonSerializer<org.nativescript.mason.masonkit.LengthPercentageAuto> {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAutoSerializer>;
					public constructor();
					public serialize(this_: org.nativescript.mason.masonkit.LengthPercentageAuto, src: java.lang.reflect.Type, typeOfSrc: com.google.gson.JsonSerializationContext): com.google.gson.JsonElement;
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class LengthPercentageSerializer extends com.google.gson.JsonSerializer<org.nativescript.mason.masonkit.LengthPercentage> {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageSerializer>;
					public constructor();
					public serialize(this_: org.nativescript.mason.masonkit.LengthPercentage, src: java.lang.reflect.Type, typeOfSrc: com.google.gson.JsonSerializationContext): com.google.gson.JsonElement;
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class Line<T>  extends java.lang.Object {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Line<any>>;
					public constructor(start: T, end: T);
					public toString(): string;
					public copy(start: T, end: T): org.nativescript.mason.masonkit.Line<T>;
					public getStart(): T;
					public equals(other: any): boolean;
					public getEnd(): T;
					public component1(): T;
					public hashCode(): number;
					public static fromStartAndEndValues(startType: number, startValue: number, endType: number, endValue: number): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
					public component2(): T;
				}
				export namespace Line {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Line.Companion>;
						public fromStartAndEndValues(end: number, this_: number, startType: number, startValue: number): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class Mason {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Mason>;
					public static getShared(): boolean;
					public static getInstance(): org.nativescript.mason.masonkit.Mason;
					public getNativePtr$masonkit_release(): number;
					public clear(): void;
					public static setShared(value: boolean): void;
					public setNativePtr$masonkit_release(value: number): void;
					public getNativePtr(): number;
				}
				export namespace Mason {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Mason.Companion>;
						public initLib$masonkit_release(): void;
						public getInstance(): org.nativescript.mason.masonkit.Mason;
						public setShared(value: boolean): void;
						public getShared(): boolean;
						public getGson$masonkit_release(): com.google.gson.Gson;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export abstract class MaxSizing {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing>;
					public getType(): number;
					public static fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.MaxSizing;
					public getValue(): number;
				}
				export namespace MaxSizing {
					export class Auto extends org.nativescript.mason.masonkit.MaxSizing {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.Auto>;
						public static INSTANCE: org.nativescript.mason.masonkit.MaxSizing.Auto;
					}
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.Companion>;
						public fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.MaxSizing;
					}
					export class FitContent extends org.nativescript.mason.masonkit.MaxSizing {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.FitContent>;
						public getFitContent(): number;
						public equals(other: any): boolean;
						public setFitContent(value: number): void;
						public hashCode(): number;
						public constructor(fitContent: number);
						public component1(): number;
						public copy(fitContent: number): org.nativescript.mason.masonkit.MaxSizing.FitContent;
						public toString(): string;
					}
					export class FitContentPercent extends org.nativescript.mason.masonkit.MaxSizing {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.FitContentPercent>;
						public getFitContent(): number;
						public equals(other: any): boolean;
						public setFitContent(value: number): void;
						public hashCode(): number;
						public constructor(fitContent: number);
						public component1(): number;
						public copy(fitContent: number): org.nativescript.mason.masonkit.MaxSizing.FitContentPercent;
						public toString(): string;
					}
					export class Fraction extends org.nativescript.mason.masonkit.MaxSizing {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.Fraction>;
						public constructor(fraction: number);
						public setFraction(value: number): void;
						public copy(fraction: number): org.nativescript.mason.masonkit.MaxSizing.Fraction;
						public equals(other: any): boolean;
						public hashCode(): number;
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
						public equals(other: any): boolean;
						public constructor(percentage: number);
						public getPercentage(): number;
						public setPercentage(value: number): void;
						public hashCode(): number;
						public component1(): number;
						public copy(percentage: number): org.nativescript.mason.masonkit.MaxSizing.Percent;
						public toString(): string;
					}
					export class Points extends org.nativescript.mason.masonkit.MaxSizing {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.Points>;
						public equals(other: any): boolean;
						public copy(points: number): org.nativescript.mason.masonkit.MaxSizing.Points;
						public constructor(points: number);
						public hashCode(): number;
						public getPoints(): number;
						public component1(): number;
						public toString(): string;
						public setPoints(value: number): void;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class MeasureFunc {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.MeasureFunc>;
					/**
					 * Constructs a new instance of the org.nativescript.mason.masonkit.MeasureFunc interface with the provided implementation. An empty constructor exists calling super() when extending the interface class.
					 */
					public constructor(implementation: {
						measure(param0: org.nativescript.mason.masonkit.Size<java.lang.Float>, param1: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
					});
					public constructor();
					public measure(param0: org.nativescript.mason.masonkit.Size<java.lang.Float>, param1: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class MeasureFuncImpl {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.MeasureFuncImpl>;
					public measure(knownHeight: number, availableWidth: number): number;
					public constructor(measureFunc: java.lang.ref.WeakReference<org.nativescript.mason.masonkit.MeasureFunc>);
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class MeasureOutput {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.MeasureOutput>;
					public static INSTANCE: org.nativescript.mason.masonkit.MeasureOutput;
					public make(hBits: number, this_: number): number;
					public make(width: number, height: number): number;
					public getHeight(measureOutput: number): number;
					public getWidth(measureOutput: number): number;
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export abstract class MinMax {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax>;
					public getCssValue(): string;
					public getMax(): org.nativescript.mason.masonkit.MaxSizing;
					public static fromTypeValue(minType: number, minValue: number, maxType: number, maxValue: number): org.nativescript.mason.masonkit.MinMax;
					public getMaxValue(): number;
					public getMaxType(): number;
					public getMin(): org.nativescript.mason.masonkit.MinSizing;
					public getMinType(): number;
					public getMinValue(): number;
				}
				export namespace MinMax {
					export class Auto extends org.nativescript.mason.masonkit.MinMax {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.Auto>;
						public static INSTANCE: org.nativescript.mason.masonkit.MinMax.Auto;
					}
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.Companion>;
						public fromTypeValue(max: number, this_: number, minType: number, minValue: number): org.nativescript.mason.masonkit.MinMax;
					}
					export class FitContent extends org.nativescript.mason.masonkit.MinMax {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.FitContent>;
						public copy(points: number): org.nativescript.mason.masonkit.MinMax.FitContent;
						public equals(other: any): boolean;
						public constructor(points: number);
						public hashCode(): number;
						public getPoints(): number;
						public component1(): number;
						public toString(): string;
						public setPoints(value: number): void;
					}
					export class FitContentPercent extends org.nativescript.mason.masonkit.MinMax {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.FitContentPercent>;
						public equals(other: any): boolean;
						public hashCode(): number;
						public constructor(percent: number);
						public copy(percent: number): org.nativescript.mason.masonkit.MinMax.FitContentPercent;
						public setPercent(value: number): void;
						public component1(): number;
						public getPercent(): number;
						public toString(): string;
					}
					export class Fraction extends org.nativescript.mason.masonkit.MinMax {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.Fraction>;
						public copy(fraction: number): org.nativescript.mason.masonkit.MinMax.Fraction;
						public constructor(fraction: number);
						public setFraction(value: number): void;
						public equals(other: any): boolean;
						public hashCode(): number;
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
						public equals(other: any): boolean;
						public constructor(percentage: number);
						public getPercentage(): number;
						public setPercentage(value: number): void;
						public copy(percentage: number): org.nativescript.mason.masonkit.MinMax.Percent;
						public hashCode(): number;
						public component1(): number;
						public toString(): string;
					}
					export class Points extends org.nativescript.mason.masonkit.MinMax {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.Points>;
						public equals(other: any): boolean;
						public constructor(points: number);
						public hashCode(): number;
						public getPoints(): number;
						public copy(points: number): org.nativescript.mason.masonkit.MinMax.Points;
						public component1(): number;
						public toString(): string;
					}
					export class Values extends org.nativescript.mason.masonkit.MinMax {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.Values>;
						public copy(minVal: org.nativescript.mason.masonkit.MinSizing, maxVal: org.nativescript.mason.masonkit.MaxSizing): org.nativescript.mason.masonkit.MinMax.Values;
						public constructor(minVal: org.nativescript.mason.masonkit.MinSizing, maxVal: org.nativescript.mason.masonkit.MaxSizing);
						public equals(other: any): boolean;
						public hashCode(): number;
						public getMinVal(): org.nativescript.mason.masonkit.MinSizing;
						public component1(): org.nativescript.mason.masonkit.MinSizing;
						public component2(): org.nativescript.mason.masonkit.MaxSizing;
						public getMaxVal(): org.nativescript.mason.masonkit.MaxSizing;
						public toString(): string;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export abstract class MinSizing {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.MinSizing>;
					public getType(): number;
					public getValue(): number;
					public static fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.MinSizing;
				}
				export namespace MinSizing {
					export class Auto extends org.nativescript.mason.masonkit.MinSizing {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MinSizing.Auto>;
						public static INSTANCE: org.nativescript.mason.masonkit.MinSizing.Auto;
					}
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MinSizing.Companion>;
						public fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.MinSizing;
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
						public equals(other: any): boolean;
						public constructor(percentage: number);
						public getPercentage(): number;
						public setPercentage(value: number): void;
						public hashCode(): number;
						public copy(percentage: number): org.nativescript.mason.masonkit.MinSizing.Percent;
						public component1(): number;
						public toString(): string;
					}
					export class Points extends org.nativescript.mason.masonkit.MinSizing {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MinSizing.Points>;
						public equals(other: any): boolean;
						public constructor(points: number);
						public hashCode(): number;
						public getPoints(): number;
						public copy(points: number): org.nativescript.mason.masonkit.MinSizing.Points;
						public component1(): number;
						public toString(): string;
						public setPoints(value: number): void;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class Node {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Node>;
					public computeMaxContent(): void;
					public getData(): any;
					public setInBatch(value: boolean): void;
					public getChildCount(): number;
					public finalize(): void;
					public layout(): org.nativescript.mason.masonkit.Layout;
					public updateNodeStyle$masonkit_release(): void;
					public getStyle(): org.nativescript.mason.masonkit.Style;
					public getOwner(): org.nativescript.mason.masonkit.Node;
					public insertChildAfter(index: org.nativescript.mason.masonkit.Node, this_: org.nativescript.mason.masonkit.Node): void;
					public getChildren(): androidNative.Array<org.nativescript.mason.masonkit.Node>;
					public rootComputeMinContent(): void;
					public removeMeasureFunction(): void;
					public constructor(style: org.nativescript.mason.masonkit.Style, measure: org.nativescript.mason.masonkit.MeasureFunc);
					public rootComputeWithViewSize(): void;
					public constructor();
					public setMeasureFunction(measure: org.nativescript.mason.masonkit.MeasureFunc): void;
					public getInBatch(): boolean;
					public computeMinContent(): void;
					public computeAndLayout(): org.nativescript.mason.masonkit.Layout;
					public constructor(style: org.nativescript.mason.masonkit.Style);
					public compute(): void;
					public isViewGroup(): boolean;
					public insertChildBefore(this_: org.nativescript.mason.masonkit.Node, child: org.nativescript.mason.masonkit.Node): void;
					public computeAndLayout(width: java.lang.Float): org.nativescript.mason.masonkit.Layout;
					public constructor(withMeasureFunction: boolean);
					public compute(width: number, height: number): void;
					public getChildAt($this$getChildAt_u24lambda_u245: number): org.nativescript.mason.masonkit.Node;
					public setStyle(value: org.nativescript.mason.masonkit.Style): void;
					public constructor(it: org.nativescript.mason.masonkit.Style, item$iv$iv: androidNative.Array<org.nativescript.mason.masonkit.Node>);
					public removeChild(this_: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Node;
					public rootCompute(): void;
					public addChildAt(this_: org.nativescript.mason.masonkit.Node, child: number): void;
					public isDirty(): boolean;
					public computeWithViewSize(): void;
					public static requestLayout(node: number): void;
					public setOwner$masonkit_release(value: org.nativescript.mason.masonkit.Node): void;
					public getRoot(): org.nativescript.mason.masonkit.Node;
					public setData(value: any): void;
					public configure(block: any): void;
					public removeChildAt(value: number): org.nativescript.mason.masonkit.Node;
					public removeChildren(): void;
					public rootCompute(width: number, height: number): void;
					// public static getNodes$masonkit_release(): java.util.WeakHashMap<java.lang.Long,org.nativescript.mason.masonkit.Node>;
					public dirty(): void;
					public rootComputeMaxContent(): void;
					public addChild(child: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Node;
					public computeAndLayout(width: java.lang.Float, height: java.lang.Float): org.nativescript.mason.masonkit.Layout;
					public getNativePtr(): number;
				}
				export namespace Node {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Node.Companion>;
						public requestLayout(node: number): void;
						public getNodes$masonkit_release(): java.util.WeakHashMap<java.lang.Long,org.nativescript.mason.masonkit.Node>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class NodeHelper {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.NodeHelper>;
					public static INSTANCE: org.nativescript.mason.masonkit.NodeHelper;
					public setInset(node: org.nativescript.mason.masonkit.Node, left: number, left_type: number, top: number, top_type: number, right: number, right_type: number, bottom: number, bottom_type: number): void;
					public batchCreateViews(this_: globalAndroid.content.Context): void;
					public setSize(node: org.nativescript.mason.masonkit.Node, width: number, height: number): void;
					public setMaxSizeWidth(node: org.nativescript.mason.masonkit.Node, value: org.nativescript.mason.masonkit.Dimension): void;
					public setGap(node: org.nativescript.mason.masonkit.Node, width: number, height: number): void;
					public setPosition(node: org.nativescript.mason.masonkit.Node, position: org.nativescript.mason.masonkit.Position): void;
					public setRowGap(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public getPosition(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Position;
					public getAlignContent(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.AlignContent;
					public getAlignItems(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.AlignItems;
					public getOverflowY(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Overflow;
					public getStylePaddingRight(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
					public setOverflowY(node: org.nativescript.mason.masonkit.Node, overflow: org.nativescript.mason.masonkit.Overflow): void;
					public getFlexShrink(node: org.nativescript.mason.masonkit.Node): number;
					public setGridAutoColumns(node: org.nativescript.mason.masonkit.Node, gridAutoColumns: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
					public setBorder(node: org.nativescript.mason.masonkit.Node, left: number, left_type: number, top: number, top_type: number, right: number, right_type: number, bottom: number, bottom_type: number): void;
					public setFlexGrow(node: org.nativescript.mason.masonkit.Node, flexGrow: number): void;
					public getStylePaddingTop(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
					public getInsetLeft(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setJustifyContent(node: org.nativescript.mason.masonkit.Node, justifyContent: org.nativescript.mason.masonkit.JustifyContent): void;
					public getGridAutoFlow(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.GridAutoFlow;
					public setPaddingTop(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public getDisplay(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Display;
					public setOverflow(node: org.nativescript.mason.masonkit.Node, overflow: org.nativescript.mason.masonkit.Overflow): void;
					public setGridTemplateColumns(node: org.nativescript.mason.masonkit.Node, gridTemplateColumns: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
					public setDirection(node: org.nativescript.mason.masonkit.Node, direction: org.nativescript.mason.masonkit.Direction): void;
					public getMaxSize(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public setGapRow(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public setDisplay(node: org.nativescript.mason.masonkit.Node, display: org.nativescript.mason.masonkit.Display): void;
					public setMargin(node: org.nativescript.mason.masonkit.Node, left: org.nativescript.mason.masonkit.LengthPercentageAuto, top: org.nativescript.mason.masonkit.LengthPercentageAuto, right: org.nativescript.mason.masonkit.LengthPercentageAuto, bottom: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
					public setFlexWrap(node: org.nativescript.mason.masonkit.Node, flexWrap: org.nativescript.mason.masonkit.FlexWrap): void;
					public getMinSizeCssValue(node: org.nativescript.mason.masonkit.Node): string;
					public setBorderWithValueType(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public getMinSizeHeight(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Dimension;
					public setMinSizeWidth(node: org.nativescript.mason.masonkit.Node, value: org.nativescript.mason.masonkit.Dimension): void;
					public getBorderCssValue(node: org.nativescript.mason.masonkit.Node): string;
					public getPaddingCssValue(node: org.nativescript.mason.masonkit.Node): string;
					public setJustifySelf(node: org.nativescript.mason.masonkit.Node, justifySelf: org.nativescript.mason.masonkit.JustifySelf): void;
					public longRunningFunction(): number;
					public setColumnGap(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public getJustifySelf(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.JustifySelf;
					public setPaddingLeft(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public getOverflow(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Overflow;
					public setMaxSize(node: org.nativescript.mason.masonkit.Node, width: number, height: number): void;
					public setInsetBottom(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public setBorderBottom(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public setMarginRight(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public getMarginJsonValue(node: org.nativescript.mason.masonkit.Node): string;
					public setScrollBarWidth(node: org.nativescript.mason.masonkit.Node, scrollBarWidth: number): void;
					public setBorderLeft(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public setPaddingRight(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public setPaddingWithValueType(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public setInsetWithValueType(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public setBorderTop(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public getAspectRatio(node: org.nativescript.mason.masonkit.Node): java.lang.Float;
					public getFlexDirection(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.FlexDirection;
					public getMarginCssValue(node: org.nativescript.mason.masonkit.Node): string;
					public getPadding(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public setMinSize(node: org.nativescript.mason.masonkit.Node, width: number, height: number): void;
					public setInsetRight(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public getSizeCssValue(node: org.nativescript.mason.masonkit.Node): string;
					public setMinSize(node: org.nativescript.mason.masonkit.Node, width: org.nativescript.mason.masonkit.Dimension, height: org.nativescript.mason.masonkit.Dimension): void;
					public setJustifyItems(node: org.nativescript.mason.masonkit.Node, justifyItems: org.nativescript.mason.masonkit.JustifyItems): void;
					public setMinSizeWidth(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public getSizeHeight(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Dimension;
					public getGridTemplateColumns(node: org.nativescript.mason.masonkit.Node): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
					public setGridColumnStart(node: org.nativescript.mason.masonkit.Node, gridColumnStart: org.nativescript.mason.masonkit.GridPlacement): void;
					public getBorderBottom(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
					public getMinSizeJsonValue(node: org.nativescript.mason.masonkit.Node): string;
					public getViews(): java.util.ArrayList<org.nativescript.mason.masonkit.View>;
					public getBorderLeft(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
					public setPaddingBottom(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public setBorderRight(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public setPosition(node: org.nativescript.mason.masonkit.Node, left: number, top: number, right: number, bottom: number): void;
					public setMargin(node: org.nativescript.mason.masonkit.Node, left: number, left_type: number, top: number, top_type: number, right: number, right_type: number, bottom: number, bottom_type: number): void;
					public getGapColumn(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
					public configure(node: org.nativescript.mason.masonkit.Node, block: any): void;
					public setFlexBasis(node: org.nativescript.mason.masonkit.Node, flexBasis: org.nativescript.mason.masonkit.Dimension): void;
					public setAlignSelf(node: org.nativescript.mason.masonkit.Node, alignSelf: org.nativescript.mason.masonkit.AlignSelf): void;
					public setMaxSize(node: org.nativescript.mason.masonkit.Node, width: number, width_type: number, height: number, height_type: number): void;
					public setPadding(node: org.nativescript.mason.masonkit.Node, left: number, left_type: number, top: number, top_type: number, right: number, right_type: number, bottom: number, bottom_type: number): void;
					public getMargin(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public getMaxSizeWidth(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Dimension;
					public setMarginLeft(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public setGridColumn(node: org.nativescript.mason.masonkit.Node, gridColumn: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
					public getInset(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public getMaxSizeHeight(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Dimension;
					public setInsetTop(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public setPosition(node: org.nativescript.mason.masonkit.Node, left: org.nativescript.mason.masonkit.LengthPercentageAuto, top: org.nativescript.mason.masonkit.LengthPercentageAuto, right: org.nativescript.mason.masonkit.LengthPercentageAuto, bottom: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
					public setMaxSize(node: org.nativescript.mason.masonkit.Node, width: org.nativescript.mason.masonkit.Dimension, height: org.nativescript.mason.masonkit.Dimension): void;
					public setGridAutoFlow(node: org.nativescript.mason.masonkit.Node, gridAutoFlow: org.nativescript.mason.masonkit.GridAutoFlow): void;
					public setSize(node: org.nativescript.mason.masonkit.Node, width: org.nativescript.mason.masonkit.Dimension, height: org.nativescript.mason.masonkit.Dimension): void;
					public setInsetLeft(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public setMinSizeHeight(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public setGridAutoRows(node: org.nativescript.mason.masonkit.Node, gridAutoRows: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
					public getOverflowX(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Overflow;
					public logPerf(time: number): void;
					public setGridRow(node: org.nativescript.mason.masonkit.Node, gridRow: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
					public setFlexShrink(node: org.nativescript.mason.masonkit.Node, flexShrink: number): void;
					public getInsetBottom(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setMarginBottom(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public getGridColumnStart(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.GridPlacement;
					public setGap(node: org.nativescript.mason.masonkit.Node, row: org.nativescript.mason.masonkit.LengthPercentage, column: org.nativescript.mason.masonkit.LengthPercentage): void;
					public getBorderTop(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
					public getGridRowEnd(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.GridPlacement;
					public setGridRowEnd(node: org.nativescript.mason.masonkit.Node, gridRowEnd: org.nativescript.mason.masonkit.GridPlacement): void;
					public setMinSize(node: org.nativescript.mason.masonkit.Node, width: number, width_type: number, height: number, height_type: number): void;
					public setMaxSizeHeight(node: org.nativescript.mason.masonkit.Node, value: org.nativescript.mason.masonkit.Dimension): void;
					public setGridTemplateRows(node: org.nativescript.mason.masonkit.Node, gridTemplateRows: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
					public setOverflowX(node: org.nativescript.mason.masonkit.Node, overflow: org.nativescript.mason.masonkit.Overflow): void;
					public setFlexBasis(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public getGridRow(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
					public getFlexBasis(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Dimension;
					public getMaxSizeJsonValue(node: org.nativescript.mason.masonkit.Node): string;
					public getGapRow(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
					public getStylePaddingBottom(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
					public setGridRowStart(node: org.nativescript.mason.masonkit.Node, gridRowStart: org.nativescript.mason.masonkit.GridPlacement): void;
					public getPaddingJsonValue(node: org.nativescript.mason.masonkit.Node): string;
					public getJustifyItems(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.JustifyItems;
					public getSize(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public setPadding(node: org.nativescript.mason.masonkit.Node, left: org.nativescript.mason.masonkit.LengthPercentage, top: org.nativescript.mason.masonkit.LengthPercentage, right: org.nativescript.mason.masonkit.LengthPercentage, bottom: org.nativescript.mason.masonkit.LengthPercentage): void;
					public setMargin(node: org.nativescript.mason.masonkit.Node, left: number, top: number, right: number, bottom: number): void;
					public setMarginTop(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public setMaxSizeHeight(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public getGridColumnEnd(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.GridPlacement;
					public setSizeHeight(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public setGridColumnEnd(node: org.nativescript.mason.masonkit.Node, gridColumnEnd: org.nativescript.mason.masonkit.GridPlacement): void;
					public setSizeWidth(node: org.nativescript.mason.masonkit.Node, value: org.nativescript.mason.masonkit.Dimension): void;
					public getMarginTop(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getMaxSizeCssValue(node: org.nativescript.mason.masonkit.Node): string;
					public getStylePaddingLeft(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
					public setBorder(node: org.nativescript.mason.masonkit.Node, left: org.nativescript.mason.masonkit.LengthPercentage, top: org.nativescript.mason.masonkit.LengthPercentage, right: org.nativescript.mason.masonkit.LengthPercentage, bottom: org.nativescript.mason.masonkit.LengthPercentage): void;
					public getAlignSelf(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.AlignSelf;
					public getJustifyContent(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.JustifyContent;
					public getInsetTop(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getGridAutoColumns(node: org.nativescript.mason.masonkit.Node): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
					public getGridTemplateRows(node: org.nativescript.mason.masonkit.Node): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
					public getInsetRight(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getSizeWidth(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Dimension;
					public setMaxSizeWidth(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public getDirection(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Direction;
					public setGap(node: org.nativescript.mason.masonkit.Node, width: number, width_type: number, height: number, height_type: number): void;
					public setGapColumn(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public getGridRowStart(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.GridPlacement;
					public getMarginBottom(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setAlignItems(node: org.nativescript.mason.masonkit.Node, alignItems: org.nativescript.mason.masonkit.AlignItems): void;
					public getGap(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>;
					public getMarginLeft(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getBorderRight(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentage;
					public getMinSize(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public setMarginWithValueType(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public setSizeWidth(node: org.nativescript.mason.masonkit.Node, value: number, type: number): void;
					public getGridColumn(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
					public getFlexWrap(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.FlexWrap;
					public getInsetCssValue(node: org.nativescript.mason.masonkit.Node): string;
					public setSize(node: org.nativescript.mason.masonkit.Node, width: number, width_type: number, height: number, height_type: number): void;
					public getSizeJsonValue(node: org.nativescript.mason.masonkit.Node): string;
					public setFlexDirection(node: org.nativescript.mason.masonkit.Node, direction: org.nativescript.mason.masonkit.FlexDirection): void;
					public getFlexGrow(node: org.nativescript.mason.masonkit.Node): number;
					public getBorder(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public getInsetJsonValue(node: org.nativescript.mason.masonkit.Node): string;
					public getGridAutoRows(node: org.nativescript.mason.masonkit.Node): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
					public setAspectRatio(node: org.nativescript.mason.masonkit.Node, aspectRatio: java.lang.Float): void;
					public getBorderJsonValue(node: org.nativescript.mason.masonkit.Node): string;
					public getScrollBarWidth(node: org.nativescript.mason.masonkit.Node): number;
					public setPadding(node: org.nativescript.mason.masonkit.Node, left: number, top: number, right: number, bottom: number): void;
					public getMarginRight(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setAlignContent(node: org.nativescript.mason.masonkit.Node, alignContent: org.nativescript.mason.masonkit.AlignContent): void;
					public getMinSizeWidth(node: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Dimension;
					public setBorder(node: org.nativescript.mason.masonkit.Node, left: number, top: number, right: number, bottom: number): void;
					public setMinSizeHeight(node: org.nativescript.mason.masonkit.Node, value: org.nativescript.mason.masonkit.Dimension): void;
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class Overflow {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Overflow>;
					public static Unset: org.nativescript.mason.masonkit.Overflow;
					public static Visible: org.nativescript.mason.masonkit.Overflow;
					public static Hidden: org.nativescript.mason.masonkit.Overflow;
					public static Scroll: org.nativescript.mason.masonkit.Overflow;
					public getCssValue(): string;
					public static valueOf(value: string): org.nativescript.mason.masonkit.Overflow;
					public getValue(): number;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.Overflow>;
				}
				export namespace Overflow {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Overflow.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.Overflow;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Overflow.WhenMappings>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class Position {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Position>;
					public static Relative: org.nativescript.mason.masonkit.Position;
					public static Absolute: org.nativescript.mason.masonkit.Position;
					public getCssValue(): string;
					public static valueOf(value: string): org.nativescript.mason.masonkit.Position;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.Position>;
				}
				export namespace Position {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Position.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.Position;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Position.WhenMappings>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class Rect<T>  extends java.lang.Object {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Rect<any>>;
					public constructor(left: T, right: T, top: T, bottom: T);
					public getRight(): T;
					public equals(other: any): boolean;
					public component1(): T;
					public copy(left: T, right: T, top: T, bottom: T): org.nativescript.mason.masonkit.Rect<T>;
					public getBottom(): T;
					public component2(): T;
					public toString(): string;
					public getLeft(): T;
					public component3(): T;
					public component4(): T;
					public getTop(): T;
					public hashCode(): number;
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class Size<T>  extends java.lang.Object {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Size<any>>;
					public getWidth(): T;
					public toString(): string;
					public copy(width: T, height: T): org.nativescript.mason.masonkit.Size<T>;
					public getHeight(): T;
					public equals(other: any): boolean;
					public component1(): T;
					public constructor(width: T, height: T);
					public setHeight(value: T): void;
					public hashCode(): number;
					public setWidth(value: T): void;
					public component2(): T;
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class Style {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Style>;
					public setPadding(value: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>): void;
					public getGridTemplateRows(): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
					public getAlignItems(): org.nativescript.mason.masonkit.AlignItems;
					public finalize(): void;
					public getGridRowStart(): org.nativescript.mason.masonkit.GridPlacement;
					public setInsetTop(it: number, top: number): void;
					public getGap(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>;
					public setJustifySelf(value: org.nativescript.mason.masonkit.JustifySelf): void;
					public setFlexDirection(value: org.nativescript.mason.masonkit.FlexDirection): void;
					public constructor();
					public setMarginWithValueType(it: number, margin: number): void;
					public setMinSize(value: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
					public getNativeSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public setGridRowStart(value: org.nativescript.mason.masonkit.GridPlacement): void;
					public setPaddingTop(it: number, top: number): void;
					public getPosition(): org.nativescript.mason.masonkit.Position;
					public getFlexBasis(): org.nativescript.mason.masonkit.Dimension;
					public getJustifySelf(): org.nativescript.mason.masonkit.JustifySelf;
					public setAlignSelf(value: org.nativescript.mason.masonkit.AlignSelf): void;
					public setGridColumn(value: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
					public getGridColumnStart(): org.nativescript.mason.masonkit.GridPlacement;
					public getGridAutoColumns(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
					public getOverflow(): org.nativescript.mason.masonkit.Overflow;
					public setMarginLeft(it: number, left: number): void;
					public setGridTemplateColumns(value: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
					public getOverflowX(): org.nativescript.mason.masonkit.Overflow;
					public getInset(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public getMaxSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public setBorderWithValueType(it: number, border: number): void;
					public getGridRowEnd(): org.nativescript.mason.masonkit.GridPlacement;
					public getFlexGrow(): number;
					public getOverflowY(): org.nativescript.mason.masonkit.Overflow;
					public setGridColumnEnd(value: org.nativescript.mason.masonkit.GridPlacement): void;
					public getDirection(): org.nativescript.mason.masonkit.Direction;
					public setGridRowEnd(value: org.nativescript.mason.masonkit.GridPlacement): void;
					// public updateStyle$masonkit_release(it: number, $i$a$-let-Style$updateStyle$2: number, it: number, $i$a$-let-Style$updateStyle$3: number, it: number, $i$a$-let-Style$updateStyle$4: number, it: number, $i$a$-let-Style$updateStyle$5: number, it: number, $i$a$-let-Style$updateStyle$6: number, it: number, $i$a$-let-Style$updateStyle$7: number, it: number, $i$a$-let-Style$updateStyle$8: number, it: number, $i$a$-let-Style$updateStyle$9: number, it: number, $i$a$-let-Style$updateStyle$10: number, it: number, $i$a$-let-Style$updateStyle$11: number, it: number, $i$a$-let-Style$updateStyle$12: number, it: number, $i$a$-let-Style$updateStyle$13: number, it: number, $i$a$-let-Style$updateStyle$14: number, it: number, $i$a$-let-Style$updateStyle$15: number, it: number, $i$a$-let-Style$updateStyle$16: number, it: number, $i$a$-let-Style$updateStyle$17: number, it: number, $i$a$-let-Style$updateStyle$18: number, it: number, $i$a$-let-Style$updateStyle$19: number, it: number, $i$a$-let-Style$updateStyle$20: number, it: number, $i$a$-let-Style$updateStyle$21: number, it: number, $i$a$-let-Style$updateStyle$22: number, it: number, $i$a$-let-Style$updateStyle$23: number, it: number, $i$a$-let-Style$updateStyle$24: number, it: number, $i$a$-let-Style$updateStyle$25: number, it: number, $i$a$-let-Style$updateStyle$26: number, it: number, $i$a$-let-Style$updateStyle$27: number, it: number, insetLeft: number, insetEnd: number, insetTop: number, insetBottom: number, marginLeft: number, marginEnd: number, marginTop: number, marginBottom: number, paddingLeft: number, paddingEnd: number, paddingTop: androidNative.Array<org.nativescript.mason.masonkit.MinMax>, paddingBottom: androidNative.Array<org.nativescript.mason.masonkit.MinMax>, borderLeft: number, borderEnd: number, borderTop: number, borderBottom: number, sizeWidth: number, sizeHeight: number, minSizeWidth: number, minSizeHeight: number, maxSizeWidth: number, maxSizeHeight: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>, gapRow: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
					// public isDirty$masonkit_release(): boolean;
					public setInsetBottom(it: number, bottom: number): void;
					public getFlexWrap(): org.nativescript.mason.masonkit.FlexWrap;
					public setOverflowY(value: org.nativescript.mason.masonkit.Overflow): void;
					public setPaddingWithValueType(it: number, padding: number): void;
					public setJustifyItems(value: org.nativescript.mason.masonkit.JustifyItems): void;
					public setSizeWidth(value: org.nativescript.mason.masonkit.Dimension): void;
					public setDirection(value: org.nativescript.mason.masonkit.Direction): void;
					public setInsetWithValueType(it: number, inset: number): void;
					public setFlexShrink(value: number): void;
					public setGridTemplateRows(value: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
					public getAlignContent(): org.nativescript.mason.masonkit.AlignContent;
					public setMinSizeWidth(it: number, width: number): void;
					public getPadding(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public setMinSizeHeight(it: number, height: number): void;
					public setMargin(value: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>): void;
					public setFlexBasis(it: number, this_: number): void;
					public setScrollBarWidth(value: org.nativescript.mason.masonkit.Dimension): void;
					public setMarginBottom(it: number, bottom: number): void;
					public setPaddingLeft(it: number, left: number): void;
					public getBorder(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public setDisplay(value: org.nativescript.mason.masonkit.Display): void;
					public setGridAutoColumns(value: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
					public setJustifyContent(value: org.nativescript.mason.masonkit.JustifyContent): void;
					public setGridRow(value: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
					public setAlignContent(value: org.nativescript.mason.masonkit.AlignContent): void;
					public getScrollBarWidth(): org.nativescript.mason.masonkit.Dimension;
					public getSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public setMaxSizeWidth(it: number, width: number): void;
					public getAlignSelf(): org.nativescript.mason.masonkit.AlignSelf;
					public setBorderLeft(it: number, left: number): void;
					public setPosition(value: org.nativescript.mason.masonkit.Position): void;
					public setFlexBasis(value: org.nativescript.mason.masonkit.Dimension): void;
					public getGridAutoRows(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
					public setGridColumnStart(value: org.nativescript.mason.masonkit.GridPlacement): void;
					public setMarginRight(it: number, right: number): void;
					public getJustifyItems(): org.nativescript.mason.masonkit.JustifyItems;
					public setGap(height: number, this_: number, width_value: number, width_type: number): void;
					public setMinSizeHeight(value: org.nativescript.mason.masonkit.Dimension): void;
					public setInset(value: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>): void;
					public setBorderRight(it: number, right: number): void;
					public setPaddingRight(it: number, right: number): void;
					public getFlexDirection(): org.nativescript.mason.masonkit.FlexDirection;
					public setMaxSizeHeight(it: number, height: number): void;
					public getGridColumn(): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
					public getDisplay(): org.nativescript.mason.masonkit.Display;
					public setFlexGrow(value: number): void;
					public setMinSizeWidth(value: org.nativescript.mason.masonkit.Dimension): void;
					public getMinSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public setGapColumn(it: number, height: number): void;
					public getMargin(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public setAlignItems(value: org.nativescript.mason.masonkit.AlignItems): void;
					public setSizeHeight(it: number, height: number): void;
					public getJustifyContent(): org.nativescript.mason.masonkit.JustifyContent;
					public setGridAutoFlow(value: org.nativescript.mason.masonkit.GridAutoFlow): void;
					public setMaxSizeHeight(value: org.nativescript.mason.masonkit.Dimension): void;
					public setInsetLeft(it: number, left: number): void;
					public getGridRow(): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
					public getNativeMargins(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public setPaddingBottom(it: number, bottom: number): void;
					public setInsetRight(it: number, right: number): void;
					public toString(): string;
					public setDirty$masonkit_release(value: boolean): void;
					public getGridTemplateColumns(): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
					public setBorderBottom(it: number, bottom: number): void;
					public setMaxSizeWidth(value: org.nativescript.mason.masonkit.Dimension): void;
					public getGridAutoFlow(): org.nativescript.mason.masonkit.GridAutoFlow;
					public getAspectRatio(): java.lang.Float;
					public setScrollBarWidth(value: number): void;
					public setMarginTop(it: number, top: number): void;
					public setSizeWidth(it: number, width: number): void;
					public setMaxSize(value: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
					public setAspectRatio(value: java.lang.Float): void;
					public setOverflowX(value: org.nativescript.mason.masonkit.Overflow): void;
					public getGridColumnEnd(): org.nativescript.mason.masonkit.GridPlacement;
					public setSizeHeight(value: org.nativescript.mason.masonkit.Dimension): void;
					public setGridAutoRows(value: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
					public setBorder(value: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>): void;
					public setGapRow(it: number, width: number): void;
					public getFlexShrink(): number;
					public setBorderTop(it: number, top: number): void;
					public setFlexWrap(value: org.nativescript.mason.masonkit.FlexWrap): void;
					public setSize(value: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
					public getNativePtr(): number;
					public setOverflow(value: org.nativescript.mason.masonkit.Overflow): void;
					public setGap(value: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>): void;
				}
				export namespace Style {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Style.Companion>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export abstract class TrackSizingFunction {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.TrackSizingFunction>;
					public getCssValue(): string;
					public isRepeating(): boolean;
				}
				export namespace TrackSizingFunction {
					export class AutoRepeat extends org.nativescript.mason.masonkit.TrackSizingFunction {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TrackSizingFunction.AutoRepeat>;
						public component1(): org.nativescript.mason.masonkit.GridTrackRepetition;
						public equals(other: any): boolean;
						public component2(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
						public getGridTrackRepetition(): org.nativescript.mason.masonkit.GridTrackRepetition;
						public copy(gridTrackRepetition: org.nativescript.mason.masonkit.GridTrackRepetition, value: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): org.nativescript.mason.masonkit.TrackSizingFunction.AutoRepeat;
						public constructor(gridTrackRepetition: org.nativescript.mason.masonkit.GridTrackRepetition, value: androidNative.Array<org.nativescript.mason.masonkit.MinMax>);
						public hashCode(): number;
						public getValue(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
						public gridTrackRepetitionNativeType(): number;
						public gridTrackRepetitionNativeValue(): number;
						public toString(): string;
					}
					export class Single extends org.nativescript.mason.masonkit.TrackSizingFunction {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TrackSizingFunction.Single>;
						public equals(other: any): boolean;
						public hashCode(): number;
						public constructor(value: org.nativescript.mason.masonkit.MinMax);
						public component1(): org.nativescript.mason.masonkit.MinMax;
						public getValue(): org.nativescript.mason.masonkit.MinMax;
						public copy(value: org.nativescript.mason.masonkit.MinMax): org.nativescript.mason.masonkit.TrackSizingFunction.Single;
						public toString(): string;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class View {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.View>;
					public getGridTemplateRows(): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
					public setMaxSize(width: number, height: number): void;
					public setMarginWithValueType(value: number, type: number): void;
					public setRowGap(value: number, type: number): void;
					public setJustifySelf(value: org.nativescript.mason.masonkit.JustifySelf): void;
					public setBorder(left: number, top: number, right: number, bottom: number): void;
					public setGridRowStart(value: org.nativescript.mason.masonkit.GridPlacement): void;
					public getInBatch(): boolean;
					public getPosition(): org.nativescript.mason.masonkit.Position;
					public getFlexBasis(): org.nativescript.mason.masonkit.Dimension;
					public getJustifySelf(): org.nativescript.mason.masonkit.JustifySelf;
					public setPosition(left: number, top: number, right: number, bottom: number): void;
					public getGridColumnStart(): org.nativescript.mason.masonkit.GridPlacement;
					public setGridTemplateColumns(value: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
					public getOverflowX(): org.nativescript.mason.masonkit.Overflow;
					public getBorderLeft(): org.nativescript.mason.masonkit.LengthPercentage;
					public getInset(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public getMaxSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public getGridRowEnd(): org.nativescript.mason.masonkit.GridPlacement;
					public getFlexGrow(): number;
					public updateNodeAndStyle(): void;
					public getOverflowY(): org.nativescript.mason.masonkit.Overflow;
					public constructor(context: globalAndroid.content.Context);
					public getBorderBottom(): org.nativescript.mason.masonkit.LengthPercentage;
					public getInsetRight(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getDirection(): org.nativescript.mason.masonkit.Direction;
					public setSizeHeight(value: number, type: number): void;
					public setSize(width: org.nativescript.mason.masonkit.Dimension, height: org.nativescript.mason.masonkit.Dimension): void;
					public setInsetWithValueType(value: number, type: number): void;
					public setBorderTop(value: number, type: number): void;
					public getMaxSizeHeight(): org.nativescript.mason.masonkit.Dimension;
					public getFlexWrap(): org.nativescript.mason.masonkit.FlexWrap;
					public setOverflowY(value: org.nativescript.mason.masonkit.Overflow): void;
					public setPaddingLeft(value: number, type: number): void;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet, defStyleAttr: number);
					public getStylePaddingLeft(): org.nativescript.mason.masonkit.LengthPercentage;
					public generateDefaultLayoutParams(): globalAndroid.view.ViewGroup.LayoutParams;
					public getMarginJsonValue(): string;
					public getMasonPtrs(): string;
					public getInsetJsonValue(): string;
					public setBorderLeft(value: number, type: number): void;
					public checkLayoutParams(p: globalAndroid.view.ViewGroup.LayoutParams): boolean;
					public setDirection(value: org.nativescript.mason.masonkit.Direction): void;
					public setFlexShrink(value: number): void;
					public getMarginRight(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setGridTemplateRows(value: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
					public setMinSizeHeight(value: number, type: number): void;
					public getAlignContent(): org.nativescript.mason.masonkit.AlignContent;
					public setPaddingBottom(value: number, type: number): void;
					public onLayout(changed: boolean, l: number, t: number, r: number, b: number): void;
					public setMinSizeWidth(value: number, type: number): void;
					public setGapColumn(value: number, type: number): void;
					public setScrollBarWidth(value: org.nativescript.mason.masonkit.Dimension): void;
					public setMargin(left: org.nativescript.mason.masonkit.LengthPercentageAuto, top: org.nativescript.mason.masonkit.LengthPercentageAuto, right: org.nativescript.mason.masonkit.LengthPercentageAuto, bottom: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
					public getInsetLeft(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setGridRow(value: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
					public removeViews(this_: number, start: number): void;
					public setAlignContent(value: org.nativescript.mason.masonkit.AlignContent): void;
					public setColumnGap(value: number, type: number): void;
					public setPosition(value: org.nativescript.mason.masonkit.Position): void;
					public setInBatch(value: boolean): void;
					public setFlexBasis(value: org.nativescript.mason.masonkit.Dimension): void;
					public getMarginBottom(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setGridColumnStart(value: org.nativescript.mason.masonkit.GridPlacement): void;
					public setMargin(left: number, top: number, right: number, bottom: number): void;
					public generateLayoutParams(p: globalAndroid.view.ViewGroup.LayoutParams): globalAndroid.view.ViewGroup.LayoutParams;
					public nodeForView($this$nodeForView_u24lambda_u241_u24lambda_u240: globalAndroid.view.View): org.nativescript.mason.masonkit.Node;
					public getInsetCssValue(): string;
					public getMaxSizeJsonValue(): string;
					public getFlexDirection(): org.nativescript.mason.masonkit.FlexDirection;
					public setMaxSizeHeight(value: number, type: number): void;
					public setInsetLeft(value: number, type: number): void;
					public setMaxSize(width: number, width_type: number, height: number, height_type: number): void;
					public getStylePaddingRight(): org.nativescript.mason.masonkit.LengthPercentage;
					public setFlexGrow(value: number): void;
					public removeViewAt(index: number): void;
					public setGapRow(value: number, type: number): void;
					public getMargin(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public setAlignItems(value: org.nativescript.mason.masonkit.AlignItems): void;
					public getPaddingCssValue(): string;
					public setMarginLeft(value: number, type: number): void;
					public getGapRow(): org.nativescript.mason.masonkit.LengthPercentage;
					public setPadding(left: number, left_type: number, top: number, top_type: number, right: number, right_type: number, bottom: number, bottom_type: number): void;
					public setInsetTop(value: number, type: number): void;
					public setStyle(value: org.nativescript.mason.masonkit.Style): void;
					public getGridRow(): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
					public setMarginTop(value: number, type: number): void;
					public setSize(width: number, width_type: number, height: number, height_type: number): void;
					public onMeasure(height: number, masonHeight: number): void;
					public setStyleFromString(this_: string): void;
					public setPaddingWithValueType(value: number, type: number): void;
					public getInsetTop(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getSizeCssValue(): string;
					public getGridTemplateColumns(): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
					public getGridAutoFlow(): org.nativescript.mason.masonkit.GridAutoFlow;
					public getAspectRatio(): java.lang.Float;
					public setFlexBasis(value: number, type: number): void;
					public setOverflowX(value: org.nativescript.mason.masonkit.Overflow): void;
					public setGridAutoRows(value: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
					public setMarginRight(value: number, type: number): void;
					public getPaddingJsonValue(): string;
					public getFlexShrink(): number;
					public removeAllViews(): void;
					public getMarginTop(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getMasonPtr(): number;
					public setFlexWrap(value: org.nativescript.mason.masonkit.FlexWrap): void;
					public getNode(): org.nativescript.mason.masonkit.Node;
					public addViews(children: androidNative.Array<globalAndroid.view.View>): void;
					public getMinSizeJsonValue(): string;
					public static createGridView(context: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
					public setOverflow(value: org.nativescript.mason.masonkit.Overflow): void;
					public getStyleAsString(): string;
					public setBorder(left: org.nativescript.mason.masonkit.LengthPercentage, top: org.nativescript.mason.masonkit.LengthPercentage, right: org.nativescript.mason.masonkit.LengthPercentage, bottom: org.nativescript.mason.masonkit.LengthPercentage): void;
					public getAlignItems(): org.nativescript.mason.masonkit.AlignItems;
					public setBorder(left: number, left_type: number, top: number, top_type: number, right: number, right_type: number, bottom: number, bottom_type: number): void;
					public getGridRowStart(): org.nativescript.mason.masonkit.GridPlacement;
					public getGap(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>;
					public removeViewInLayout(view: globalAndroid.view.View): void;
					public invalidate(it: globalAndroid.view.View): void;
					public setFlexDirection(value: org.nativescript.mason.masonkit.FlexDirection): void;
					public setSize(width: number, height: number): void;
					public setBorderBottom(value: number, type: number): void;
					public getInsetBottom(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setInset(left: number, left_type: number, top: number, top_type: number, right: number, right_type: number, bottom: number, bottom_type: number): void;
					public setAlignSelf(value: org.nativescript.mason.masonkit.AlignSelf): void;
					public setGridColumn(value: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
					public getGridAutoColumns(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
					public getBorderCssValue(): string;
					public setPaddingRight(value: number, type: number): void;
					public getMinSizeCssValue(): string;
					public getOverflow(): org.nativescript.mason.masonkit.Overflow;
					public setMargin(left: number, left_type: number, top: number, top_type: number, right: number, right_type: number, bottom: number, bottom_type: number): void;
					public removeViewsInLayout(this_: number, start: number): void;
					public setMinSize(width: org.nativescript.mason.masonkit.Dimension, height: org.nativescript.mason.masonkit.Dimension): void;
					public setMaxSize(width: org.nativescript.mason.masonkit.Dimension, height: org.nativescript.mason.masonkit.Dimension): void;
					public isNodeDirty(): boolean;
					public setSizeWidth(value: number, type: number): void;
					public setGap(width: number, width_type: number, height: number, height_type: number): void;
					public setGridColumnEnd(value: org.nativescript.mason.masonkit.GridPlacement): void;
					public setGridRowEnd(value: org.nativescript.mason.masonkit.GridPlacement): void;
					public removeAllViewsInLayout(): void;
					public setPaddingTop(value: number, type: number): void;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet);
					public getSizeWidth(): org.nativescript.mason.masonkit.Dimension;
					public markNodeDirty(): void;
					public setMaxSizeWidth(value: number, type: number): void;
					public setJustifyItems(value: org.nativescript.mason.masonkit.JustifyItems): void;
					public static createFlexView(context: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
					public setMinSize(width: number, width_type: number, height: number, height_type: number): void;
					public static createBlockView(context: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
					public getPadding(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public setPadding(left: number, top: number, right: number, bottom: number): void;
					public getBorderTop(): org.nativescript.mason.masonkit.LengthPercentage;
					public getBorder(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public setDisplay(value: org.nativescript.mason.masonkit.Display): void;
					public getBorderRight(): org.nativescript.mason.masonkit.LengthPercentage;
					public setGridAutoColumns(value: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
					public setJustifyContent(value: org.nativescript.mason.masonkit.JustifyContent): void;
					public removeView(view: globalAndroid.view.View): void;
					public getScrollBarWidth(): org.nativescript.mason.masonkit.Dimension;
					public getSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public getAlignSelf(): org.nativescript.mason.masonkit.AlignSelf;
					public setMarginBottom(value: number, type: number): void;
					public getGridAutoRows(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
					public getMasonNodePtr(): number;
					public getMasonStylePtr(): number;
					public getStyle(): org.nativescript.mason.masonkit.Style;
					public getJustifyItems(): org.nativescript.mason.masonkit.JustifyItems;
					public generateLayoutParams(attrs: globalAndroid.util.AttributeSet): globalAndroid.view.ViewGroup.LayoutParams;
					public setPosition(left: org.nativescript.mason.masonkit.LengthPercentageAuto, top: org.nativescript.mason.masonkit.LengthPercentageAuto, right: org.nativescript.mason.masonkit.LengthPercentageAuto, bottom: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
					public getMinSizeHeight(): org.nativescript.mason.masonkit.Dimension;
					public getGridColumn(): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
					public applyLayoutParams(points: org.nativescript.mason.masonkit.View.LayoutParams, points: org.nativescript.mason.masonkit.Node, points: globalAndroid.view.View): void;
					public getStylePaddingTop(): org.nativescript.mason.masonkit.LengthPercentage;
					public setPadding(left: org.nativescript.mason.masonkit.LengthPercentage, top: org.nativescript.mason.masonkit.LengthPercentage, right: org.nativescript.mason.masonkit.LengthPercentage, bottom: org.nativescript.mason.masonkit.LengthPercentage): void;
					public setGap(row: org.nativescript.mason.masonkit.LengthPercentage, column: org.nativescript.mason.masonkit.LengthPercentage): void;
					public getDisplay(): org.nativescript.mason.masonkit.Display;
					public getMinSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public getMarginCssValue(): string;
					public getGapColumn(): org.nativescript.mason.masonkit.LengthPercentage;
					public getJustifyContent(): org.nativescript.mason.masonkit.JustifyContent;
					public setBorderRight(value: number, type: number): void;
					public setGridAutoFlow(value: org.nativescript.mason.masonkit.GridAutoFlow): void;
					public setMinSize(width: number, height: number): void;
					public setBorderWithValueType(value: number, type: number): void;
					public getMinSizeWidth(): org.nativescript.mason.masonkit.Dimension;
					public addViews(childIndex: androidNative.Array<globalAndroid.view.View>, child: number): void;
					public addView(child: globalAndroid.view.View, node: org.nativescript.mason.masonkit.Node): void;
					public getBorderJsonValue(): string;
					public addView($this$addView_u24lambda_u249: globalAndroid.view.View, childNode: number, this_: globalAndroid.view.ViewGroup.LayoutParams): void;
					public getMaxSizeCssValue(): string;
					public setInsetBottom(value: number, type: number): void;
					public setInsetRight(value: number, type: number): void;
					public setGap(width: number, height: number): void;
					public getMarginLeft(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setScrollBarWidth(value: number): void;
					public configure(block: any): void;
					public getStylePaddingBottom(): org.nativescript.mason.masonkit.LengthPercentage;
					public setAspectRatio(value: java.lang.Float): void;
					public getGridColumnEnd(): org.nativescript.mason.masonkit.GridPlacement;
					public getMaxSizeWidth(): org.nativescript.mason.masonkit.Dimension;
					public getSizeJsonValue(): string;
					public getSizeHeight(): org.nativescript.mason.masonkit.Dimension;
				}
				export namespace View {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.View.Companion>;
						public createBlockView($this$createBlockView_u24lambda_u242: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
						public createGridView($this$createGridView_u24lambda_u240: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
						public getGson$masonkit_release(): com.google.gson.Gson;
						public createFlexView($this$createFlexView_u24lambda_u241: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
					}
					export class LayoutParams {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.View.LayoutParams>;
						public getNumericAttributes$masonkit_release(): globalAndroid.util.SparseArray<java.lang.Float>;
						public constructor(source: globalAndroid.view.ViewGroup.LayoutParams);
						public setStringAttributes$masonkit_release(value: globalAndroid.util.SparseArray<string>): void;
						public constructor(width: number, height: number);
						public constructor(typedValue: globalAndroid.content.Context, i: globalAndroid.util.AttributeSet);
						public setNumericAttributes$masonkit_release(value: globalAndroid.util.SparseArray<java.lang.Float>): void;
						public getStringAttributes$masonkit_release(): globalAndroid.util.SparseArray<string>;
					}
					export class ViewMeasureFunc extends org.nativescript.mason.masonkit.MeasureFunc {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.View.ViewMeasureFunc>;
						public measure(param0: org.nativescript.mason.masonkit.Size<java.lang.Float>, param1: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
						public constructor(node: java.lang.ref.WeakReference<org.nativescript.mason.masonkit.Node>);
						public measure(height: org.nativescript.mason.masonkit.Size<java.lang.Float>, availableWidth: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
					}
				}
			}
		}
	}
}

declare namespace org {
	export namespace nativescript {
		export namespace mason {
			export namespace masonkit {
				export class ViewLayoutFactory {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.ViewLayoutFactory>;
					public onCreateView(name: string, context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet): globalAndroid.view.View;
					public constructor();
					public static getInstance(): org.nativescript.mason.masonkit.ViewLayoutFactory;
				}
				export namespace ViewLayoutFactory {
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

