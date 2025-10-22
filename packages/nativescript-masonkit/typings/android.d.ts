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
					public static getEntries(): any;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.AlignContent>;
					public static valueOf(value: string): org.nativescript.mason.masonkit.AlignContent;
					public getValue(): number;
				}
				export module AlignContent {
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
					public getValue(): number;
					public static valueOf(value: string): org.nativescript.mason.masonkit.AlignItems;
					public static getEntries(): any;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.AlignItems>;
				}
				export module AlignItems {
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
					public getValue(): number;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.AlignSelf>;
					public static valueOf(value: string): org.nativescript.mason.masonkit.AlignSelf;
					public static getEntries(): any;
				}
				export module AlignSelf {
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export abstract class AvailableSpace {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.AvailableSpace>;
					public static fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.AvailableSpace;
					public getValue$masonkit_release(): number;
					public getType$masonkit_release(): number;
				}
				export module AvailableSpace {
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
						public equals(other: any): boolean;
						public hashCode(): number;
						public toString(): string;
					}
					export class MinContent extends org.nativescript.mason.masonkit.AvailableSpace {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.AvailableSpace.MinContent>;
						public static INSTANCE: org.nativescript.mason.masonkit.AvailableSpace.MinContent;
						public equals(other: any): boolean;
						public hashCode(): number;
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
				export class BoxSizing {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.BoxSizing>;
					public static BorderBox: org.nativescript.mason.masonkit.BoxSizing;
					public static ContentBox: org.nativescript.mason.masonkit.BoxSizing;
					public getCssValue(): string;
					public static valueOf(value: string): org.nativescript.mason.masonkit.BoxSizing;
					public getValue(): number;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.BoxSizing>;
					public static getEntries(): any;
				}
				export module BoxSizing {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.BoxSizing.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.BoxSizing;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.BoxSizing.WhenMappings>;
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
				export class CharacterData {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.CharacterData>;
					/**
					 * Constructs a new instance of the org.nativescript.mason.masonkit.CharacterData interface with the provided implementation. An empty constructor exists calling super() when extending the interface class.
					 */
					public constructor(implementation: {
						getData(): string;
						setData(param0: string): void;
						getLength(): number;
						appendData(param0: string): org.nativescript.mason.masonkit.CharacterData;
						insertData(param0: number, param1: string): org.nativescript.mason.masonkit.CharacterData;
						deleteData(param0: number, param1: number): org.nativescript.mason.masonkit.CharacterData;
						replaceData(param0: number, param1: number, param2: string): org.nativescript.mason.masonkit.CharacterData;
						substringData(param0: number, param1: number): string;
					});
					public constructor();
					public getData(): string;
					public insertData(param0: number, param1: string): org.nativescript.mason.masonkit.CharacterData;
					public getLength(): number;
					public setData(param0: string): void;
					public deleteData(param0: number, param1: number): org.nativescript.mason.masonkit.CharacterData;
					public substringData(param0: number, param1: number): string;
					public appendData(param0: string): org.nativescript.mason.masonkit.CharacterData;
					public replaceData(param0: number, param1: number, param2: string): org.nativescript.mason.masonkit.CharacterData;
				}
			}
		}
	}
}

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class Constants {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Constants>;
					public static INSTANCE: org.nativescript.mason.masonkit.Constants;
					public static AUTO_VALUE: string = "auto";
					public static PX_UNIT: string = "px";
					public static PERCENT_UNIT: string = "%";
					public static UNSET_COLOR: number = 3735928559;
					public static VIEW_PLACEHOLDER: string = "￼";
					public static DEFAULT_FONT_SIZE: number = 16;
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
					public getValue$masonkit_release(): number;
					public static fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.Dimension;
					public isZero(): boolean;
					public getType$masonkit_release(): number;
					public updateValue$masonkit_release(value: number): void;
					public getJsonValue(): string;
				}
				export module Dimension {
					export class Auto extends org.nativescript.mason.masonkit.Dimension {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Dimension.Auto>;
						public static INSTANCE: org.nativescript.mason.masonkit.Dimension.Auto;
						public equals(other: any): boolean;
						public hashCode(): number;
						public toString(): string;
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class DimensionSerializer extends com.google.gson.JsonSerializer<org.nativescript.mason.masonkit.Dimension> {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.DimensionSerializer>;
					public constructor();
					public serialize(this_: org.nativescript.mason.masonkit.Dimension, src: java.lang.reflect.Type, typeOfSrc: com.google.gson.JsonSerializationContext): com.google.gson.JsonElement;
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
					public getValue(): number;
					public static getEntries(): any;
					public static valueOf(value: string): org.nativescript.mason.masonkit.Direction;
				}
				export module Direction {
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class Display {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Display>;
					public static None: org.nativescript.mason.masonkit.Display;
					public static Flex: org.nativescript.mason.masonkit.Display;
					public static Grid: org.nativescript.mason.masonkit.Display;
					public static Block: org.nativescript.mason.masonkit.Display;
					public static Inline: org.nativescript.mason.masonkit.Display;
					public static InlineBlock: org.nativescript.mason.masonkit.Display;
					public static InlineFlex: org.nativescript.mason.masonkit.Display;
					public static InlineGrid: org.nativescript.mason.masonkit.Display;
					public getCssValue(): string;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.Display>;
					public getValue(): number;
					public static valueOf(value: string): org.nativescript.mason.masonkit.Display;
					public static getEntries(): any;
				}
				export module Display {
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class DisplayMode {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.DisplayMode>;
					public static None: org.nativescript.mason.masonkit.DisplayMode;
					public static Inline: org.nativescript.mason.masonkit.DisplayMode;
					public static Box: org.nativescript.mason.masonkit.DisplayMode;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.DisplayMode>;
					public static getEntries(): any;
					public getValue(): number;
					public static valueOf(value: string): org.nativescript.mason.masonkit.DisplayMode;
				}
				export module DisplayMode {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.DisplayMode.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.DisplayMode;
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
				export class Document {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Document>;
					public getDocumentElement(): org.nativescript.mason.masonkit.Element;
					public getNode(): org.nativescript.mason.masonkit.Node;
					public setDocumentElement$masonkit_release(value: org.nativescript.mason.masonkit.Element): void;
					public constructor($this$node_u24lambda_u240: org.nativescript.mason.masonkit.Mason);
				}
			}
		}
	}
}

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class Element {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Element>;
					/**
					 * Constructs a new instance of the org.nativescript.mason.masonkit.Element interface with the provided implementation. An empty constructor exists calling super() when extending the interface class.
					 */
					public constructor(implementation: {
						getStyle(): org.nativescript.mason.masonkit.Style;
						getNode(): org.nativescript.mason.masonkit.Node;
						onNodeAttached(): void;
						onNodeDetached(): void;
						markNodeDirty(): void;
						isNodeDirty(): boolean;
						configure(param0: any): void;
						getView(): globalAndroid.view.View;
						layout(): org.nativescript.mason.masonkit.Layout;
						compute(): void;
						compute(param0: number, param1: number): void;
						computeMaxContent(): void;
						computeMinContent(): void;
						computeWithViewSize(): void;
						computeAndLayout(): org.nativescript.mason.masonkit.Layout;
						computeAndLayout(param0: number, param1: number): org.nativescript.mason.masonkit.Layout;
						computeWithSize(param0: number, param1: number): void;
						computeWithViewSize(param0: boolean): void;
						computeWithMaxContent(): void;
						computeWithMinContent(): void;
						attachAndApply(): void;
						append(param0: org.nativescript.mason.masonkit.Element): void;
						append(param0: string): void;
						append(param0: org.nativescript.mason.masonkit.Node): void;
						append(param0: androidNative.Array<string>): void;
						append(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
						append(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
						prepend(param0: org.nativescript.mason.masonkit.Element): void;
						prepend(param0: string): void;
						prepend(param0: org.nativescript.mason.masonkit.Node): void;
						prepend(param0: androidNative.Array<string>): void;
						prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
						prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
						invalidateLayout(): void;
						appendView(param0: globalAndroid.view.View): void;
						appendView(param0: androidNative.Array<globalAndroid.view.View>): void;
						prependView(param0: globalAndroid.view.View): void;
						prependView(param0: androidNative.Array<globalAndroid.view.View>): void;
						addChildAt(param0: string, param1: number): void;
						addChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
						addChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
						replaceChildAt(param0: string, param1: number): void;
						replaceChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
						replaceChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
						removeChildAt(param0: number): void;
					});
					public constructor();
					public configure(param0: any): void;
					public getView(): globalAndroid.view.View;
					public computeMaxContent(): void;
					public addChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public attachAndApply(): void;
					public layout(): org.nativescript.mason.masonkit.Layout;
					public getStyle(): org.nativescript.mason.masonkit.Style;
					public removeChildAt(param0: number): void;
					public onNodeAttached(): void;
					public onNodeDetached(): void;
					public computeWithViewSize(): void;
					public computeWithMaxContent(): void;
					public append(param0: org.nativescript.mason.masonkit.Element): void;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public append(param0: org.nativescript.mason.masonkit.Node): void;
					public markNodeDirty(): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public append(param0: androidNative.Array<string>): void;
					public replaceChildAt(param0: string, param1: number): void;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public prepend(param0: org.nativescript.mason.masonkit.Node): void;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public computeMinContent(): void;
					public addChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public computeAndLayout(): org.nativescript.mason.masonkit.Layout;
					public compute(): void;
					public invalidateLayout(): void;
					public computeWithViewSize(param0: boolean): void;
					public prepend(param0: org.nativescript.mason.masonkit.Element): void;
					public prepend(param0: androidNative.Array<string>): void;
					public addChildAt(param0: string, param1: number): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public appendView(param0: globalAndroid.view.View): void;
					public prependView(param0: globalAndroid.view.View): void;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public compute(param0: number, param1: number): void;
					public prepend(param0: string): void;
					public computeWithSize(param0: number, param1: number): void;
					public isNodeDirty(): boolean;
					public computeWithMinContent(): void;
					public getNode(): org.nativescript.mason.masonkit.Node;
					public append(param0: string): void;
					public prependView(param0: androidNative.Array<globalAndroid.view.View>): void;
					public computeAndLayout(param0: number, param1: number): org.nativescript.mason.masonkit.Layout;
					public appendView(param0: androidNative.Array<globalAndroid.view.View>): void;
				}
				export module Element {
					export class DefaultImpls {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Element.DefaultImpls>;
						public static computeWithMinContent($this: org.nativescript.mason.masonkit.Element): void;
						public static attachAndApply($this: org.nativescript.mason.masonkit.Element): void;
						public static onNodeDetached($this: org.nativescript.mason.masonkit.Element): void;
						public static computeAndLayout($this: org.nativescript.mason.masonkit.Element, width: number, height: number): org.nativescript.mason.masonkit.Layout;
						public static markNodeDirty($this: org.nativescript.mason.masonkit.Element): void;
						public static computeWithMaxContent($this: org.nativescript.mason.masonkit.Element): void;
						public static layout(layouts: org.nativescript.mason.masonkit.Element): org.nativescript.mason.masonkit.Layout;
						public static prependView(element: org.nativescript.mason.masonkit.Element, it: androidNative.Array<globalAndroid.view.View>): void;
						public static append(element: org.nativescript.mason.masonkit.Element, it: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
						public static append($this: org.nativescript.mason.masonkit.Element, element: org.nativescript.mason.masonkit.Element): void;
						public static prepend(element: org.nativescript.mason.masonkit.Element, $this$prepend_u24lambda_u244: string): void;
						public static appendView(element: org.nativescript.mason.masonkit.Element, it: androidNative.Array<globalAndroid.view.View>): void;
						public static computeMinContent($this: org.nativescript.mason.masonkit.Element): void;
						public static computeWithViewSize(width: org.nativescript.mason.masonkit.Element): void;
						public static isNodeDirty($this: org.nativescript.mason.masonkit.Element): boolean;
						public static compute($this: org.nativescript.mason.masonkit.Element, width: number, height: number): void;
						public static replaceChildAt($this: org.nativescript.mason.masonkit.Element, element: org.nativescript.mason.masonkit.Element, index: number): void;
						public static configure($this: org.nativescript.mason.masonkit.Element, block: any): void;
						public static removeChildAt($this: org.nativescript.mason.masonkit.Element, index: number): void;
						public static prepend($this: org.nativescript.mason.masonkit.Element, node: org.nativescript.mason.masonkit.Node): void;
						public static computeAndLayout($this: org.nativescript.mason.masonkit.Element): org.nativescript.mason.masonkit.Layout;
						public static prepend(element: org.nativescript.mason.masonkit.Element, it: androidNative.Array<string>): void;
						public static prepend(element: org.nativescript.mason.masonkit.Element, it: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
						public static replaceChildAt(element: org.nativescript.mason.masonkit.Element, $this$replaceChildAt_u24lambda_u2412: string, $this: number): void;
						public static compute($this: org.nativescript.mason.masonkit.Element): void;
						public static append(element: org.nativescript.mason.masonkit.Element, $this$append_u24lambda_u240: string): void;
						public static prepend($this: org.nativescript.mason.masonkit.Element, element: org.nativescript.mason.masonkit.Element): void;
						public static addChildAt($this: org.nativescript.mason.masonkit.Element, node: org.nativescript.mason.masonkit.Node, index: number): void;
						public static onNodeAttached($this: org.nativescript.mason.masonkit.Element): void;
						public static invalidateLayout(width: org.nativescript.mason.masonkit.Element): void;
						public static computeMaxContent($this: org.nativescript.mason.masonkit.Element): void;
						public static computeWithViewSize($this: org.nativescript.mason.masonkit.Element, layout: boolean): void;
						public static append($this: org.nativescript.mason.masonkit.Element, node: org.nativescript.mason.masonkit.Node): void;
						public static append(element: org.nativescript.mason.masonkit.Element, it: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
						public static computeWithSize($this: org.nativescript.mason.masonkit.Element, width: number, height: number): void;
						public static prepend(element: org.nativescript.mason.masonkit.Element, it: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
						public static replaceChildAt($this: org.nativescript.mason.masonkit.Element, node: org.nativescript.mason.masonkit.Node, index: number): void;
						public static appendView(child: org.nativescript.mason.masonkit.Element, $this: globalAndroid.view.View): void;
						public static prependView(child: org.nativescript.mason.masonkit.Element, $this: globalAndroid.view.View): void;
						public static addChildAt($this: org.nativescript.mason.masonkit.Element, element: org.nativescript.mason.masonkit.Element, index: number): void;
						public static addChildAt(element: org.nativescript.mason.masonkit.Element, $this$addChildAt_u24lambda_u2411: string, $this: number): void;
						public static append(element: org.nativescript.mason.masonkit.Element, it: androidNative.Array<string>): void;
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
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.FlexDirection>;
					public getValue(): number;
					public static valueOf(value: string): org.nativescript.mason.masonkit.FlexDirection;
					public static getEntries(): any;
				}
				export module FlexDirection {
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
					public static valueOf(value: string): org.nativescript.mason.masonkit.FlexWrap;
					public getValue(): number;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.FlexWrap>;
					public static getEntries(): any;
				}
				export module FlexWrap {
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class FontFace {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.FontFace>;
					public getFontFamily(): string;
					public setFontWeight(this_: string): org.nativescript.mason.masonkit.FontFace;
					public constructor(family: string, source: androidNative.Array<number>, descriptors: org.nativescript.mason.masonkit.FontFace.NSCFontDescriptors);
					public getDisplay(): org.nativescript.mason.masonkit.FontFace.NSCFontDisplay;
					public loadSync$masonkit_release(font: globalAndroid.content.Context, style: any): void;
					public constructor(family: string, source: java.nio.ByteBuffer);
					public constructor(family: string);
					public updateFontWeight$masonkit_release(it: org.nativescript.mason.masonkit.FontFace.NSCFontWeight): void;
					public getFont(): globalAndroid.graphics.Typeface;
					public updateDescriptor(value: string): void;
					public getWeight(): org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
					public constructor(family: string, source: androidNative.Array<number>);
					public setFontDisplay(value: string): org.nativescript.mason.masonkit.FontFace;
					public load(context: globalAndroid.content.Context, callback: any): void;
					public constructor(family: string, source: java.nio.ByteBuffer, descriptors: org.nativescript.mason.masonkit.FontFace.NSCFontDescriptors);
					public getStyle(): org.nativescript.mason.masonkit.FontFace.NSCFontStyle;
					public getFontPath(): string;
					public getStatus(): org.nativescript.mason.masonkit.FontFace.FontFaceStatus;
					public setDisplay(value: org.nativescript.mason.masonkit.FontFace.NSCFontDisplay): void;
					public setFontStyle(this_: string): org.nativescript.mason.masonkit.FontFace;
					public static clearFontCache(context: globalAndroid.content.Context): void;
					public setWeight(this_: org.nativescript.mason.masonkit.FontFace.NSCFontWeight): void;
					public static importFromRemote(context: globalAndroid.content.Context, url: string, load: boolean, callback: any): void;
					public setStyle(this_: org.nativescript.mason.masonkit.FontFace.NSCFontStyle): void;
					public updateFontStyle$masonkit_release(it: org.nativescript.mason.masonkit.FontFace.NSCFontStyle): void;
					public setStatus(value: org.nativescript.mason.masonkit.FontFace.FontFaceStatus): void;
					public constructor(family: string, source: string, descriptors: org.nativescript.mason.masonkit.FontFace.NSCFontDescriptors);
				}
				export module FontFace {
					export class Callback {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.FontFace.Callback>;
						/**
						 * Constructs a new instance of the org.nativescript.mason.masonkit.FontFace$Callback interface with the provided implementation. An empty constructor exists calling super() when extending the interface class.
						 */
						public constructor(implementation: {
							onSuccess(): void;
							onError(param0: string): void;
						});
						public constructor();
						public onSuccess(): void;
						public onError(param0: string): void;
					}
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.FontFace.Companion>;
						public clearFontCache(context: globalAndroid.content.Context): void;
						public importFromRemote(e: globalAndroid.content.Context, result: string, this_: boolean, context: any): void;
					}
					export class FontFaceStatus {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.FontFace.FontFaceStatus>;
						public static unloaded: org.nativescript.mason.masonkit.FontFace.FontFaceStatus;
						public static loading: org.nativescript.mason.masonkit.FontFace.FontFaceStatus;
						public static loaded: org.nativescript.mason.masonkit.FontFace.FontFaceStatus;
						public static error: org.nativescript.mason.masonkit.FontFace.FontFaceStatus;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.FontFace.FontFaceStatus>;
						public static valueOf(value: string): org.nativescript.mason.masonkit.FontFace.FontFaceStatus;
						public static getEntries(): any;
					}
					export class NSCFontDescriptors {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.FontFace.NSCFontDescriptors>;
						public getVariationSettings(): string;
						public getFeatureSettings(): string;
						public getWeight(): org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
						public getStyle(): org.nativescript.mason.masonkit.FontFace.NSCFontStyle;
						public setDisplay(value: org.nativescript.mason.masonkit.FontFace.NSCFontDisplay): void;
						public setVariationSettings(value: string): void;
						public getUnicodeRange(): string;
						public setFontWeight(value: string): void;
						public setUnicodeRange(value: string): void;
						public setAscentOverride(value: string): void;
						public setStretch(value: string): void;
						public getDescentOverride(): string;
						public setFontDisplay(value: string): void;
						public setFamily(value: string): void;
						public setLineGapOverride(value: string): void;
						public setWeight(value: org.nativescript.mason.masonkit.FontFace.NSCFontWeight): void;
						public setFontStyle(angle: string): void;
						public setDescentOverride(value: string): void;
						public update$masonkit_release(it: string): void;
						public getLineGapOverride(): string;
						public getFamily(): string;
						public constructor(family: string);
						public getDisplay(): org.nativescript.mason.masonkit.FontFace.NSCFontDisplay;
						public getAscentOverride(): string;
						public getStretch(): string;
						public setStyle(value: org.nativescript.mason.masonkit.FontFace.NSCFontStyle): void;
						public setFeatureSettings(value: string): void;
					}
					export class NSCFontDisplay {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.FontFace.NSCFontDisplay>;
						public static Auto: org.nativescript.mason.masonkit.FontFace.NSCFontDisplay;
						public static Block: org.nativescript.mason.masonkit.FontFace.NSCFontDisplay;
						public static Fallback: org.nativescript.mason.masonkit.FontFace.NSCFontDisplay;
						public static Optional: org.nativescript.mason.masonkit.FontFace.NSCFontDisplay;
						public static Swap: org.nativescript.mason.masonkit.FontFace.NSCFontDisplay;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.FontFace.NSCFontDisplay>;
						public static getEntries(): any;
						public static valueOf(value: string): org.nativescript.mason.masonkit.FontFace.NSCFontDisplay;
					}
					export class NSCFontStyle {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.FontFace.NSCFontStyle>;
						public getStyle$masonkit_release(): org.nativescript.mason.masonkit.FontFace.NSCFontStyle.Style;
						public static Oblique(angle: number): org.nativescript.mason.masonkit.FontFace.NSCFontStyle;
						public getFontStyle(): number;
						public toString(): string;
						public static getItalic(): org.nativescript.mason.masonkit.FontFace.NSCFontStyle;
						public static getNormal(): org.nativescript.mason.masonkit.FontFace.NSCFontStyle;
						public static Oblique(): org.nativescript.mason.masonkit.FontFace.NSCFontStyle;
					}
					export module NSCFontStyle {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.FontFace.NSCFontStyle.Companion>;
							public getItalic(): org.nativescript.mason.masonkit.FontFace.NSCFontStyle;
							public Oblique(this_: number): org.nativescript.mason.masonkit.FontFace.NSCFontStyle;
							public Oblique(): org.nativescript.mason.masonkit.FontFace.NSCFontStyle;
							public getNormal(): org.nativescript.mason.masonkit.FontFace.NSCFontStyle;
						}
						export class Style {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.FontFace.NSCFontStyle.Style>;
							public static Normal: org.nativescript.mason.masonkit.FontFace.NSCFontStyle.Style;
							public static Italic: org.nativescript.mason.masonkit.FontFace.NSCFontStyle.Style;
							public static Oblique: org.nativescript.mason.masonkit.FontFace.NSCFontStyle.Style;
							public getValue$masonkit_release(): number;
							public static values(): androidNative.Array<org.nativescript.mason.masonkit.FontFace.NSCFontStyle.Style>;
							public static valueOf(value: string): org.nativescript.mason.masonkit.FontFace.NSCFontStyle.Style;
							public static getEntries(): any;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.FontFace.NSCFontStyle.WhenMappings>;
						}
					}
					export class NSCFontWeight {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.FontFace.NSCFontWeight>;
						public static Thin: org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
						public static ExtraLight: org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
						public static Light: org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
						public static Normal: org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
						public static Medium: org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
						public static SemiBold: org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
						public static Bold: org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
						public static ExtraBold: org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
						public static Black: org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
						public static from(value: number): org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
						public getStyle$masonkit_release(isItalic: boolean): number;
						public static valueOf(value: string): org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
						public getWeight(): number;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.FontFace.NSCFontWeight>;
						public static getEntries(): any;
						public getRaw(): number;
						public isBold(): boolean;
					}
					export module NSCFontWeight {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.FontFace.NSCFontWeight.Companion>;
							public from(value: number): org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
						}
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
				export class FontFaceSet {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.FontFaceSet>;
					public delete(font: org.nativescript.mason.masonkit.FontFace): void;
					public add(font: org.nativescript.mason.masonkit.FontFace): void;
					public getStatus(): org.nativescript.mason.masonkit.FontFaceSet.FontFaceSetStatus;
					public check(font: string, value: string): boolean;
					public load(context: globalAndroid.content.Context, font: string, text: string, callback: any): void;
					public setOnStatus(value: any): void;
					public getSize(): number;
					public static getInstance(): org.nativescript.mason.masonkit.FontFaceSet;
					public getOnStatus(): any;
					public getIter(): java.util.Iterator<org.nativescript.mason.masonkit.FontFace>;
					public getArray(): androidNative.Array<org.nativescript.mason.masonkit.FontFace>;
					public constructor();
					public clear(): void;
				}
				export module FontFaceSet {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.FontFaceSet.Companion>;
						public getInstance(): org.nativescript.mason.masonkit.FontFaceSet;
					}
					export class FontFaceSetStatus {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.FontFaceSet.FontFaceSetStatus>;
						public static loading: org.nativescript.mason.masonkit.FontFaceSet.FontFaceSetStatus;
						public static loaded: org.nativescript.mason.masonkit.FontFaceSet.FontFaceSetStatus;
						public static valueOf(value: string): org.nativescript.mason.masonkit.FontFaceSet.FontFaceSetStatus;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.FontFaceSet.FontFaceSetStatus>;
						public static getEntries(): any;
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
					public getValue(): number;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.GridAutoFlow>;
					public static valueOf(value: string): org.nativescript.mason.masonkit.GridAutoFlow;
					public static getEntries(): any;
				}
				export module GridAutoFlow {
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export abstract class GridPlacement {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.GridPlacement>;
					public getCssValue(): string;
					public getPlacementValue$masonkit_release(): number;
					public static fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.GridPlacement;
					public getType$masonkit_release(): number;
					public getJsonValue(): string;
				}
				export module GridPlacement {
					export class Auto extends org.nativescript.mason.masonkit.GridPlacement {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.GridPlacement.Auto>;
						public static INSTANCE: org.nativescript.mason.masonkit.GridPlacement.Auto;
						public equals(other: any): boolean;
						public hashCode(): number;
						public toString(): string;
					}
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.GridPlacement.Companion>;
						public fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.GridPlacement;
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
					public static fromInt(type: number, value: number): org.nativescript.mason.masonkit.GridTrackRepetition;
				}
				export module GridTrackRepetition {
					export class AutoFill extends org.nativescript.mason.masonkit.GridTrackRepetition {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.GridTrackRepetition.AutoFill>;
						public static INSTANCE: org.nativescript.mason.masonkit.GridTrackRepetition.AutoFill;
						public equals(other: any): boolean;
						public hashCode(): number;
						public toString(): string;
					}
					export class AutoFit extends org.nativescript.mason.masonkit.GridTrackRepetition {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.GridTrackRepetition.AutoFit>;
						public static INSTANCE: org.nativescript.mason.masonkit.GridTrackRepetition.AutoFit;
						public equals(other: any): boolean;
						public hashCode(): number;
						public toString(): string;
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class Img implements org.nativescript.mason.masonkit.Element, org.nativescript.mason.masonkit.MeasureFunc {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Img>;
					public getView(): globalAndroid.view.View;
					public computeMaxContent(): void;
					public configure(param0: any): void;
					public replaceChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public layout(): org.nativescript.mason.masonkit.Layout;
					public addChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public computeWithViewSize(layout: boolean): void;
					public getStyle(): org.nativescript.mason.masonkit.Style;
					public removeChildAt(param0: number): void;
					public append(param0: org.nativescript.mason.masonkit.Element): void;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public append(param0: org.nativescript.mason.masonkit.Node): void;
					public prependView(view: globalAndroid.view.View): void;
					public replaceChildAt(param0: string, param1: number): void;
					public replaceChildAt(text: string, index: number): void;
					public prepend(param0: org.nativescript.mason.masonkit.Node): void;
					public computeMinContent(): void;
					public computeAndLayout(): org.nativescript.mason.masonkit.Layout;
					public compute(): void;
					public invalidateLayout(): void;
					public getOnStateChange(): any;
					public setCurrentBitmap$masonkit_release(value: globalAndroid.graphics.Bitmap): void;
					public computeWithViewSize(param0: boolean): void;
					public prepend(param0: org.nativescript.mason.masonkit.Element): void;
					public measure(param0: org.nativescript.mason.masonkit.Size<java.lang.Float>, param1: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
					public appendView(view: globalAndroid.view.View): void;
					public prepend(param0: androidNative.Array<string>): void;
					public removeChildAt(index: number): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public prependView(param0: globalAndroid.view.View): void;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public constructor($this$_init__u24lambda_u240: globalAndroid.content.Context, this_: org.nativescript.mason.masonkit.Mason);
					public appendView(views: androidNative.Array<globalAndroid.view.View>): void;
					public compute(param0: number, param1: number): void;
					public addChildAt(text: string, index: number): void;
					public prepend(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public syncStyle(this_: string): void;
					public prepend(param0: string): void;
					public compute(width: number, height: number): void;
					public setSrc(it: string): void;
					public computeWithMinContent(): void;
					public isNodeDirty(): boolean;
					public prepend(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public append(texts: androidNative.Array<string>): void;
					public constructor(context: globalAndroid.content.Context);
					public computeAndLayout(width: number, height: number): org.nativescript.mason.masonkit.Layout;
					public computeAndLayout(param0: number, param1: number): org.nativescript.mason.masonkit.Layout;
					public addChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public setImageResource(resId: number): void;
					public attachAndApply(): void;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet);
					public getSrc(): string;
					public onNodeAttached(): void;
					public computeWithViewSize(): void;
					public onNodeDetached(): void;
					public computeWithMaxContent(): void;
					public onMeasure(layout: number, width: number): void;
					public append(node: org.nativescript.mason.masonkit.Node): void;
					public prepend(node: org.nativescript.mason.masonkit.Node): void;
					public markNodeDirty(): void;
					public prepend(element: org.nativescript.mason.masonkit.Element): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public append(param0: androidNative.Array<string>): void;
					public constructor($this$_init__u24lambda_u241: globalAndroid.content.Context, this_: globalAndroid.util.AttributeSet, context: boolean);
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public addChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public configure(block: any): void;
					public setImageBitmap(bm: globalAndroid.graphics.Bitmap): void;
					public append(element: org.nativescript.mason.masonkit.Element): void;
					public replaceChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public getCurrentBitmap$masonkit_release(): globalAndroid.graphics.Bitmap;
					public append(text: string): void;
					public setOnStateChange(value: any): void;
					public addChildAt(param0: string, param1: number): void;
					public prepend(strings: androidNative.Array<string>): void;
					public appendView(param0: globalAndroid.view.View): void;
					public prepend(string: string): void;
					public prependView(views: androidNative.Array<globalAndroid.view.View>): void;
					public measure(it: org.nativescript.mason.masonkit.Size<java.lang.Float>, size: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
					public addChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public computeWithSize(param0: number, param1: number): void;
					public getNode(): org.nativescript.mason.masonkit.Node;
					public computeWithSize(width: number, height: number): void;
					public append(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public append(param0: string): void;
					public append(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public prependView(param0: androidNative.Array<globalAndroid.view.View>): void;
					public appendView(param0: androidNative.Array<globalAndroid.view.View>): void;
				}
			}
		}
	}
}

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export abstract class InlineSegment {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.InlineSegment>;
				}
				export module InlineSegment {
					export class InlineChild extends org.nativescript.mason.masonkit.InlineSegment {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.InlineSegment.InlineChild>;
						public nodePtr: number;
						public descent: number;
						public equals(this_: any): boolean;
						public hashCode(): number;
						public constructor(nodePtr: number, descent: number);
						public toString(): string;
					}
					export class Text extends org.nativescript.mason.masonkit.InlineSegment {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.InlineSegment.Text>;
						public width: number;
						public ascent: number;
						public descent: number;
						public equals(this_: any): boolean;
						public constructor(width: number, ascent: number, descent: number);
						public hashCode(): number;
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
					public static valueOf(value: string): org.nativescript.mason.masonkit.JustifyContent;
					public getCssValue(): string;
					public getValue(): number;
					public static getEntries(): any;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.JustifyContent>;
				}
				export module JustifyContent {
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
					public static valueOf(value: string): org.nativescript.mason.masonkit.JustifyItems;
					public getValue(): number;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.JustifyItems>;
					public static getEntries(): any;
				}
				export module JustifyItems {
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
					public static valueOf(value: string): org.nativescript.mason.masonkit.JustifySelf;
					public static getEntries(): any;
					public getValue(): number;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.JustifySelf>;
				}
				export module JustifySelf {
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class Layout {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Layout>;
					public getX(): number;
					public component3(): number;
					public component8(): org.nativescript.mason.masonkit.Rect<java.lang.Float>;
					public toString(): string;
					public getOrder(): number;
					public component4(): number;
					public component1(): number;
					public component7(): org.nativescript.mason.masonkit.Rect<java.lang.Float>;
					public component6(): org.nativescript.mason.masonkit.Rect<java.lang.Float>;
					public hashCode(): number;
					public getMargin(): org.nativescript.mason.masonkit.Rect<java.lang.Float>;
					public component5(): number;
					public component10(): org.nativescript.mason.masonkit.Size<java.lang.Float>;
					public component9(): org.nativescript.mason.masonkit.Size<java.lang.Float>;
					public getHeight(): number;
					public equals(other: any): boolean;
					public getWidth(): number;
					public getY(): number;
					public getBorder(): org.nativescript.mason.masonkit.Rect<java.lang.Float>;
					public getPadding(): org.nativescript.mason.masonkit.Rect<java.lang.Float>;
					public copy(order: number, x: number, y: number, width: number, height: number, border: org.nativescript.mason.masonkit.Rect<java.lang.Float>, margin: org.nativescript.mason.masonkit.Rect<java.lang.Float>, padding: org.nativescript.mason.masonkit.Rect<java.lang.Float>, contentSize: org.nativescript.mason.masonkit.Size<java.lang.Float>, scrollbarSize: org.nativescript.mason.masonkit.Size<java.lang.Float>, children: java.util.List<org.nativescript.mason.masonkit.Layout>): org.nativescript.mason.masonkit.Layout;
					public static getEmpty(): org.nativescript.mason.masonkit.Layout;
					public constructor(order: number, x: number, y: number, width: number, height: number, border: org.nativescript.mason.masonkit.Rect<java.lang.Float>, margin: org.nativescript.mason.masonkit.Rect<java.lang.Float>, padding: org.nativescript.mason.masonkit.Rect<java.lang.Float>, contentSize: org.nativescript.mason.masonkit.Size<java.lang.Float>, scrollbarSize: org.nativescript.mason.masonkit.Size<java.lang.Float>, children: java.util.List<org.nativescript.mason.masonkit.Layout>);
					public getContentSize(): org.nativescript.mason.masonkit.Size<java.lang.Float>;
					public component11(): java.util.List<org.nativescript.mason.masonkit.Layout>;
					public component2(): number;
					public getChildren(): java.util.List<org.nativescript.mason.masonkit.Layout>;
					public getScrollbarSize(): org.nativescript.mason.masonkit.Size<java.lang.Float>;
				}
				export module Layout {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Layout.Companion>;
						public getEmpty(): org.nativescript.mason.masonkit.Layout;
						public fromFloatArray$masonkit_release(i: androidNative.Array<number>, position: number): any;
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
					public getValue$masonkit_release(): number;
					public static fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.LengthPercentage;
					public getType$masonkit_release(): number;
					public updateValue$masonkit_release(value: number): void;
					public getJsonValue(): string;
				}
				export module LengthPercentage {
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
						public static points: number = 0.0;
						public equals(other: any): boolean;
						public hashCode(): number;
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
				export abstract class LengthPercentageAuto {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public static fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getCssValue(): string;
					public getValue$masonkit_release(): number;
					public getType$masonkit_release(): number;
					public updateValue$masonkit_release(value: number): void;
					public getJsonValue(): string;
				}
				export module LengthPercentageAuto {
					export class Auto extends org.nativescript.mason.masonkit.LengthPercentageAuto {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAuto.Auto>;
						public static INSTANCE: org.nativescript.mason.masonkit.LengthPercentageAuto.Auto;
						public equals(other: any): boolean;
						public hashCode(): number;
						public toString(): string;
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
						public equals(other: any): boolean;
						public hashCode(): number;
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
				export class LengthPercentageAutoSerializer extends com.google.gson.JsonSerializer<org.nativescript.mason.masonkit.LengthPercentageAuto> {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentageAutoSerializer>;
					public constructor();
					public serialize(this_: org.nativescript.mason.masonkit.LengthPercentageAuto, src: java.lang.reflect.Type, typeOfSrc: com.google.gson.JsonSerializationContext): com.google.gson.JsonElement;
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
					public serialize(this_: org.nativescript.mason.masonkit.LengthPercentage, src: java.lang.reflect.Type, typeOfSrc: com.google.gson.JsonSerializationContext): com.google.gson.JsonElement;
				}
			}
		}
	}
}

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
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
				export module Line {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Line.Companion>;
						public fromStartAndEndValues(end: number, this_: number, startType: number, startValue: number): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
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
				export class LoadingState {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.LoadingState>;
					public static Loading: org.nativescript.mason.masonkit.LoadingState;
					public static Loaded: org.nativescript.mason.masonkit.LoadingState;
					public static Error: org.nativescript.mason.masonkit.LoadingState;
					public static valueOf(value: string): org.nativescript.mason.masonkit.LoadingState;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.LoadingState>;
					public static getEntries(): any;
					public getValue(): number;
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
					public createTextNode($this$createTextNode_u24lambda_u2412: org.nativescript.mason.masonkit.MeasureFunc, func: boolean): org.nativescript.mason.masonkit.Node;
					public static getShared(): org.nativescript.mason.masonkit.Mason;
					public finalize(): void;
					public createNode(): org.nativescript.mason.masonkit.Node;
					public createTextView(context: globalAndroid.content.Context, type: org.nativescript.mason.masonkit.TextType): org.nativescript.mason.masonkit.TextView;
					public createNode(children: androidNative.Array<org.nativescript.mason.masonkit.Node>): org.nativescript.mason.masonkit.Node;
					public createTextNode(children: androidNative.Array<org.nativescript.mason.masonkit.Node>): org.nativescript.mason.masonkit.Node;
					public constructor();
					public clear(): void;
					public createNode($this$createNode_u24lambda_u245: org.nativescript.mason.masonkit.MeasureFunc, func: boolean): org.nativescript.mason.masonkit.Node;
					public createScrollView(context: globalAndroid.content.Context): org.nativescript.mason.masonkit.Scroll;
					public createTextView(context: globalAndroid.content.Context): org.nativescript.mason.masonkit.TextView;
					public createTextView(context: globalAndroid.content.Context, type: org.nativescript.mason.masonkit.TextType, isAnonymous: boolean): org.nativescript.mason.masonkit.TextView;
					public requestLayout(node: number): void;
					public getNodes$masonkit_release(): java.util.WeakHashMap<java.lang.Long,org.nativescript.mason.masonkit.Node>;
					public requestLayout(view: globalAndroid.view.View): void;
					public printTree(node: org.nativescript.mason.masonkit.Node): void;
					public createView(context: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
					public createImageView(context: globalAndroid.content.Context): org.nativescript.mason.masonkit.Img;
					public configureStyleForView(this_: globalAndroid.view.View, view: any): void;
					public createTextNode(): org.nativescript.mason.masonkit.Node;
					public getNativePtr$masonkit_release(): number;
					public createTextNode(map: androidNative.Array<org.nativescript.mason.masonkit.Node>, item$iv$iv: boolean): org.nativescript.mason.masonkit.Node;
					public createNode(it: androidNative.Array<org.nativescript.mason.masonkit.Node>, item$iv$iv: boolean): org.nativescript.mason.masonkit.Node;
					public getNativePtr(): number;
					public styleForView(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Style;
					public nodeForView($this$nodeForView_u24lambda_u2414_u24lambda_u2413: globalAndroid.view.View): org.nativescript.mason.masonkit.Node;
				}
				export module Mason {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Mason.Companion>;
						public initLib$masonkit_release(): void;
						public getGson$masonkit_release(): com.google.gson.Gson;
						public getShared(): org.nativescript.mason.masonkit.Mason;
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
					public static fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.MaxSizing;
					public getValue(): number;
				}
				export module MaxSizing {
					export class Auto extends org.nativescript.mason.masonkit.MaxSizing {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.Auto>;
						public static INSTANCE: org.nativescript.mason.masonkit.MaxSizing.Auto;
						public equals(other: any): boolean;
						public hashCode(): number;
						public toString(): string;
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
						public equals(other: any): boolean;
						public hashCode(): number;
						public toString(): string;
					}
					export class MinContent extends org.nativescript.mason.masonkit.MaxSizing {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MaxSizing.MinContent>;
						public static INSTANCE: org.nativescript.mason.masonkit.MaxSizing.MinContent;
						public equals(other: any): boolean;
						public hashCode(): number;
						public toString(): string;
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class MeasureFuncImpl {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.MeasureFuncImpl>;
					public measure(knownHeight: number, availableWidth: number): number;
					public constructor(measureFunc: java.lang.ref.WeakReference<org.nativescript.mason.masonkit.MeasureFunc>);
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
					public make(hBits: number, this_: number): number;
					public make(width: number, height: number): number;
					public getHeight(measureOutput: number): number;
					public getWidth(measureOutput: number): number;
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
					public static fromTypeValue(minType: number, minValue: number, maxType: number, maxValue: number): org.nativescript.mason.masonkit.MinMax;
					public getMaxValue(): number;
					public getMaxType(): number;
					public getMin(): org.nativescript.mason.masonkit.MinSizing;
					public getMinType(): number;
					public getMinValue(): number;
				}
				export module MinMax {
					export class Auto extends org.nativescript.mason.masonkit.MinMax {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.Auto>;
						public static INSTANCE: org.nativescript.mason.masonkit.MinMax.Auto;
						public equals(other: any): boolean;
						public hashCode(): number;
						public toString(): string;
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
						public equals(other: any): boolean;
						public hashCode(): number;
						public toString(): string;
					}
					export class MinContent extends org.nativescript.mason.masonkit.MinMax {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MinMax.MinContent>;
						public static INSTANCE: org.nativescript.mason.masonkit.MinMax.MinContent;
						public equals(other: any): boolean;
						public hashCode(): number;
						public toString(): string;
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export abstract class MinSizing {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.MinSizing>;
					public getType(): number;
					public getValue(): number;
					public static fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.MinSizing;
				}
				export module MinSizing {
					export class Auto extends org.nativescript.mason.masonkit.MinSizing {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MinSizing.Auto>;
						public static INSTANCE: org.nativescript.mason.masonkit.MinSizing.Auto;
						public equals(other: any): boolean;
						public hashCode(): number;
						public toString(): string;
					}
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MinSizing.Companion>;
						public fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.MinSizing;
					}
					export class MaxContent extends org.nativescript.mason.masonkit.MinSizing {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MinSizing.MaxContent>;
						public static INSTANCE: org.nativescript.mason.masonkit.MinSizing.MaxContent;
						public equals(other: any): boolean;
						public hashCode(): number;
						public toString(): string;
					}
					export class MinContent extends org.nativescript.mason.masonkit.MinSizing {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.MinSizing.MinContent>;
						public static INSTANCE: org.nativescript.mason.masonkit.MinSizing.MinContent;
						public equals(other: any): boolean;
						public hashCode(): number;
						public toString(): string;
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class NativeHelpers {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.NativeHelpers>;
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
				export class Node {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Node>;
					public isStyleInitialized$masonkit_release(): boolean;
					public getChildCount(): number;
					public setAnonymous$masonkit_release(value: boolean): void;
					public appendChild(child: org.nativescript.mason.masonkit.Node): void;
					public finalize(): void;
					public getMason$masonkit_release(): org.nativescript.mason.masonkit.Mason;
					public getMeasureFunc$masonkit_release(): org.nativescript.mason.masonkit.MeasureFunc;
					public isFlattened$masonkit_release(): boolean;
					public setChildren$masonkit_release(value: java.util.ArrayList<org.nativescript.mason.masonkit.Node>): void;
					public getStyle$masonkit_release(): org.nativescript.mason.masonkit.Style;
					public getParentElement(): org.nativescript.mason.masonkit.Element;
					public replaceChildAt(authorNodes: org.nativescript.mason.masonkit.Node, this_: number): void;
					public removeMeasureFunction(): void;
					public getChildAt(index: number): org.nativescript.mason.masonkit.Node;
					public setMeasureFunction(measure: org.nativescript.mason.masonkit.MeasureFunc): void;
					public getAvailableHeight$masonkit_release(): java.lang.Float;
					public getChildren$masonkit_release(): java.util.ArrayList<org.nativescript.mason.masonkit.Node>;
					public setFlattened$masonkit_release(value: boolean): void;
					public getParent(): org.nativescript.mason.masonkit.Node;
					public getDocument$masonkit_release(): org.nativescript.mason.masonkit.Document;
					public setDocument$masonkit_release(value: org.nativescript.mason.masonkit.Document): void;
					public getType(): org.nativescript.mason.masonkit.NodeType;
					public constructor(mason: org.nativescript.mason.masonkit.Mason, nativePtr: number, nodeType: org.nativescript.mason.masonkit.NodeType);
					public setComputeCacheDirty$masonkit_release(value: boolean): void;
					public setAvailableHeight$masonkit_release(value: java.lang.Float): void;
					public getKnownHeight$masonkit_release(): java.lang.Float;
					public setKnownWidth$masonkit_release(value: java.lang.Float): void;
					public isAnonymous$masonkit_release(): boolean;
					public getCachedWidth$masonkit_release(): number;
					public setComputedSize(width: number, height: number): void;
					public getComputeCache$masonkit_release(): any;
					public setCachedHeight$masonkit_release(value: number): void;
					public getView(): any;
					public removeChildAt(this_: number): org.nativescript.mason.masonkit.Node;
					public isDirty(): boolean;
					public setCachedWidth$masonkit_release(value: number): void;
					public setType$masonkit_release(value: org.nativescript.mason.masonkit.NodeType): void;
					public getCachedHeight$masonkit_release(): number;
					public setNativePtr$masonkit_release(value: number): void;
					public setDefaultMeasureFunction$masonkit_release(): void;
					public setKnownHeight$masonkit_release(value: java.lang.Float): void;
					public removeChild(child: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Node;
					public addChildAt(authorNodes: org.nativescript.mason.masonkit.Node, this_: number): void;
					public setComputeCache$masonkit_release(value: any): void;
					public setComputedLayout$masonkit_release(value: org.nativescript.mason.masonkit.Layout): void;
					public appendChild(this_: globalAndroid.view.View): void;
					public getRootNode(): org.nativescript.mason.masonkit.Node;
					public setMeasureFunc$masonkit_release(value: org.nativescript.mason.masonkit.MeasureFunc): void;
					public getLayoutChildren(): java.util.List<org.nativescript.mason.masonkit.Node>;
					public getComputeCacheDirty$masonkit_release(): boolean;
					public getOnNodeAttached(): any;
					public getOnNodeDetached(): any;
					public removeChildren(): void;
					public setOnNodeDetached(value: any): void;
					public setAvailableWidth$masonkit_release(value: java.lang.Float): void;
					public getAvailableWidth$masonkit_release(): java.lang.Float;
					public setStyleInitialized$masonkit_release(value: boolean): void;
					public dirty(): void;
					public getComputedLayout(): org.nativescript.mason.masonkit.Layout;
					public getKnownWidth$masonkit_release(): java.lang.Float;
					public setParent$masonkit_release(value: org.nativescript.mason.masonkit.Node): void;
					public setOnNodeAttached(value: any): void;
					public getParentNode(): org.nativescript.mason.masonkit.Node;
					public getChildren(): java.util.List<org.nativescript.mason.masonkit.Node>;
					public getNativePtr$masonkit_release(): number;
					public setView(value: any): void;
					public getOrCreateAnonymousTextContainer$masonkit_release(textView: boolean, this_: boolean): org.nativescript.mason.masonkit.Node;
					public getNativePtr(): number;
				}
				export module Node {
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Node.WhenMappings>;
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
					public batchCreateViews(this_: globalAndroid.content.Context): void;
					public setMargin(this_: globalAndroid.view.View, view: number, left: number, left_type: number, top: number, top_type: number, right: number, right_type: number, bottom: number): void;
					public setPaddingBottom(this_: globalAndroid.view.View, view: number, value: number): void;
					public setPadding(this_: globalAndroid.view.View, view: number, left: number, top: number, right: number): void;
					public getMarginRight(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getMinSizeHeight(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Dimension;
					public setGridColumnStart(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.GridPlacement): void;
					public getFlexGrow(this_: globalAndroid.view.View): number;
					public setSizeWidth(this_: globalAndroid.view.View, view: number, value: number): void;
					public getGridAutoColumns(this_: globalAndroid.view.View): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
					public setInsetBottom(this_: globalAndroid.view.View, view: number, value: number): void;
					public getSizeCssValue(this_: globalAndroid.view.View): string;
					public getMinSize(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public setBorderBottom(this_: globalAndroid.view.View, view: number, value: number): void;
					public setMinSizeHeight(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension): void;
					public setGridColumn(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
					public getGridColumnStart(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.GridPlacement;
					public setAspectRatio(this_: globalAndroid.view.View, view: java.lang.Float): void;
					public getJustifyContent(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.JustifyContent;
					public setMaxSize(this_: globalAndroid.view.View, view: number, width: number, widthType: number, height: number): void;
					public setGridAutoColumns(this_: globalAndroid.view.View, view: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
					public getMarginLeft(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getFlexDirection(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.FlexDirection;
					public getGridRowStart(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.GridPlacement;
					public setJustifySelf(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.JustifySelf): void;
					public setAlignSelf(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.AlignSelf): void;
					public setDirection(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Direction): void;
					public getBorderCssValue(this_: globalAndroid.view.View): string;
					public setMarginTop(this_: globalAndroid.view.View, view: number, value: number): void;
					public getInsetRight(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getMaxSize(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public getMinSizeWidth(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Dimension;
					public setGap(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.LengthPercentage, row: org.nativescript.mason.masonkit.LengthPercentage): void;
					public getJustifyItems(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.JustifyItems;
					public setSize(this_: globalAndroid.view.View, view: number, width: number): void;
					public getMinSizeCssValue(this_: globalAndroid.view.View): string;
					public getFlexWrap(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.FlexWrap;
					public getPadding(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public setSize(this_: globalAndroid.view.View, view: number, width: number, widthType: number, height: number): void;
					public getGapRow(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public getFlexShrink(this_: globalAndroid.view.View): number;
					public setGap(this_: globalAndroid.view.View, view: number, width: number): void;
					public setInsetTop(this_: globalAndroid.view.View, view: number, value: number): void;
					public longRunningFunction(): number;
					public getGridColumn(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
					public static getShared(): org.nativescript.mason.masonkit.NodeHelper;
					public setFlexWrap(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.FlexWrap): void;
					public setGridColumnEnd(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.GridPlacement): void;
					public getStylePaddingRight(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public setBorder(this_: globalAndroid.view.View, view: number, left: number, left_type: number, top: number, top_type: number, right: number, right_type: number, bottom: number): void;
					public getGridColumnEnd(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.GridPlacement;
					public getSizeWidth(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Dimension;
					public setOverflowX(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Overflow): void;
					public setPaddingRight(this_: globalAndroid.view.View, view: number, value: number): void;
					public setGapRow(view: globalAndroid.view.View, value: number, type: number): void;
					public getDirection(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Direction;
					public getAlignSelf(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.AlignSelf;
					public getMaxSizeCssValue(this_: globalAndroid.view.View): string;
					public configure(view: globalAndroid.view.View, block: any): void;
					public setGridRow(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
					public setRowGap(this_: globalAndroid.view.View, view: number, value: number): void;
					public getGap(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>;
					public setSizeHeight(this_: globalAndroid.view.View, view: number, value: number): void;
					public setMaxSizeHeight(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension): void;
					public getBorderTop(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public setMinSizeWidth(this_: globalAndroid.view.View, view: number, value: number): void;
					public getOverflowY(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Overflow;
					public getScrollBarWidth(this_: globalAndroid.view.View): number;
					public getFlexBasis(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Dimension;
					public getMason(): org.nativescript.mason.masonkit.Mason;
					public getMinSizeJsonValue(this_: globalAndroid.view.View): string;
					public getInsetBottom(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getMaxSizeHeight(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Dimension;
					public getAspectRatio(this_: globalAndroid.view.View): java.lang.Float;
					public setGridRowEnd(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.GridPlacement): void;
					public getPaddingCssValue(this_: globalAndroid.view.View): string;
					public setGridAutoRows(this_: globalAndroid.view.View, view: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
					public getDisplay(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Display;
					public setBorder(this_: globalAndroid.view.View, view: number, left: number, top: number, right: number): void;
					public setFlexShrink(this_: globalAndroid.view.View, view: number): void;
					public getGridAutoFlow(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.GridAutoFlow;
					public setDisplay(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Display): void;
					public setPaddingTop(this_: globalAndroid.view.View, view: number, value: number): void;
					public setPaddingWithValueType(this_: globalAndroid.view.View, view: number, value: number): void;
					public setBorderTop(this_: globalAndroid.view.View, view: number, value: number): void;
					public setInsetRight(this_: globalAndroid.view.View, view: number, value: number): void;
					public getGridTemplateColumns(this_: globalAndroid.view.View): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
					public getViews(): java.util.ArrayList<org.nativescript.mason.masonkit.View>;
					public setSizeWidth(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension): void;
					public getSizeJsonValue(this_: globalAndroid.view.View): string;
					public setMaxSizeWidth(this_: globalAndroid.view.View, view: number, value: number): void;
					public setPadding(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.LengthPercentage, left: org.nativescript.mason.masonkit.LengthPercentage, top: org.nativescript.mason.masonkit.LengthPercentage, right: org.nativescript.mason.masonkit.LengthPercentage): void;
					public setMinSizeWidth(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension): void;
					public getBorderLeft(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public setMarginBottom(this_: globalAndroid.view.View, view: number, value: number): void;
					public getSize(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public setMaxSize(this_: globalAndroid.view.View, view: number, width: number): void;
					public setPaddingLeft(this_: globalAndroid.view.View, view: number, value: number): void;
					public getMarginJsonValue(this_: globalAndroid.view.View): string;
					public setFlexBasis(this_: globalAndroid.view.View, view: number, value: number): void;
					public setBorderWithValueType(this_: globalAndroid.view.View, view: number, value: number): void;
					public getInsetTop(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setOverflow(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Overflow): void;
					public setBorder(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.LengthPercentage, left: org.nativescript.mason.masonkit.LengthPercentage, top: org.nativescript.mason.masonkit.LengthPercentage, right: org.nativescript.mason.masonkit.LengthPercentage): void;
					public getInsetCssValue(this_: globalAndroid.view.View): string;
					public getStylePaddingLeft(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public getBorderRight(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public getMarginCssValue(this_: globalAndroid.view.View): string;
					public logPerf(time: number): void;
					public setJustifyItems(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.JustifyItems): void;
					public getMaxSizeJsonValue(this_: globalAndroid.view.View): string;
					public setTextAlign(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.BoxSizing): void;
					public setGridTemplateColumns(this_: globalAndroid.view.View, view: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
					public setPosition(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Position): void;
					public setGridRowStart(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.GridPlacement): void;
					public setMargin(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.LengthPercentageAuto, left: org.nativescript.mason.masonkit.LengthPercentageAuto, top: org.nativescript.mason.masonkit.LengthPercentageAuto, right: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
					public getInsetJsonValue(this_: globalAndroid.view.View): string;
					public setMinSize(this_: globalAndroid.view.View, view: number, width: number): void;
					public getInsetLeft(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getGapColumn(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public getBorderBottom(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public setFlexDirection(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.FlexDirection): void;
					public setInset(this_: globalAndroid.view.View, view: number, left: number, left_type: number, top: number, top_type: number, right: number, right_type: number, bottom: number): void;
					public setMinSizeHeight(this_: globalAndroid.view.View, view: number, value: number): void;
					public getBoxSizing(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.BoxSizing;
					public getOverflow(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Overflow;
					public setPadding(this_: globalAndroid.view.View, view: number, left: number, left_type: number, top: number, top_type: number, right: number, right_type: number, bottom: number): void;
					public getMarginBottom(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getMarginTop(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setInsetWithValueType(this_: globalAndroid.view.View, view: number, value: number): void;
					public setMaxSizeWidth(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension): void;
					public setBorderRight(this_: globalAndroid.view.View, view: number, value: number): void;
					public setInsetLeft(this_: globalAndroid.view.View, view: number, value: number): void;
					public getGridRow(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
					public getStylePaddingTop(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public getGridTemplateRows(this_: globalAndroid.view.View): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
					public getMargin(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public setTextAlign(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.TextAlign): void;
					public getBorder(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public setOverflowY(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Overflow): void;
					public getPaddingJsonValue(this_: globalAndroid.view.View): string;
					public setMargin(this_: globalAndroid.view.View, view: number, left: number, top: number, right: number): void;
					public setFlexBasis(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension): void;
					public setJustifyContent(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.JustifyContent): void;
					public getTextAlign(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.TextAlign;
					public setMaxSizeHeight(this_: globalAndroid.view.View, view: number, value: number): void;
					public setGapColumn(view: globalAndroid.view.View, value: number, type: number): void;
					public setBorderLeft(this_: globalAndroid.view.View, view: number, value: number): void;
					public setMinSize(this_: globalAndroid.view.View, view: number, width: number, widthType: number, height: number): void;
					public setSize(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension, width: org.nativescript.mason.masonkit.Dimension): void;
					public setMarginRight(this_: globalAndroid.view.View, view: number, value: number): void;
					public getInset(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public getMaxSizeWidth(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Dimension;
					public setFlexGrow(this_: globalAndroid.view.View, view: number): void;
					public setScrollBarWidth(this_: globalAndroid.view.View, view: number): void;
					public getAlignItems(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.AlignItems;
					public setAlignContent(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.AlignContent): void;
					public getBorderJsonValue(this_: globalAndroid.view.View): string;
					public getGridAutoRows(this_: globalAndroid.view.View): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
					public getPosition(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Position;
					public setMarginWithValueType(this_: globalAndroid.view.View, view: number, value: number): void;
					public constructor(mason: org.nativescript.mason.masonkit.Mason);
					public setGridAutoFlow(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.GridAutoFlow): void;
					public setAlignItems(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.AlignItems): void;
					public getOverflowX(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Overflow;
					public getStylePaddingBottom(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public setMarginLeft(this_: globalAndroid.view.View, view: number, value: number): void;
					public getGridRowEnd(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.GridPlacement;
					public getAlignContent(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.AlignContent;
					public setPosition(this_: globalAndroid.view.View, view: number, left: number, top: number, right: number): void;
					public setMaxSize(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension, width: org.nativescript.mason.masonkit.Dimension): void;
					public setGridTemplateRows(this_: globalAndroid.view.View, view: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
					public setMinSize(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension, width: org.nativescript.mason.masonkit.Dimension): void;
					public setPosition(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.LengthPercentageAuto, left: org.nativescript.mason.masonkit.LengthPercentageAuto, top: org.nativescript.mason.masonkit.LengthPercentageAuto, right: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
					public getJustifySelf(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.JustifySelf;
					public setColumnGap(this_: globalAndroid.view.View, view: number, value: number): void;
					public getSizeHeight(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Dimension;
					public setGap(this_: globalAndroid.view.View, view: number, width: number, widthType: number, height: number): void;
				}
				export module NodeHelper {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.NodeHelper.Companion>;
						public getShared(): org.nativescript.mason.masonkit.NodeHelper;
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
				export class NodeType {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.NodeType>;
					public static Element: org.nativescript.mason.masonkit.NodeType;
					public static Text: org.nativescript.mason.masonkit.NodeType;
					public static Document: org.nativescript.mason.masonkit.NodeType;
					public static valueOf(value: string): org.nativescript.mason.masonkit.NodeType;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.NodeType>;
					public static getEntries(): any;
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
					public static Clip: org.nativescript.mason.masonkit.Overflow;
					public static Auto: org.nativescript.mason.masonkit.Overflow;
					public getCssValue(): string;
					public static getEntries(): any;
					public static valueOf(value: string): org.nativescript.mason.masonkit.Overflow;
					public getValue(): number;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.Overflow>;
				}
				export module Overflow {
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class Position {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Position>;
					public static Relative: org.nativescript.mason.masonkit.Position;
					public static Absolute: org.nativescript.mason.masonkit.Position;
					public getCssValue(): string;
					public getValue(): number;
					public static getEntries(): any;
					public static valueOf(value: string): org.nativescript.mason.masonkit.Position;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.Position>;
				}
				export module Position {
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class Scroll extends org.nativescript.mason.masonkit.TwoDScrollView implements org.nativescript.mason.masonkit.Element {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Scroll>;
					public scrollRoot: org.nativescript.mason.masonkit.View;
					public getView(): globalAndroid.view.View;
					public computeMaxContent(): void;
					public configure(param0: any): void;
					public replaceChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public layout(): org.nativescript.mason.masonkit.Layout;
					public addChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public computeWithViewSize(layout: boolean): void;
					public getStyle(): org.nativescript.mason.masonkit.Style;
					public removeChildAt(param0: number): void;
					public append(param0: org.nativescript.mason.masonkit.Element): void;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public append(param0: org.nativescript.mason.masonkit.Node): void;
					public prependView(view: globalAndroid.view.View): void;
					public replaceChildAt(param0: string, param1: number): void;
					public replaceChildAt(text: string, index: number): void;
					public prepend(param0: org.nativescript.mason.masonkit.Node): void;
					public computeMinContent(): void;
					public setEnableScrollX(value: boolean): void;
					public computeAndLayout(): org.nativescript.mason.masonkit.Layout;
					public compute(): void;
					public invalidateLayout(): void;
					public computeWithViewSize(param0: boolean): void;
					public prepend(param0: org.nativescript.mason.masonkit.Element): void;
					public appendView(view: globalAndroid.view.View): void;
					public prepend(param0: androidNative.Array<string>): void;
					public getScrollRoot$masonkit_release(): org.nativescript.mason.masonkit.View;
					public removeChildAt(index: number): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public prependView(param0: globalAndroid.view.View): void;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public constructor($this$_init__u24lambda_u240: globalAndroid.content.Context, this_: org.nativescript.mason.masonkit.Mason);
					public appendView(views: androidNative.Array<globalAndroid.view.View>): void;
					public compute(param0: number, param1: number): void;
					public addChildAt(text: string, index: number): void;
					public prepend(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public prepend(param0: string): void;
					public compute(width: number, height: number): void;
					public computeWithMinContent(): void;
					public isNodeDirty(): boolean;
					public prepend(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public append(texts: androidNative.Array<string>): void;
					public constructor(context: globalAndroid.content.Context);
					public addView(this_: globalAndroid.view.View, child: number): void;
					public setScrollRoot$masonkit_release(value: org.nativescript.mason.masonkit.View): void;
					public computeAndLayout(width: number, height: number): org.nativescript.mason.masonkit.Layout;
					public computeAndLayout(param0: number, param1: number): org.nativescript.mason.masonkit.Layout;
					public setEnableScrollY(value: boolean): void;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet, defStyle: number);
					public addChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public getEnableScrollX(): boolean;
					public attachAndApply(): void;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet);
					public addView(child: globalAndroid.view.View): void;
					public addView(this_: globalAndroid.view.View, child: globalAndroid.view.ViewGroup.LayoutParams): void;
					public onNodeAttached(): void;
					public computeWithViewSize(): void;
					public onNodeDetached(): void;
					public computeWithMaxContent(): void;
					public append(node: org.nativescript.mason.masonkit.Node): void;
					public prepend(node: org.nativescript.mason.masonkit.Node): void;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet, defStyleAttr: number);
					public markNodeDirty(): void;
					public prepend(element: org.nativescript.mason.masonkit.Element): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public append(param0: androidNative.Array<string>): void;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public addChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public addView(child: globalAndroid.view.View, index: number, params: globalAndroid.view.ViewGroup.LayoutParams): void;
					public configure(block: any): void;
					public addView(this_: globalAndroid.view.View, child: number, index: globalAndroid.view.ViewGroup.LayoutParams): void;
					public append(element: org.nativescript.mason.masonkit.Element): void;
					public replaceChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public append(text: string): void;
					public addChildAt(param0: string, param1: number): void;
					public prepend(strings: androidNative.Array<string>): void;
					public appendView(param0: globalAndroid.view.View): void;
					public prepend(string: string): void;
					public prependView(views: androidNative.Array<globalAndroid.view.View>): void;
					public constructor($this$_init__u24lambda_u241: globalAndroid.content.Context, this_: globalAndroid.util.AttributeSet, context: number, attrs: boolean);
					public addView(child: globalAndroid.view.View, width: number, height: number): void;
					public addChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public computeWithSize(param0: number, param1: number): void;
					public getNode(): org.nativescript.mason.masonkit.Node;
					public computeWithSize(width: number, height: number): void;
					public append(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public append(param0: string): void;
					public getEnableScrollY(): boolean;
					public append(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public prependView(param0: androidNative.Array<globalAndroid.view.View>): void;
					public appendView(param0: androidNative.Array<globalAndroid.view.View>): void;
				}
			}
		}
	}
}

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class Spans {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans>;
					public constructor();
				}
				export module Spans {
					export class BackgroundColorSpan implements org.nativescript.mason.masonkit.Spans.NSCSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans.BackgroundColorSpan>;
						public getColor(): number;
						public constructor(color: number);
						public getType(): org.nativescript.mason.masonkit.Spans.Type;
					}
					export class ForegroundColorSpan implements org.nativescript.mason.masonkit.Spans.NSCSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans.ForegroundColorSpan>;
						public getColor(): number;
						public constructor(color: number);
						public getType(): org.nativescript.mason.masonkit.Spans.Type;
					}
					export class NSCSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans.NSCSpan>;
						/**
						 * Constructs a new instance of the org.nativescript.mason.masonkit.Spans$NSCSpan interface with the provided implementation. An empty constructor exists calling super() when extending the interface class.
						 */
						public constructor(implementation: {
							getType(): org.nativescript.mason.masonkit.Spans.Type;
						});
						public constructor();
						public getType(): org.nativescript.mason.masonkit.Spans.Type;
					}
					export class ScaleXSpan implements org.nativescript.mason.masonkit.Spans.NSCSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans.ScaleXSpan>;
						public getType(): org.nativescript.mason.masonkit.Spans.Type;
						public constructor(scale: number);
					}
					export class SizeSpan implements org.nativescript.mason.masonkit.Spans.NSCSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans.SizeSpan>;
						public constructor(size: number, scale: boolean);
						public getType(): org.nativescript.mason.masonkit.Spans.Type;
					}
					export class StrikethroughSpan implements org.nativescript.mason.masonkit.Spans.NSCSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans.StrikethroughSpan>;
						public constructor();
						public getType(): org.nativescript.mason.masonkit.Spans.Type;
					}
					export class TrackingSpan implements org.nativescript.mason.masonkit.Spans.NSCSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans.TrackingSpan>;
						public constructor();
						public getType(): org.nativescript.mason.masonkit.Spans.Type;
						public draw(canvas: globalAndroid.graphics.Canvas, text: string, start: number, end: number, x: number, top: number, y: number, bottom: number, paint: globalAndroid.graphics.Paint): void;
						public getSize(paint: globalAndroid.graphics.Paint, text: string, start: number, end: number, fm: globalAndroid.graphics.Paint.FontMetricsInt): number;
					}
					export class Type {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans.Type>;
						public static View: org.nativescript.mason.masonkit.Spans.Type;
						public static BackgroundColor: org.nativescript.mason.masonkit.Spans.Type;
						public static ForegroundColor: org.nativescript.mason.masonkit.Spans.Type;
						public static DecorationLine: org.nativescript.mason.masonkit.Spans.Type;
						public static Justify: org.nativescript.mason.masonkit.Spans.Type;
						public static Tracking: org.nativescript.mason.masonkit.Spans.Type;
						public static Size: org.nativescript.mason.masonkit.Spans.Type;
						public static Typeface: org.nativescript.mason.masonkit.Spans.Type;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.Spans.Type>;
						public static getEntries(): any;
						public static valueOf(value: string): org.nativescript.mason.masonkit.Spans.Type;
					}
					export class TypefaceSpan implements org.nativescript.mason.masonkit.Spans.NSCSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans.TypefaceSpan>;
						public updateDrawState(tp: globalAndroid.text.TextPaint): void;
						public getType(): org.nativescript.mason.masonkit.Spans.Type;
						public constructor(typeface: globalAndroid.graphics.Typeface, isBold: boolean);
						public updateMeasureState(textPaint: globalAndroid.text.TextPaint): void;
					}
					export class TypefaceSpan2 implements org.nativescript.mason.masonkit.Spans.NSCSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans.TypefaceSpan2>;
						public constructor(family: string);
						public getType(): org.nativescript.mason.masonkit.Spans.Type;
					}
					export class UnderlineLineThrough implements org.nativescript.mason.masonkit.Spans.NSCSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans.UnderlineLineThrough>;
						public getColor(): number;
						public constructor(color: number);
						public updateDrawState(tp: globalAndroid.text.TextPaint): void;
						public getType(): org.nativescript.mason.masonkit.Spans.Type;
					}
					export class UnderlineSpan implements org.nativescript.mason.masonkit.Spans.NSCSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans.UnderlineSpan>;
						public getColor(): number;
						public constructor(color: number);
						public updateDrawState(tp: globalAndroid.text.TextPaint): void;
						public getType(): org.nativescript.mason.masonkit.Spans.Type;
					}
					export class ViewSpannable implements org.nativescript.mason.masonkit.Spans.NSCSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans.ViewSpannable>;
						public draw($this$draw_u24lambda_u241: globalAndroid.graphics.Canvas, $i$f$withSave: string, checkpoint$iv: number, $this$withSave$iv: number, layout: number, width: number, height: number, fontMetrics: number, fontHeight: globalAndroid.graphics.Paint): void;
						public constructor(view: globalAndroid.view.View, node: org.nativescript.mason.masonkit.Node);
						public getType(): org.nativescript.mason.masonkit.Spans.Type;
						public getView(): globalAndroid.view.View;
						public getNode(): org.nativescript.mason.masonkit.Node;
						public getSize(fontHeight: globalAndroid.graphics.Paint, centerY: string, halfViewHeight: number, it: number, layout: globalAndroid.graphics.Paint.FontMetricsInt): number;
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
				export class StateKeys {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.StateKeys>;
					public static "equals-impl"(arg0: number, other: any): boolean;
					public static "constructor-impl"(bits: number): number;
					public toString(): string;
					public static "equals-impl0"(p1: number, p2: number): boolean;
					public equals(other: any): boolean;
					public static "toString-impl"(arg0: number): string;
					public static "hashCode-impl"(arg0: number): number;
					public static "and-BVFDOsw"(arg0: number, other: number): number;
					public static "or-BVFDOsw"(arg0: number, other: number): number;
					public static "hasFlag-eOU-u_s"(arg0: number, flag: number): boolean;
					public hashCode(): number;
					public getBits(): number;
				}
				export module StateKeys {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.StateKeys.Companion>;
						public "getFLEX_WRAP-U0xtSZA"(): number;
						public "getOVERFLOW_Y-U0xtSZA"(): number;
						public "getITEM_IS_TABLE-U0xtSZA"(): number;
						public "getJUSTIFY_CONTENT-U0xtSZA"(): number;
						public "getBORDER-U0xtSZA"(): number;
						public "getSIZE-U0xtSZA"(): number;
						public "getJUSTIFY_ITEMS-U0xtSZA"(): number;
						public "getSCROLLBAR_WIDTH-U0xtSZA"(): number;
						public "getALIGN_SELF-U0xtSZA"(): number;
						public "getITEM_IS_REPLACED-U0xtSZA"(): number;
						public "getMAX_SIZE-U0xtSZA"(): number;
						public "getMARGIN-U0xtSZA"(): number;
						public "getFLEX_SHRINK-U0xtSZA"(): number;
						public "getDIRECTION-U0xtSZA"(): number;
						public "getALIGN_CONTENT-U0xtSZA"(): number;
						public "getMIN_CONTENT_HEIGHT-U0xtSZA"(): number;
						public "getFLEX_DIRECTION-U0xtSZA"(): number;
						public "getGRID_AUTO_FLOW-U0xtSZA"(): number;
						public "getALIGN_ITEMS-U0xtSZA"(): number;
						public "getFLEX_BASIS-U0xtSZA"(): number;
						public "getGAP-U0xtSZA"(): number;
						public "getGRID_COLUMN-U0xtSZA"(): number;
						public "getBOX_SIZING-U0xtSZA"(): number;
						public "getJUSTIFY_SELF-U0xtSZA"(): number;
						public "getMAX_CONTENT_WIDTH-U0xtSZA"(): number;
						public "getINSET-U0xtSZA"(): number;
						public "getPADDING-U0xtSZA"(): number;
						public "getOVERFLOW-U0xtSZA"(): number;
						public "getPOSITION-U0xtSZA"(): number;
						public "getFLEX_GROW-U0xtSZA"(): number;
						public "getFORCE_INLINE-U0xtSZA"(): number;
						public "getDISPLAY-U0xtSZA"(): number;
						public "getOVERFLOW_X-U0xtSZA"(): number;
						public "getDISPLAY_MODE-U0xtSZA"(): number;
						public "getTEXT_ALIGN-U0xtSZA"(): number;
						public "getGRID_ROW-U0xtSZA"(): number;
						public "getMIN_SIZE-U0xtSZA"(): number;
						public "getASPECT_RATIO-U0xtSZA"(): number;
						public "getMAX_CONTENT_HEIGHT-U0xtSZA"(): number;
						public "getMIN_CONTENT_WIDTH-U0xtSZA"(): number;
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
				export class Style {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Style>;
					public setPadding(value: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>): void;
					public getGridTemplateRows(): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
					public getTextAlign(): org.nativescript.mason.masonkit.TextAlign;
					public getAlignItems(): org.nativescript.mason.masonkit.AlignItems;
					public getGridRowStart(): org.nativescript.mason.masonkit.GridPlacement;
					public setInsetTop(it: number, top: number): void;
					public getGap(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>;
					public setInBatch(this_: boolean): void;
					public setJustifySelf(value: org.nativescript.mason.masonkit.JustifySelf): void;
					public setFlexDirection(value: org.nativescript.mason.masonkit.FlexDirection): void;
					public getBoxSizing(): org.nativescript.mason.masonkit.BoxSizing;
					public setBoxSizing(value: org.nativescript.mason.masonkit.BoxSizing): void;
					public setMarginWithValueType(it: number, margin: number): void;
					public setMinSize(value: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
					public getNativeSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public setGridRowStart(value: org.nativescript.mason.masonkit.GridPlacement): void;
					public setPaddingTop(it: number, top: number): void;
					public getInBatch(): boolean;
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
					public getForceInline$masonkit_release(): boolean;
					public getOverflowY(): org.nativescript.mason.masonkit.Overflow;
					public setGridColumnEnd(value: org.nativescript.mason.masonkit.GridPlacement): void;
					public getDirection(): org.nativescript.mason.masonkit.Direction;
					public setGridRowEnd(value: org.nativescript.mason.masonkit.GridPlacement): void;
					public setInsetBottom(it: number, bottom: number): void;
					public getFlexWrap(): org.nativescript.mason.masonkit.FlexWrap;
					public setOverflowY(value: org.nativescript.mason.masonkit.Overflow): void;
					public setPaddingWithValueType(it: number, padding: number): void;
					public setJustifyItems(value: org.nativescript.mason.masonkit.JustifyItems): void;
					public setSizeWidth(value: org.nativescript.mason.masonkit.Dimension): void;
					public constructor($this$values_u24lambda_u240: org.nativescript.mason.masonkit.Node);
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
					public setMarginBottom(it: number, bottom: number): void;
					public setPaddingLeft(it: number, left: number): void;
					public getBorder(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public setDisplay(display: org.nativescript.mason.masonkit.Display): void;
					public setGridAutoColumns(value: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
					public setJustifyContent(value: org.nativescript.mason.masonkit.JustifyContent): void;
					public setGridRow(value: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
					public setAlignContent(value: org.nativescript.mason.masonkit.AlignContent): void;
					public getSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public setMaxSizeWidth(it: number, width: number): void;
					public static nativeGetStyleBuffer(param0: number, param1: number): java.nio.ByteBuffer;
					public getAlignSelf(): org.nativescript.mason.masonkit.AlignSelf;
					public setBorderLeft(it: number, left: number): void;
					public setPosition(value: org.nativescript.mason.masonkit.Position): void;
					public setFlexBasis(value: org.nativescript.mason.masonkit.Dimension): void;
					public getGridAutoRows(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
					public setGridColumnStart(value: org.nativescript.mason.masonkit.GridPlacement): void;
					public setMarginRight(it: number, right: number): void;
					public static nativeUpdateWithValues(param0: number, param1: number, param2: number, param3: number, param4: number, param5: number, param6: number, param7: number, param8: number, param9: number, param10: number, param11: number, param12: number, param13: number, param14: number, param15: number, param16: number, param17: number, param18: number, param19: number, param20: number, param21: number, param22: number, param23: number, param24: number, param25: number, param26: number, param27: number, param28: number, param29: number, param30: number, param31: number, param32: number, param33: number, param34: number, param35: number, param36: number, param37: number, param38: number, param39: number, param40: number, param41: number, param42: number, param43: number, param44: number, param45: number, param46: number, param47: number, param48: number, param49: number, param50: number, param51: number, param52: number, param53: number, param54: number, param55: number, param56: number, param57: number, param58: number, param59: number, param60: number, param61: number, param62: number, param63: number, param64: number, param65: number, param66: number, param67: androidNative.Array<org.nativescript.mason.masonkit.MinMax>, param68: androidNative.Array<org.nativescript.mason.masonkit.MinMax>, param69: number, param70: number, param71: number, param72: number, param73: number, param74: number, param75: number, param76: number, param77: number, param78: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>, param79: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>, param80: number, param81: number, param82: number, param83: number, param84: number): void;
					public getJustifyItems(): org.nativescript.mason.masonkit.JustifyItems;
					public updateNativeStyle$masonkit_release(): void;
					public setMinSizeHeight(value: org.nativescript.mason.masonkit.Dimension): void;
					public setInset(value: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>): void;
					public setBorderRight(it: number, right: number): void;
					public setPaddingRight(it: number, right: number): void;
					public getFlexDirection(): org.nativescript.mason.masonkit.FlexDirection;
					public setMaxSizeHeight(it: number, height: number): void;
					public getGridColumn(): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
					public setDirty$masonkit_release(value: number): void;
					public getDisplay(): org.nativescript.mason.masonkit.Display;
					public setFlexGrow(value: number): void;
					public setMinSizeWidth(value: org.nativescript.mason.masonkit.Dimension): void;
					public getMinSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public setGapColumn(it: number, height: number): void;
					public getMargin(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public setAlignItems(value: org.nativescript.mason.masonkit.AlignItems): void;
					public isDirty$masonkit_release(): number;
					public setSizeHeight(it: number, height: number): void;
					public getJustifyContent(): org.nativescript.mason.masonkit.JustifyContent;
					public setGridAutoFlow(value: org.nativescript.mason.masonkit.GridAutoFlow): void;
					public setMaxSizeHeight(value: org.nativescript.mason.masonkit.Dimension): void;
					public setTextAlign(value: org.nativescript.mason.masonkit.TextAlign): void;
					public setInsetLeft(it: number, left: number): void;
					public getGridRow(): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
					public getNativeMargins(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public setPaddingBottom(it: number, bottom: number): void;
					public setInsetRight(it: number, right: number): void;
					public toString(): string;
					public getGridTemplateColumns(): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
					public setBorderBottom(it: number, bottom: number): void;
					public setMaxSizeWidth(value: org.nativescript.mason.masonkit.Dimension): void;
					public static nativeNonBufferData(param0: number, param1: number, param2: androidNative.Array<org.nativescript.mason.masonkit.MinMax>, param3: androidNative.Array<org.nativescript.mason.masonkit.MinMax>, param4: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>, param5: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
					public getGridAutoFlow(): org.nativescript.mason.masonkit.GridAutoFlow;
					public getAspectRatio(): java.lang.Float;
					public setScrollBarWidth(value: number): void;
					public setMarginTop(it: number, top: number): void;
					public setSizeWidth(it: number, width: number): void;
					public configure(block: any): void;
					public setMaxSize(value: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
					public setAspectRatio(value: java.lang.Float): void;
					public setOverflowX(value: org.nativescript.mason.masonkit.Overflow): void;
					public getGridColumnEnd(): org.nativescript.mason.masonkit.GridPlacement;
					public setSizeHeight(value: org.nativescript.mason.masonkit.Dimension): void;
					public setGridAutoRows(value: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
					public setBorder(value: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>): void;
					public setGapRow(it: number, width: number): void;
					public getValues(): java.nio.ByteBuffer;
					public getFlexShrink(): number;
					public setBorderTop(it: number, top: number): void;
					public setFlexWrap(value: org.nativescript.mason.masonkit.FlexWrap): void;
					public setForceInline$masonkit_release(value: boolean): void;
					public getScrollBarWidth(): number;
					public setGap(height: number, this_: number, widthValue: number, widthType: number): void;
					public setSize(value: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
					public setOverflow(value: org.nativescript.mason.masonkit.Overflow): void;
					public setGap(value: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>): void;
				}
				export module Style {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Style.Companion>;
						public nativeGetStyleBuffer(mason: number, node: number): java.nio.ByteBuffer;
						public nativeUpdateWithValues(mason: number, node: number, display: number, position: number, direction: number, flexDirection: number, flexWrap: number, overflow: number, alignItems: number, alignSelf: number, alignContent: number, justifyItems: number, justifySelf: number, justifyContent: number, insetLeftType: number, insetLeftValue: number, insetRightType: number, insetRightValue: number, insetTopType: number, insetTopValue: number, insetBottomType: number, insetBottomValue: number, marginLeftType: number, marginLeftValue: number, marginRightType: number, marginRightValue: number, marginTopType: number, marginTopValue: number, marginBottomType: number, marginBottomValue: number, paddingLeftType: number, paddingLeftValue: number, paddingRightType: number, paddingRightValue: number, paddingTopType: number, paddingTopValue: number, paddingBottomType: number, paddingBottomValue: number, borderLeftType: number, borderLeftValue: number, borderRightType: number, borderRightValue: number, borderTopType: number, borderTopValue: number, borderBottomType: number, borderBottomValue: number, flexGrow: number, flexShrink: number, flexBasisType: number, flexBasisValue: number, widthType: number, widthValue: number, heightType: number, heightValue: number, minWidthType: number, minWidthValue: number, minHeightType: number, minHeightValue: number, maxWidthType: number, maxWidthValue: number, maxHeightType: number, maxHeightValue: number, gapRowType: number, gapRowValue: number, gapColumnType: number, gapColumnValue: number, aspectRatio: number, gridAutoRows: androidNative.Array<org.nativescript.mason.masonkit.MinMax>, gridAutoColumns: androidNative.Array<org.nativescript.mason.masonkit.MinMax>, gridAutoFlow: number, gridColumnStartType: number, gridColumnStartValue: number, gridColumnEndType: number, gridColumnEndValue: number, gridRowStartType: number, gridRowStartValue: number, gridRowEndType: number, gridRowEndValue: number, gridTemplateRows: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>, gridTemplateColumns: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>, overflowX: number, overflowY: number, scrollBarWidth: number, textAlign: number, boxSizing: number): void;
						public nativeNonBufferData(mason: number, node: number, gridAutoRows: androidNative.Array<org.nativescript.mason.masonkit.MinMax>, gridAutoColumns: androidNative.Array<org.nativescript.mason.masonkit.MinMax>, gridTemplateRows: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>, gridTemplateColumns: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Style.WhenMappings>;
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
				export class StyleHelpers {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.StyleHelpers>;
					public static gridAutoColumnsCSS(mason: org.nativescript.mason.masonkit.Mason, view: globalAndroid.view.View): string;
					public constructor();
					public static gridAutoRowsCSS(mason: org.nativescript.mason.masonkit.Mason, view: globalAndroid.view.View): string;
					public static gridTemplateRowsCSS(mason: org.nativescript.mason.masonkit.Mason, view: globalAndroid.view.View): string;
					public static gridTemplateColumnsCSS(mason: org.nativescript.mason.masonkit.Mason, view: globalAndroid.view.View): string;
				}
				export module StyleHelpers {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.StyleHelpers.Companion>;
						public gridTemplateColumnsCSS(mason: org.nativescript.mason.masonkit.Mason, view: globalAndroid.view.View): string;
						public gridTemplateRowsCSS(mason: org.nativescript.mason.masonkit.Mason, view: globalAndroid.view.View): string;
						public gridAutoRowsCSS(mason: org.nativescript.mason.masonkit.Mason, view: globalAndroid.view.View): string;
						public gridAutoColumnsCSS(mason: org.nativescript.mason.masonkit.Mason, view: globalAndroid.view.View): string;
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
				export class StyleKeys {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.StyleKeys>;
					public static INSTANCE: org.nativescript.mason.masonkit.StyleKeys;
					public static DISPLAY: number = 0;
					public static POSITION: number = 4;
					public static DIRECTION: number = 8;
					public static FLEX_DIRECTION: number = 12;
					public static FLEX_WRAP: number = 16;
					public static OVERFLOW_X: number = 20;
					public static OVERFLOW_Y: number = 24;
					public static ALIGN_ITEMS: number = 28;
					public static ALIGN_SELF: number = 32;
					public static ALIGN_CONTENT: number = 36;
					public static JUSTIFY_ITEMS: number = 40;
					public static JUSTIFY_SELF: number = 44;
					public static JUSTIFY_CONTENT: number = 48;
					public static INSET_LEFT_TYPE: number = 52;
					public static INSET_LEFT_VALUE: number = 56;
					public static INSET_RIGHT_TYPE: number = 60;
					public static INSET_RIGHT_VALUE: number = 64;
					public static INSET_TOP_TYPE: number = 68;
					public static INSET_TOP_VALUE: number = 72;
					public static INSET_BOTTOM_TYPE: number = 76;
					public static INSET_BOTTOM_VALUE: number = 80;
					public static MARGIN_LEFT_TYPE: number = 84;
					public static MARGIN_LEFT_VALUE: number = 88;
					public static MARGIN_RIGHT_TYPE: number = 92;
					public static MARGIN_RIGHT_VALUE: number = 96;
					public static MARGIN_TOP_TYPE: number = 100;
					public static MARGIN_TOP_VALUE: number = 104;
					public static MARGIN_BOTTOM_TYPE: number = 108;
					public static MARGIN_BOTTOM_VALUE: number = 112;
					public static PADDING_LEFT_TYPE: number = 116;
					public static PADDING_LEFT_VALUE: number = 120;
					public static PADDING_RIGHT_TYPE: number = 124;
					public static PADDING_RIGHT_VALUE: number = 128;
					public static PADDING_TOP_TYPE: number = 132;
					public static PADDING_TOP_VALUE: number = 136;
					public static PADDING_BOTTOM_TYPE: number = 140;
					public static PADDING_BOTTOM_VALUE: number = 144;
					public static BORDER_LEFT_TYPE: number = 148;
					public static BORDER_LEFT_VALUE: number = 152;
					public static BORDER_RIGHT_TYPE: number = 156;
					public static BORDER_RIGHT_VALUE: number = 160;
					public static BORDER_TOP_TYPE: number = 164;
					public static BORDER_TOP_VALUE: number = 168;
					public static BORDER_BOTTOM_TYPE: number = 172;
					public static BORDER_BOTTOM_VALUE: number = 176;
					public static FLEX_GROW: number = 180;
					public static FLEX_SHRINK: number = 184;
					public static FLEX_BASIS_TYPE: number = 188;
					public static FLEX_BASIS_VALUE: number = 192;
					public static WIDTH_TYPE: number = 196;
					public static WIDTH_VALUE: number = 200;
					public static HEIGHT_TYPE: number = 204;
					public static HEIGHT_VALUE: number = 208;
					public static MIN_WIDTH_TYPE: number = 212;
					public static MIN_WIDTH_VALUE: number = 216;
					public static MIN_HEIGHT_TYPE: number = 220;
					public static MIN_HEIGHT_VALUE: number = 224;
					public static MAX_WIDTH_TYPE: number = 228;
					public static MAX_WIDTH_VALUE: number = 232;
					public static MAX_HEIGHT_TYPE: number = 236;
					public static MAX_HEIGHT_VALUE: number = 240;
					public static GAP_ROW_TYPE: number = 244;
					public static GAP_ROW_VALUE: number = 248;
					public static GAP_COLUMN_TYPE: number = 252;
					public static GAP_COLUMN_VALUE: number = 256;
					public static ASPECT_RATIO: number = 260;
					public static GRID_AUTO_FLOW: number = 264;
					public static GRID_COLUMN_START_TYPE: number = 268;
					public static GRID_COLUMN_START_VALUE: number = 272;
					public static GRID_COLUMN_END_TYPE: number = 276;
					public static GRID_COLUMN_END_VALUE: number = 280;
					public static GRID_ROW_START_TYPE: number = 284;
					public static GRID_ROW_START_VALUE: number = 288;
					public static GRID_ROW_END_TYPE: number = 292;
					public static GRID_ROW_END_VALUE: number = 296;
					public static SCROLLBAR_WIDTH: number = 300;
					public static TEXT_ALIGN: number = 304;
					public static BOX_SIZING: number = 308;
					public static OVERFLOW: number = 312;
					public static ITEM_IS_TABLE: number = 316;
					public static ITEM_IS_REPLACED: number = 320;
					public static DISPLAY_MODE: number = 324;
					public static FORCE_INLINE: number = 328;
					public static MIN_CONTENT_WIDTH: number = 332;
					public static MIN_CONTENT_HEIGHT: number = 336;
					public static MAX_CONTENT_WIDTH: number = 340;
					public static MAX_CONTENT_HEIGHT: number = 344;
				}
			}
		}
	}
}

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class Styles {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles>;
					public constructor();
				}
				export module Styles {
					export class DecorationLine {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.DecorationLine>;
						public static None: org.nativescript.mason.masonkit.Styles.DecorationLine;
						public static Underline: org.nativescript.mason.masonkit.Styles.DecorationLine;
						public static Overline: org.nativescript.mason.masonkit.Styles.DecorationLine;
						public static LineThrough: org.nativescript.mason.masonkit.Styles.DecorationLine;
						public static UnderlineLineThrough: org.nativescript.mason.masonkit.Styles.DecorationLine;
						public static getEntries(): any;
						public static valueOf(value: string): org.nativescript.mason.masonkit.Styles.DecorationLine;
						public getValue(): number;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.Styles.DecorationLine>;
					}
					export module DecorationLine {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.DecorationLine.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.Styles.DecorationLine;
						}
					}
					export class DecorationStyle {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.DecorationStyle>;
						public static Solid: org.nativescript.mason.masonkit.Styles.DecorationStyle;
						public static Double: org.nativescript.mason.masonkit.Styles.DecorationStyle;
						public static Dotted: org.nativescript.mason.masonkit.Styles.DecorationStyle;
						public static Dashed: org.nativescript.mason.masonkit.Styles.DecorationStyle;
						public static Wavy: org.nativescript.mason.masonkit.Styles.DecorationStyle;
						public static valueOf(value: string): org.nativescript.mason.masonkit.Styles.DecorationStyle;
						public static getEntries(): any;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.Styles.DecorationStyle>;
						public getValue(): number;
					}
					export module DecorationStyle {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.DecorationStyle.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.Styles.DecorationStyle;
						}
					}
					export class FontStyle {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.FontStyle>;
						public static Normal: org.nativescript.mason.masonkit.Styles.FontStyle;
						public static Italic: org.nativescript.mason.masonkit.Styles.FontStyle;
						public static Oblique: org.nativescript.mason.masonkit.Styles.FontStyle;
						public static valueOf(value: string): org.nativescript.mason.masonkit.Styles.FontStyle;
						public static getEntries(): any;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.Styles.FontStyle>;
						public getValue(): number;
					}
					export module FontStyle {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.FontStyle.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.Styles.FontStyle;
						}
					}
					export class TextJustify {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.TextJustify>;
						public static None: org.nativescript.mason.masonkit.Styles.TextJustify;
						public static Auto: org.nativescript.mason.masonkit.Styles.TextJustify;
						public static InterWord: org.nativescript.mason.masonkit.Styles.TextJustify;
						public static InterCharacter: org.nativescript.mason.masonkit.Styles.TextJustify;
						public static Distribute: org.nativescript.mason.masonkit.Styles.TextJustify;
						public static valueOf(value: string): org.nativescript.mason.masonkit.Styles.TextJustify;
						public static getEntries(): any;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.Styles.TextJustify>;
						public getCssValue(): string;
						public getValue(): number;
					}
					export module TextJustify {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.TextJustify.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.Styles.TextJustify;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.TextJustify.WhenMappings>;
						}
					}
					export class TextOverflow {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.TextOverflow>;
						public static Clip: org.nativescript.mason.masonkit.Styles.TextOverflow;
						public static Ellipse: org.nativescript.mason.masonkit.Styles.TextOverflow;
						public static Custom: org.nativescript.mason.masonkit.Styles.TextOverflow;
						public static valueOf(value: string): org.nativescript.mason.masonkit.Styles.TextOverflow;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.Styles.TextOverflow>;
						public static getEntries(): any;
						public setToken$masonkit_release(value: string): void;
						public getToken(): string;
						public getValue(): number;
					}
					export module TextOverflow {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.TextOverflow.Companion>;
							public fromInt($this$fromInt_u24lambda_u240: number, value: string): org.nativescript.mason.masonkit.Styles.TextOverflow;
							public fromInt(value: number): org.nativescript.mason.masonkit.Styles.TextOverflow;
						}
					}
					export class TextTransform {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.TextTransform>;
						public static None: org.nativescript.mason.masonkit.Styles.TextTransform;
						public static Capitalize: org.nativescript.mason.masonkit.Styles.TextTransform;
						public static Uppercase: org.nativescript.mason.masonkit.Styles.TextTransform;
						public static Lowercase: org.nativescript.mason.masonkit.Styles.TextTransform;
						public static FullWidth: org.nativescript.mason.masonkit.Styles.TextTransform;
						public static FullSizeKana: org.nativescript.mason.masonkit.Styles.TextTransform;
						public static MathAuto: org.nativescript.mason.masonkit.Styles.TextTransform;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.Styles.TextTransform>;
						public static valueOf(value: string): org.nativescript.mason.masonkit.Styles.TextTransform;
						public static getEntries(): any;
						public getValue(): number;
					}
					export module TextTransform {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.TextTransform.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.Styles.TextTransform;
						}
					}
					export class TextWrap {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.TextWrap>;
						public static Wrap: org.nativescript.mason.masonkit.Styles.TextWrap;
						public static NoWrap: org.nativescript.mason.masonkit.Styles.TextWrap;
						public static Balance: org.nativescript.mason.masonkit.Styles.TextWrap;
						public static Pretty: org.nativescript.mason.masonkit.Styles.TextWrap;
						public static getEntries(): any;
						public static valueOf(value: string): org.nativescript.mason.masonkit.Styles.TextWrap;
						public getValue(): number;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.Styles.TextWrap>;
					}
					export module TextWrap {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.TextWrap.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.Styles.TextWrap;
						}
					}
					export class WhiteSpace {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.WhiteSpace>;
						public static Normal: org.nativescript.mason.masonkit.Styles.WhiteSpace;
						public static Pre: org.nativescript.mason.masonkit.Styles.WhiteSpace;
						public static PreWrap: org.nativescript.mason.masonkit.Styles.WhiteSpace;
						public static PreLine: org.nativescript.mason.masonkit.Styles.WhiteSpace;
						public static NoWrap: org.nativescript.mason.masonkit.Styles.WhiteSpace;
						public static BreakSpaces: org.nativescript.mason.masonkit.Styles.WhiteSpace;
						public static getEntries(): any;
						public static valueOf(value: string): org.nativescript.mason.masonkit.Styles.WhiteSpace;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.Styles.WhiteSpace>;
						public getValue(): number;
					}
					export module WhiteSpace {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.WhiteSpace.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.Styles.WhiteSpace;
						}
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
				export class TextAlign {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.TextAlign>;
					public static Auto: org.nativescript.mason.masonkit.TextAlign;
					public static Left: org.nativescript.mason.masonkit.TextAlign;
					public static Right: org.nativescript.mason.masonkit.TextAlign;
					public static Center: org.nativescript.mason.masonkit.TextAlign;
					public static Justify: org.nativescript.mason.masonkit.TextAlign;
					public static Start: org.nativescript.mason.masonkit.TextAlign;
					public static End: org.nativescript.mason.masonkit.TextAlign;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.TextAlign>;
					public getCssValue(): string;
					public static getEntries(): any;
					public getValue(): number;
					public static valueOf(value: string): org.nativescript.mason.masonkit.TextAlign;
				}
				export module TextAlign {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextAlign.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.TextAlign;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextAlign.WhenMappings>;
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
				export class TextNode extends org.nativescript.mason.masonkit.Node implements org.nativescript.mason.masonkit.CharacterData {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.TextNode>;
					public getParent(): org.nativescript.mason.masonkit.Node;
					public getAttributes$masonkit_release(): java.util.Map<string,any>;
					public replaceData(this_: number, offset: number, count: string): org.nativescript.mason.masonkit.CharacterData;
					public constructor(mason: org.nativescript.mason.masonkit.Mason, nativePtr: number, nodeType: org.nativescript.mason.masonkit.NodeType);
					public attributed(): globalAndroid.text.SpannableStringBuilder;
					public insertData(offset: number, data: string): org.nativescript.mason.masonkit.CharacterData;
					public getContainer$masonkit_release(): org.nativescript.mason.masonkit.TextView;
					public getLength(): number;
					public appendData(data: string): org.nativescript.mason.masonkit.CharacterData;
					public constructor(mason: org.nativescript.mason.masonkit.Mason);
					public setData(param0: string): void;
					public setParent$masonkit_release(value: org.nativescript.mason.masonkit.Node): void;
					public setData(value: string): void;
					public deleteData(param0: number, param1: number): org.nativescript.mason.masonkit.CharacterData;
					public substringData(param0: number, param1: number): string;
					public setAttributes$masonkit_release(value: java.util.Map<string,any>): void;
					public getData(): string;
					public constructor(mason: org.nativescript.mason.masonkit.Mason, data: string);
					public substringData(this_: number, offset: number): string;
					public insertData(param0: number, param1: string): org.nativescript.mason.masonkit.CharacterData;
					public setContainer$masonkit_release(value: org.nativescript.mason.masonkit.TextView): void;
					public appendData(param0: string): org.nativescript.mason.masonkit.CharacterData;
					public replaceData(param0: number, param1: number, param2: string): org.nativescript.mason.masonkit.CharacterData;
					public deleteData(this_: number, offset: number): org.nativescript.mason.masonkit.CharacterData;
				}
				export module TextNode {
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextNode.WhenMappings>;
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
				export class TextStateKeys {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.TextStateKeys>;
					public static "equals-impl"(arg0: number, other: any): boolean;
					public static "constructor-impl"(bits: number): number;
					public static "hasFlag-LS73rdQ"(arg0: number, flag: number): boolean;
					public toString(): string;
					public static "and-y3GgEhU"(arg0: number, other: number): number;
					public static "equals-impl0"(p1: number, p2: number): boolean;
					public equals(other: any): boolean;
					public static "toString-impl"(arg0: number): string;
					public static "hashCode-impl"(arg0: number): number;
					public static "or-y3GgEhU"(arg0: number, other: number): number;
					public hashCode(): number;
					public getBits(): number;
				}
				export module TextStateKeys {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextStateKeys.Companion>;
						public "getTEXT_ALIGN-Zvr9YrE"(): number;
						public "getBACKGROUND_COLOR-Zvr9YrE"(): number;
						public "getTRANSFORM-Zvr9YrE"(): number;
						public "getCOLOR-Zvr9YrE"(): number;
						public "getWHITE_SPACE-Zvr9YrE"(): number;
						public "getTEXT_JUSTIFY-Zvr9YrE"(): number;
						public "getDECORATION_STYLE-Zvr9YrE"(): number;
						public "getSIZE-Zvr9YrE"(): number;
						public "getDECORATION_LINE-Zvr9YrE"(): number;
						public "getTEXT_WRAP-Zvr9YrE"(): number;
						public "getFONT_STYLE_SLANT-Zvr9YrE"(): number;
						public "getDECORATION_COLOR-Zvr9YrE"(): number;
						public "getTEXT_OVERFLOW-Zvr9YrE"(): number;
						public "getFONT_WEIGHT-Zvr9YrE"(): number;
						public "getFONT_STYLE-Zvr9YrE"(): number;
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
				export class TextStyleKeys {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.TextStyleKeys>;
					public static INSTANCE: org.nativescript.mason.masonkit.TextStyleKeys;
					public static COLOR: number = 0;
					public static DECORATION_LINE: number = 4;
					public static DECORATION_COLOR: number = 8;
					public static TEXT_ALIGN: number = 12;
					public static TEXT_JUSTIFY: number = 16;
					public static BACKGROUND_COLOR: number = 20;
					public static SIZE: number = 24;
					public static TRANSFORM: number = 28;
					public static FONT_STYLE_TYPE: number = 32;
					public static FONT_STYLE_SLANT: number = 36;
					public static TEXT_WRAP: number = 40;
					public static TEXT_OVERFLOW: number = 44;
					public static DECORATION_STYLE: number = 48;
					public static WHITE_SPACE: number = 52;
					public static FONT_WEIGHT: number = 56;
				}
			}
		}
	}
}

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class TextType {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.TextType>;
					public static None: org.nativescript.mason.masonkit.TextType;
					public static P: org.nativescript.mason.masonkit.TextType;
					public static Span: org.nativescript.mason.masonkit.TextType;
					public static Code: org.nativescript.mason.masonkit.TextType;
					public static H1: org.nativescript.mason.masonkit.TextType;
					public static H2: org.nativescript.mason.masonkit.TextType;
					public static H3: org.nativescript.mason.masonkit.TextType;
					public static H4: org.nativescript.mason.masonkit.TextType;
					public static H5: org.nativescript.mason.masonkit.TextType;
					public static H6: org.nativescript.mason.masonkit.TextType;
					public static Li: org.nativescript.mason.masonkit.TextType;
					public static Blockquote: org.nativescript.mason.masonkit.TextType;
					public static B: org.nativescript.mason.masonkit.TextType;
					public static Pre: org.nativescript.mason.masonkit.TextType;
					public static Strong: org.nativescript.mason.masonkit.TextType;
					public static Em: org.nativescript.mason.masonkit.TextType;
					public static I: org.nativescript.mason.masonkit.TextType;
					public getCssValue(): string;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.TextType>;
					public getValue(): number;
					public static getEntries(): any;
					public static valueOf(value: string): org.nativescript.mason.masonkit.TextType;
				}
				export module TextType {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextType.Companion>;
						public fromInt(value: number): org.nativescript.mason.masonkit.TextType;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextType.WhenMappings>;
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
				export class TextUtils {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.TextUtils>;
					public static INSTANCE: org.nativescript.mason.masonkit.TextUtils;
					public fullWidthTransformed$masonkit_release(char_: string): string;
					public fullWidthKanaCompat$masonkit_release(base: string): string;
					public balancedText$masonkit_release(input: string): string;
					public fullWidthKana$masonkit_release(this_: string): string;
				}
			}
		}
	}
}

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class TextView implements org.nativescript.mason.masonkit.Element, org.nativescript.mason.masonkit.MeasureFunc {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.TextView>;
					public computeMaxContent(): void;
					public getTextAlign(): org.nativescript.mason.masonkit.TextAlign;
					public setIncludePadding(value: boolean): void;
					public onMeasure(layout: number, specWidth: number): void;
					public layout(): org.nativescript.mason.masonkit.Layout;
					public computeWithViewSize(layout: boolean): void;
					public getWhiteSpace(): org.nativescript.mason.masonkit.Styles.WhiteSpace;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public prependView(view: globalAndroid.view.View): void;
					public measure(width: org.nativescript.mason.masonkit.Size<java.lang.Float>, height: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
					public replaceChildAt(param0: string, param1: number): void;
					public getDecorationColor(): number;
					public replaceChildAt(text: string, index: number): void;
					public prepend(param0: org.nativescript.mason.masonkit.Node): void;
					public computeMinContent(): void;
					public setTextWrap(value: org.nativescript.mason.masonkit.Styles.TextWrap): void;
					public compute(): void;
					public getColor(): number;
					public setDecorationLine(value: org.nativescript.mason.masonkit.Styles.DecorationLine): void;
					public getDecorationLine(): org.nativescript.mason.masonkit.Styles.DecorationLine;
					public prepend(param0: org.nativescript.mason.masonkit.Element): void;
					public prepend(param0: androidNative.Array<string>): void;
					public getTextJustify(): org.nativescript.mason.masonkit.Styles.TextJustify;
					public removeChildAt(index: number): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public prependView(param0: globalAndroid.view.View): void;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public appendView(views: androidNative.Array<globalAndroid.view.View>): void;
					public compute(param0: number, param1: number): void;
					public prepend(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public syncStyle(value: string, colorDirty: string): void;
					public compute(width: number, height: number): void;
					public computeWithMinContent(): void;
					public isNodeDirty(): boolean;
					public append(texts: androidNative.Array<string>): void;
					public getTextContent(): string;
					public getFontStyle(): org.nativescript.mason.masonkit.FontFace.NSCFontStyle;
					public constructor(context: globalAndroid.content.Context);
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet, override: boolean);
					public getDecorationStyle(): org.nativescript.mason.masonkit.Styles.DecorationStyle;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet);
					public onNodeAttached(): void;
					public onNodeDetached(): void;
					public append(node: org.nativescript.mason.masonkit.Node): void;
					public setDecorationColor(value: number): void;
					public markNodeDirty(): void;
					public prepend(element: org.nativescript.mason.masonkit.Element): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public addChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public replaceChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public getBackgroundColorValue(): number;
					public invalidateInlineSegments$masonkit_release(): void;
					public append(text: string): void;
					public addChildAt(param0: string, param1: number): void;
					public setDecorationStyle(value: org.nativescript.mason.masonkit.Styles.DecorationStyle): void;
					public appendView(param0: globalAndroid.view.View): void;
					public setTextContent(this_: string): void;
					public computeWithSize(param0: number, param1: number): void;
					public append(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public append(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public prependView(param0: androidNative.Array<globalAndroid.view.View>): void;
					public constructor(context: globalAndroid.content.Context, mason: org.nativescript.mason.masonkit.Mason);
					public getView(): globalAndroid.view.View;
					public constructor(context: globalAndroid.content.Context, mason: org.nativescript.mason.masonkit.Mason, type: org.nativescript.mason.masonkit.TextType, isAnonymous: boolean);
					public getDefaultAttributes$masonkit_release(): java.util.Map<string,any>;
					public configure(param0: any): void;
					public addChildAt($this$addChildAt_u24lambda_u247: string, this_: number): void;
					public replaceChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public addChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public getStyle(): org.nativescript.mason.masonkit.Style;
					public removeChildAt(param0: number): void;
					public onCharacterDataChanged$masonkit_release(node: org.nativescript.mason.masonkit.TextNode): void;
					public append(param0: org.nativescript.mason.masonkit.Element): void;
					public append(param0: org.nativescript.mason.masonkit.Node): void;
					public computeAndLayout(): org.nativescript.mason.masonkit.Layout;
					public invalidateLayout(): void;
					public getTextValues(): java.nio.ByteBuffer;
					public computeWithViewSize(param0: boolean): void;
					public measure(param0: org.nativescript.mason.masonkit.Size<java.lang.Float>, param1: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
					public getTextTransform(): org.nativescript.mason.masonkit.Styles.TextTransform;
					public appendView(view: globalAndroid.view.View): void;
					public getIncludePadding(): boolean;
					public setBackgroundColorValue(this_: number): void;
					public detachTextNode$masonkit_release(node: org.nativescript.mason.masonkit.TextNode): void;
					public prepend(param0: string): void;
					public setTextJustify(value: org.nativescript.mason.masonkit.Styles.TextJustify): void;
					public prepend(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public append($this$append_u24lambda_u245: androidNative.Array<any>): void;
					public setTextAlign(value: org.nativescript.mason.masonkit.TextAlign): void;
					public computeAndLayout(width: number, height: number): org.nativescript.mason.masonkit.Layout;
					public computeAndLayout(param0: number, param1: number): org.nativescript.mason.masonkit.Layout;
					public addChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public attachAndApply(): void;
					public setWhiteSpace(value: org.nativescript.mason.masonkit.Styles.WhiteSpace): void;
					public computeWithViewSize(): void;
					public computeWithMaxContent(): void;
					public getType(): org.nativescript.mason.masonkit.TextType;
					public prepend(node: org.nativescript.mason.masonkit.Node): void;
					public setFontWeight(this_: org.nativescript.mason.masonkit.FontFace.NSCFontWeight): void;
					public attachTextNode$masonkit_release(node: org.nativescript.mason.masonkit.TextNode, index: number): void;
					public append(param0: androidNative.Array<string>): void;
					public getTextWrap(): org.nativescript.mason.masonkit.Styles.TextWrap;
					public setTextTransform(value: org.nativescript.mason.masonkit.Styles.TextTransform): void;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public getFont(): org.nativescript.mason.masonkit.FontFace;
					public setFontSize(value: number): void;
					public configure(block: any): void;
					public append(element: org.nativescript.mason.masonkit.Element): void;
					public setColor(value: number): void;
					public prepend(strings: androidNative.Array<string>): void;
					public getValues(): java.nio.ByteBuffer;
					public prepend(string: string): void;
					public prependView(views: androidNative.Array<globalAndroid.view.View>): void;
					public shouldFlattenTextContainer$masonkit_release(hasBackground: org.nativescript.mason.masonkit.TextView): boolean;
					public addChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public getNode(): org.nativescript.mason.masonkit.Node;
					public computeWithSize(width: number, height: number): void;
					public setFontStyle(this_: org.nativescript.mason.masonkit.FontFace.NSCFontStyle): void;
					public append(param0: string): void;
					public getFontWeight(): org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
					public appendView(param0: androidNative.Array<globalAndroid.view.View>): void;
					public getFontSize(): number;
				}
				export module TextView {
					export class ViewHelper {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextView.ViewHelper>;
						public setBitmap(value: globalAndroid.graphics.Bitmap): void;
						public constructor(this$0: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Node);
						public updateBitmap(config$iv: boolean): void;
						public getView(): globalAndroid.view.View;
						public getNode(): org.nativescript.mason.masonkit.Node;
						public getBitmap(): globalAndroid.graphics.Bitmap;
					}
					export class ViewSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextView.ViewSpan>;
						public constructor(this$0: org.nativescript.mason.masonkit.Node, childNode: org.nativescript.mason.masonkit.TextView.ViewHelper);
						public getSize(b: globalAndroid.graphics.Paint, b: string, size: number, it: number, width: globalAndroid.graphics.Paint.FontMetricsInt): number;
						public draw($this$draw_u24lambda_u241: globalAndroid.graphics.Canvas, $i$f$withTranslation: string, checkpoint$iv: number, $this$withTranslation$iv: number, y$iv: number, cachedWidth: number, cachedHeight: number, childView: number, parentPaddingLeft: globalAndroid.graphics.Paint): void;
						public getChildNode(): org.nativescript.mason.masonkit.Node;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextView.WhenMappings>;
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class TwoDScrollView {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.TwoDScrollView>;
					public static ANIMATED_SCROLL_GAP: number = 250;
					public static MAX_SCROLL_FACTOR: number = 0.5;
					public getMaxScrollAmountVertical(): number;
					public executeKeyEvent(nextFocused: globalAndroid.view.KeyEvent): boolean;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet, defStyle: number);
					public getLeftFadingEdgeStrength(): number;
					public getEnableScrollX(): boolean;
					public requestChildRectangleOnScreen(child: globalAndroid.view.View, rectangle: globalAndroid.graphics.Rect, immediate: boolean): boolean;
					public fullScroll(count: number, down: boolean): boolean;
					public computeHorizontalScrollRange(): number;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet);
					public isFillViewport(): boolean;
					public getRightFadingEdgeStrength(): number;
					public addView(this_: globalAndroid.view.View, child: globalAndroid.view.ViewGroup.LayoutParams): void;
					public measureChild(childWidthMeasureSpec: globalAndroid.view.View, childHeightMeasureSpec: number, this_: number): void;
					public onSizeChanged(scrollDeltaX: number, scrollDeltaY: number, this_: number, w: number): void;
					public setScrollChangeListner(listener: org.nativescript.mason.masonkit.TwoDScrollView.ScrollChangeListener): void;
					public smoothScrollTo(x: number, y: number): void;
					public onInterceptTouchEvent(xDiff: globalAndroid.view.MotionEvent): boolean;
					public setEnableScrollY(value: boolean): void;
					public computeScrollDeltaToGetChildRectOnScreen($this$isEmpty$iv: globalAndroid.graphics.Rect): number;
					public onScrollChanged(x: number, y: number, oldx: number, oldy: number): void;
					public requestLayout(): void;
					public addView(this_: globalAndroid.view.View, child: number, index: globalAndroid.view.ViewGroup.LayoutParams): void;
					public onTouchEvent(availableToScroll: globalAndroid.view.MotionEvent): boolean;
					public computeVerticalScrollRange(): number;
					public onLayout(changed: boolean, l: number, t: number, r: number, b: number): void;
					public scrollTo($this$isNotEmpty$iv: number, child: number): void;
					public dispatchKeyEvent(this_: globalAndroid.view.KeyEvent): boolean;
					public addView(this_: globalAndroid.view.View): void;
					public smoothScrollBy(this_: number, dx: number): void;
					public measureChildWithMargins(childWidthMeasureSpec: globalAndroid.view.View, childHeightMeasureSpec: number, this_: number, child: number, parentWidthMeasureSpec: number): void;
					public setEnableScrollX(value: boolean): void;
					public fling($this$isNotEmpty$iv: number, height: number): void;
					public getTopFadingEdgeStrength(): number;
					public getMaxScrollAmountHorizontal(): number;
					public requestChildFocus(child: globalAndroid.view.View, focused: globalAndroid.view.View): void;
					public setFillViewport(fillViewport: boolean): void;
					public computeScroll(): void;
					public arrowScroll($i$f$isNotEmpty: number, $this$isNotEmpty$iv: boolean): boolean;
					public onRequestFocusInDescendants(nextFocus: number, this_: globalAndroid.graphics.Rect): boolean;
					public getEnableScrollY(): boolean;
					public constructor(context: globalAndroid.content.Context);
					public addView(this_: globalAndroid.view.View, child: number): void;
					public onMeasure($this$isNotEmpty$iv: number, lp: number): void;
					public getBottomFadingEdgeStrength(): number;
				}
				export module TwoDScrollView {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TwoDScrollView.Companion>;
					}
					export class ScrollChangeListener {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TwoDScrollView.ScrollChangeListener>;
						/**
						 * Constructs a new instance of the org.nativescript.mason.masonkit.TwoDScrollView$ScrollChangeListener interface with the provided implementation. An empty constructor exists calling super() when extending the interface class.
						 */
						public constructor(implementation: {
							onScrollChanged(param0: globalAndroid.view.View, param1: number, param2: number, param3: number, param4: number): void;
						});
						public constructor();
						public onScrollChanged(param0: globalAndroid.view.View, param1: number, param2: number, param3: number, param4: number): void;
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
				export class View implements org.nativescript.mason.masonkit.Element {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.View>;
					public node: org.nativescript.mason.masonkit.Node;
					public getGridTemplateRows(): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
					public computeMaxContent(): void;
					public setMaxSize(width: number, height: number): void;
					public setMarginWithValueType(value: number, type: number): void;
					public layout(): org.nativescript.mason.masonkit.Layout;
					public computeWithViewSize(layout: boolean): void;
					public setRowGap(value: number, type: number): void;
					public setJustifySelf(value: org.nativescript.mason.masonkit.JustifySelf): void;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public replaceChildAt(param0: string, param1: number): void;
					public setBorder(left: number, top: number, right: number, bottom: number): void;
					public replaceChildAt(text: string, index: number): void;
					public setGridRowStart(value: org.nativescript.mason.masonkit.GridPlacement): void;
					public getPosition(): org.nativescript.mason.masonkit.Position;
					public getFlexBasis(): org.nativescript.mason.masonkit.Dimension;
					public getJustifySelf(): org.nativescript.mason.masonkit.JustifySelf;
					public compute(): void;
					public setPosition(left: number, top: number, right: number, bottom: number): void;
					public setMargin(left: number, leftType: number, top: number, topType: number, right: number, rightType: number, bottom: number, bottomType: number): void;
					public getGridColumnStart(): org.nativescript.mason.masonkit.GridPlacement;
					public prepend(param0: org.nativescript.mason.masonkit.Element): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public prependView(param0: globalAndroid.view.View): void;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public compute(param0: number, param1: number): void;
					public setGridTemplateColumns(value: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
					public addChildAt(text: string, index: number): void;
					public getOverflowX(): org.nativescript.mason.masonkit.Overflow;
					public getBorderLeft(): org.nativescript.mason.masonkit.LengthPercentage;
					public getInset(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public getMaxSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public getGridRowEnd(): org.nativescript.mason.masonkit.GridPlacement;
					public getFlexGrow(): number;
					public updateNodeAndStyle(): void;
					public append(texts: androidNative.Array<string>): void;
					public getOverflowY(): org.nativescript.mason.masonkit.Overflow;
					public constructor(context: globalAndroid.content.Context);
					public addView(this_: globalAndroid.view.View, child: number): void;
					public getBorderBottom(): org.nativescript.mason.masonkit.LengthPercentage;
					public getInsetRight(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getDirection(): org.nativescript.mason.masonkit.Direction;
					public setBorder(left: number, leftType: number, top: number, topType: number, right: number, rightType: number, bottom: number, bottomType: number): void;
					public setSizeHeight(value: number, type: number): void;
					public setSize(width: org.nativescript.mason.masonkit.Dimension, height: org.nativescript.mason.masonkit.Dimension): void;
					public addView(this_: globalAndroid.view.View, child: globalAndroid.view.ViewGroup.LayoutParams): void;
					public setInsetWithValueType(value: number, type: number): void;
					public setBorderTop(value: number, type: number): void;
					public setInset(left: number, leftType: number, top: number, topType: number, right: number, rightType: number, bottom: number, bottomType: number): void;
					public getMaxSizeHeight(): org.nativescript.mason.masonkit.Dimension;
					public getFlexWrap(): org.nativescript.mason.masonkit.FlexWrap;
					public setOverflowY(value: org.nativescript.mason.masonkit.Overflow): void;
					public static createGridView(mason: org.nativescript.mason.masonkit.Mason, context: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
					public setPaddingLeft(value: number, type: number): void;
					public append(node: org.nativescript.mason.masonkit.Node): void;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet, defStyleAttr: number);
					public getStylePaddingLeft(): org.nativescript.mason.masonkit.LengthPercentage;
					public generateDefaultLayoutParams(): globalAndroid.view.ViewGroup.LayoutParams;
					public getMarginJsonValue(): string;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public getInsetJsonValue(): string;
					public setBorderLeft(value: number, type: number): void;
					public checkLayoutParams(p: globalAndroid.view.ViewGroup.LayoutParams): boolean;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public setDirection(value: org.nativescript.mason.masonkit.Direction): void;
					public setFlexShrink(value: number): void;
					public getMarginRight(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setGridTemplateRows(value: androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>): void;
					public setMinSizeHeight(value: number, type: number): void;
					public setNode(value: org.nativescript.mason.masonkit.Node): void;
					public getAlignContent(): org.nativescript.mason.masonkit.AlignContent;
					public setPaddingBottom(value: number, type: number): void;
					public replaceChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public setMinSizeWidth(value: number, type: number): void;
					public setGapColumn(value: number, type: number): void;
					public appendView(param0: globalAndroid.view.View): void;
					public applyLayoutParams($i$f$getSize: org.nativescript.mason.masonkit.View.LayoutParams, $this$size$iv: org.nativescript.mason.masonkit.Node, points: globalAndroid.view.View): void;
					public computeWithSize(param0: number, param1: number): void;
					public setMargin(left: org.nativescript.mason.masonkit.LengthPercentageAuto, top: org.nativescript.mason.masonkit.LengthPercentageAuto, right: org.nativescript.mason.masonkit.LengthPercentageAuto, bottom: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
					public getInsetLeft(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public append(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public setGridRow(value: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
					public prependView(param0: androidNative.Array<globalAndroid.view.View>): void;
					public removeViews(this_: number, start: number): void;
					public setAlignContent(value: org.nativescript.mason.masonkit.AlignContent): void;
					public setColumnGap(value: number, type: number): void;
					public setPosition(value: org.nativescript.mason.masonkit.Position): void;
					public setFlexBasis(value: org.nativescript.mason.masonkit.Dimension): void;
					public replaceChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public getMarginBottom(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setGridColumnStart(value: org.nativescript.mason.masonkit.GridPlacement): void;
					public setMargin(left: number, top: number, right: number, bottom: number): void;
					public generateLayoutParams(p: globalAndroid.view.ViewGroup.LayoutParams): globalAndroid.view.ViewGroup.LayoutParams;
					public getInsetCssValue(): string;
					public onLayout(this_: boolean, changed: number, l: number, t: number, r: number): void;
					public getMaxSizeJsonValue(): string;
					public getFlexDirection(): org.nativescript.mason.masonkit.FlexDirection;
					public setMaxSizeHeight(value: number, type: number): void;
					public setGap(width: number, widthType: number, height: number, heightType: number): void;
					public setInsetLeft(value: number, type: number): void;
					public getStylePaddingRight(): org.nativescript.mason.masonkit.LengthPercentage;
					public computeAndLayout(): org.nativescript.mason.masonkit.Layout;
					public computeWithViewSize(param0: boolean): void;
					public setFlexGrow(value: number): void;
					public removeViewAt(index: number): void;
					public static createBlockView(mason: org.nativescript.mason.masonkit.Mason, context: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
					public setGapRow(value: number, type: number): void;
					public getMargin(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public setAlignItems(value: org.nativescript.mason.masonkit.AlignItems): void;
					public getPaddingCssValue(): string;
					public setMarginLeft(value: number, type: number): void;
					public prepend(param0: string): void;
					public getGapRow(): org.nativescript.mason.masonkit.LengthPercentage;
					public setInsetTop(value: number, type: number): void;
					public getGridRow(): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
					public setMarginTop(value: number, type: number): void;
					public attachAndApply(): void;
					public computeWithMaxContent(): void;
					public setPaddingWithValueType(value: number, type: number): void;
					public getInsetTop(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getSizeCssValue(): string;
					public getGridTemplateColumns(): androidNative.Array<org.nativescript.mason.masonkit.TrackSizingFunction>;
					public getGridAutoFlow(): org.nativescript.mason.masonkit.GridAutoFlow;
					public append(param0: androidNative.Array<string>): void;
					public getAspectRatio(): java.lang.Float;
					public setFlexBasis(value: number, type: number): void;
					public setOverflowX(value: org.nativescript.mason.masonkit.Overflow): void;
					public setGridAutoRows(value: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
					public setMarginRight(value: number, type: number): void;
					public prepend(string: string): void;
					public getPaddingJsonValue(): string;
					public getFlexShrink(): number;
					public removeAllViews(): void;
					public getMarginTop(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setFlexWrap(value: org.nativescript.mason.masonkit.FlexWrap): void;
					public getNode(): org.nativescript.mason.masonkit.Node;
					public computeWithSize(width: number, height: number): void;
					public getScrollBarWidth(): number;
					public getMinSizeJsonValue(): string;
					public setOverflow(value: org.nativescript.mason.masonkit.Overflow): void;
					public appendView(param0: androidNative.Array<globalAndroid.view.View>): void;
					public getStyleAsString(): string;
					public setBorder(left: org.nativescript.mason.masonkit.LengthPercentage, top: org.nativescript.mason.masonkit.LengthPercentage, right: org.nativescript.mason.masonkit.LengthPercentage, bottom: org.nativescript.mason.masonkit.LengthPercentage): void;
					public getAlignItems(): org.nativescript.mason.masonkit.AlignItems;
					public getGridRowStart(): org.nativescript.mason.masonkit.GridPlacement;
					public getGap(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>;
					public removeViewInLayout(view: globalAndroid.view.View): void;
					public setFlexDirection(value: org.nativescript.mason.masonkit.FlexDirection): void;
					public prependView(view: globalAndroid.view.View): void;
					public setSize(width: number, height: number): void;
					public setBorderBottom(value: number, type: number): void;
					public prepend(param0: org.nativescript.mason.masonkit.Node): void;
					public computeMinContent(): void;
					public getInsetBottom(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setAlignSelf(value: org.nativescript.mason.masonkit.AlignSelf): void;
					public setGridColumn(value: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
					public getGridAutoColumns(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
					public prepend(param0: androidNative.Array<string>): void;
					public getBorderCssValue(): string;
					public removeChildAt(index: number): void;
					public constructor($this$_init__u24lambda_u240: globalAndroid.content.Context, this_: org.nativescript.mason.masonkit.Mason);
					public setPaddingRight(value: number, type: number): void;
					public appendView(views: androidNative.Array<globalAndroid.view.View>): void;
					public getMinSizeCssValue(): string;
					public setSize(width: number, widthType: number, height: number, heightType: number): void;
					public getOverflow(): org.nativescript.mason.masonkit.Overflow;
					public prepend(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public removeViewsInLayout(this_: number, start: number): void;
					public syncStyle(this_: string): void;
					public setMinSize(width: org.nativescript.mason.masonkit.Dimension, height: org.nativescript.mason.masonkit.Dimension): void;
					public setMaxSize(width: org.nativescript.mason.masonkit.Dimension, height: org.nativescript.mason.masonkit.Dimension): void;
					public compute(width: number, height: number): void;
					public computeWithMinContent(): void;
					public isNodeDirty(): boolean;
					public static createFlexView(mason: org.nativescript.mason.masonkit.Mason, context: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
					public setSizeWidth(value: number, type: number): void;
					public setGridColumnEnd(value: org.nativescript.mason.masonkit.GridPlacement): void;
					public setGridRowEnd(value: org.nativescript.mason.masonkit.GridPlacement): void;
					public removeAllViewsInLayout(): void;
					public setPaddingTop(value: number, type: number): void;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet);
					public onNodeAttached(): void;
					public onMeasure(specHeight: number, specWidthMode: number): void;
					public onNodeDetached(): void;
					public getSizeWidth(): org.nativescript.mason.masonkit.Dimension;
					public setMaxSizeWidth(value: number, type: number): void;
					public markNodeDirty(): void;
					public setJustifyItems(value: org.nativescript.mason.masonkit.JustifyItems): void;
					public prepend(element: org.nativescript.mason.masonkit.Element): void;
					public addChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public getPadding(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public append(text: string): void;
					public addChildAt(param0: string, param1: number): void;
					public setPadding(left: number, top: number, right: number, bottom: number): void;
					public constructor($this$_init__u24lambda_u241: globalAndroid.content.Context, this_: globalAndroid.util.AttributeSet, context: number, attrs: boolean);
					public getBorderTop(): org.nativescript.mason.masonkit.LengthPercentage;
					public getBorder(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public setDisplay(value: org.nativescript.mason.masonkit.Display): void;
					public getBorderRight(): org.nativescript.mason.masonkit.LengthPercentage;
					public append(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public setGridAutoColumns(value: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
					public removeView(this_: globalAndroid.view.View): void;
					public setJustifyContent(value: org.nativescript.mason.masonkit.JustifyContent): void;
					public getSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public getView(): globalAndroid.view.View;
					public configure(param0: any): void;
					public isScrollRoot$masonkit_release(): boolean;
					public getAlignSelf(): org.nativescript.mason.masonkit.AlignSelf;
					public setMarginBottom(value: number, type: number): void;
					public getGridAutoRows(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
					public addChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public getStyle(): org.nativescript.mason.masonkit.Style;
					public getJustifyItems(): org.nativescript.mason.masonkit.JustifyItems;
					public removeChildAt(param0: number): void;
					public generateLayoutParams(attrs: globalAndroid.util.AttributeSet): globalAndroid.view.ViewGroup.LayoutParams;
					public append(param0: org.nativescript.mason.masonkit.Element): void;
					public append(param0: org.nativescript.mason.masonkit.Node): void;
					public setPosition(left: org.nativescript.mason.masonkit.LengthPercentageAuto, top: org.nativescript.mason.masonkit.LengthPercentageAuto, right: org.nativescript.mason.masonkit.LengthPercentageAuto, bottom: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
					public getMinSizeHeight(): org.nativescript.mason.masonkit.Dimension;
					public getGridColumn(): org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>;
					public invalidateLayout(): void;
					public getStylePaddingTop(): org.nativescript.mason.masonkit.LengthPercentage;
					public setPadding(left: org.nativescript.mason.masonkit.LengthPercentage, top: org.nativescript.mason.masonkit.LengthPercentage, right: org.nativescript.mason.masonkit.LengthPercentage, bottom: org.nativescript.mason.masonkit.LengthPercentage): void;
					public setGap(row: org.nativescript.mason.masonkit.LengthPercentage, column: org.nativescript.mason.masonkit.LengthPercentage): void;
					public getDisplay(): org.nativescript.mason.masonkit.Display;
					public getMinSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public appendView(view: globalAndroid.view.View): void;
					public addView(this_: globalAndroid.view.View): void;
					public getMarginCssValue(): string;
					public getGapColumn(): org.nativescript.mason.masonkit.LengthPercentage;
					public prepend(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public getJustifyContent(): org.nativescript.mason.masonkit.JustifyContent;
					public setBorderRight(value: number, type: number): void;
					public setMaxSize(width: number, widthType: number, height: number, heightType: number): void;
					public setGridAutoFlow(value: org.nativescript.mason.masonkit.GridAutoFlow): void;
					public setMinSize(width: number, height: number): void;
					public setBorderWithValueType(value: number, type: number): void;
					public getMinSizeWidth(): org.nativescript.mason.masonkit.Dimension;
					public computeAndLayout(width: number, height: number): org.nativescript.mason.masonkit.Layout;
					public computeAndLayout(param0: number, param1: number): org.nativescript.mason.masonkit.Layout;
					public addChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public getBorderJsonValue(): string;
					public getMaxSizeCssValue(): string;
					public setInsetBottom(value: number, type: number): void;
					public computeWithViewSize(): void;
					public setInsetRight(value: number, type: number): void;
					public prepend(node: org.nativescript.mason.masonkit.Node): void;
					public setGap(width: number, height: number): void;
					public getMarginLeft(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setPadding(left: number, leftType: number, top: number, topType: number, right: number, rightType: number, bottom: number, bottomType: number): void;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public setScrollBarWidth(value: number): void;
					public configure(block: any): void;
					public addView(this_: globalAndroid.view.View, child: number, index: globalAndroid.view.ViewGroup.LayoutParams): void;
					public getStylePaddingBottom(): org.nativescript.mason.masonkit.LengthPercentage;
					public append(element: org.nativescript.mason.masonkit.Element): void;
					public setAspectRatio(value: java.lang.Float): void;
					public getGridColumnEnd(): org.nativescript.mason.masonkit.GridPlacement;
					public getMaxSizeWidth(): org.nativescript.mason.masonkit.Dimension;
					public prepend(strings: androidNative.Array<string>): void;
					public setScrollRoot$masonkit_release(value: boolean): void;
					public prependView(views: androidNative.Array<globalAndroid.view.View>): void;
					public addChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public setMinSize(width: number, widthType: number, height: number, heightType: number): void;
					public getSizeJsonValue(): string;
					public append(param0: string): void;
					public getSizeHeight(): org.nativescript.mason.masonkit.Dimension;
				}
				export module View {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.View.Companion>;
						public mapMeasureSpec$masonkit_release(mode: number, value: number): org.nativescript.mason.masonkit.AvailableSpace;
						public createBlockView($this$createBlockView_u24lambda_u242: org.nativescript.mason.masonkit.Mason, this_: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
						public getGson$masonkit_release(): com.google.gson.Gson;
						public createGridView($this$createGridView_u24lambda_u240: org.nativescript.mason.masonkit.Mason, this_: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
						public createFlexView($this$createFlexView_u24lambda_u241: org.nativescript.mason.masonkit.Mason, this_: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
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
					public onCreateView(name: string, context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet): globalAndroid.view.View;
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

