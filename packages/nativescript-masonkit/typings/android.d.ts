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
				export class Background {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Background>;
					public constructor(style: org.nativescript.mason.masonkit.Style);
					public getLayers(): java.util.List<org.nativescript.mason.masonkit.BackgroundLayer>;
					public setLayers(value: java.util.List<org.nativescript.mason.masonkit.BackgroundLayer>): void;
					public setColor(value: java.lang.Integer): void;
					public clear(): void;
					public getColor(): java.lang.Integer;
					public getStyle(): org.nativescript.mason.masonkit.Style;
				}
			}
		}
	}
}

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class BackgroundClip {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.BackgroundClip>;
					public static BORDER_BOX: org.nativescript.mason.masonkit.BackgroundClip;
					public static PADDING_BOX: org.nativescript.mason.masonkit.BackgroundClip;
					public static CONTENT_BOX: org.nativescript.mason.masonkit.BackgroundClip;
					public static getEntries(): any;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.BackgroundClip>;
					public static valueOf(value: string): org.nativescript.mason.masonkit.BackgroundClip;
				}
			}
		}
	}
}

// declare module org {
// 	export module nativescript {
// 		export module mason {
// 			export module masonkit {
// 				export module BackgroundKt {
// export module  {
// 					export class WhenMappings {
// 						public static class: java.lang.Class<org.nativescript.mason.masonkit.BackgroundKt.WhenMappings>;
// 					}
// 				}
// 			}
// 		}
// 	}
// }

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class BackgroundLayer {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.BackgroundLayer>;
					public getShader(): globalAndroid.graphics.Shader;
					public getClip(): org.nativescript.mason.masonkit.BackgroundClip;
					public component2(): org.nativescript.mason.masonkit.BackgroundRepeat;
					public component4(): any;
					public getImage(): string;
					public setImage(value: string): void;
					public component7(): globalAndroid.graphics.Bitmap;
					public component8(): org.nativescript.mason.masonkit.BackgroundClip;
					public toString(): string;
					public component5(): org.nativescript.mason.masonkit.Gradient;
					public constructor(image: string, repeat: org.nativescript.mason.masonkit.BackgroundRepeat, position: any, size: any, gradient: org.nativescript.mason.masonkit.Gradient, shader: globalAndroid.graphics.Shader, bitmap: globalAndroid.graphics.Bitmap, clip: org.nativescript.mason.masonkit.BackgroundClip);
					public constructor();
					public setSize(value: any): void;
					public getGradient(): org.nativescript.mason.masonkit.Gradient;
					public setRepeat(value: org.nativescript.mason.masonkit.BackgroundRepeat): void;
					public hashCode(): number;
					public getSize(): any;
					public setGradient(value: org.nativescript.mason.masonkit.Gradient): void;
					public getRepeat(): org.nativescript.mason.masonkit.BackgroundRepeat;
					public setClip(value: org.nativescript.mason.masonkit.BackgroundClip): void;
					public component6(): globalAndroid.graphics.Shader;
					public equals(other: any): boolean;
					public setShader(value: globalAndroid.graphics.Shader): void;
					public setPosition(value: any): void;
					public getBitmap(): globalAndroid.graphics.Bitmap;
					public component1(): string;
					public copy(image: string, repeat: org.nativescript.mason.masonkit.BackgroundRepeat, position: any, size: any, gradient: org.nativescript.mason.masonkit.Gradient, shader: globalAndroid.graphics.Shader, bitmap: globalAndroid.graphics.Bitmap, clip: org.nativescript.mason.masonkit.BackgroundClip): org.nativescript.mason.masonkit.BackgroundLayer;
					public getPosition(): any;
					public component3(): any;
					public setBitmap(value: globalAndroid.graphics.Bitmap): void;
				}
			}
		}
	}
}

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class BackgroundRepeat {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.BackgroundRepeat>;
					public static REPEAT: org.nativescript.mason.masonkit.BackgroundRepeat;
					public static REPEAT_X: org.nativescript.mason.masonkit.BackgroundRepeat;
					public static REPEAT_Y: org.nativescript.mason.masonkit.BackgroundRepeat;
					public static NO_REPEAT: org.nativescript.mason.masonkit.BackgroundRepeat;
					public getValue(): string;
					public static valueOf(value: string): org.nativescript.mason.masonkit.BackgroundRepeat;
					public static getEntries(): any;
					public static values(): androidNative.Array<org.nativescript.mason.masonkit.BackgroundRepeat>;
				}
			}
		}
	}
}

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class Border {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Border>;
					public setCorner2Exponent(value: number): void;
					public setSetState$masonkit_release(value: boolean): void;
					public getStyle(): org.nativescript.mason.masonkit.enums.BorderStyle;
					public getColor(): number;
					public getOwner(): org.nativescript.mason.masonkit.Style;
					public setWidth(this_: org.nativescript.mason.masonkit.LengthPercentage): void;
					public setCorner1Radius(value: org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.LengthPercentage>): void;
					public getWidth(): org.nativescript.mason.masonkit.LengthPercentage;
					public getSetState$masonkit_release(): boolean;
					public getKeys(): org.nativescript.mason.masonkit.Border.IKey;
					public getCorner1Radius(): org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.LengthPercentage>;
					public constructor(owner: org.nativescript.mason.masonkit.Style, side: org.nativescript.mason.masonkit.Border.Side);
					public setColor(this_: number): void;
					public getCorner2Radius(): org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.LengthPercentage>;
					public getCorner2Exponent(): number;
					public setCorner2Radius(value: org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.LengthPercentage>): void;
					public getCorner1Exponent(): number;
					public setCorner1Exponent(value: number): void;
					public setStyle(this_: org.nativescript.mason.masonkit.enums.BorderStyle): void;
				}
				export module Border {
					export class IKey {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Border.IKey>;
						/**
						 * Constructs a new instance of the org.nativescript.mason.masonkit.Border$IKey interface with the provided implementation. An empty constructor exists calling super() when extending the interface class.
						 */
						public constructor(implementation: {
							getWidthValue(): number;
							getWidthType(): number;
							getStyle(): number;
							getColor(): number;
							getCorner1RadiusXType(): number;
							getCorner1RadiusXValue(): number;
							getCorner1RadiusYType(): number;
							getCorner1RadiusYValue(): number;
							getCorner1Exponent(): number;
							getCorner2RadiusXType(): number;
							getCorner2RadiusXValue(): number;
							getCorner2RadiusYType(): number;
							getCorner2RadiusYValue(): number;
							getCorner2Exponent(): number;
						});
						public constructor();
						public getCorner1Exponent(): number;
						public getColor(): number;
						public getCorner1RadiusXType(): number;
						public getCorner2RadiusXValue(): number;
						public getCorner1RadiusXValue(): number;
						public getWidthValue(): number;
						public getCorner2RadiusYType(): number;
						public getCorner1RadiusYValue(): number;
						public getWidthType(): number;
						public getCorner2RadiusYValue(): number;
						public getCorner2RadiusXType(): number;
						public getCorner1RadiusYType(): number;
						public getStyle(): number;
						public getCorner2Exponent(): number;
					}
					export class IKeyCorner {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Border.IKeyCorner>;
						/**
						 * Constructs a new instance of the org.nativescript.mason.masonkit.Border$IKeyCorner interface with the provided implementation. An empty constructor exists calling super() when extending the interface class.
						 */
						public constructor(implementation: {
							getXType(): number;
							getXValue(): number;
							getYType(): number;
							getYValue(): number;
							getExponent(): number;
						});
						public constructor();
						public getExponent(): number;
						public getXType(): number;
						public getYValue(): number;
						public getXValue(): number;
						public getYType(): number;
					}
					export class Keys {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Border.Keys>;
						public constructor();
					}
					export module Keys {
						export class Bottom extends org.nativescript.mason.masonkit.Border.IKey {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Border.Keys.Bottom>;
							public constructor();
							public getCorner1Exponent(): number;
							public getCorner2Exponent(): number;
							public getColor(): number;
							public getCorner1RadiusYType(): number;
							public getCorner2RadiusYValue(): number;
							public getCorner2RadiusXType(): number;
							public getWidthType(): number;
							public getWidthValue(): number;
							public getStyle(): number;
							public getCorner1RadiusYValue(): number;
							public getCorner2RadiusXValue(): number;
							public getCorner1RadiusXValue(): number;
							public getCorner2RadiusYType(): number;
							public getCorner1RadiusXType(): number;
						}
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Border.Keys.Companion>;
							public getTop(): org.nativescript.mason.masonkit.Border.Keys.Top;
							public getBottom(): org.nativescript.mason.masonkit.Border.Keys.Bottom;
							public getLeft(): org.nativescript.mason.masonkit.Border.Keys.Left;
							public getRight(): org.nativescript.mason.masonkit.Border.Keys.Right;
						}
						export class Left extends org.nativescript.mason.masonkit.Border.IKey {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Border.Keys.Left>;
							public constructor();
							public getCorner1Exponent(): number;
							public getCorner2Exponent(): number;
							public getColor(): number;
							public getCorner1RadiusYType(): number;
							public getCorner2RadiusYValue(): number;
							public getCorner2RadiusXType(): number;
							public getWidthType(): number;
							public getWidthValue(): number;
							public getStyle(): number;
							public getCorner1RadiusYValue(): number;
							public getCorner2RadiusXValue(): number;
							public getCorner1RadiusXValue(): number;
							public getCorner2RadiusYType(): number;
							public getCorner1RadiusXType(): number;
						}
						export class Right extends org.nativescript.mason.masonkit.Border.IKey {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Border.Keys.Right>;
							public constructor();
							public getCorner1Exponent(): number;
							public getCorner2Exponent(): number;
							public getColor(): number;
							public getCorner1RadiusYType(): number;
							public getCorner2RadiusYValue(): number;
							public getCorner2RadiusXType(): number;
							public getWidthType(): number;
							public getWidthValue(): number;
							public getStyle(): number;
							public getCorner1RadiusYValue(): number;
							public getCorner2RadiusXValue(): number;
							public getCorner1RadiusXValue(): number;
							public getCorner2RadiusYType(): number;
							public getCorner1RadiusXType(): number;
						}
						export class Top extends org.nativescript.mason.masonkit.Border.IKey {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Border.Keys.Top>;
							public constructor();
							public getCorner1Exponent(): number;
							public getCorner2Exponent(): number;
							public getColor(): number;
							public getCorner1RadiusYType(): number;
							public getCorner2RadiusYValue(): number;
							public getCorner2RadiusXType(): number;
							public getWidthType(): number;
							public getWidthValue(): number;
							public getStyle(): number;
							public getCorner1RadiusYValue(): number;
							public getCorner2RadiusXValue(): number;
							public getCorner1RadiusXValue(): number;
							public getCorner2RadiusYType(): number;
							public getCorner1RadiusXType(): number;
						}
					}
					export class Side {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Border.Side>;
						public static Left: org.nativescript.mason.masonkit.Border.Side;
						public static Top: org.nativescript.mason.masonkit.Border.Side;
						public static Right: org.nativescript.mason.masonkit.Border.Side;
						public static Bottom: org.nativescript.mason.masonkit.Border.Side;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.Border.Side>;
						public static valueOf(value: string): org.nativescript.mason.masonkit.Border.Side;
						public static getEntries(): any;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Border.WhenMappings>;
					}
					export class cornerBottomLeftKeys extends org.nativescript.mason.masonkit.Border.IKeyCorner {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Border.cornerBottomLeftKeys>;
						public static INSTANCE: org.nativescript.mason.masonkit.Border.cornerBottomLeftKeys;
						public getExponent(): number;
						public getXType(): number;
						public getYValue(): number;
						public getXValue(): number;
						public getYType(): number;
					}
					export class cornerBottomRightKeys extends org.nativescript.mason.masonkit.Border.IKeyCorner {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Border.cornerBottomRightKeys>;
						public static INSTANCE: org.nativescript.mason.masonkit.Border.cornerBottomRightKeys;
						public getExponent(): number;
						public getXType(): number;
						public getYValue(): number;
						public getXValue(): number;
						public getYType(): number;
					}
					export class cornerTopLeftKeys extends org.nativescript.mason.masonkit.Border.IKeyCorner {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Border.cornerTopLeftKeys>;
						public static INSTANCE: org.nativescript.mason.masonkit.Border.cornerTopLeftKeys;
						public getExponent(): number;
						public getXType(): number;
						public getYValue(): number;
						public getXValue(): number;
						public getYType(): number;
					}
					export class cornerTopRightKeys extends org.nativescript.mason.masonkit.Border.IKeyCorner {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Border.cornerTopRightKeys>;
						public static INSTANCE: org.nativescript.mason.masonkit.Border.cornerTopRightKeys;
						public getExponent(): number;
						public getXType(): number;
						public getYValue(): number;
						public getXValue(): number;
						public getYType(): number;
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
				export class BorderRenderer {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.BorderRenderer>;
					public constructor(style: org.nativescript.mason.masonkit.Style);
					public updateCache(this_: number, viewWidth: number): void;
					public draw(canvas: globalAndroid.graphics.Canvas, width: number, height: number): void;
					public getClipPath(tr: number, br: number): globalAndroid.graphics.Path;
					public hasRadii(): boolean;
					public invalidate(): void;
				}
				export module BorderRenderer {
					export class Corner {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.BorderRenderer.Corner>;
						public static TOP_LEFT: org.nativescript.mason.masonkit.BorderRenderer.Corner;
						public static TOP_RIGHT: org.nativescript.mason.masonkit.BorderRenderer.Corner;
						public static BOTTOM_RIGHT: org.nativescript.mason.masonkit.BorderRenderer.Corner;
						public static BOTTOM_LEFT: org.nativescript.mason.masonkit.BorderRenderer.Corner;
						public static getEntries(): any;
						public static valueOf(value: string): org.nativescript.mason.masonkit.BorderRenderer.Corner;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.BorderRenderer.Corner>;
					}
					export class Side {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.BorderRenderer.Side>;
						public static Left: org.nativescript.mason.masonkit.BorderRenderer.Side;
						public static Top: org.nativescript.mason.masonkit.BorderRenderer.Side;
						public static Right: org.nativescript.mason.masonkit.BorderRenderer.Side;
						public static Bottom: org.nativescript.mason.masonkit.BorderRenderer.Side;
						public static valueOf(value: string): org.nativescript.mason.masonkit.BorderRenderer.Side;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.BorderRenderer.Side>;
						public static getEntries(): any;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.BorderRenderer.WhenMappings>;
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
				export class Br extends org.nativescript.mason.masonkit.TextNode {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Br>;
					public getData(): string;
					public constructor(mason: org.nativescript.mason.masonkit.Mason, data: string);
					public constructor(mason: org.nativescript.mason.masonkit.Mason, nativePtr: number, nodeType: org.nativescript.mason.masonkit.NodeType);
					public insertData(param0: number, param1: string): org.nativescript.mason.masonkit.CharacterData;
					public getLength(): number;
					public constructor(mason: org.nativescript.mason.masonkit.Mason);
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
				export class Button implements org.nativescript.mason.masonkit.Element, org.nativescript.mason.masonkit.MeasureFunc, org.nativescript.mason.masonkit.TextContainer {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Button>;
					public computeMaxContent(): void;
					public layout(): org.nativescript.mason.masonkit.Layout;
					public computeWithViewSize(layout: boolean): void;
					public setTextSize(param0: number): void;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public prependView(view: globalAndroid.view.View): void;
					public onTextStyleChanged(param0: number): void;
					public replaceChildAt(param0: string, param1: number): void;
					public replaceChildAt(text: string, index: number): void;
					public prepend(param0: org.nativescript.mason.masonkit.Node): void;
					public computeMinContent(): void;
					public compute(): void;
					public setTextContent(value: string): void;
					public prepend(param0: org.nativescript.mason.masonkit.Element): void;
					public prepend(param0: androidNative.Array<string>): void;
					public removeChildAt(index: number): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public prependView(param0: globalAndroid.view.View): void;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public appendView(views: androidNative.Array<globalAndroid.view.View>): void;
					public compute(param0: number, param1: number): void;
					public addChildAt(text: string, index: number): void;
					public prepend(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public compute(width: number, height: number): void;
					public computeWithMinContent(): void;
					public isNodeDirty(): boolean;
					public invalidateLayout(param0: boolean): void;
					public append(texts: androidNative.Array<string>): void;
					public getTextContent(): string;
					public constructor(context: globalAndroid.content.Context);
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet, override: boolean);
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet);
					public onNodeAttached(): void;
					public getEngine(): org.nativescript.mason.masonkit.TextEngine;
					public onNodeDetached(): void;
					public append(node: org.nativescript.mason.masonkit.Node): void;
					public markNodeDirty(): void;
					public prepend(element: org.nativescript.mason.masonkit.Element): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public syncStyle(param0: string, param1: string): void;
					public addChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public measure(knownDimensions: org.nativescript.mason.masonkit.Size<java.lang.Float>, availableSpace: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
					public replaceChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public invalidateLayout(invalidateRoot: boolean): void;
					public append(text: string): void;
					public addChildAt(param0: string, param1: number): void;
					public appendView(param0: globalAndroid.view.View): void;
					public setTextSize(param0: number, param1: number): void;
					public computeWithSize(param0: number, param1: number): void;
					public append(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public append(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public prependView(param0: androidNative.Array<globalAndroid.view.View>): void;
					public setText(param0: string, param1: globalAndroid.widget.TextView.BufferType): void;
					public constructor(context: globalAndroid.content.Context, mason: org.nativescript.mason.masonkit.Mason);
					public getView(): globalAndroid.view.View;
					public configure(param0: any): void;
					public replaceChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public setIncludePadding(value: boolean): void;
					public addChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public getStyle(): org.nativescript.mason.masonkit.Style;
					public removeChildAt(param0: number): void;
					public syncStyle(state: string, textState: string): void;
					public onTextStyleChanged(change: number): void;
					public append(param0: org.nativescript.mason.masonkit.Element): void;
					public append(param0: org.nativescript.mason.masonkit.Node): void;
					public onSizeChanged(it: number, element$iv: number, $i$f$forEach: number, $this$forEach$iv: number): void;
					public computeAndLayout(): org.nativescript.mason.masonkit.Layout;
					public invalidateLayout(): void;
					public computeWithViewSize(param0: boolean): void;
					public measure(param0: org.nativescript.mason.masonkit.Size<java.lang.Float>, param1: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
					public appendView(view: globalAndroid.view.View): void;
					public getIncludePadding(): boolean;
					public prepend(param0: string): void;
					public prepend(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public drawableStateChanged(): void;
					public computeAndLayout(width: number, height: number): org.nativescript.mason.masonkit.Layout;
					public computeAndLayout(param0: number, param1: number): org.nativescript.mason.masonkit.Layout;
					public addChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public attachAndApply(): void;
					public getPaint(): globalAndroid.text.TextPaint;
					public computeWithViewSize(): void;
					public computeWithMaxContent(): void;
					public prepend(node: org.nativescript.mason.masonkit.Node): void;
					public append(param0: androidNative.Array<string>): void;
					public getFontFace$masonkit_release(): org.nativescript.mason.masonkit.FontFace;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public configure(block: any): void;
					public append(element: org.nativescript.mason.masonkit.Element): void;
					public prepend(strings: androidNative.Array<string>): void;
					public prepend(string: string): void;
					public prependView(views: androidNative.Array<globalAndroid.view.View>): void;
					public addChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public getNode(): org.nativescript.mason.masonkit.Node;
					public computeWithSize(width: number, height: number): void;
					public onDraw(canvas: globalAndroid.graphics.Canvas): void;
					public append(param0: string): void;
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
				export class CSSFilters {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters>;
					public constructor();
					public static parse(value: string): org.nativescript.mason.masonkit.CSSFilters.CSSFilter;
				}
				export module CSSFilters {
					export class BitmapPool {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.BitmapPool>;
						public putBitmap(this_: globalAndroid.graphics.Bitmap, bitmap: java.lang.Boolean): void;
						public getSourceBitmap(k: number, cached: number, this_: globalAndroid.graphics.Bitmap.Config): globalAndroid.graphics.Bitmap;
						public getBitmap(k: number, cached: number, this_: globalAndroid.graphics.Bitmap.Config): globalAndroid.graphics.Bitmap;
						public clear(): void;
						public constructor(totalMem: globalAndroid.content.Context);
					}
					export class CSSFilter {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.CSSFilter>;
						public getV1$masonkit_release(): org.nativescript.mason.masonkit.CSSFilters.FilterHelper;
						public renderFilters(filter: globalAndroid.view.View, canvas: globalAndroid.graphics.Canvas, it: any): void;
						public getInvalid$masonkit_release(): boolean;
						public getV2$masonkit_release(): any;
						public setCss$masonkit_release(value: string): void;
						public getV3$masonkit_release(): any;
						public setV3$masonkit_release(value: any): void;
						public setV2$masonkit_release(value: any): void;
						public setV1$masonkit_release(value: org.nativescript.mason.masonkit.CSSFilters.FilterHelper): void;
						public constructor(css: string, filters: java.util.List<any>);
						public setInvalid$masonkit_release(value: boolean): void;
						public getFilters(): java.util.List<org.nativescript.mason.masonkit.CSSFilters.Filter>;
						public getCss$masonkit_release(): string;
					}
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.Companion>;
						public getPool$masonkit_release(context: globalAndroid.content.Context): org.nativescript.mason.masonkit.CSSFilters.BitmapPool;
						public parseCssColor$masonkit_release(g: string): number;
						public parse(it: string): org.nativescript.mason.masonkit.CSSFilters.CSSFilter;
					}
					export abstract class Filter {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.Filter>;
					}
					export module Filter {
						export class Blur extends org.nativescript.mason.masonkit.CSSFilters.Filter {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.Filter.Blur>;
							public copy(radiusPx: number): org.nativescript.mason.masonkit.CSSFilters.Filter.Blur;
							public component1(): number;
							public getRadiusPx(): number;
							public hashCode(): number;
							public equals(other: any): boolean;
							public toString(): string;
							public constructor(radiusPx: number);
						}
						export class Brightness extends org.nativescript.mason.masonkit.CSSFilters.Filter {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.Filter.Brightness>;
							public component1(): number;
							public constructor(value: number);
							public hashCode(): number;
							public equals(other: any): boolean;
							public toString(): string;
							public getValue(): number;
							public copy(value: number): org.nativescript.mason.masonkit.CSSFilters.Filter.Brightness;
						}
						export class Contrast extends org.nativescript.mason.masonkit.CSSFilters.Filter {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.Filter.Contrast>;
							public component1(): number;
							public constructor(value: number);
							public hashCode(): number;
							public equals(other: any): boolean;
							public copy(value: number): org.nativescript.mason.masonkit.CSSFilters.Filter.Contrast;
							public toString(): string;
							public getValue(): number;
						}
						export class DropShadow extends org.nativescript.mason.masonkit.CSSFilters.Filter {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.Filter.DropShadow>;
							public hashCode(): number;
							public component2(): number;
							public toString(): string;
							public getColor(): number;
							public getOffsetX(): number;
							public constructor(offsetX: number, offsetY: number, blur: number, color: number);
							public getBlur(): number;
							public component1(): number;
							public component4(): number;
							public equals(other: any): boolean;
							public getOffsetY(): number;
							public component3(): number;
							public copy(offsetX: number, offsetY: number, blur: number, color: number): org.nativescript.mason.masonkit.CSSFilters.Filter.DropShadow;
						}
						export class Grayscale extends org.nativescript.mason.masonkit.CSSFilters.Filter {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.Filter.Grayscale>;
							public component1(): number;
							public hashCode(): number;
							public getAmount(): number;
							public equals(other: any): boolean;
							public copy(amount: number): org.nativescript.mason.masonkit.CSSFilters.Filter.Grayscale;
							public constructor(amount: number);
							public toString(): string;
						}
						export class HueRotate extends org.nativescript.mason.masonkit.CSSFilters.Filter {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.Filter.HueRotate>;
							public constructor(degrees: number);
							public component1(): number;
							public hashCode(): number;
							public getDegrees(): number;
							public equals(other: any): boolean;
							public toString(): string;
							public copy(degrees: number): org.nativescript.mason.masonkit.CSSFilters.Filter.HueRotate;
						}
						export class Invert extends org.nativescript.mason.masonkit.CSSFilters.Filter {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.Filter.Invert>;
							public component1(): number;
							public hashCode(): number;
							public getAmount(): number;
							public equals(other: any): boolean;
							public constructor(amount: number);
							public copy(amount: number): org.nativescript.mason.masonkit.CSSFilters.Filter.Invert;
							public toString(): string;
						}
						export class Opacity extends org.nativescript.mason.masonkit.CSSFilters.Filter {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.Filter.Opacity>;
							public component1(): number;
							public hashCode(): number;
							public getAmount(): number;
							public equals(other: any): boolean;
							public copy(amount: number): org.nativescript.mason.masonkit.CSSFilters.Filter.Opacity;
							public constructor(amount: number);
							public toString(): string;
						}
						export class Saturate extends org.nativescript.mason.masonkit.CSSFilters.Filter {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.Filter.Saturate>;
							public component1(): number;
							public constructor(value: number);
							public hashCode(): number;
							public equals(other: any): boolean;
							public toString(): string;
							public copy(value: number): org.nativescript.mason.masonkit.CSSFilters.Filter.Saturate;
							public getValue(): number;
						}
						export class Sepia extends org.nativescript.mason.masonkit.CSSFilters.Filter {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.Filter.Sepia>;
							public component1(): number;
							public hashCode(): number;
							public getAmount(): number;
							public equals(other: any): boolean;
							public constructor(amount: number);
							public toString(): string;
							public copy(amount: number): org.nativescript.mason.masonkit.CSSFilters.Filter.Sepia;
						}
					}
					export class FilterHelper {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.FilterHelper>;
						public getSource$masonkit_release(): globalAndroid.graphics.Bitmap;
						public constructor();
						public getShadowsOrBlurs$masonkit_release(): java.util.List<globalAndroid.graphics.Bitmap>;
						public setCssFilter$masonkit_release(value: globalAndroid.graphics.ColorMatrix): void;
						public setSource$masonkit_release(value: globalAndroid.graphics.Bitmap): void;
						public setShadowsOrBlurs$masonkit_release(value: java.util.List<globalAndroid.graphics.Bitmap>): void;
						public getCssFilter$masonkit_release(): globalAndroid.graphics.ColorMatrix;
						public getGetOrInitCssFilter$masonkit_release(): globalAndroid.graphics.ColorMatrix;
						public setGetOrInitCssFilter$masonkit_release(value: globalAndroid.graphics.ColorMatrix): void;
					}
					export module FilterHelper {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.FilterHelper.Companion>;
							public createDropShadowBitmap(cached: globalAndroid.content.Context, value: number, value2: number, value3: number, tempW: number, tempH: number, tempBmp: number, tempCanvas: globalAndroid.graphics.Bitmap, input: globalAndroid.renderscript.RenderScript, output: globalAndroid.graphics.Canvas): globalAndroid.graphics.Bitmap;
							public build(helper: globalAndroid.view.View, pool: java.util.List<any>, source: any): org.nativescript.mason.masonkit.CSSFilters.FilterHelper;
							public createBlurBitmap(config$iv: globalAndroid.content.Context, destroyRS: number, renderScript: number, input: number, output: globalAndroid.graphics.Bitmap, script: globalAndroid.renderscript.RenderScript): globalAndroid.graphics.Bitmap;
						}
					}
					export class FilterHelperV2 {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.FilterHelperV2>;
						public constructor();
						public setCssFilter$masonkit_release(value: globalAndroid.graphics.ColorMatrix): void;
						public getSourceNode$masonkit_release(): globalAndroid.graphics.RenderNode;
						public setSourceFallback$masonkit_release(value: globalAndroid.graphics.Bitmap): void;
						public getCssFilter$masonkit_release(): globalAndroid.graphics.ColorMatrix;
						public getGetOrInitCssFilter$masonkit_release(): globalAndroid.graphics.ColorMatrix;
						public getShadowsOrBlurs$masonkit_release(): java.util.List<org.nativescript.mason.masonkit.CSSFilters.ShadowOrBlur>;
						public getSourceFallback$masonkit_release(): globalAndroid.graphics.Bitmap;
						public setGetOrInitCssFilter$masonkit_release(value: globalAndroid.graphics.ColorMatrix): void;
					}
					export module FilterHelperV2 {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.FilterHelperV2.Companion>;
							public build(_: globalAndroid.view.View, canvas: java.util.List<any>, source: any): org.nativescript.mason.masonkit.CSSFilters.FilterHelperV2;
						}
					}
					export class FilterHelperV3 {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.FilterHelperV3>;
						public constructor();
						public setFilter$masonkit_release(value: globalAndroid.graphics.RenderEffect): void;
						public getFilter$masonkit_release(): globalAndroid.graphics.RenderEffect;
						public getSourceNode$masonkit_release(): globalAndroid.graphics.RenderNode;
						public getShadowNodes$masonkit_release(): java.util.ArrayList<globalAndroid.graphics.RenderNode>;
						public getHasComposite$masonkit_release(): boolean;
						public setShadowNodes$masonkit_release(value: java.util.ArrayList<globalAndroid.graphics.RenderNode>): void;
						public setHasComposite$masonkit_release(value: boolean): void;
						public getCompositeNode$masonkit_release(): globalAndroid.graphics.RenderNode;
					}
					export module FilterHelperV3 {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.FilterHelperV3.Companion>;
							public build(view: globalAndroid.view.View, $this$build_u24lambda_u240: java.util.List<any>, blurEffect: any): org.nativescript.mason.masonkit.CSSFilters.FilterHelperV3;
						}
					}
					export class ShadowOrBlur {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.CSSFilters.ShadowOrBlur>;
						public component1(): globalAndroid.graphics.RenderNode;
						public equals(other: any): boolean;
						public constructor();
						public getShadow(): globalAndroid.graphics.RenderNode;
						public copy(shadow: globalAndroid.graphics.RenderNode, blur: globalAndroid.graphics.Bitmap): org.nativescript.mason.masonkit.CSSFilters.ShadowOrBlur;
						public hashCode(): number;
						public constructor(shadow: globalAndroid.graphics.RenderNode, blur: globalAndroid.graphics.Bitmap);
						public getBlur(): globalAndroid.graphics.Bitmap;
						public component2(): globalAndroid.graphics.Bitmap;
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
				export class ComputedStyle {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.ComputedStyle>;
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
						syncStyle(param0: string, param1: string): void;
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
						invalidateLayout(param0: boolean): void;
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
					public syncStyle(param0: string, param1: string): void;
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
					public invalidateLayout(param0: boolean): void;
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
						public static prepend(element: org.nativescript.mason.masonkit.Element, $this$prepend_u24lambda_u249: string): void;
						public static replaceChildAt(element: org.nativescript.mason.masonkit.Element, $this$replaceChildAt_u24lambda_u2419: string, index: number): void;
						public static append($this: org.nativescript.mason.masonkit.Element, element: org.nativescript.mason.masonkit.Element): void;
						public static invalidateLayout(width: org.nativescript.mason.masonkit.Element, height: boolean): void;
						public static appendView(element: org.nativescript.mason.masonkit.Element, it: androidNative.Array<globalAndroid.view.View>): void;
						public static computeMinContent($this: org.nativescript.mason.masonkit.Element): void;
						public static computeWithViewSize(width: org.nativescript.mason.masonkit.Element): void;
						public static isNodeDirty($this: org.nativescript.mason.masonkit.Element): boolean;
						public static compute($this: org.nativescript.mason.masonkit.Element, width: number, height: number): void;
						public static replaceChildAt($this: org.nativescript.mason.masonkit.Element, element: org.nativescript.mason.masonkit.Element, index: number): void;
						public static prepend(element: org.nativescript.mason.masonkit.Element, it: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
						public static configure($this: org.nativescript.mason.masonkit.Element, block: any): void;
						public static append(element: org.nativescript.mason.masonkit.Element, $this$append_u24lambda_u244: string): void;
						public static removeChildAt($this: org.nativescript.mason.masonkit.Element, index: number): void;
						public static prepend($this: org.nativescript.mason.masonkit.Element, node: org.nativescript.mason.masonkit.Node): void;
						public static computeAndLayout($this: org.nativescript.mason.masonkit.Element): org.nativescript.mason.masonkit.Layout;
						public static compute($this: org.nativescript.mason.masonkit.Element): void;
						public static prepend($this: org.nativescript.mason.masonkit.Element, element: org.nativescript.mason.masonkit.Element): void;
						public static append(element: org.nativescript.mason.masonkit.Element, it: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
						public static addChildAt($this: org.nativescript.mason.masonkit.Element, node: org.nativescript.mason.masonkit.Node, index: number): void;
						public static onNodeAttached($this: org.nativescript.mason.masonkit.Element): void;
						public static computeMaxContent($this: org.nativescript.mason.masonkit.Element): void;
						public static computeWithViewSize($this: org.nativescript.mason.masonkit.Element, layout: boolean): void;
						public static append($this: org.nativescript.mason.masonkit.Element, node: org.nativescript.mason.masonkit.Node): void;
						public static computeWithSize($this: org.nativescript.mason.masonkit.Element, width: number, height: number): void;
						public static replaceChildAt($this: org.nativescript.mason.masonkit.Element, node: org.nativescript.mason.masonkit.Node, index: number): void;
						public static appendView(child: org.nativescript.mason.masonkit.Element, $this: globalAndroid.view.View): void;
						public static prependView(child: org.nativescript.mason.masonkit.Element, $this: globalAndroid.view.View): void;
						public static append(element: org.nativescript.mason.masonkit.Element, it: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
						public static addChildAt($this: org.nativescript.mason.masonkit.Element, element: org.nativescript.mason.masonkit.Element, index: number): void;
						public static addChildAt(element: org.nativescript.mason.masonkit.Element, $this$addChildAt_u24lambda_u2417: string, index: number): void;
						public static syncStyle(element: org.nativescript.mason.masonkit.Element, it: string, state: string): void;
						public static prepend(element: org.nativescript.mason.masonkit.Element, it: androidNative.Array<string>): void;
						public static append(element: org.nativescript.mason.masonkit.Element, it: androidNative.Array<string>): void;
						public static prepend(element: org.nativescript.mason.masonkit.Element, it: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
						public static invalidateLayout($this: org.nativescript.mason.masonkit.Element): void;
					}
				}
			}
		}
	}
}

// declare module org {
// 	export module nativescript {
// 		export module mason {
// 			export module masonkit {
// 				export module ElementKt {
// export module  {
// 					export class WhenMappings {
// 						public static class: java.lang.Class<org.nativescript.mason.masonkit.ElementKt.WhenMappings>;
// 					}
// 				}
// 			}
// 		}
// 	}
// }

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class FontFace {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.FontFace>;
					public getFontFamily(): string;
					public setFontWeight(this_: string): org.nativescript.mason.masonkit.FontFace;
					public setFontDescriptors$masonkit_release(value: org.nativescript.mason.masonkit.FontFace.NSCFontDescriptors): void;
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
					public getOwner$masonkit_release(): org.nativescript.mason.masonkit.Style;
					public setFontDisplay(value: string): org.nativescript.mason.masonkit.FontFace;
					public load(context: globalAndroid.content.Context, callback: any): void;
					public setOwner$masonkit_release(value: org.nativescript.mason.masonkit.Style): void;
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
					public getFontDescriptors$masonkit_release(): org.nativescript.mason.masonkit.FontFace.NSCFontDescriptors;
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
						public setVariantLigatures(value: string): void;
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
						public getVariantLigatures(): string;
						public setDescentOverride(value: string): void;
						public update$masonkit_release(it: string): void;
						public getLineGapOverride(): string;
						public getKerning(): string;
						public getFamily(): string;
						public constructor(family: string);
						public getDisplay(): org.nativescript.mason.masonkit.FontFace.NSCFontDisplay;
						public getAscentOverride(): string;
						public getStretch(): string;
						public setStyle(value: org.nativescript.mason.masonkit.FontFace.NSCFontStyle): void;
						public setKerning(value: string): void;
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
					public check(font: string, check: string): boolean;
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
				export class Gradient {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Gradient>;
					public copy(type: string, direction: string, stops: java.util.List<string>): org.nativescript.mason.masonkit.Gradient;
					public toString(): string;
					public component1(): string;
					public component2(): string;
					public getDirection(): string;
					public equals(other: any): boolean;
					public component3(): java.util.List<string>;
					public getStops(): java.util.List<string>;
					public constructor(type: string, direction: string, stops: java.util.List<string>);
					public getType(): string;
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
				export abstract class GridPlacement {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.GridPlacement>;
					public getCssValue(): string;
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
					export class NamedLine extends org.nativescript.mason.masonkit.GridPlacement {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.GridPlacement.NamedLine>;
						public component2(): number;
						public getLine(): number;
						public equals(other: any): boolean;
						public component1(): string;
						public hashCode(): number;
						public setLine(value: number): void;
						public copy(name: string, line: number): org.nativescript.mason.masonkit.GridPlacement.NamedLine;
						public setName(value: string): void;
						public constructor(name: string, line: number);
						public getName(): string;
						public toString(): string;
					}
					export class NamedSpan extends org.nativescript.mason.masonkit.GridPlacement {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.GridPlacement.NamedSpan>;
						public getSpan(): number;
						public component2(): number;
						public equals(other: any): boolean;
						public component1(): string;
						public hashCode(): number;
						public copy(name: string, span: number): org.nativescript.mason.masonkit.GridPlacement.NamedSpan;
						public setName(value: string): void;
						public getName(): string;
						public setSpan(value: number): void;
						public constructor(name: string, span: number);
						public toString(): string;
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
				export class GridState {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.GridState>;
					public getGridColumn(): string;
					public setGridColumnEnd(value: string): void;
					public setGridColumnStart(value: string): void;
					public setGridRow(value: string): void;
					public getGridAutoRows(): string;
					public getGridTemplateRows(): string;
					public getGridRow(): string;
					public getGridRowEnd(): string;
					public constructor();
					public getGridRowStart(): string;
					public clear(): void;
					public setGridAutoRows(value: string): void;
					public getGridColumnStart(): string;
					public getGridArea(): string;
					public setGridTemplateRows(value: string): void;
					public setGridColumn(value: string): void;
					public setGridArea(value: string): void;
					public getGridTemplateColumns(): string;
					public getGridTemplateAreas(): string;
					public setGridRowStart(value: string): void;
					public setGridTemplateColumns(value: string): void;
					public setGridRowEnd(value: string): void;
					public getGridAutoColumns(): string;
					public setGridAutoColumns(value: string): void;
					public setGridTemplateAreas(value: string): void;
					public getGridColumnEnd(): string;
				}
			}
		}
	}
}

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class GridStateKeys {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.GridStateKeys>;
					public static "equals-impl"(arg0: number, other: any): boolean;
					public static "constructor-impl"(bits: number): number;
					public toString(): string;
					public static "or-lVilzWI"(arg0: number, other: number): number;
					public static "equals-impl0"(p1: number, p2: number): boolean;
					public equals(other: any): boolean;
					public static "toString-impl"(arg0: number): string;
					public static "hashCode-impl"(arg0: number): number;
					public static "hasFlag-Hm63_aQ"(arg0: number, flag: number): boolean;
					public static "and-lVilzWI"(arg0: number, other: number): number;
					public hashCode(): number;
					public getBits(): number;
				}
				export module GridStateKeys {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.GridStateKeys.Companion>;
						public "getGridRowEnd-8t4EpgM"(): number;
						public "getGridAutoRows-8t4EpgM"(): number;
						public "getGridTemplateAreas-8t4EpgM"(): number;
						public "getGridColumnEnd-8t4EpgM"(): number;
						public "getGridAutoColumns-8t4EpgM"(): number;
						public "getGridRowStart-8t4EpgM"(): number;
						public "getGridColumnStart-8t4EpgM"(): number;
						public "getGridTemplateRows-8t4EpgM"(): number;
						public "getGridTemplateColumns-8t4EpgM"(): number;
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
				export abstract class GridTemplate {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.GridTemplate>;
					public getCssValue(): string;
					public isRepeating(): boolean;
				}
				export module GridTemplate {
					export class AutoRepeat extends org.nativescript.mason.masonkit.GridTemplate {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.GridTemplate.AutoRepeat>;
						public component1(): org.nativescript.mason.masonkit.GridTrackRepetition;
						public equals(other: any): boolean;
						public component2(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
						public getGridTrackRepetition(): org.nativescript.mason.masonkit.GridTrackRepetition;
						public hashCode(): number;
						public gridTrackRepetitionNativeType(): number;
						public getLineNames(): androidNative.Array<androidNative.Array<string>>;
						public toString(): string;
						public copy(gridTrackRepetition: org.nativescript.mason.masonkit.GridTrackRepetition, value: androidNative.Array<org.nativescript.mason.masonkit.MinMax>, lineNames: androidNative.Array<androidNative.Array<string>>): org.nativescript.mason.masonkit.GridTemplate.AutoRepeat;
						public component3(): androidNative.Array<androidNative.Array<string>>;
						public constructor(gridTrackRepetition: org.nativescript.mason.masonkit.GridTrackRepetition, value: androidNative.Array<org.nativescript.mason.masonkit.MinMax>, lineNames: androidNative.Array<androidNative.Array<string>>);
						public getValue(): androidNative.Array<org.nativescript.mason.masonkit.MinMax>;
						public getCssValue(): string;
						public gridTrackRepetitionNativeValue(): number;
					}
					export class Single extends org.nativescript.mason.masonkit.GridTemplate {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.GridTemplate.Single>;
						public constructor(value: org.nativescript.mason.masonkit.MinMax, lineNames: androidNative.Array<string>);
						public equals(other: any): boolean;
						public getLineNames(): androidNative.Array<string>;
						public copy(value: org.nativescript.mason.masonkit.MinMax, lineNames: androidNative.Array<string>): org.nativescript.mason.masonkit.GridTemplate.Single;
						public hashCode(): number;
						public component2(): androidNative.Array<string>;
						public component1(): org.nativescript.mason.masonkit.MinMax;
						public getValue(): org.nativescript.mason.masonkit.MinMax;
						public getCssValue(): string;
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
					public syncStyle(state: string, textState: string): void;
					public getMImgMatrix$masonkit_release(): globalAndroid.graphics.Matrix;
					public append(param0: org.nativescript.mason.masonkit.Element): void;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public append(param0: org.nativescript.mason.masonkit.Node): void;
					public prependView(view: globalAndroid.view.View): void;
					public replaceChildAt(param0: string, param1: number): void;
					public replaceChildAt(text: string, index: number): void;
					public prepend(param0: org.nativescript.mason.masonkit.Node): void;
					public computeMinContent(): void;
					public computeAndLayout(): org.nativescript.mason.masonkit.Layout;
					public getDstF(): globalAndroid.graphics.RectF;
					public compute(): void;
					public onDraw(dx: globalAndroid.graphics.Canvas): void;
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
					public prepend(param0: string): void;
					public compute(width: number, height: number): void;
					public getSrcF(): globalAndroid.graphics.RectF;
					public setSrc(it: string): void;
					public computeWithMinContent(): void;
					public isNodeDirty(): boolean;
					public prepend(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public invalidateLayout(param0: boolean): void;
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
					public syncStyle(param0: string, param1: string): void;
					public addChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public configure(block: any): void;
					public setImageBitmap(bm: globalAndroid.graphics.Bitmap): void;
					public append(element: org.nativescript.mason.masonkit.Element): void;
					public replaceChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public getCurrentBitmap$masonkit_release(): globalAndroid.graphics.Bitmap;
					public invalidateLayout(invalidateRoot: boolean): void;
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
				export module Img {
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Img.WhenMappings>;
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
				export abstract class InlineSegment {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.InlineSegment>;
				}
				export module InlineSegment {
					export class Br extends org.nativescript.mason.masonkit.InlineSegment {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.InlineSegment.Br>;
						public constructor();
						public equals(o: any): boolean;
						public toString(): string;
					}
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
				export class Input implements org.nativescript.mason.masonkit.Element, org.nativescript.mason.masonkit.MeasureFunc {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Input>;
					public computeMaxContent(): void;
					public getCheckBoxInput$masonkit_release(): globalAndroid.widget.CheckBox;
					public layout(): org.nativescript.mason.masonkit.Layout;
					public computeWithViewSize(layout: boolean): void;
					public getSize(): number;
					public setMaxLength(value: number): void;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public prependView(view: globalAndroid.view.View): void;
					public measure(width: org.nativescript.mason.masonkit.Size<java.lang.Float>, height: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
					public replaceChildAt(param0: string, param1: number): void;
					public getDateInput$masonkit_release(): org.nativescript.mason.masonkit.Input.DateInput;
					public replaceChildAt(text: string, index: number): void;
					public prepend(param0: org.nativescript.mason.masonkit.Node): void;
					public computeMinContent(): void;
					public compute(): void;
					public getPlaceholder(): string;
					public prepend(param0: org.nativescript.mason.masonkit.Element): void;
					public prepend(param0: androidNative.Array<string>): void;
					public removeChildAt(index: number): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public prependView(param0: globalAndroid.view.View): void;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public appendView(views: androidNative.Array<globalAndroid.view.View>): void;
					public compute(param0: number, param1: number): void;
					public addChildAt(text: string, index: number): void;
					public prepend(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public compute(width: number, height: number): void;
					public isNodeDirty(): boolean;
					public computeWithMinContent(): void;
					public invalidateLayout(param0: boolean): void;
					public append(texts: androidNative.Array<string>): void;
					public constructor(context: globalAndroid.content.Context);
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet, override: boolean);
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet);
					public onNodeAttached(): void;
					public onNodeDetached(): void;
					public append(node: org.nativescript.mason.masonkit.Node): void;
					public markNodeDirty(): void;
					public prepend(element: org.nativescript.mason.masonkit.Element): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public getRadioInput$masonkit_release(): globalAndroid.widget.RadioButton;
					public setSize(value: number): void;
					public syncStyle(param0: string, param1: string): void;
					public addChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public dispatchDraw(canvas: globalAndroid.graphics.Canvas): void;
					public replaceChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public invalidateLayout(invalidateRoot: boolean): void;
					public append(text: string): void;
					public addChildAt(param0: string, param1: number): void;
					public appendView(param0: globalAndroid.view.View): void;
					public computeWithSize(param0: number, param1: number): void;
					public getName(): string;
					public append(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public append(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public getMaxLength(): number;
					public prependView(param0: androidNative.Array<globalAndroid.view.View>): void;
					public constructor(context: globalAndroid.content.Context, mason: org.nativescript.mason.masonkit.Mason);
					public getView(): globalAndroid.view.View;
					public configure(param0: any): void;
					public replaceChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public addChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public getStyle(): org.nativescript.mason.masonkit.Style;
					public removeChildAt(param0: number): void;
					public constructor(context: globalAndroid.content.Context, mason: org.nativescript.mason.masonkit.Mason, type: org.nativescript.mason.masonkit.Input.Type);
					public syncStyle(state: string, textState: string): void;
					public append(param0: org.nativescript.mason.masonkit.Element): void;
					public append(param0: org.nativescript.mason.masonkit.Node): void;
					public setType(value: org.nativescript.mason.masonkit.Input.Type): void;
					public onSizeChanged(it: number, element$iv: number, $i$f$forEach: number, $this$forEach$iv: number): void;
					public computeAndLayout(): org.nativescript.mason.masonkit.Layout;
					public invalidateLayout(): void;
					public computeWithViewSize(param0: boolean): void;
					public measure(param0: org.nativescript.mason.masonkit.Size<java.lang.Float>, param1: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
					public setValue(value: string): void;
					public appendView(view: globalAndroid.view.View): void;
					public prepend(param0: string): void;
					public layoutChild$masonkit_release(height: number, this_: number, l: number, t: number): void;
					public prepend(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public setPlaceholder(value: string): void;
					public computeAndLayout(width: number, height: number): org.nativescript.mason.masonkit.Layout;
					public computeAndLayout(param0: number, param1: number): org.nativescript.mason.masonkit.Layout;
					public getType(): org.nativescript.mason.masonkit.Input.Type;
					public setName(value: string): void;
					public addChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public attachAndApply(): void;
					public computeWithViewSize(): void;
					public computeWithMaxContent(): void;
					public getValue(): string;
					public prepend(node: org.nativescript.mason.masonkit.Node): void;
					public append(param0: androidNative.Array<string>): void;
					public getTextInput$masonkit_release(): globalAndroid.widget.EditText;
					public getButtonInput$masonkit_release(): org.nativescript.mason.masonkit.Button;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public configure(block: any): void;
					public append(element: org.nativescript.mason.masonkit.Element): void;
					public prepend(strings: androidNative.Array<string>): void;
					public prepend(string: string): void;
					public prependView(views: androidNative.Array<globalAndroid.view.View>): void;
					public addChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public getNode(): org.nativescript.mason.masonkit.Node;
					public computeWithSize(width: number, height: number): void;
					public append(param0: string): void;
					public appendView(param0: androidNative.Array<globalAndroid.view.View>): void;
				}
				export module Input {
					export class DateInput {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Input.DateInput>;
						public onMeasure(child: number, element$iv: number): void;
						public getYearInput$masonkit_release(): globalAndroid.widget.EditText;
						public setValue(this_: string): void;
						public onLayout(right: boolean, child: number, element$iv: number, $i$f$forEach: number, $this$forEach$iv: number): void;
						public getDayInput$masonkit_release(): globalAndroid.widget.EditText;
						public getValue(): string;
						public constructor(it: globalAndroid.content.Context);
						public getMonthInput$masonkit_release(): globalAndroid.widget.EditText;
					}
					export class InputEditText {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Input.InputEditText>;
						public getInput$masonkit_release(): org.nativescript.mason.masonkit.Input;
						public onDraw(offset: globalAndroid.graphics.Canvas): void;
						public constructor($this$cursorPaint_u24lambda_u240: globalAndroid.content.Context, this_: globalAndroid.util.AttributeSet);
						public setInput$masonkit_release(value: org.nativescript.mason.masonkit.Input): void;
						public isSuggestionsEnabled(): boolean;
						public onAttachedToWindow(): void;
						public onDetachedFromWindow(): void;
						public constructor(context: globalAndroid.content.Context);
					}
					export class Type {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Input.Type>;
						public static Text: org.nativescript.mason.masonkit.Input.Type;
						public static Button: org.nativescript.mason.masonkit.Input.Type;
						public static Checkbox: org.nativescript.mason.masonkit.Input.Type;
						public static Email: org.nativescript.mason.masonkit.Input.Type;
						public static Password: org.nativescript.mason.masonkit.Input.Type;
						public static Date: org.nativescript.mason.masonkit.Input.Type;
						public static Radio: org.nativescript.mason.masonkit.Input.Type;
						public static Number: org.nativescript.mason.masonkit.Input.Type;
						public static getEntries(): any;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.Input.Type>;
						public static valueOf(value: string): org.nativescript.mason.masonkit.Input.Type;
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Input.WhenMappings>;
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
					public getBaseline(): number;
					public component8(): org.nativescript.mason.masonkit.Rect<java.lang.Float>;
					public toString(): string;
					public getOrder(): number;
					public component4(): number;
					public setBaseline$masonkit_release(value: number): void;
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
					public static from(value: org.nativescript.mason.masonkit.LengthPercentage): org.nativescript.mason.masonkit.LengthPercentage;
					public getJsonValue(): string;
				}
				export module LengthPercentage {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentage.Companion>;
						public from(value: org.nativescript.mason.masonkit.LengthPercentage): org.nativescript.mason.masonkit.LengthPercentage;
						public fromTypeValue(type: number, value: number): org.nativescript.mason.masonkit.LengthPercentage;
					}
					export class Percent extends org.nativescript.mason.masonkit.LengthPercentage {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentage.Percent>;
						public equals(other: any): boolean;
						public constructor(percentage: number);
						public getPercentage(): number;
						public copy(percentage: number): org.nativescript.mason.masonkit.LengthPercentage.Percent;
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
					}
					export class Zero extends org.nativescript.mason.masonkit.LengthPercentage {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.LengthPercentage.Zero>;
						public static INSTANCE: org.nativescript.mason.masonkit.LengthPercentage.Zero;
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
					public createTextView(context: globalAndroid.content.Context, type: org.nativescript.mason.masonkit.enums.TextType): org.nativescript.mason.masonkit.TextView;
					public createImageNode($this$createImageNode_u24lambda_u2413: org.nativescript.mason.masonkit.MeasureFunc): org.nativescript.mason.masonkit.Node;
					public createNode(children: androidNative.Array<org.nativescript.mason.masonkit.Node>): org.nativescript.mason.masonkit.Node;
					public nodeForView($this$nodeForView_u24lambda_u2415_u24lambda_u2414: globalAndroid.view.View): org.nativescript.mason.masonkit.Node;
					public createTextView(context: globalAndroid.content.Context, type: org.nativescript.mason.masonkit.enums.TextType, isAnonymous: boolean): org.nativescript.mason.masonkit.TextView;
					public createTextNode(children: androidNative.Array<org.nativescript.mason.masonkit.Node>): org.nativescript.mason.masonkit.Node;
					public constructor();
					public styleForViewOrNode(view: any): org.nativescript.mason.masonkit.Style;
					public clear(): void;
					public createNode($this$createNode_u24lambda_u245: org.nativescript.mason.masonkit.MeasureFunc, func: boolean): org.nativescript.mason.masonkit.Node;
					public createScrollView(context: globalAndroid.content.Context): org.nativescript.mason.masonkit.Scroll;
					public createTextView(context: globalAndroid.content.Context): org.nativescript.mason.masonkit.TextView;
					public setDeviceScale(value: number): void;
					public createInput(context: globalAndroid.content.Context, type: org.nativescript.mason.masonkit.Input.Type): org.nativescript.mason.masonkit.Input;
					public requestLayout(node: number): void;
					public createButton(context: globalAndroid.content.Context): org.nativescript.mason.masonkit.Button;
					public getNodes$masonkit_release(): java.util.WeakHashMap<java.lang.Long,org.nativescript.mason.masonkit.Node>;
					public requestLayout(view: globalAndroid.view.View): void;
					public printTree(node: org.nativescript.mason.masonkit.Node): void;
					public createView(context: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
					public createImageView(context: globalAndroid.content.Context): org.nativescript.mason.masonkit.Img;
					public configureStyleForView(this_: globalAndroid.view.View, view: any): void;
					public createTextNode(): org.nativescript.mason.masonkit.Node;
					public getNativePtr$masonkit_release(): number;
					public createTextNode(map: androidNative.Array<org.nativescript.mason.masonkit.Node>, item$iv$iv: boolean): org.nativescript.mason.masonkit.Node;
					public getScale(): number;
					public createNode(it: androidNative.Array<org.nativescript.mason.masonkit.Node>, item$iv$iv: boolean): org.nativescript.mason.masonkit.Node;
					public getNativePtr(): number;
					public createBr(): org.nativescript.mason.masonkit.Node;
					public styleForView(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Style;
					public createInput(context: globalAndroid.content.Context): org.nativescript.mason.masonkit.Input;
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
					public getChildCount(): number;
					public setAnonymous$masonkit_release(value: boolean): void;
					public finalize(): void;
					public getMason$masonkit_release(): org.nativescript.mason.masonkit.Mason;
					public getMeasureFunc$masonkit_release(): org.nativescript.mason.masonkit.MeasureFunc;
					public setChildren$masonkit_release(value: java.util.ArrayList<org.nativescript.mason.masonkit.Node>): void;
					public getStyle$masonkit_release(): org.nativescript.mason.masonkit.Style;
					public replaceChildAt(it: org.nativescript.mason.masonkit.Node, index: number): void;
					public getParentElement(): org.nativescript.mason.masonkit.Element;
					public appendChild(it: org.nativescript.mason.masonkit.Node): void;
					public getAttributes$masonkit_release(): org.nativescript.mason.masonkit.TextDefaultAttributes;
					public setSuppressChildOps$masonkit_release(value: number): void;
					public removeMeasureFunction(): void;
					public getChildAt(index: number): org.nativescript.mason.masonkit.Node;
					public getComputeCache(): any;
					public setMeasureFunction(measure: org.nativescript.mason.masonkit.MeasureFunc): void;
					public getAvailableHeight$masonkit_release(): java.lang.Float;
					public isPlaceholder$masonkit_release(): boolean;
					public removeChildAt(it: number): org.nativescript.mason.masonkit.Node;
					public getChildren$masonkit_release(): java.util.ArrayList<org.nativescript.mason.masonkit.Node>;
					public getLayoutParent$masonkit_release(): org.nativescript.mason.masonkit.Node;
					public getParent(): org.nativescript.mason.masonkit.Node;
					public getDocument$masonkit_release(): org.nativescript.mason.masonkit.Document;
					public setDocument$masonkit_release(value: org.nativescript.mason.masonkit.Document): void;
					public getType(): org.nativescript.mason.masonkit.NodeType;
					public constructor(mason: org.nativescript.mason.masonkit.Mason, nativePtr: number, nodeType: org.nativescript.mason.masonkit.NodeType);
					public getOverflowHeight$masonkit_release(): number;
					public setImage$masonkit_release(value: boolean): void;
					public addChildAt(it: org.nativescript.mason.masonkit.Node, index: number): void;
					public setComputeCacheDirty$masonkit_release(value: boolean): void;
					public setAvailableHeight$masonkit_release(value: java.lang.Float): void;
					public getKnownHeight$masonkit_release(): java.lang.Float;
					public setKnownWidth$masonkit_release(value: java.lang.Float): void;
					public isAnonymous$masonkit_release(): boolean;
					public getCachedWidth$masonkit_release(): number;
					public getOverflowWidth$masonkit_release(): number;
					public setComputedSize(width: number, height: number): void;
					public removeChild(it: org.nativescript.mason.masonkit.Node): org.nativescript.mason.masonkit.Node;
					public setPlaceholder$masonkit_release(value: boolean): void;
					public setLayoutParent$masonkit_release(value: org.nativescript.mason.masonkit.Node): void;
					public setCachedHeight$masonkit_release(value: number): void;
					public getView(): any;
					public isDirty(): boolean;
					public setCachedWidth$masonkit_release(value: number): void;
					public setType$masonkit_release(value: org.nativescript.mason.masonkit.NodeType): void;
					public getCachedHeight$masonkit_release(): number;
					public setNativePtr$masonkit_release(value: number): void;
					public setParent$masonkit_release(value: org.nativescript.mason.masonkit.Node): void;
					public setDefaultMeasureFunction$masonkit_release(): void;
					public setOverflowHeight$masonkit_release(value: number): void;
					public suppressChildOperations$masonkit_release(this_: any): any;
					public setKnownHeight$masonkit_release(value: java.lang.Float): void;
					public setComputedLayout$masonkit_release(value: org.nativescript.mason.masonkit.Layout): void;
					public getSuppressChildOps$masonkit_release(): number;
					public appendChild(this_: globalAndroid.view.View): void;
					public getRootNode(): org.nativescript.mason.masonkit.Node;
					public setOverflowWidth$masonkit_release(value: number): void;
					public setMeasureFunc$masonkit_release(value: org.nativescript.mason.masonkit.MeasureFunc): void;
					public getOrCreateAnonymousTextContainer$masonkit_release($i$f$suppressChildOperations$masonkit_release: boolean, this_$iv: boolean): org.nativescript.mason.masonkit.Node;
					public getLayoutChildren(): java.util.List<org.nativescript.mason.masonkit.Node>;
					public getComputeCacheDirty$masonkit_release(): boolean;
					public isImage$masonkit_release(): boolean;
					public getOnNodeAttached(): any;
					public getOnNodeDetached(): any;
					public getOrCreateAnonymousInlineContainer$masonkit_release(container: boolean, this_: boolean): org.nativescript.mason.masonkit.Node;
					public removeChildren(): void;
					public setOnNodeDetached(value: any): void;
					public setAvailableWidth$masonkit_release(value: java.lang.Float): void;
					public getAvailableWidth$masonkit_release(): java.lang.Float;
					public setComputeCache(value: any): void;
					public dirty(): void;
					public getComputedLayout(): org.nativescript.mason.masonkit.Layout;
					public getKnownWidth$masonkit_release(): java.lang.Float;
					public setOnNodeAttached(value: any): void;
					public getParentNode(): org.nativescript.mason.masonkit.Node;
					public getChildren(): java.util.List<org.nativescript.mason.masonkit.Node>;
					public getNativePtr$masonkit_release(): number;
					public setView(value: any): void;
					public getNativePtr(): number;
				}
				export module Node {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Node.Companion>;
						public invalidateDescendantTextViews$masonkit_release(size: org.nativescript.mason.masonkit.Node, this_: number): void;
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
					public getGridAutoColumns(this_: globalAndroid.view.View): string;
					public setGridColumnStart(this_: globalAndroid.view.View, view: string): void;
					public getAlignSelf(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.enums.AlignSelf;
					public getSizeCssValue(this_: globalAndroid.view.View): string;
					public setAspectRatio(this_: globalAndroid.view.View, view: java.lang.Float): void;
					public setBorderWidth(this_: globalAndroid.view.View, view: number, left: number, top: number, right: number): void;
					public setMaxSize(this_: globalAndroid.view.View, view: number, width: number, widthType: number, height: number): void;
					public getBackgroundImage(this_: globalAndroid.view.View): string;
					public getInsetRight(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getMaxSize(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public getAlignItems(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.enums.AlignItems;
					public getMinSizeWidth(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Dimension;
					public getGridColumn(this_: globalAndroid.view.View): string;
					public setGridRowEnd(this_: globalAndroid.view.View, view: string): void;
					public getFilter(this_: globalAndroid.view.View): string;
					public longRunningFunction(): number;
					public setBackground(this_: globalAndroid.view.View, view: string): void;
					public setOverflow(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.enums.Overflow>): void;
					public getBackgroundColor(this_: globalAndroid.view.View): string;
					public getBorderWidth(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public setPosition(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.enums.Position): void;
					public getSizeWidth(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Dimension;
					public setGridColumnEnd(this_: globalAndroid.view.View, view: string): void;
					public setPaddingRight(this_: globalAndroid.view.View, view: number, value: number): void;
					public setGapRow(view: globalAndroid.view.View, value: number, type: number): void;
					public getBorderWidthCssValue(this_: globalAndroid.view.View): string;
					public setGridRow(this_: globalAndroid.view.View, view: string): void;
					public configure(view: globalAndroid.view.View, block: any): void;
					public setFlexWrap(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.enums.FlexWrap): void;
					public setRowGap(this_: globalAndroid.view.View, view: number, value: number): void;
					public setSizeHeight(this_: globalAndroid.view.View, view: number, value: number): void;
					public getBorderBottomWidth(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public setMinSizeWidth(this_: globalAndroid.view.View, view: number, value: number): void;
					public getScrollBarWidth(this_: globalAndroid.view.View): number;
					public getGridTemplateAreas(this_: globalAndroid.view.View): string;
					public getMaxSizeHeight(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Dimension;
					public setBorderWidth(borderWidth: globalAndroid.view.View, this_: number, view: number, left: number, leftType: number, top: number, topType: number, right: number, rightType: number): void;
					public setTextShadow(this_: globalAndroid.view.View, view: string): void;
					public setPaddingTop(this_: globalAndroid.view.View, view: number, value: number): void;
					public setPaddingWithValueType(this_: globalAndroid.view.View, view: number, value: number): void;
					public setInsetRight(this_: globalAndroid.view.View, view: number, value: number): void;
					public getViews(): java.util.ArrayList<org.nativescript.mason.masonkit.View>;
					public getSizeJsonValue(this_: globalAndroid.view.View): string;
					public getGridColumnStart(this_: globalAndroid.view.View): string;
					public setMarginBottom(this_: globalAndroid.view.View, view: number, value: number): void;
					public getSize(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public setPaddingLeft(this_: globalAndroid.view.View, view: number, value: number): void;
					public setBorderTopWidth(this_: globalAndroid.view.View, view: number, value: number): void;
					public setBorderWithValueType(this_: globalAndroid.view.View, view: number, value: number): void;
					public getInsetCssValue(this_: globalAndroid.view.View): string;
					public setDisplay(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.enums.Display): void;
					public setFilter(this_: globalAndroid.view.View, view: string): void;
					public setBackgroundColor(this_: globalAndroid.view.View, view: string): void;
					public setBackgroundImage(this_: globalAndroid.view.View, view: string): void;
					public getMaxSizeJsonValue(this_: globalAndroid.view.View): string;
					public getOverflowY(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.enums.Overflow;
					public setInset(this_: globalAndroid.view.View, view: number, left: number, leftType: number, top: number, topType: number, right: number, rightType: number, bottom: number): void;
					public setMargin(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.LengthPercentageAuto, left: org.nativescript.mason.masonkit.LengthPercentageAuto, top: org.nativescript.mason.masonkit.LengthPercentageAuto, right: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
					public getInsetLeft(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getGapColumn(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public setAlignItems(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.enums.AlignItems): void;
					public setGridTemplateRows(this_: globalAndroid.view.View, view: string): void;
					public setBorderWidth(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.LengthPercentage, left: org.nativescript.mason.masonkit.LengthPercentage, top: org.nativescript.mason.masonkit.LengthPercentage, right: org.nativescript.mason.masonkit.LengthPercentage): void;
					public setGridTemplateAreas(this_: globalAndroid.view.View, view: string): void;
					public getStylePaddingTop(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public setGridTemplateColumns(this_: globalAndroid.view.View, view: string): void;
					public setDirection(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.enums.Direction): void;
					public getPaddingJsonValue(this_: globalAndroid.view.View): string;
					public setMargin(this_: globalAndroid.view.View, view: number, left: number, top: number, right: number): void;
					public setFlexBasis(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension): void;
					public getFlexWrap(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.enums.FlexWrap;
					public getBorderTopWidth(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public getGridAutoFlow(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.enums.GridAutoFlow;
					public setFlexDirection(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.enums.FlexDirection): void;
					public setOverflowX(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.enums.Overflow): void;
					public setJustifySelf(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.enums.JustifySelf): void;
					public setGapColumn(view: globalAndroid.view.View, value: number, type: number): void;
					public setFlexGrow(this_: globalAndroid.view.View, view: number): void;
					public setScrollBarWidth(this_: globalAndroid.view.View, view: number): void;
					public getBorderWidthJsonValue(this_: globalAndroid.view.View): string;
					public setBorderBottomWidth(this_: globalAndroid.view.View, view: number, value: number): void;
					public getFlexDirection(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.enums.FlexDirection;
					public constructor(mason: org.nativescript.mason.masonkit.Mason);
					public setJustifyContent(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.enums.JustifyContent): void;
					public getStylePaddingBottom(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public setMaxSize(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension, width: org.nativescript.mason.masonkit.Dimension): void;
					public setMinSize(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension, width: org.nativescript.mason.masonkit.Dimension): void;
					public getDisplay(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.enums.Display;
					public setColumnGap(this_: globalAndroid.view.View, view: number, value: number): void;
					public getSizeHeight(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Dimension;
					public batchCreateViews(this_: globalAndroid.content.Context): void;
					public setPaddingBottom(this_: globalAndroid.view.View, view: number, value: number): void;
					public getGridTemplateColumns(this_: globalAndroid.view.View): string;
					public setPadding(this_: globalAndroid.view.View, view: number, left: number, top: number, right: number): void;
					public getMarginRight(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getOverflowX(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.enums.Overflow;
					public getMinSizeHeight(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Dimension;
					public setAlignContent(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.enums.AlignContent): void;
					public getFlexGrow(this_: globalAndroid.view.View): number;
					public setSizeWidth(this_: globalAndroid.view.View, view: number, value: number): void;
					public setInsetBottom(this_: globalAndroid.view.View, view: number, value: number): void;
					public getMinSize(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public setMinSizeHeight(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension): void;
					public getBackground(this_: globalAndroid.view.View): string;
					public getGridArea(this_: globalAndroid.view.View): string;
					public getJustifyItems(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.enums.JustifyItems;
					public getMarginLeft(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setBorderRadius(this_: globalAndroid.view.View, view: string): void;
					public setMarginTop(this_: globalAndroid.view.View, view: number, value: number): void;
					public getTextAlign(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.enums.TextAlign;
					public getGridRowEnd(this_: globalAndroid.view.View): string;
					public setGap(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.LengthPercentage, row: org.nativescript.mason.masonkit.LengthPercentage): void;
					public setSize(this_: globalAndroid.view.View, view: number, width: number): void;
					public getMinSizeCssValue(this_: globalAndroid.view.View): string;
					public setTextAlign(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.enums.TextAlign): void;
					public getPadding(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public setSize(this_: globalAndroid.view.View, view: number, width: number, widthType: number, height: number): void;
					public getGapRow(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public getFlexShrink(this_: globalAndroid.view.View): number;
					public setMargin(this_: globalAndroid.view.View, view: number, left: number, leftType: number, top: number, topType: number, right: number, rightType: number, bottom: number): void;
					public setGap(this_: globalAndroid.view.View, view: number, width: number): void;
					public setPadding(this_: globalAndroid.view.View, view: number, left: number, leftType: number, top: number, topType: number, right: number, rightType: number, bottom: number): void;
					public setInsetTop(this_: globalAndroid.view.View, view: number, value: number): void;
					public static getShared(): org.nativescript.mason.masonkit.NodeHelper;
					public getOverflow(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.enums.Overflow>;
					public getDirection(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.enums.Direction;
					public getStylePaddingRight(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public setBorderRightWidth(this_: globalAndroid.view.View, view: number, value: number): void;
					public setGridColumn(this_: globalAndroid.view.View, view: string): void;
					public getMaxSizeCssValue(this_: globalAndroid.view.View): string;
					public getGridRowStart(this_: globalAndroid.view.View): string;
					public getGap(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>;
					public setMaxSizeHeight(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension): void;
					public getFlexBasis(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Dimension;
					public getMason(): org.nativescript.mason.masonkit.Mason;
					public getMinSizeJsonValue(this_: globalAndroid.view.View): string;
					public getInsetBottom(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getAspectRatio(this_: globalAndroid.view.View): java.lang.Float;
					public getPaddingCssValue(this_: globalAndroid.view.View): string;
					public getJustifySelf(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.enums.JustifySelf;
					public setFlexShrink(this_: globalAndroid.view.View, view: number): void;
					public setSizeWidth(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension): void;
					public setGridRowStart(this_: globalAndroid.view.View, view: string): void;
					public setMaxSizeWidth(this_: globalAndroid.view.View, view: number, value: number): void;
					public setPadding(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.LengthPercentage, left: org.nativescript.mason.masonkit.LengthPercentage, top: org.nativescript.mason.masonkit.LengthPercentage, right: org.nativescript.mason.masonkit.LengthPercentage): void;
					public getBorderLeftWidth(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public getGridColumnEnd(this_: globalAndroid.view.View): string;
					public setMinSizeWidth(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension): void;
					public getJustifyContent(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.enums.JustifyContent;
					public setMaxSize(this_: globalAndroid.view.View, view: number, width: number): void;
					public getMarginJsonValue(this_: globalAndroid.view.View): string;
					public setFlexBasis(this_: globalAndroid.view.View, view: number, value: number): void;
					public getInsetTop(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getStylePaddingLeft(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public getBorderRightWidth(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentage;
					public getMarginCssValue(this_: globalAndroid.view.View): string;
					public logPerf(time: number): void;
					public getGridAutoRows(this_: globalAndroid.view.View): string;
					public setGridAutoFlow(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.enums.GridAutoFlow): void;
					public getTextShadow(this_: globalAndroid.view.View): string;
					public getInsetJsonValue(this_: globalAndroid.view.View): string;
					public setMinSize(this_: globalAndroid.view.View, view: number, width: number): void;
					public getGridTemplateRows(this_: globalAndroid.view.View): string;
					public setMinSizeHeight(this_: globalAndroid.view.View, view: number, value: number): void;
					public getBorderRadius(this_: globalAndroid.view.View): string;
					public getMarginBottom(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setBorderLeftWidth(this_: globalAndroid.view.View, view: number, value: number): void;
					public setOverflowY(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.enums.Overflow): void;
					public getMarginTop(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setInsetWithValueType(this_: globalAndroid.view.View, view: number, value: number): void;
					public setMaxSizeWidth(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension): void;
					public setInsetLeft(this_: globalAndroid.view.View, view: number, value: number): void;
					public getMargin(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public getBoxSizing(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.enums.BoxSizing;
					public setGridAutoRows(this_: globalAndroid.view.View, view: string): void;
					public getBorder(this_: globalAndroid.view.View): string;
					public setAlignSelf(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.enums.AlignSelf): void;
					public setMaxSizeHeight(this_: globalAndroid.view.View, view: number, value: number): void;
					public setMinSize(this_: globalAndroid.view.View, view: number, width: number, widthType: number, height: number): void;
					public setSize(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.Dimension, width: org.nativescript.mason.masonkit.Dimension): void;
					public setMarginRight(this_: globalAndroid.view.View, view: number, value: number): void;
					public getInset(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public getMaxSizeWidth(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.Dimension;
					public setJustifyItems(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.enums.JustifyItems): void;
					public getPosition(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.enums.Position;
					public getAlignContent(this_: globalAndroid.view.View): org.nativescript.mason.masonkit.enums.AlignContent;
					public setMarginWithValueType(this_: globalAndroid.view.View, view: number, value: number): void;
					public setTextAlign(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.enums.BoxSizing): void;
					public setGridArea(this_: globalAndroid.view.View, view: string): void;
					public getGridRow(this_: globalAndroid.view.View): string;
					public setMarginLeft(this_: globalAndroid.view.View, view: number, value: number): void;
					public setBorder(this_: globalAndroid.view.View, view: string): void;
					public setPosition(this_: globalAndroid.view.View, view: number, left: number, top: number, right: number): void;
					public setPosition(this_: globalAndroid.view.View, view: org.nativescript.mason.masonkit.LengthPercentageAuto, left: org.nativescript.mason.masonkit.LengthPercentageAuto, top: org.nativescript.mason.masonkit.LengthPercentageAuto, right: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
					public setGap(this_: globalAndroid.view.View, view: number, width: number, widthType: number, height: number): void;
					public setGridAutoColumns(this_: globalAndroid.view.View, view: string): void;
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
				export class NodeUtils {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.NodeUtils>;
					public static INSTANCE: org.nativescript.mason.masonkit.NodeUtils;
					public isInlineLike(node: org.nativescript.mason.masonkit.Node): boolean;
					public addView(node: org.nativescript.mason.masonkit.Node, $i$f$suppressChildOperations$masonkit_release: globalAndroid.view.View, this_$iv: globalAndroid.view.ViewGroup.LayoutParams): void;
					public syncNode(it: org.nativescript.mason.masonkit.Node, list: java.util.List<any>): void;
					public addView(node: org.nativescript.mason.masonkit.Node, $i$f$suppressChildOperations$masonkit_release: globalAndroid.view.View, this_$iv: number, this_: globalAndroid.view.ViewGroup.LayoutParams): void;
					public syncNode(it: org.nativescript.mason.masonkit.Node, nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public addView(node: org.nativescript.mason.masonkit.Node, $i$f$suppressChildOperations$masonkit_release: globalAndroid.view.View): void;
					public addView(node: org.nativescript.mason.masonkit.Node, $i$f$suppressChildOperations$masonkit_release: globalAndroid.view.View, this_$iv: number): void;
					public invalidateLayout(it: org.nativescript.mason.masonkit.Node, this_: boolean): void;
					public removeView(node: org.nativescript.mason.masonkit.Node, $i$f$suppressChildOperations$masonkit_release: globalAndroid.view.View): void;
					public collectAuthorChildren(this_: java.util.List<org.nativescript.mason.masonkit.Node>, out: java.util.List<any>): void;
				}
			}
		}
	}
}

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class Point<T>  extends java.lang.Object {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Point<any>>;
					public getX(): T;
					public toString(): string;
					public copy(x: T, y: T): org.nativescript.mason.masonkit.Point<T>;
					public constructor(x: T, y: T);
					public equals(other: any): boolean;
					public component1(): T;
					public getY(): T;
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
				export class Rect<T>  extends java.lang.Object {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Rect<any>>;
					public getRight(): T;
					public equals(other: any): boolean;
					public component1(): T;
					public copy(top: T, right: T, bottom: T, left: T): org.nativescript.mason.masonkit.Rect<T>;
					public getBottom(): T;
					public static uniform(value: any): org.nativescript.mason.masonkit.Rect<any>;
					public component2(): T;
					public toString(): string;
					public getLeft(): T;
					public component3(): T;
					public component4(): T;
					public getTop(): T;
					public hashCode(): number;
					public constructor(top: T, right: T, bottom: T, left: T);
				}
				export module Rect {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Rect.Companion>;
						public uniform(value: any): org.nativescript.mason.masonkit.Rect<any>;
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
				export class Scroll extends org.nativescript.mason.masonkit.TwoDScrollView implements org.nativescript.mason.masonkit.Element {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Scroll>;
					public scrollRoot: org.nativescript.mason.masonkit.View;
					public computeMaxContent(): void;
					public layout(): org.nativescript.mason.masonkit.Layout;
					public computeWithViewSize(layout: boolean): void;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public prependView(view: globalAndroid.view.View): void;
					public replaceChildAt(param0: string, param1: number): void;
					public replaceChildAt(text: string, index: number): void;
					public prepend(param0: org.nativescript.mason.masonkit.Node): void;
					public computeMinContent(): void;
					public compute(): void;
					public prepend(param0: org.nativescript.mason.masonkit.Element): void;
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
					public compute(width: number, height: number): void;
					public isNodeDirty(): boolean;
					public computeWithMinContent(): void;
					public invalidateLayout(param0: boolean): void;
					public append(texts: androidNative.Array<string>): void;
					public constructor(context: globalAndroid.content.Context);
					public addView(this_: globalAndroid.view.View, child: number): void;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet, defStyle: number);
					public getEnableScrollX(): boolean;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet);
					public addView(this_: globalAndroid.view.View, child: globalAndroid.view.ViewGroup.LayoutParams): void;
					public onNodeAttached(): void;
					public onMeasure(specHeight: number, specWidthMode: number): void;
					public onNodeDetached(): void;
					public append(node: org.nativescript.mason.masonkit.Node): void;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet, defStyleAttr: number);
					public markNodeDirty(): void;
					public prepend(element: org.nativescript.mason.masonkit.Element): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public syncStyle(param0: string, param1: string): void;
					public addChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public dispatchDraw(canvas: globalAndroid.graphics.Canvas): void;
					public replaceChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public invalidateLayout(invalidateRoot: boolean): void;
					public append(text: string): void;
					public addChildAt(param0: string, param1: number): void;
					public appendView(param0: globalAndroid.view.View): void;
					public constructor($this$_init__u24lambda_u241: globalAndroid.content.Context, this_: globalAndroid.util.AttributeSet, context: number, attrs: boolean);
					public addView(child: globalAndroid.view.View, width: number, height: number): void;
					public computeWithSize(param0: number, param1: number): void;
					public addView(child: globalAndroid.view.View, index: number): void;
					public append(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public getEnableScrollY(): boolean;
					public append(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public prependView(param0: androidNative.Array<globalAndroid.view.View>): void;
					public getView(): globalAndroid.view.View;
					public configure(param0: any): void;
					public replaceChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public addChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public getStyle(): org.nativescript.mason.masonkit.Style;
					public removeChildAt(param0: number): void;
					public syncStyle(state: string, textState: string): void;
					public onLayout(this_: boolean, changed: number, l: number, t: number, r: number): void;
					public append(param0: org.nativescript.mason.masonkit.Element): void;
					public append(param0: org.nativescript.mason.masonkit.Node): void;
					public onSizeChanged(it: number, element$iv: number, $i$f$forEach: number, $this$forEach$iv: number): void;
					public setEnableScrollX(value: boolean): void;
					public computeAndLayout(): org.nativescript.mason.masonkit.Layout;
					public invalidateLayout(): void;
					public computeWithViewSize(param0: boolean): void;
					public appendView(view: globalAndroid.view.View): void;
					public prepend(param0: string): void;
					public prepend(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public setScrollRoot$masonkit_release(value: org.nativescript.mason.masonkit.View): void;
					public computeAndLayout(width: number, height: number): org.nativescript.mason.masonkit.Layout;
					public computeAndLayout(param0: number, param1: number): org.nativescript.mason.masonkit.Layout;
					public setEnableScrollY(value: boolean): void;
					public addChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public attachAndApply(): void;
					public addView(child: globalAndroid.view.View): void;
					public computeWithViewSize(): void;
					public computeWithMaxContent(): void;
					public prepend(node: org.nativescript.mason.masonkit.Node): void;
					public append(param0: androidNative.Array<string>): void;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public addView(child: globalAndroid.view.View, index: number, params: globalAndroid.view.ViewGroup.LayoutParams): void;
					public configure(block: any): void;
					public addView(this_: globalAndroid.view.View, child: number, index: globalAndroid.view.ViewGroup.LayoutParams): void;
					public append(element: org.nativescript.mason.masonkit.Element): void;
					public prepend(strings: androidNative.Array<string>): void;
					public prepend(string: string): void;
					public prependView(views: androidNative.Array<globalAndroid.view.View>): void;
					public addChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public generateDefaultLayoutParams(): globalAndroid.widget.FrameLayout.LayoutParams;
					public getNode(): org.nativescript.mason.masonkit.Node;
					public computeWithSize(width: number, height: number): void;
					public append(param0: string): void;
					public appendView(param0: androidNative.Array<globalAndroid.view.View>): void;
				}
				export module Scroll {
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Scroll.WhenMappings>;
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
				export class Shadow {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.Shadow>;
					public constructor();
				}
				export module Shadow {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Shadow.Companion>;
						public parseTextShadow(parsedColor: org.nativescript.mason.masonkit.Style, token: string): java.util.List<org.nativescript.mason.masonkit.Shadow.TextShadow>;
					}
					export class TextShadow {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Shadow.TextShadow>;
						public getOffsetX(): number;
						public getColor(): number;
						public equals(other: any): boolean;
						public hashCode(): number;
						public component4(): number;
						public toString(): string;
						public component2(): number;
						public getOffsetY(): number;
						public constructor(offsetX: number, offsetY: number, blurRadius: number, color: number);
						public getBlurRadius(): number;
						public component1(): number;
						public component3(): number;
						public copy(offsetX: number, offsetY: number, blurRadius: number, color: number): org.nativescript.mason.masonkit.Shadow.TextShadow;
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
				export module Size {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Size.Companion>;
						public uniform(value: any): org.nativescript.mason.masonkit.Size<any>;
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
					export class BlurredTextShadowSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans.BlurredTextShadowSpan>;
						public constructor(offsetX: number, offsetY: number, blurRadius: number, color: number);
						public updateDrawState(tp: globalAndroid.text.TextPaint): void;
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
					export class OverlineSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans.OverlineSpan>;
						public drawBackground(oldStrokeWidth: globalAndroid.graphics.Canvas, fm: globalAndroid.graphics.Paint, y: number, this_: number, canvas: number, paint: number, left: number, right: string, top: number, baseline: number, bottom: number): void;
						public constructor(color: number, thicknessPx: number);
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
					export class TextShadowSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Spans.TextShadowSpan>;
						public constructor(offsetX: number, offsetY: number, shadowColor: number);
						public getSize(paint: globalAndroid.graphics.Paint, text: string, start: number, end: number, fm: globalAndroid.graphics.Paint.FontMetricsInt): number;
						public draw(this_: globalAndroid.graphics.Canvas, canvas: string, text: number, start: number, end: number, x: number, top: number, y: number, bottom: globalAndroid.graphics.Paint): void;
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
						public "getBORDER_RADIUS-U0xtSZA"(): number;
						public "getSIZE-U0xtSZA"(): number;
						public "getJUSTIFY_ITEMS-U0xtSZA"(): number;
						public "getSCROLLBAR_WIDTH-U0xtSZA"(): number;
						public "getALIGN-U0xtSZA"(): number;
						public "getCLEAR-U0xtSZA"(): number;
						public "getALIGN_SELF-U0xtSZA"(): number;
						public "getITEM_IS_REPLACED-U0xtSZA"(): number;
						public "getMAX_SIZE-U0xtSZA"(): number;
						public "getMARGIN-U0xtSZA"(): number;
						public "getFLEX_SHRINK-U0xtSZA"(): number;
						public "getFLOAT-U0xtSZA"(): number;
						public "getDIRECTION-U0xtSZA"(): number;
						public "getALIGN_CONTENT-U0xtSZA"(): number;
						public "getMIN_CONTENT_HEIGHT-U0xtSZA"(): number;
						public "getFLEX_DIRECTION-U0xtSZA"(): number;
						public "getGRID_AUTO_FLOW-U0xtSZA"(): number;
						public "getBORDER_COLOR-U0xtSZA"(): number;
						public "getALIGN_ITEMS-U0xtSZA"(): number;
						public "getOBJECT_FIT-U0xtSZA"(): number;
						public "getFLEX_BASIS-U0xtSZA"(): number;
						public "getGAP-U0xtSZA"(): number;
						public "getGRID_COLUMN-U0xtSZA"(): number;
						public "getBOX_SIZING-U0xtSZA"(): number;
						public "getJUSTIFY_SELF-U0xtSZA"(): number;
						public "getMAX_CONTENT_WIDTH-U0xtSZA"(): number;
						public "getBORDER_STYLE-U0xtSZA"(): number;
						public "getINSET-U0xtSZA"(): number;
						public "getPADDING-U0xtSZA"(): number;
						public "getOVERFLOW-U0xtSZA"(): number;
						public "getPOSITION-U0xtSZA"(): number;
						public "getFLEX_GROW-U0xtSZA"(): number;
						public "getFORCE_INLINE-U0xtSZA"(): number;
						public "getDISPLAY-U0xtSZA"(): number;
						public "getOVERFLOW_X-U0xtSZA"(): number;
						public "getDISPLAY_MODE-U0xtSZA"(): number;
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
					public "setOrAppendState-eOU-u_s$masonkit_release"(value: number): void;
					public setGridTemplateRows(value: string): void;
					public getObjectFit(): org.nativescript.mason.masonkit.enums.ObjectFit;
					public setDecorationColor(this_$iv: number): void;
					public getFontFeatureSettings(): string;
					public getBorderTopWidth(): org.nativescript.mason.masonkit.LengthPercentage;
					public getGridTemplateRows(): string;
					public setFlexWrap(value: org.nativescript.mason.masonkit.enums.FlexWrap): void;
					public getWhiteSpace(): org.nativescript.mason.masonkit.Styles.WhiteSpace;
					public setBorderLeftWidth(it: number, left: number): void;
					public getMBorderRight$masonkit_release(): org.nativescript.mason.masonkit.Border;
					public setMarginWithValueType(it: number, margin: number): void;
					public getNativeSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public setBorderRightWidth(value: org.nativescript.mason.masonkit.LengthPercentage): void;
					public getInBatch(): boolean;
					public getFlexBasis(): org.nativescript.mason.masonkit.Dimension;
					public setBorderTopWidth(it: number, top: number): void;
					public isTextDirty$masonkit_release(): number;
					public getColor(): number;
					public getDecorationLine(): org.nativescript.mason.masonkit.Styles.DecorationLine;
					public getFloat(): org.nativescript.mason.masonkit.enums.Float;
					public getMBackgroundRaw$masonkit_release(): string;
					public getTextJustify(): org.nativescript.mason.masonkit.Styles.TextJustify;
					public setGridColumnEnd(value: string): void;
					public setBorderWidth($this$_set_borderWidth__u24lambda_u2441: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>): void;
					public setTextTransform(this_$iv: org.nativescript.mason.masonkit.Styles.TextTransform): void;
					public setMarginLeft(it: number, left: number): void;
					public getInset(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public setBorderStyle($this$setBorderStyle_u24lambda_u2425: org.nativescript.mason.masonkit.enums.BorderStyle): void;
					public getMaxSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public getBackground(): string;
					public setTextShadows$masonkit_release(value: java.util.List<org.nativescript.mason.masonkit.Shadow.TextShadow>): void;
					public setGridAutoColumns(value: string): void;
					public setFontWeight(this_$iv: org.nativescript.mason.masonkit.FontFace.NSCFontWeight): void;
					public getFlexGrow(): number;
					public setBackgroundColor(this_$iv: number): void;
					public getFontMetrics$masonkit_release(): org.nativescript.mason.masonkit.Style.FontMetrics;
					public getFontStyle(): org.nativescript.mason.masonkit.FontFace.NSCFontStyle;
					public setAlignContent(value: org.nativescript.mason.masonkit.enums.AlignContent): void;
					public getResolvedDecorationStyle$masonkit_release(): org.nativescript.mason.masonkit.Styles.DecorationStyle;
					public setMBackground$masonkit_release(value: org.nativescript.mason.masonkit.Background): void;
					public getBorderLeftStyle(): org.nativescript.mason.masonkit.enums.BorderStyle;
					public setVerticalAlign(this_$iv: org.nativescript.mason.masonkit.enums.VerticalAlign): void;
					public setJustifyItems(value: org.nativescript.mason.masonkit.enums.JustifyItems): void;
					public setStyleChangeListener$masonkit_release(listener: org.nativescript.mason.masonkit.StyleChangeListener): void;
					public setBackgroundImage(this_: string): void;
					public setBorderColor($this$_set_borderColor__u24lambda_u2433: org.nativescript.mason.masonkit.Rect<java.lang.Integer>): void;
					public resetFontFamilyToInherit(): void;
					public setDecorationLine(this_$iv: org.nativescript.mason.masonkit.Styles.DecorationLine): void;
					public getMBorderRenderer$masonkit_release(): org.nativescript.mason.masonkit.BorderRenderer;
					public setPaddingWithValueType(it: number, padding: number): void;
					public setSizeWidth(value: org.nativescript.mason.masonkit.Dimension): void;
					public isValueInitialized$masonkit_release(): boolean;
					public getGridRowStart(): string;
					public getTextAlign(): org.nativescript.mason.masonkit.enums.TextAlign;
					public setFilter(this_: string): void;
					public setInsetWithValueType(it: number, inset: number): void;
					public setFlexShrink(value: number): void;
					public setAlign(value: org.nativescript.mason.masonkit.enums.Align): void;
					public setMBackgroundRaw$masonkit_release(value: string): void;
					public static nativeGetGridColumn(param0: number, param1: number): string;
					public setMinSizeWidth(it: number, width: number): void;
					public setFontFamily($this$_set_fontFamily__u24lambda_u249: string): void;
					public static nativeGetGridRow(param0: number, param1: number): string;
					public setDisplay(display: org.nativescript.mason.masonkit.enums.Display): void;
					public getClear(): org.nativescript.mason.masonkit.enums.Clear;
					public setBorderStyle($this$_set_borderStyle__u24lambda_u2429: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.enums.BorderStyle>): void;
					public setFontStyle(this_$iv: org.nativescript.mason.masonkit.FontFace.NSCFontStyle): void;
					public setBorderRadius(value: string): void;
					public getGridTemplateColumns(): string;
					public getTextShadows$masonkit_release(): java.util.List<org.nativescript.mason.masonkit.Shadow.TextShadow>;
					public getBorderStyle(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.enums.BorderStyle>;
					public setFontKerning(value: string): void;
					public isTextValueInitialized$masonkit_release(): boolean;
					public clearFontMetrics$masonkit_release(): void;
					public getMBorder$masonkit_release(): string;
					public getBorderRadius(): string;
					public setGridTemplateAreas(value: string): void;
					public getAlignItems(): org.nativescript.mason.masonkit.enums.AlignItems;
					public setGridRow(value: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
					public getCapHeight$masonkit_release(paint: globalAndroid.graphics.Paint): java.lang.Float;
					public setMaxSizeWidth(it: number, width: number): void;
					public static nativeGetStyleBuffer(param0: number, param1: number): java.nio.ByteBuffer;
					public setFlexBasis(value: org.nativescript.mason.masonkit.Dimension): void;
					public setGridTemplateColumns(value: string): void;
					public setGridColumnStart(value: org.nativescript.mason.masonkit.GridPlacement): void;
					public getFilter(): string;
					public setMargin(left: number, top: number, right: number, bottom: number): void;
					public setMarginRight(it: number, right: number): void;
					public static nativeUpdateWithValues(param0: number, param1: number, param2: number, param3: number, param4: number, param5: number, param6: number, param7: number, param8: number, param9: number, param10: number, param11: number, param12: number, param13: number, param14: number, param15: number, param16: number, param17: number, param18: number, param19: number, param20: number, param21: number, param22: number, param23: number, param24: number, param25: number, param26: number, param27: number, param28: number, param29: number, param30: number, param31: number, param32: number, param33: number, param34: number, param35: number, param36: number, param37: number, param38: number, param39: number, param40: number, param41: number, param42: number, param43: number, param44: number, param45: number, param46: number, param47: number, param48: number, param49: number, param50: number, param51: number, param52: number, param53: number, param54: number, param55: number, param56: number, param57: number, param58: number, param59: number, param60: number, param61: number, param62: number, param63: number, param64: number, param65: number, param66: number, param67: string, param68: string, param69: number, param70: string, param71: string, param72: string, param73: string, param74: string, param75: string, param76: string, param77: string, param78: number, param79: number, param80: number, param81: number, param82: number, param83: string, param84: string): void;
					public getOverflowX(): org.nativescript.mason.masonkit.enums.Overflow;
					public updateNativeStyle$masonkit_release(): void;
					public setMinSizeHeight(value: org.nativescript.mason.masonkit.Dimension): void;
					public getGridRowEnd(): string;
					public setWhiteSpace(this_$iv: org.nativescript.mason.masonkit.Styles.WhiteSpace): void;
					public setGridRowEnd(value: string): void;
					public getResolvedDecorationThickness$masonkit_release(): number;
					public setPaddingRight(it: number, right: number): void;
					public setJustifyContent(value: org.nativescript.mason.masonkit.enums.JustifyContent): void;
					public getBackgroundColor(): number;
					public setMaxSizeHeight(it: number, height: number): void;
					public setBorderWidth($this$setBorderWidth_u24lambda_u2453_u24lambda_u2449: number, width: number): void;
					public setOverflow(value: org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.enums.Overflow>): void;
					public setDirty$masonkit_release(value: number): void;
					public setPosition(value: org.nativescript.mason.masonkit.enums.Position): void;
					public getGridArea(): string;
					public setTextValueInitialized$masonkit_release(value: boolean): void;
					public getTextValues(): java.nio.ByteBuffer;
					public setFlexGrow(value: number): void;
					public setOverflowY(value: org.nativescript.mason.masonkit.enums.Overflow): void;
					public resetFontWeightToInherit(): void;
					public getMargin(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public getResolvedLineHeight$masonkit_release(): number;
					public getBorderLeftWidth(): org.nativescript.mason.masonkit.LengthPercentage;
					public getFontKerning(): string;
					public isDirty$masonkit_release(): number;
					public setBackground(it: string): void;
					public getJustifyContent(): org.nativescript.mason.masonkit.enums.JustifyContent;
					public setMaxSizeHeight(value: org.nativescript.mason.masonkit.Dimension): void;
					public setFloat(value: org.nativescript.mason.masonkit.enums.Float): void;
					public setMFilter$masonkit_release(value: org.nativescript.mason.masonkit.CSSFilters.CSSFilter): void;
					public getAlignSelf(): org.nativescript.mason.masonkit.enums.AlignSelf;
					public getLineHeight(): number;
					public getMFilter$masonkit_release(): org.nativescript.mason.masonkit.CSSFilters.CSSFilter;
					public setBorderBottomRightRadius(value: org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.LengthPercentage>): void;
					public getGridAutoRows(): string;
					public getBorderColor(): org.nativescript.mason.masonkit.Rect<java.lang.Integer>;
					public static nativeNonBufferData(param0: number, param1: number, param2: string, param3: string, param4: string, param5: string, param6: string, param7: string, param8: string, param9: string, param10: string, param11: string, param12: string, param13: string): void;
					public setValueInitialized$masonkit_release(value: boolean): void;
					public setPaddingBottom(it: number, bottom: number): void;
					public getBorderBottomLeftRadius(): org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.LengthPercentage>;
					public setOverflowX(value: org.nativescript.mason.masonkit.enums.Overflow): void;
					public setInsetRight(it: number, right: number): void;
					public static nativeGetGridTemplateRows(param0: number, param1: number): string;
					public setTextDirty$masonkit_release(value: number): void;
					public getFontVariantLigatures(): string;
					public setMaxSizeWidth(value: org.nativescript.mason.masonkit.Dimension): void;
					public setFontFeatureSettings(value: string): void;
					public getTextWrap(): org.nativescript.mason.masonkit.Styles.TextWrap;
					public getAspectRatio(): java.lang.Float;
					public getBorderRightStyle(): org.nativescript.mason.masonkit.enums.BorderStyle;
					public setSizeWidth(it: number, width: number): void;
					public setGridState$masonkit_release(value: org.nativescript.mason.masonkit.GridState): void;
					public setColor(this_$iv: number): void;
					public getBorderTopLeftRadius(): org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.LengthPercentage>;
					public setBorderTopWidth(value: org.nativescript.mason.masonkit.LengthPercentage): void;
					public getResolvedFontSize$masonkit_release(): number;
					public setSizeHeight(value: org.nativescript.mason.masonkit.Dimension): void;
					public setGridAutoRows(value: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
					public getTextOverflow(): org.nativescript.mason.masonkit.Styles.TextOverflow;
					public getValues(): java.nio.ByteBuffer;
					public getFlexShrink(): number;
					public getResolvedLetterSpacing$masonkit_release(): number;
					public setForceInline$masonkit_release(value: boolean): void;
					public setColor(it: string): void;
					public getScrollBarWidth(): number;
					public setGridTemplateRows(value: androidNative.Array<org.nativescript.mason.masonkit.GridTemplate>): void;
					public setBorderLeftStyle(value: org.nativescript.mason.masonkit.enums.BorderStyle): void;
					public getFontWeight(): org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
					public getResolvedBackgroundColor$masonkit_release(): number;
					public getFontSize(): number;
					public setBorderTopLeftRadius(value: org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.LengthPercentage>): void;
					public setPadding(value: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>): void;
					public getOverflowY(): org.nativescript.mason.masonkit.enums.Overflow;
					public setBorderColor($this$setBorderColor_u24lambda_u2437: number): void;
					public getGridColumn(): string;
					public getBorderWidth(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public getBorderRightWidth(): org.nativescript.mason.masonkit.LengthPercentage;
					public setInsetTop(it: number, top: number): void;
					public setBorderBottomStyle(value: org.nativescript.mason.masonkit.enums.BorderStyle): void;
					public static nativeGetGridAutoRows(param0: number, param1: number): string;
					public getGap(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>;
					public setInBatch(this_: boolean): void;
					public setBorderTopStyle(value: org.nativescript.mason.masonkit.enums.BorderStyle): void;
					public getResolvedWhiteSpace$masonkit_release(): org.nativescript.mason.masonkit.Styles.WhiteSpace;
					public static nativeGetGridTemplateColumns(param0: number, param1: number): string;
					public getDecorationColor(): number;
					public setMinSize(value: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
					public getMBorderLeft$masonkit_release(): org.nativescript.mason.masonkit.Border;
					public setPaddingTop(it: number, top: number): void;
					public isSizeAuto$masonkit_release(): boolean;
					public getResolvedFontFace$masonkit_release(): org.nativescript.mason.masonkit.FontFace;
					public getFontVariant(): string;
					public getGridColumnStart(): string;
					public "setOrAppendState-LS73rdQ$masonkit_release"(value: number): void;
					public setFlexDirection(value: org.nativescript.mason.masonkit.enums.FlexDirection): void;
					public setGridColumn(value: org.nativescript.mason.masonkit.Line<org.nativescript.mason.masonkit.GridPlacement>): void;
					public setTextAlign(value: org.nativescript.mason.masonkit.enums.TextAlign): void;
					public setObjectFit(value: org.nativescript.mason.masonkit.enums.ObjectFit): void;
					public setDecorationStyle(this_$iv: org.nativescript.mason.masonkit.Styles.DecorationStyle): void;
					public resetFontStyleToInherit(): void;
					public getGridTemplateAreas(): string;
					public setNode$masonkit_release(value: org.nativescript.mason.masonkit.Node): void;
					public getMBackground$masonkit_release(): org.nativescript.mason.masonkit.Background;
					public setGridArea(value: string): void;
					public setBorderRightStyle(value: org.nativescript.mason.masonkit.enums.BorderStyle): void;
					public getForceInline$masonkit_release(): boolean;
					public getDisplay(): org.nativescript.mason.masonkit.enums.Display;
					public getDecorationThickness(): number;
					public resolvePercentageFontSize$masonkit_release(percent: number, this_: number): number;
					public setLineHeight(this_$iv: number): void;
					public setTextShadow(this_$iv: string): void;
					public getDecorationStyle(): org.nativescript.mason.masonkit.Styles.DecorationStyle;
					public getAlignContent(): org.nativescript.mason.masonkit.enums.AlignContent;
					public getLetterSpacing(): number;
					public setInsetBottom(it: number, bottom: number): void;
					public getResolvedDecorationLine$masonkit_release(): org.nativescript.mason.masonkit.Styles.DecorationLine;
					public setFontSize(this_$iv: number): void;
					public getBorderBottomStyle(): org.nativescript.mason.masonkit.enums.BorderStyle;
					public getResolvedFontStyle$masonkit_release(): org.nativescript.mason.masonkit.FontFace.NSCFontStyle;
					public setAlignSelf(value: org.nativescript.mason.masonkit.enums.AlignSelf): void;
					public getMBorderBottom$masonkit_release(): org.nativescript.mason.masonkit.Border;
					public syncFontMetrics$masonkit_release(): void;
					public setBorder(value: string): void;
					public setBackgroundColor($this$setBackgroundColor_u24lambda_u247_u24lambda_u246: string): void;
					public static nativeGetGridArea(param0: number, param1: number): string;
					public setGridRowStart(value: string): void;
					public setBorderTopRightRadius(value: org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.LengthPercentage>): void;
					public getPadding(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public getMBorderTop$masonkit_release(): org.nativescript.mason.masonkit.Border;
					public setGridRow(value: string): void;
					public setMinSizeHeight(it: number, height: number): void;
					public getResolvedTextTransform$masonkit_release(): org.nativescript.mason.masonkit.Styles.TextTransform;
					public setMargin(value: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>): void;
					public setMBorder$masonkit_release(value: string): void;
					public setPadding(left: number, top: number, right: number, bottom: number): void;
					public setFlexBasis(it: number, this_: number): void;
					public updateTextStyle$masonkit_release(): void;
					public setTextJustify(this_$iv: org.nativescript.mason.masonkit.Styles.TextJustify): void;
					public setMarginBottom(it: number, bottom: number): void;
					public getResolvedTextJustify$masonkit_release(): org.nativescript.mason.masonkit.Styles.TextJustify;
					public getJustifyItems(): org.nativescript.mason.masonkit.enums.JustifyItems;
					public setPaddingLeft(it: number, left: number): void;
					public getGridAutoColumns(): string;
					public setLetterSpacing(this_$iv: number): void;
					public static nativeGetGridRowEnd(param0: number, param1: number): string;
					public getResolvedTextAlign$masonkit_release(): org.nativescript.mason.masonkit.enums.TextAlign;
					public setClear(value: org.nativescript.mason.masonkit.enums.Clear): void;
					public setGridAutoColumns(value: androidNative.Array<org.nativescript.mason.masonkit.MinMax>): void;
					public setJustifySelf(value: org.nativescript.mason.masonkit.enums.JustifySelf): void;
					public getSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public getResolvedTextShadow$masonkit_release(): java.util.List<org.nativescript.mason.masonkit.Shadow.TextShadow>;
					public getOverflow(): org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.enums.Overflow>;
					public getVerticalAlign(): org.nativescript.mason.masonkit.enums.VerticalAlign;
					public getGridAutoFlow(): org.nativescript.mason.masonkit.enums.GridAutoFlow;
					public setTextWrap(this_$iv: org.nativescript.mason.masonkit.Styles.TextWrap): void;
					public getAlign(): org.nativescript.mason.masonkit.enums.Align;
					public static nativeGetGridTemplateAreas(param0: number, param1: number): string;
					public updateFirstBaseline$masonkit_release(): void;
					public getNode$masonkit_release(): org.nativescript.mason.masonkit.Node;
					public getGridRow(): string;
					public static nativeGetGridColumnStart(param0: number, param1: number): string;
					public getTextShadow(): string;
					public setInset(value: org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>): void;
					public setLineHeight(this_$iv: number, change$iv: boolean): void;
					public getBoxSizing(): org.nativescript.mason.masonkit.enums.BoxSizing;
					public getFontStretch(): string;
					public getResolvedLineHeightType$masonkit_release(): number;
					public getGridState$masonkit_release(): org.nativescript.mason.masonkit.GridState;
					public constructor($this$font_u24lambda_u240: org.nativescript.mason.masonkit.Node);
					public setGridTemplateColumns(value: androidNative.Array<org.nativescript.mason.masonkit.GridTemplate>): void;
					public getJustifySelf(): org.nativescript.mason.masonkit.enums.JustifySelf;
					public getXHeight$masonkit_release(paint: globalAndroid.graphics.Paint): java.lang.Float;
					public getFlexDirection(): org.nativescript.mason.masonkit.enums.FlexDirection;
					public setDecorationThickness(this_$iv: number): void;
					public setDirection(value: org.nativescript.mason.masonkit.enums.Direction): void;
					public getBorderTopStyle(): org.nativescript.mason.masonkit.enums.BorderStyle;
					public setTextOverflow(this_$iv: org.nativescript.mason.masonkit.Styles.TextOverflow): void;
					public setRadiusPoint$masonkit_release(keys: org.nativescript.mason.masonkit.Border.IKeyCorner, value: org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.LengthPercentage>): void;
					public setMinSizeWidth(value: org.nativescript.mason.masonkit.Dimension): void;
					public getTextTransform(): org.nativescript.mason.masonkit.Styles.TextTransform;
					public getMinSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public static nativeGetGridColumnEnd(param0: number, param1: number): string;
					public setGridAutoFlow(value: org.nativescript.mason.masonkit.enums.GridAutoFlow): void;
					public setFontVariantLigatures(value: string): void;
					public setBorderBottomLeftRadius(value: org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.LengthPercentage>): void;
					public setGapColumn(it: number, height: number): void;
					public setGridAutoRows(value: string): void;
					public getResolvedFontWeight$masonkit_release(): org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
					public getBorderBottomWidth(): org.nativescript.mason.masonkit.LengthPercentage;
					public getResolvedDecorationColor$masonkit_release(): number;
					public setFont(value: org.nativescript.mason.masonkit.FontFace): void;
					public setSizeHeight(it: number, height: number): void;
					public setOrAppendState$masonkit_release(this_: androidNative.Array<org.nativescript.mason.masonkit.StateKeys>): void;
					public setBorderLeftWidth(value: org.nativescript.mason.masonkit.LengthPercentage): void;
					public getGridColumnEnd(): string;
					public setInsetLeft(it: number, left: number): void;
					public setSize$masonkit_release(width: number, height: number): void;
					public getFontFamily(): string;
					public setBorderRightWidth(it: number, right: number): void;
					public setGridColumnStart(value: string): void;
					public setFontStretch(value: string): void;
					public getFlexWrap(): org.nativescript.mason.masonkit.enums.FlexWrap;
					public getPaint$masonkit_release(): globalAndroid.text.TextPaint;
					public getRadiusPoint$masonkit_release(y: org.nativescript.mason.masonkit.Border.IKeyCorner): org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.LengthPercentage>;
					public getNativeMargins(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public getDirection(): org.nativescript.mason.masonkit.enums.Direction;
					public toString(): string;
					public getBorderBottomRightRadius(): org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.LengthPercentage>;
					public getBorder(): string;
					public setScrollBarWidth(value: number): void;
					public setMarginTop(it: number, top: number): void;
					public getFont(): org.nativescript.mason.masonkit.FontFace;
					public configure(block: any): void;
					public setMaxSize(value: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
					public getResolvedTextWrap$masonkit_release(): org.nativescript.mason.masonkit.Styles.TextWrap;
					public setAlignItems(value: org.nativescript.mason.masonkit.enums.AlignItems): void;
					public setAspectRatio(value: java.lang.Float): void;
					public setGridColumn(value: string): void;
					public setFontVariant(value: string): void;
					public getResolvedColor$masonkit_release(): number;
					public setBorderBottomWidth(value: org.nativescript.mason.masonkit.LengthPercentage): void;
					public setGapRow(it: number, width: number): void;
					public getBorderTopRightRadius(): org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.LengthPercentage>;
					public getPosition(): org.nativescript.mason.masonkit.enums.Position;
					public setGap(height: number, this_: number, widthValue: number, widthType: number): void;
					public static nativeGetGridRowStart(param0: number, param1: number): string;
					public getBackgroundImage(): string;
					public setSize(value: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>): void;
					public setBorderBottomWidth(it: number, bottom: number): void;
					public static nativeGetGridAutoColumns(param0: number, param1: number): string;
					public setGap(value: org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>): void;
					public setBoxSizing(value: org.nativescript.mason.masonkit.enums.BoxSizing): void;
				}
				export module Style {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Style.Companion>;
						public nativeGetStyleBuffer(mason: number, node: number): java.nio.ByteBuffer;
						public nativeGetGridTemplateAreas(mason: number, node: number): string;
						public nativeGetGridColumn(mason: number, node: number): string;
						public nativeGetGridRow(mason: number, node: number): string;
						public nativeGetGridTemplateRows(mason: number, node: number): string;
						public nativeNonBufferData(mason: number, node: number, gridAutoRows: string, gridAutoColumns: string, gridColumn: string, gridColumnStart: string, gridColumnEnd: string, gridRow: string, gridRowStart: string, gridRowEnd: string, gridTemplateRows: string, gridTemplateColumns: string, gridArea: string, gridTemplateAreas: string): void;
						public nativeGetGridColumnEnd(mason: number, node: number): string;
						public nativeGetGridAutoColumns(mason: number, node: number): string;
						public nativeGetGridTemplateColumns(mason: number, node: number): string;
						public nativeGetGridRowStart(mason: number, node: number): string;
						public nativeUpdateWithValues(mason: number, node: number, display: number, position: number, direction: number, flexDirection: number, flexWrap: number, overflow: number, alignItems: number, alignSelf: number, alignContent: number, justifyItems: number, justifySelf: number, justifyContent: number, insetLeftType: number, insetLeftValue: number, insetRightType: number, insetRightValue: number, insetTopType: number, insetTopValue: number, insetBottomType: number, insetBottomValue: number, marginLeftType: number, marginLeftValue: number, marginRightType: number, marginRightValue: number, marginTopType: number, marginTopValue: number, marginBottomType: number, marginBottomValue: number, paddingLeftType: number, paddingLeftValue: number, paddingRightType: number, paddingRightValue: number, paddingTopType: number, paddingTopValue: number, paddingBottomType: number, paddingBottomValue: number, borderLeftType: number, borderLeftValue: number, borderRightType: number, borderRightValue: number, borderTopType: number, borderTopValue: number, borderBottomType: number, borderBottomValue: number, flexGrow: number, flexShrink: number, flexBasisType: number, flexBasisValue: number, widthType: number, widthValue: number, heightType: number, heightValue: number, minWidthType: number, minWidthValue: number, minHeightType: number, minHeightValue: number, maxWidthType: number, maxWidthValue: number, maxHeightType: number, maxHeightValue: number, gapRowType: number, gapRowValue: number, gapColumnType: number, gapColumnValue: number, aspectRatio: number, gridAutoRows: string, gridAutoColumns: string, gridAutoFlow: number, gridColumn: string, gridColumnStart: string, gridColumnEnd: string, gridRow: string, gridRowStart: string, gridRowEnd: string, gridTemplateRows: string, gridTemplateColumns: string, overflowX: number, overflowY: number, scrollbarWidth: number, textAlign: number, boxSizing: number, gridArea: string, gridTemplateAreas: string): void;
						public nativeGetGridColumnStart(mason: number, node: number): string;
						public nativeGetGridRowEnd(mason: number, node: number): string;
						public applyClip$masonkit_release(height: globalAndroid.graphics.Canvas, padding: org.nativescript.mason.masonkit.BackgroundClip, border: org.nativescript.mason.masonkit.Node): void;
						public nativeGetGridAutoRows(mason: number, node: number): string;
						public nativeGetGridArea(mason: number, node: number): string;
						public applyOverflowClip$masonkit_release($this$applyOverflowClip_u24lambda_u240: org.nativescript.mason.masonkit.Style, $i$f$withClip: globalAndroid.graphics.Canvas, checkpoint$iv: org.nativescript.mason.masonkit.Node): void;
					}
					export module Companion {
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Style.Companion.WhenMappings>;
						}
					}
					export class FontMetrics {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.Style.FontMetrics>;
						public equals(other: any): boolean;
						public getAscent(): number;
						public static from(style: org.nativescript.mason.masonkit.Style): org.nativescript.mason.masonkit.Style.FontMetrics;
						public hashCode(): number;
						public component4(): number;
						public copy(ascent: number, descent: number, xHeight: number, leading: number, capHeight: number): org.nativescript.mason.masonkit.Style.FontMetrics;
						public toString(): string;
						public component2(): number;
						public getDescent(): number;
						public getXHeight(): number;
						public constructor(ascent: number, descent: number, xHeight: number, leading: number, capHeight: number);
						public getCapHeight(): number;
						public getLeading(): number;
						public component1(): number;
						public component3(): number;
						public component5(): number;
					}
					export module FontMetrics {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Style.FontMetrics.Companion>;
							public from(style: org.nativescript.mason.masonkit.Style): org.nativescript.mason.masonkit.Style.FontMetrics;
						}
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
				export class StyleChangeListener {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.StyleChangeListener>;
					/**
					 * Constructs a new instance of the org.nativescript.mason.masonkit.StyleChangeListener interface with the provided implementation. An empty constructor exists calling super() when extending the interface class.
					 */
					public constructor(implementation: {
						onTextStyleChanged(param0: number): void;
					});
					public constructor();
					public onTextStyleChanged(param0: number): void;
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
					public static ALIGN: number = 304;
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
					public static BORDER_LEFT_STYLE: number = 348;
					public static BORDER_RIGHT_STYLE: number = 352;
					public static BORDER_TOP_STYLE: number = 356;
					public static BORDER_BOTTOM_STYLE: number = 360;
					public static BORDER_LEFT_COLOR: number = 364;
					public static BORDER_RIGHT_COLOR: number = 368;
					public static BORDER_TOP_COLOR: number = 372;
					public static BORDER_BOTTOM_COLOR: number = 376;
					public static BORDER_RADIUS_TOP_LEFT_X_TYPE: number = 380;
					public static BORDER_RADIUS_TOP_LEFT_X_VALUE: number = 384;
					public static BORDER_RADIUS_TOP_LEFT_Y_TYPE: number = 388;
					public static BORDER_RADIUS_TOP_LEFT_Y_VALUE: number = 392;
					public static BORDER_RADIUS_TOP_LEFT_EXPONENT: number = 396;
					public static BORDER_RADIUS_TOP_RIGHT_X_TYPE: number = 400;
					public static BORDER_RADIUS_TOP_RIGHT_X_VALUE: number = 404;
					public static BORDER_RADIUS_TOP_RIGHT_Y_TYPE: number = 408;
					public static BORDER_RADIUS_TOP_RIGHT_Y_VALUE: number = 412;
					public static BORDER_RADIUS_TOP_RIGHT_EXPONENT: number = 416;
					public static BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE: number = 420;
					public static BORDER_RADIUS_BOTTOM_RIGHT_X_VALUE: number = 424;
					public static BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE: number = 428;
					public static BORDER_RADIUS_BOTTOM_RIGHT_Y_VALUE: number = 432;
					public static BORDER_RADIUS_BOTTOM_RIGHT_EXPONENT: number = 436;
					public static BORDER_RADIUS_BOTTOM_LEFT_X_TYPE: number = 440;
					public static BORDER_RADIUS_BOTTOM_LEFT_X_VALUE: number = 444;
					public static BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE: number = 448;
					public static BORDER_RADIUS_BOTTOM_LEFT_Y_VALUE: number = 452;
					public static BORDER_RADIUS_BOTTOM_LEFT_EXPONENT: number = 456;
					public static FLOAT: number = 460;
					public static CLEAR: number = 464;
					public static OBJECT_FIT: number = 468;
					public static FONT_METRICS_ASCENT_OFFSET: number = 472;
					public static FONT_METRICS_DESCENT_OFFSET: number = 476;
					public static FONT_METRICS_X_HEIGHT_OFFSET: number = 480;
					public static FONT_METRICS_LEADING_OFFSET: number = 484;
					public static FONT_METRICS_CAP_HEIGHT_OFFSET: number = 488;
					public static VERTICAL_ALIGN_OFFSET_OFFSET: number = 492;
					public static VERTICAL_ALIGN_IS_PERCENT_OFFSET: number = 496;
					public static VERTICAL_ALIGN_ENUM_OFFSET: number = 500;
					public static FIRST_BASELINE_OFFSET: number = 504;
				}
			}
		}
	}
}

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class StyleState {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.StyleState>;
					public static INSTANCE: org.nativescript.mason.masonkit.StyleState;
					public static INHERIT: number = 0;
					public static SET: number = 1;
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
						public static UnderlineOverline: org.nativescript.mason.masonkit.Styles.DecorationLine;
						public static OverlineUnderlineLineThrough: org.nativescript.mason.masonkit.Styles.DecorationLine;
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
						public static ellipse(token: string): org.nativescript.mason.masonkit.Styles.TextOverflow;
						public static valueOf(value: string): org.nativescript.mason.masonkit.Styles.TextOverflow;
						public static custom(token: string): org.nativescript.mason.masonkit.Styles.TextOverflow;
						public static custom(): org.nativescript.mason.masonkit.Styles.TextOverflow;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.Styles.TextOverflow>;
						public static getEntries(): any;
						public setToken$masonkit_release(value: string): void;
						public getToken(): string;
						public getValue(): number;
					}
					export module TextOverflow {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.Styles.TextOverflow.Companion>;
							public custom($this$custom_u24lambda_u243: string): org.nativescript.mason.masonkit.Styles.TextOverflow;
							public fromInt($this$fromInt_u24lambda_u240: number, value: string): org.nativescript.mason.masonkit.Styles.TextOverflow;
							public ellipse($this$ellipse_u24lambda_u242: string): org.nativescript.mason.masonkit.Styles.TextOverflow;
							public fromInt(value: number): org.nativescript.mason.masonkit.Styles.TextOverflow;
							public custom(): org.nativescript.mason.masonkit.Styles.TextOverflow;
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
				export class TextContainer extends org.nativescript.mason.masonkit.StyleChangeListener {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.TextContainer>;
					/**
					 * Constructs a new instance of the org.nativescript.mason.masonkit.TextContainer interface with the provided implementation. An empty constructor exists calling super() when extending the interface class.
					 */
					public constructor(implementation: {
						getEngine(): org.nativescript.mason.masonkit.TextEngine;
						getNode(): org.nativescript.mason.masonkit.Node;
						setText(param0: string, param1: globalAndroid.widget.TextView.BufferType): void;
						setTextSize(param0: number): void;
						setTextSize(param0: number, param1: number): void;
						getPaint(): globalAndroid.text.TextPaint;
						onTextStyleChanged(param0: number): void;
					});
					public constructor();
					public getNode(): org.nativescript.mason.masonkit.Node;
					public onTextStyleChanged(param0: number): void;
					public setTextSize(param0: number): void;
					public getPaint(): globalAndroid.text.TextPaint;
					public setText(param0: string, param1: globalAndroid.widget.TextView.BufferType): void;
					public getEngine(): org.nativescript.mason.masonkit.TextEngine;
					public setTextSize(param0: number, param1: number): void;
				}
			}
		}
	}
}

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class TextDefaultAttributes {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.TextDefaultAttributes>;
					public component17(): globalAndroid.text.Layout.Alignment;
					public getVerticalAlign(): org.nativescript.mason.masonkit.enums.VerticalAlign;
					public component5(): string;
					public getBackgroundColor(): java.lang.Integer;
					public component3(): org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
					public setLineHeight(value: java.lang.Float): void;
					public component14(): java.lang.Float;
					public getWhiteSpace(): org.nativescript.mason.masonkit.Styles.WhiteSpace;
					public setTextWrap(value: org.nativescript.mason.masonkit.Styles.TextWrap): void;
					public component16(): java.lang.Byte;
					public sync(this_: org.nativescript.mason.masonkit.Style): void;
					public component19(): java.lang.Float;
					public constructor();
					public setVerticalAlign(value: org.nativescript.mason.masonkit.enums.VerticalAlign): void;
					public getDecorationColor(): java.lang.Integer;
					public setTextTransform(value: org.nativescript.mason.masonkit.Styles.TextTransform): void;
					public getLetterSpacing(): java.lang.Float;
					public setWhiteSpace(value: org.nativescript.mason.masonkit.Styles.WhiteSpace): void;
					public getTextShadow(): java.util.List<org.nativescript.mason.masonkit.Shadow.TextShadow>;
					public getFontSize(): any;
					public getDecorationLine(): org.nativescript.mason.masonkit.Styles.DecorationLine;
					public component8(): org.nativescript.mason.masonkit.Styles.WhiteSpace;
					public getTextTransform(): org.nativescript.mason.masonkit.Styles.TextTransform;
					public equals(other: any): boolean;
					public setFontSize(value: any): void;
					public component15(): java.lang.Float;
					public setDecorationStyle(value: org.nativescript.mason.masonkit.Styles.DecorationStyle): void;
					public component10(): java.lang.Integer;
					public setFont(value: org.nativescript.mason.masonkit.FontFace): void;
					public getLineHeight(): java.lang.Float;
					public setFontWeight(value: org.nativescript.mason.masonkit.FontFace.NSCFontWeight): void;
					public getFontStyle(): org.nativescript.mason.masonkit.FontFace.NSCFontStyle;
					public setLetterSpacing(value: java.lang.Float): void;
					public component11(): org.nativescript.mason.masonkit.Styles.DecorationLine;
					public setDecorationLine(value: org.nativescript.mason.masonkit.Styles.DecorationLine): void;
					public getFontFamily(): string;
					public component13(): org.nativescript.mason.masonkit.Styles.DecorationStyle;
					public setColor(value: java.lang.Integer): void;
					public setDecorationColor(value: java.lang.Integer): void;
					public getDecorationStyle(): org.nativescript.mason.masonkit.Styles.DecorationStyle;
					public component2(): any;
					public getLineHeightType(): java.lang.Byte;
					public setFontFamily(value: string): void;
					public component1(): java.lang.Integer;
					public setBackgroundColor(value: java.lang.Integer): void;
					public copy(color: java.lang.Integer, fontSize: any, fontWeight: org.nativescript.mason.masonkit.FontFace.NSCFontWeight, fontStyle: org.nativescript.mason.masonkit.FontFace.NSCFontStyle, fontFamily: string, font: org.nativescript.mason.masonkit.FontFace, textWrap: org.nativescript.mason.masonkit.Styles.TextWrap, whiteSpace: org.nativescript.mason.masonkit.Styles.WhiteSpace, textTransform: org.nativescript.mason.masonkit.Styles.TextTransform, backgroundColor: java.lang.Integer, decorationLine: org.nativescript.mason.masonkit.Styles.DecorationLine, decorationColor: java.lang.Integer, decorationStyle: org.nativescript.mason.masonkit.Styles.DecorationStyle, letterSpacing: java.lang.Float, lineHeight: java.lang.Float, lineHeightType: java.lang.Byte, textAlign: globalAndroid.text.Layout.Alignment, verticalAlign: org.nativescript.mason.masonkit.enums.VerticalAlign, decorationThickness: java.lang.Float, textShadow: java.util.List<org.nativescript.mason.masonkit.Shadow.TextShadow>): org.nativescript.mason.masonkit.TextDefaultAttributes;
					public component12(): java.lang.Integer;
					public toString(): string;
					public setTextAlign(value: globalAndroid.text.Layout.Alignment): void;
					public getColor(): java.lang.Integer;
					public getTextWrap(): org.nativescript.mason.masonkit.Styles.TextWrap;
					public hashCode(): number;
					public setLineHeightType(value: java.lang.Byte): void;
					public getFont(): org.nativescript.mason.masonkit.FontFace;
					public constructor(color: java.lang.Integer, fontSize: any, fontWeight: org.nativescript.mason.masonkit.FontFace.NSCFontWeight, fontStyle: org.nativescript.mason.masonkit.FontFace.NSCFontStyle, fontFamily: string, font: org.nativescript.mason.masonkit.FontFace, textWrap: org.nativescript.mason.masonkit.Styles.TextWrap, whiteSpace: org.nativescript.mason.masonkit.Styles.WhiteSpace, textTransform: org.nativescript.mason.masonkit.Styles.TextTransform, backgroundColor: java.lang.Integer, decorationLine: org.nativescript.mason.masonkit.Styles.DecorationLine, decorationColor: java.lang.Integer, decorationStyle: org.nativescript.mason.masonkit.Styles.DecorationStyle, letterSpacing: java.lang.Float, lineHeight: java.lang.Float, lineHeightType: java.lang.Byte, textAlign: globalAndroid.text.Layout.Alignment, verticalAlign: org.nativescript.mason.masonkit.enums.VerticalAlign, decorationThickness: java.lang.Float, textShadow: java.util.List<org.nativescript.mason.masonkit.Shadow.TextShadow>);
					public setDecorationThickness(value: java.lang.Float): void;
					public getTextAlign(): globalAndroid.text.Layout.Alignment;
					public setFontStyle(value: org.nativescript.mason.masonkit.FontFace.NSCFontStyle): void;
					public getDecorationThickness(): java.lang.Float;
					public copy(attributes: org.nativescript.mason.masonkit.TextDefaultAttributes): void;
					public component6(): org.nativescript.mason.masonkit.FontFace;
					public component4(): org.nativescript.mason.masonkit.FontFace.NSCFontStyle;
					public component20(): java.util.List<org.nativescript.mason.masonkit.Shadow.TextShadow>;
					public getFontWeight(): org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
					public component7(): org.nativescript.mason.masonkit.Styles.TextWrap;
					public component18(): org.nativescript.mason.masonkit.enums.VerticalAlign;
					public setTextShadow(value: java.util.List<org.nativescript.mason.masonkit.Shadow.TextShadow>): void;
					public component9(): org.nativescript.mason.masonkit.Styles.TextTransform;
				}
				export module TextDefaultAttributes {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextDefaultAttributes.Companion>;
						public from(this_: org.nativescript.mason.masonkit.Style): org.nativescript.mason.masonkit.TextDefaultAttributes;
						public empty(): org.nativescript.mason.masonkit.TextDefaultAttributes;
					}
					export module Companion {
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.TextDefaultAttributes.Companion.WhenMappings>;
						}
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextDefaultAttributes.WhenMappings>;
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
				export class TextEngine {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.TextEngine>;
					public invalidateInlineSegments$masonkit_release(it: boolean): void;
					public getContainer(): org.nativescript.mason.masonkit.TextContainer;
					public setIncludePadding(value: boolean): void;
					public measure(width: globalAndroid.text.TextPaint, height: org.nativescript.mason.masonkit.Size<java.lang.Float>, fontMetrics: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
					public setTextContent(it: string): void;
					public getIncludePadding(): boolean;
					public getStyle(): org.nativescript.mason.masonkit.Style;
					public updateStyleOnTextNodes$masonkit_release(): void;
					public constructor(container: org.nativescript.mason.masonkit.TextContainer);
					public getCachedAttributedString$masonkit_release(): globalAndroid.text.SpannableStringBuilder;
					public getNode(): org.nativescript.mason.masonkit.Node;
					public setCachedAttributedString$masonkit_release(value: globalAndroid.text.SpannableStringBuilder): void;
					public getTextContent(): string;
					public onTextStyleChanged(value: number, it: globalAndroid.graphics.Paint, dirty: globalAndroid.util.DisplayMetrics): void;
					public shouldFlattenTextContainer$masonkit_release(hasBackground: org.nativescript.mason.masonkit.TextContainer): boolean;
				}
				export module TextEngine {
					export class BrSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextEngine.BrSpan>;
						public constructor();
						public updateDrawState(tp: globalAndroid.text.TextPaint): void;
					}
					export class ViewHelper {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextEngine.ViewHelper>;
						public constructor(view: globalAndroid.view.View, node: org.nativescript.mason.masonkit.Node);
						public setBitmap(value: globalAndroid.graphics.Bitmap): void;
						public updateBitmap(config$iv: boolean): void;
						public getView(): globalAndroid.view.View;
						public getNode(): org.nativescript.mason.masonkit.Node;
						public getBitmap(): globalAndroid.graphics.Bitmap;
					}
					export class ViewSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextEngine.ViewSpan>;
						public draw(middleY: globalAndroid.graphics.Canvas, raiseAmount: string, offset: number, offset: number, span: number, $this$draw_u24lambda_u241: number, $i$f$withTranslation: number, checkpoint$iv: number, $this$withTranslation$iv: globalAndroid.graphics.Paint): void;
						public getSize(aboveDescent: globalAndroid.graphics.Paint, xHeight: string, halfHeight: number, raiseAmount: number, offset: globalAndroid.graphics.Paint.FontMetricsInt): number;
						public constructor(childNode: org.nativescript.mason.masonkit.Node, viewHelper: org.nativescript.mason.masonkit.TextEngine.ViewHelper);
						public getChildNode(): org.nativescript.mason.masonkit.Node;
					}
					export module ViewSpan {
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.TextEngine.ViewSpan.WhenMappings>;
						}
					}
					export class WhenMappings {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextEngine.WhenMappings>;
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
					public getLayoutParent$masonkit_release(): org.nativescript.mason.masonkit.Node;
					public setContainer$masonkit_release(value: org.nativescript.mason.masonkit.TextContainer): void;
					public replaceData(this_: number, offset: number, count: string): org.nativescript.mason.masonkit.CharacterData;
					public constructor(mason: org.nativescript.mason.masonkit.Mason, nativePtr: number, nodeType: org.nativescript.mason.masonkit.NodeType);
					public attributed(): globalAndroid.text.SpannableStringBuilder;
					public insertData(offset: number, data: string): org.nativescript.mason.masonkit.CharacterData;
					public getLength(): number;
					public appendData(data: string): org.nativescript.mason.masonkit.CharacterData;
					public constructor(mason: org.nativescript.mason.masonkit.Mason);
					public setData(param0: string): void;
					public setData(value: string): void;
					public deleteData(param0: number, param1: number): org.nativescript.mason.masonkit.CharacterData;
					public substringData(param0: number, param1: number): string;
					public getData(): string;
					public constructor(mason: org.nativescript.mason.masonkit.Mason, data: string);
					public substringData(this_: number, offset: number): string;
					public getContainer$masonkit_release(): org.nativescript.mason.masonkit.TextContainer;
					public insertData(param0: number, param1: string): org.nativescript.mason.masonkit.CharacterData;
					public setLayoutParent$masonkit_release(value: org.nativescript.mason.masonkit.Node): void;
					public appendData(param0: string): org.nativescript.mason.masonkit.CharacterData;
					public replaceData(param0: number, param1: number, param2: string): org.nativescript.mason.masonkit.CharacterData;
					public deleteData(this_: number, offset: number): org.nativescript.mason.masonkit.CharacterData;
				}
				export module TextNode {
					export class FixedLineHeightSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextNode.FixedLineHeightSpan>;
						public chooseHeight(it: string, this_: number, text: number, start: number, end: number, spanstartv: globalAndroid.graphics.Paint.FontMetricsInt, lineHeight: globalAndroid.text.TextPaint): void;
						public constructor(heightDip: number);
						public chooseHeight(it: string, this_: number, text: number, start: number, end: number, spanstartv: globalAndroid.graphics.Paint.FontMetricsInt): void;
					}
					export class RelativeLineHeightSpan {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.TextNode.RelativeLineHeightSpan>;
						public chooseHeight(originalHeight: string, targetHeight: number, diff: number, half: number, fm: number, this_: globalAndroid.graphics.Paint.FontMetricsInt): void;
						public constructor(multiplier: number);
					}
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
						public "getLETTER_SPACING-Zvr9YrE"(): number;
						public "getTRANSFORM-Zvr9YrE"(): number;
						public "getCOLOR-Zvr9YrE"(): number;
						public "getFONT_FAMILY-Zvr9YrE"(): number;
						public "getWHITE_SPACE-Zvr9YrE"(): number;
						public "getDECORATION_THICKNESS-Zvr9YrE"(): number;
						public "getLINE_HEIGHT-Zvr9YrE"(): number;
						public "getTEXT_JUSTIFY-Zvr9YrE"(): number;
						public "getDECORATION_STYLE-Zvr9YrE"(): number;
						public "getSIZE-Zvr9YrE"(): number;
						public "getDECORATION_LINE-Zvr9YrE"(): number;
						public "getTEXT_WRAP-Zvr9YrE"(): number;
						public "getFONT_STYLE_SLANT-Zvr9YrE"(): number;
						public "getDECORATION_COLOR-Zvr9YrE"(): number;
						public "getTEXT_OVERFLOW-Zvr9YrE"(): number;
						public "getVERTICAL_ALIGN-Zvr9YrE"(): number;
						public "getFONT_WEIGHT-Zvr9YrE"(): number;
						public "getFONT_STYLE-Zvr9YrE"(): number;
						public "getTEXT_SHADOWS-Zvr9YrE"(): number;
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
				export class TextStyleChangeMask {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.TextStyleChangeMask>;
					public static INSTANCE: org.nativescript.mason.masonkit.TextStyleChangeMask;
					public static NONE: number = 0;
					public static COLOR: number = 1;
					public static DECORATION_LINE: number = 2;
					public static DECORATION_COLOR: number = 4;
					public static TEXT_ALIGN: number = 8;
					public static TEXT_JUSTIFY: number = 16;
					public static BACKGROUND_COLOR: number = 32;
					public static FONT_SIZE: number = 64;
					public static TEXT_TRANSFORM: number = 128;
					public static FONT_STYLE: number = 256;
					public static FONT_STYLE_SLANT: number = 512;
					public static TEXT_WRAP: number = 1024;
					public static TEXT_OVERFLOW: number = 2048;
					public static DECORATION_STYLE: number = 4096;
					public static WHITE_SPACE: number = 8192;
					public static FONT_WEIGHT: number = 16384;
					public static LINE_HEIGHT: number = 32768;
					public static VERTICAL_ALIGN: number = 65536;
					public static DECORATION_THICKNESS: number = 131072;
					public static TEXT_SHADOW: number = 262144;
					public static FONT_FAMILY: number = 524288;
					public static LETTER_SPACING: number = 1048576;
					public static ALL: number = -1;
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
					public static COLOR_STATE: number = 4;
					public static SIZE: number = 8;
					public static SIZE_TYPE: number = 12;
					public static SIZE_STATE: number = 13;
					public static FONT_WEIGHT: number = 16;
					public static FONT_WEIGHT_STATE: number = 20;
					public static FONT_STYLE_SLANT: number = 24;
					public static FONT_STYLE_TYPE: number = 28;
					public static FONT_STYLE_STATE: number = 29;
					public static FONT_FAMILY_STATE: number = 30;
					public static FONT_RESOLVED_DIRTY: number = 31;
					public static BACKGROUND_COLOR: number = 32;
					public static BACKGROUND_COLOR_STATE: number = 36;
					public static DECORATION_LINE: number = 40;
					public static DECORATION_LINE_STATE: number = 44;
					public static DECORATION_COLOR: number = 48;
					public static DECORATION_COLOR_STATE: number = 52;
					public static DECORATION_STYLE: number = 56;
					public static DECORATION_STYLE_STATE: number = 60;
					public static LETTER_SPACING: number = 64;
					public static LETTER_SPACING_STATE: number = 68;
					public static TEXT_WRAP: number = 72;
					public static TEXT_WRAP_STATE: number = 76;
					public static WHITE_SPACE: number = 80;
					public static WHITE_SPACE_STATE: number = 84;
					public static TRANSFORM: number = 88;
					public static TRANSFORM_STATE: number = 92;
					public static TEXT_ALIGN: number = 96;
					public static TEXT_ALIGN_STATE: number = 100;
					public static TEXT_JUSTIFY: number = 104;
					public static TEXT_JUSTIFY_STATE: number = 108;
					public static TEXT_INDENT: number = 112;
					public static TEXT_INDENT_STATE: number = 116;
					public static TEXT_OVERFLOW: number = 120;
					public static TEXT_OVERFLOW_STATE: number = 124;
					public static LINE_HEIGHT: number = 128;
					public static LINE_HEIGHT_STATE: number = 132;
					public static LINE_HEIGHT_TYPE: number = 133;
					public static DECORATION_THICKNESS: number = 134;
					public static DECORATION_THICKNESS_STATE: number = 138;
					public static TEXT_SHADOW_STATE: number = 139;
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
				export class TextView implements org.nativescript.mason.masonkit.Element, org.nativescript.mason.masonkit.MeasureFunc, org.nativescript.mason.masonkit.TextContainer {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.TextView>;
					public computeMaxContent(): void;
					public onMeasure(layout: number, specWidth: number): void;
					public layout(): org.nativescript.mason.masonkit.Layout;
					public setFontFamily(value: string): void;
					public computeWithViewSize(layout: boolean): void;
					public setTextSize(param0: number): void;
					public getWhiteSpace(): org.nativescript.mason.masonkit.Styles.WhiteSpace;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public prependView(view: globalAndroid.view.View): void;
					public onTextStyleChanged(param0: number): void;
					public replaceChildAt(param0: string, param1: number): void;
					public getDecorationColor(): number;
					public replaceChildAt(text: string, index: number): void;
					public prepend(param0: org.nativescript.mason.masonkit.Node): void;
					public computeMinContent(): void;
					public getFontVariant(): string;
					public setTextWrap(value: org.nativescript.mason.masonkit.Styles.TextWrap): void;
					public compute(): void;
					public setTextContent(value: string): void;
					public getColor(): number;
					public setDecorationLine(value: org.nativescript.mason.masonkit.Styles.DecorationLine): void;
					public getDecorationLine(): org.nativescript.mason.masonkit.Styles.DecorationLine;
					public prepend(param0: org.nativescript.mason.masonkit.Element): void;
					public setTextSize(px: number, this_: number): void;
					public setTextAlign(value: org.nativescript.mason.masonkit.enums.TextAlign): void;
					public prepend(param0: androidNative.Array<string>): void;
					public getTextJustify(): org.nativescript.mason.masonkit.Styles.TextJustify;
					public removeChildAt(index: number): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public prependView(param0: globalAndroid.view.View): void;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public appendView(views: androidNative.Array<globalAndroid.view.View>): void;
					public compute(param0: number, param1: number): void;
					public prepend(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public compute(width: number, height: number): void;
					public computeWithMinContent(): void;
					public isNodeDirty(): boolean;
					public invalidateLayout(param0: boolean): void;
					public append(texts: androidNative.Array<string>): void;
					public getTextContent(): string;
					public getFontStyle(): org.nativescript.mason.masonkit.FontFace.NSCFontStyle;
					public constructor(context: globalAndroid.content.Context);
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet, override: boolean);
					public getDecorationStyle(): org.nativescript.mason.masonkit.Styles.DecorationStyle;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet);
					public onNodeAttached(): void;
					public getEngine(): org.nativescript.mason.masonkit.TextEngine;
					public onNodeDetached(): void;
					public append(node: org.nativescript.mason.masonkit.Node): void;
					public setDecorationColor(value: number): void;
					public markNodeDirty(): void;
					public prepend(element: org.nativescript.mason.masonkit.Element): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public getTextAlign(): org.nativescript.mason.masonkit.enums.TextAlign;
					public getFont(): string;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public setBackgroundColorValue(value: number): void;
					public syncStyle(param0: string, param1: string): void;
					public addChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public measure(knownDimensions: org.nativescript.mason.masonkit.Size<java.lang.Float>, availableSpace: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
					public replaceChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public invalidateLayout(invalidateRoot: boolean): void;
					public getBackgroundColorValue(): number;
					public append(text: string): void;
					public addChildAt(param0: string, param1: number): void;
					public setDecorationStyle(value: org.nativescript.mason.masonkit.Styles.DecorationStyle): void;
					public appendView(param0: globalAndroid.view.View): void;
					public setTextSize(param0: number, param1: number): void;
					public constructor(context: globalAndroid.content.Context, mason: org.nativescript.mason.masonkit.Mason, type: org.nativescript.mason.masonkit.enums.TextType, isAnonymous: boolean);
					public computeWithSize(param0: number, param1: number): void;
					public append(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public append(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public prependView(param0: androidNative.Array<globalAndroid.view.View>): void;
					public setText(param0: string, param1: globalAndroid.widget.TextView.BufferType): void;
					public constructor(context: globalAndroid.content.Context, mason: org.nativescript.mason.masonkit.Mason);
					public getView(): globalAndroid.view.View;
					public configure(param0: any): void;
					public replaceChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public setIncludePadding(value: boolean): void;
					public addChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public getStyle(): org.nativescript.mason.masonkit.Style;
					public removeChildAt(param0: number): void;
					public syncStyle(state: string, textState: string): void;
					public onTextStyleChanged(change: number): void;
					public onCharacterDataChanged$masonkit_release(node: org.nativescript.mason.masonkit.TextNode): void;
					public getLetterSpacingValue(): number;
					public append(param0: org.nativescript.mason.masonkit.Element): void;
					public setLetterSpacingValue(value: number): void;
					public append(param0: org.nativescript.mason.masonkit.Node): void;
					public getFontStretch(): string;
					public setFontWeight(value: org.nativescript.mason.masonkit.FontFace.NSCFontWeight): void;
					public onSizeChanged(it: number, element$iv: number, $i$f$forEach: number, $this$forEach$iv: number): void;
					public computeAndLayout(): org.nativescript.mason.masonkit.Layout;
					public setTextSize(size: number): void;
					public invalidateLayout(): void;
					public getTextValues(): java.nio.ByteBuffer;
					public computeWithViewSize(param0: boolean): void;
					public measure(param0: org.nativescript.mason.masonkit.Size<java.lang.Float>, param1: org.nativescript.mason.masonkit.Size<java.lang.Float>): org.nativescript.mason.masonkit.Size<java.lang.Float>;
					public getTextTransform(): org.nativescript.mason.masonkit.Styles.TextTransform;
					public appendView(view: globalAndroid.view.View): void;
					public getIncludePadding(): boolean;
					public detachTextNode$masonkit_release(node: org.nativescript.mason.masonkit.TextNode): void;
					public prepend(param0: string): void;
					public setTextJustify(value: org.nativescript.mason.masonkit.Styles.TextJustify): void;
					public prepend(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public computeAndLayout(width: number, height: number): org.nativescript.mason.masonkit.Layout;
					public computeAndLayout(param0: number, param1: number): org.nativescript.mason.masonkit.Layout;
					public getFontFamily(): string;
					public addChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public attachAndApply(): void;
					public setFontStretch(value: string): void;
					public setFontStyle(value: org.nativescript.mason.masonkit.FontFace.NSCFontStyle): void;
					public append($this$append_u24lambda_u242: androidNative.Array<any>): void;
					public getBaseline(): number;
					public getPaint(): globalAndroid.text.TextPaint;
					public setWhiteSpace(value: org.nativescript.mason.masonkit.Styles.WhiteSpace): void;
					public computeWithViewSize(): void;
					public computeWithMaxContent(): void;
					public prepend(node: org.nativescript.mason.masonkit.Node): void;
					public attachTextNode$masonkit_release(node: org.nativescript.mason.masonkit.TextNode, index: number): void;
					public append(param0: androidNative.Array<string>): void;
					public getTextWrap(): org.nativescript.mason.masonkit.Styles.TextWrap;
					public setTextTransform(value: org.nativescript.mason.masonkit.Styles.TextTransform): void;
					public getFontFace$masonkit_release(): org.nativescript.mason.masonkit.FontFace;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public setFontSize(value: number): void;
					public configure(block: any): void;
					public append(element: org.nativescript.mason.masonkit.Element): void;
					public setColor(value: number): void;
					public setFontVariant(value: string): void;
					public addChildAt($this$addChildAt_u24lambda_u244: string, index: number): void;
					public prepend(strings: androidNative.Array<string>): void;
					public getValues(): java.nio.ByteBuffer;
					public setFont(value: string): void;
					public prepend(string: string): void;
					public prependView(views: androidNative.Array<globalAndroid.view.View>): void;
					public addChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public getNode(): org.nativescript.mason.masonkit.Node;
					public computeWithSize(width: number, height: number): void;
					public onDraw(canvas: globalAndroid.graphics.Canvas): void;
					public append(param0: string): void;
					public getFontWeight(): org.nativescript.mason.masonkit.FontFace.NSCFontWeight;
					public appendView(param0: androidNative.Array<globalAndroid.view.View>): void;
					public getType(): org.nativescript.mason.masonkit.enums.TextType;
					public getFontSize(): number;
				}
				export module TextView {
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
				export class View implements org.nativescript.mason.masonkit.Element, org.nativescript.mason.masonkit.StyleChangeListener {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.View>;
					public node: org.nativescript.mason.masonkit.Node;
					public computeMaxContent(): void;
					public setMaxSize(width: number, height: number): void;
					public setGridTemplateRows(value: string): void;
					public setMarginWithValueType(value: number, type: number): void;
					public layout(): org.nativescript.mason.masonkit.Layout;
					public getBorderTopWidth(): org.nativescript.mason.masonkit.LengthPercentage;
					public computeWithViewSize(layout: boolean): void;
					public setRowGap(value: number, type: number): void;
					public getGridTemplateRows(): string;
					public setFlexWrap(value: org.nativescript.mason.masonkit.enums.FlexWrap): void;
					public append(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public onTextStyleChanged(param0: number): void;
					public replaceChildAt(param0: string, param1: number): void;
					public replaceChildAt(text: string, index: number): void;
					public getFlexBasis(): org.nativescript.mason.masonkit.Dimension;
					public compute(): void;
					public setPosition(left: number, top: number, right: number, bottom: number): void;
					public setMargin(left: number, leftType: number, top: number, topType: number, right: number, rightType: number, bottom: number, bottomType: number): void;
					public prepend(param0: org.nativescript.mason.masonkit.Element): void;
					public setGridColumnEnd(value: string): void;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public prependView(param0: globalAndroid.view.View): void;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public compute(param0: number, param1: number): void;
					public addChildAt(text: string, index: number): void;
					public getInset(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public getMaxSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public setGridAutoColumns(value: string): void;
					public getFlexGrow(): number;
					public updateNodeAndStyle(): void;
					public invalidateLayout(param0: boolean): void;
					public append(texts: androidNative.Array<string>): void;
					public setAlignContent(value: org.nativescript.mason.masonkit.enums.AlignContent): void;
					public constructor(context: globalAndroid.content.Context);
					public addView(this_: globalAndroid.view.View, child: number): void;
					public getInsetRight(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setBorder(left: number, leftType: number, top: number, topType: number, right: number, rightType: number, bottom: number, bottomType: number): void;
					public setSizeHeight(value: number, type: number): void;
					public setSize(width: org.nativescript.mason.masonkit.Dimension, height: org.nativescript.mason.masonkit.Dimension): void;
					public setJustifyItems(value: org.nativescript.mason.masonkit.enums.JustifyItems): void;
					public addView(this_: globalAndroid.view.View, child: globalAndroid.view.ViewGroup.LayoutParams): void;
					public setInsetWithValueType(value: number, type: number): void;
					public setBorderTop(value: number, type: number): void;
					public setInset(left: number, leftType: number, top: number, topType: number, right: number, rightType: number, bottom: number, bottomType: number): void;
					public getMaxSizeHeight(): org.nativescript.mason.masonkit.Dimension;
					public static createGridView(mason: org.nativescript.mason.masonkit.Mason, context: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
					public setPaddingLeft(value: number, type: number): void;
					public append(node: org.nativescript.mason.masonkit.Node): void;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet, defStyleAttr: number);
					public getStylePaddingLeft(): org.nativescript.mason.masonkit.LengthPercentage;
					public generateDefaultLayoutParams(): globalAndroid.view.ViewGroup.LayoutParams;
					public getMarginJsonValue(): string;
					public prepend(param0: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public getGridRowStart(): string;
					public getInsetJsonValue(): string;
					public setDisplay(value: org.nativescript.mason.masonkit.enums.Display): void;
					public setBorderLeft(value: number, type: number): void;
					public checkLayoutParams(p: globalAndroid.view.ViewGroup.LayoutParams): boolean;
					public replaceChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public setFlexShrink(value: number): void;
					public getMarginRight(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setMinSizeHeight(value: number, type: number): void;
					public setNode(value: org.nativescript.mason.masonkit.Node): void;
					public dispatchDraw(canvas: globalAndroid.graphics.Canvas): void;
					public setPaddingBottom(value: number, type: number): void;
					public replaceChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public getGridTemplateColumns(): string;
					public setMinSizeWidth(value: number, type: number): void;
					public setGapColumn(value: number, type: number): void;
					public appendView(param0: globalAndroid.view.View): void;
					public applyLayoutParams($i$f$getSize: org.nativescript.mason.masonkit.View.LayoutParams, $this$size$iv: org.nativescript.mason.masonkit.Node, points: globalAndroid.view.View): void;
					public computeWithSize(param0: number, param1: number): void;
					public setMargin(left: org.nativescript.mason.masonkit.LengthPercentageAuto, top: org.nativescript.mason.masonkit.LengthPercentageAuto, right: org.nativescript.mason.masonkit.LengthPercentageAuto, bottom: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
					public getInsetLeft(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getAlignItems(): org.nativescript.mason.masonkit.enums.AlignItems;
					public append(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public prependView(param0: androidNative.Array<globalAndroid.view.View>): void;
					public removeViews(this_: number, start: number): void;
					public setColumnGap(value: number, type: number): void;
					public setFlexBasis(value: org.nativescript.mason.masonkit.Dimension): void;
					public replaceChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public setGridTemplateColumns(value: string): void;
					public getMarginBottom(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setMargin(left: number, top: number, right: number, bottom: number): void;
					public generateLayoutParams(p: globalAndroid.view.ViewGroup.LayoutParams): globalAndroid.view.ViewGroup.LayoutParams;
					public getInsetCssValue(): string;
					public getOverflowX(): org.nativescript.mason.masonkit.enums.Overflow;
					public onLayout(this_: boolean, changed: number, l: number, t: number, r: number): void;
					public getMaxSizeJsonValue(): string;
					public getGridRowEnd(): string;
					public setGridRowEnd(value: string): void;
					public setJustifyContent(value: org.nativescript.mason.masonkit.enums.JustifyContent): void;
					public setMaxSizeHeight(value: number, type: number): void;
					public setGap(width: number, widthType: number, height: number, heightType: number): void;
					public setInsetLeft(value: number, type: number): void;
					public getStylePaddingRight(): org.nativescript.mason.masonkit.LengthPercentage;
					public onSizeChanged(it: number, element$iv: number, $i$f$forEach: number, $this$forEach$iv: number): void;
					public setOverflow(value: org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.enums.Overflow>): void;
					public setPosition(value: org.nativescript.mason.masonkit.enums.Position): void;
					public computeAndLayout(): org.nativescript.mason.masonkit.Layout;
					public computeWithViewSize(param0: boolean): void;
					public setFlexGrow(value: number): void;
					public removeViewAt(index: number): void;
					public setOverflowY(value: org.nativescript.mason.masonkit.enums.Overflow): void;
					public static createBlockView(mason: org.nativescript.mason.masonkit.Mason, context: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
					public setGapRow(value: number, type: number): void;
					public getMargin(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentageAuto>;
					public getPaddingCssValue(): string;
					public getBorderLeftWidth(): org.nativescript.mason.masonkit.LengthPercentage;
					public setMarginLeft(value: number, type: number): void;
					public prepend(param0: string): void;
					public getGapRow(): org.nativescript.mason.masonkit.LengthPercentage;
					public getJustifyContent(): org.nativescript.mason.masonkit.enums.JustifyContent;
					public setInsetTop(value: number, type: number): void;
					public setMarginTop(value: number, type: number): void;
					public attachAndApply(): void;
					public getAlignSelf(): org.nativescript.mason.masonkit.enums.AlignSelf;
					public getGridAutoRows(): string;
					public computeWithMaxContent(): void;
					public setPaddingWithValueType(value: number, type: number): void;
					public setOverflowX(value: org.nativescript.mason.masonkit.enums.Overflow): void;
					public getInsetTop(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getSizeCssValue(): string;
					public append(param0: androidNative.Array<string>): void;
					public getAspectRatio(): java.lang.Float;
					public setFlexBasis(value: number, type: number): void;
					public setMarginRight(value: number, type: number): void;
					public prepend(string: string): void;
					public getPaddingJsonValue(): string;
					public getFlexShrink(): number;
					public removeAllViews(): void;
					public getMarginTop(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public getNode(): org.nativescript.mason.masonkit.Node;
					public computeWithSize(width: number, height: number): void;
					public getScrollBarWidth(): number;
					public getMinSizeJsonValue(): string;
					public appendView(param0: androidNative.Array<globalAndroid.view.View>): void;
					public getStyleAsString(): string;
					public setBorder(left: org.nativescript.mason.masonkit.LengthPercentage, top: org.nativescript.mason.masonkit.LengthPercentage, right: org.nativescript.mason.masonkit.LengthPercentage, bottom: org.nativescript.mason.masonkit.LengthPercentage): void;
					public getOverflowY(): org.nativescript.mason.masonkit.enums.Overflow;
					public getGridColumn(): string;
					public getBorderWidth(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public getBorderRightWidth(): org.nativescript.mason.masonkit.LengthPercentage;
					public getGap(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.LengthPercentage>;
					public removeViewInLayout(view: globalAndroid.view.View): void;
					public prependView(view: globalAndroid.view.View): void;
					public setSize(width: number, height: number): void;
					public setBorderBottom(value: number, type: number): void;
					public prepend(param0: org.nativescript.mason.masonkit.Node): void;
					public computeMinContent(): void;
					public getGridColumnStart(): string;
					public getInsetBottom(): org.nativescript.mason.masonkit.LengthPercentageAuto;
					public setFlexDirection(value: org.nativescript.mason.masonkit.enums.FlexDirection): void;
					public prepend(param0: androidNative.Array<string>): void;
					public getBorderCssValue(): string;
					public removeChildAt(index: number): void;
					public constructor($this$_init__u24lambda_u240: globalAndroid.content.Context, this_: org.nativescript.mason.masonkit.Mason);
					public setPaddingRight(value: number, type: number): void;
					public appendView(views: androidNative.Array<globalAndroid.view.View>): void;
					public getMinSizeCssValue(): string;
					public setSize(width: number, widthType: number, height: number, heightType: number): void;
					public prepend(nodes: androidNative.Array<org.nativescript.mason.masonkit.Node>): void;
					public removeViewsInLayout(this_: number, start: number): void;
					public setBorderWidth(left: number, top: number, right: number, bottom: number): void;
					public setMinSize(width: org.nativescript.mason.masonkit.Dimension, height: org.nativescript.mason.masonkit.Dimension): void;
					public setMaxSize(width: org.nativescript.mason.masonkit.Dimension, height: org.nativescript.mason.masonkit.Dimension): void;
					public compute(width: number, height: number): void;
					public isNodeDirty(): boolean;
					public computeWithMinContent(): void;
					public getDisplay(): org.nativescript.mason.masonkit.enums.Display;
					public static createFlexView(mason: org.nativescript.mason.masonkit.Mason, context: globalAndroid.content.Context): org.nativescript.mason.masonkit.View;
					public setSizeWidth(value: number, type: number): void;
					public removeAllViewsInLayout(): void;
					public setPaddingTop(value: number, type: number): void;
					public constructor(context: globalAndroid.content.Context, attrs: globalAndroid.util.AttributeSet);
					public getAlignContent(): org.nativescript.mason.masonkit.enums.AlignContent;
					public onNodeAttached(): void;
					public onMeasure(specHeight: number, specWidthMode: number): void;
					public onNodeDetached(): void;
					public getSizeWidth(): org.nativescript.mason.masonkit.Dimension;
					public setMaxSizeWidth(value: number, type: number): void;
					public markNodeDirty(): void;
					public prepend(element: org.nativescript.mason.masonkit.Element): void;
					public setAlignSelf(value: org.nativescript.mason.masonkit.enums.AlignSelf): void;
					public setGridRowStart(value: string): void;
					public syncStyle(param0: string, param1: string): void;
					public addChildAt(param0: org.nativescript.mason.masonkit.Node, param1: number): void;
					public getPadding(): org.nativescript.mason.masonkit.Rect<org.nativescript.mason.masonkit.LengthPercentage>;
					public setGridRow(value: string): void;
					public invalidateLayout(invalidateRoot: boolean): void;
					public append(text: string): void;
					public addChildAt(param0: string, param1: number): void;
					public setPadding(left: number, top: number, right: number, bottom: number): void;
					public constructor($this$_init__u24lambda_u241: globalAndroid.content.Context, this_: globalAndroid.util.AttributeSet, context: number, attrs: boolean);
					public getJustifyItems(): org.nativescript.mason.masonkit.enums.JustifyItems;
					public getGridAutoColumns(): string;
					public append(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public removeView(this_: globalAndroid.view.View): void;
					public setJustifySelf(value: org.nativescript.mason.masonkit.enums.JustifySelf): void;
					public getSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public getView(): globalAndroid.view.View;
					public configure(param0: any): void;
					public isScrollRoot$masonkit_release(): boolean;
					public setMarginBottom(value: number, type: number): void;
					public getOverflow(): org.nativescript.mason.masonkit.Point<org.nativescript.mason.masonkit.enums.Overflow>;
					public getGridAutoFlow(): org.nativescript.mason.masonkit.enums.GridAutoFlow;
					public addChildAt(node: org.nativescript.mason.masonkit.Node, index: number): void;
					public getStyle(): org.nativescript.mason.masonkit.Style;
					public removeChildAt(param0: number): void;
					public generateLayoutParams(attrs: globalAndroid.util.AttributeSet): globalAndroid.view.ViewGroup.LayoutParams;
					public syncStyle(state: string, textState: string): void;
					public onTextStyleChanged(change: number): void;
					public getGridRow(): string;
					public append(param0: org.nativescript.mason.masonkit.Element): void;
					public append(param0: org.nativescript.mason.masonkit.Node): void;
					public setPosition(left: org.nativescript.mason.masonkit.LengthPercentageAuto, top: org.nativescript.mason.masonkit.LengthPercentageAuto, right: org.nativescript.mason.masonkit.LengthPercentageAuto, bottom: org.nativescript.mason.masonkit.LengthPercentageAuto): void;
					public getMinSizeHeight(): org.nativescript.mason.masonkit.Dimension;
					public getJustifySelf(): org.nativescript.mason.masonkit.enums.JustifySelf;
					public getFlexDirection(): org.nativescript.mason.masonkit.enums.FlexDirection;
					public setDirection(value: org.nativescript.mason.masonkit.enums.Direction): void;
					public invalidateLayout(): void;
					public getStylePaddingTop(): org.nativescript.mason.masonkit.LengthPercentage;
					public setPadding(left: org.nativescript.mason.masonkit.LengthPercentage, top: org.nativescript.mason.masonkit.LengthPercentage, right: org.nativescript.mason.masonkit.LengthPercentage, bottom: org.nativescript.mason.masonkit.LengthPercentage): void;
					public setGap(row: org.nativescript.mason.masonkit.LengthPercentage, column: org.nativescript.mason.masonkit.LengthPercentage): void;
					public getMinSize(): org.nativescript.mason.masonkit.Size<org.nativescript.mason.masonkit.Dimension>;
					public appendView(view: globalAndroid.view.View): void;
					public addView(this_: globalAndroid.view.View): void;
					public setGridAutoFlow(value: org.nativescript.mason.masonkit.enums.GridAutoFlow): void;
					public getMarginCssValue(): string;
					public setGridAutoRows(value: string): void;
					public getBorderBottomWidth(): org.nativescript.mason.masonkit.LengthPercentage;
					public getGapColumn(): org.nativescript.mason.masonkit.LengthPercentage;
					public prepend(elements: androidNative.Array<org.nativescript.mason.masonkit.Element>): void;
					public setBorderRight(value: number, type: number): void;
					public setMaxSize(width: number, widthType: number, height: number, heightType: number): void;
					public setMinSize(width: number, height: number): void;
					public setBorderWithValueType(value: number, type: number): void;
					public getMinSizeWidth(): org.nativescript.mason.masonkit.Dimension;
					public computeAndLayout(width: number, height: number): org.nativescript.mason.masonkit.Layout;
					public getGridColumnEnd(): string;
					public computeAndLayout(param0: number, param1: number): org.nativescript.mason.masonkit.Layout;
					public addChildAt(param0: org.nativescript.mason.masonkit.Element, param1: number): void;
					public getBorderJsonValue(): string;
					public setGridColumnStart(value: string): void;
					public getFlexWrap(): org.nativescript.mason.masonkit.enums.FlexWrap;
					public getMaxSizeCssValue(): string;
					public setInsetBottom(value: number, type: number): void;
					public computeWithViewSize(): void;
					public getDirection(): org.nativescript.mason.masonkit.enums.Direction;
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
					public setAlignItems(value: org.nativescript.mason.masonkit.enums.AlignItems): void;
					public setAspectRatio(value: java.lang.Float): void;
					public setGridColumn(value: string): void;
					public getMaxSizeWidth(): org.nativescript.mason.masonkit.Dimension;
					public prepend(strings: androidNative.Array<string>): void;
					public setScrollRoot$masonkit_release(value: boolean): void;
					public prependView(views: androidNative.Array<globalAndroid.view.View>): void;
					public getPosition(): org.nativescript.mason.masonkit.enums.Position;
					public addChildAt(element: org.nativescript.mason.masonkit.Element, index: number): void;
					public setMinSize(width: number, widthType: number, height: number, heightType: number): void;
					public getSizeJsonValue(): string;
					public onDraw(canvas: globalAndroid.graphics.Canvas): void;
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

declare module org {
	export module nativescript {
		export module mason {
			export module masonkit {
				export class ViewUtils {
					public static class: java.lang.Class<org.nativescript.mason.masonkit.ViewUtils>;
					public constructor();
				}
				export module ViewUtils {
					export class Companion {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.ViewUtils.Companion>;
						public onDraw(view: globalAndroid.view.View, canvas: globalAndroid.graphics.Canvas, style: org.nativescript.mason.masonkit.Style, superDraw: any): void;
						public dispatchDraw(view: globalAndroid.view.View, canvas: globalAndroid.graphics.Canvas, style: org.nativescript.mason.masonkit.Style, superDraw: any): void;
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
				export module enums {
					export class Align {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Align>;
						public static Auto: org.nativescript.mason.masonkit.enums.Align;
						public static Left: org.nativescript.mason.masonkit.enums.Align;
						public static Right: org.nativescript.mason.masonkit.enums.Align;
						public static Center: org.nativescript.mason.masonkit.enums.Align;
						public static getEntries(): any;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.Align;
						public getCssValue(): string;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.Align>;
						public getValue(): number;
					}
					export module Align {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Align.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.Align;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Align.WhenMappings>;
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
				export module enums {
					export class AlignContent {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.AlignContent>;
						public static Normal: org.nativescript.mason.masonkit.enums.AlignContent;
						public static Start: org.nativescript.mason.masonkit.enums.AlignContent;
						public static End: org.nativescript.mason.masonkit.enums.AlignContent;
						public static Center: org.nativescript.mason.masonkit.enums.AlignContent;
						public static Stretch: org.nativescript.mason.masonkit.enums.AlignContent;
						public static SpaceBetween: org.nativescript.mason.masonkit.enums.AlignContent;
						public static SpaceAround: org.nativescript.mason.masonkit.enums.AlignContent;
						public static SpaceEvenly: org.nativescript.mason.masonkit.enums.AlignContent;
						public static FlexStart: org.nativescript.mason.masonkit.enums.AlignContent;
						public static FlexEnd: org.nativescript.mason.masonkit.enums.AlignContent;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.AlignContent;
						public getCssValue(): string;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.AlignContent>;
						public static getEntries(): any;
						public getValue(): number;
					}
					export module AlignContent {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.AlignContent.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.AlignContent;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.AlignContent.WhenMappings>;
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
				export module enums {
					export class AlignItems {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.AlignItems>;
						public static Normal: org.nativescript.mason.masonkit.enums.AlignItems;
						public static Start: org.nativescript.mason.masonkit.enums.AlignItems;
						public static End: org.nativescript.mason.masonkit.enums.AlignItems;
						public static Center: org.nativescript.mason.masonkit.enums.AlignItems;
						public static Baseline: org.nativescript.mason.masonkit.enums.AlignItems;
						public static Stretch: org.nativescript.mason.masonkit.enums.AlignItems;
						public static FlexStart: org.nativescript.mason.masonkit.enums.AlignItems;
						public static FlexEnd: org.nativescript.mason.masonkit.enums.AlignItems;
						public static getEntries(): any;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.AlignItems;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.AlignItems>;
						public getCssValue(): string;
						public getValue(): number;
					}
					export module AlignItems {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.AlignItems.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.AlignItems;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.AlignItems.WhenMappings>;
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
				export module enums {
					export class AlignSelf {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.AlignSelf>;
						public static Normal: org.nativescript.mason.masonkit.enums.AlignSelf;
						public static Start: org.nativescript.mason.masonkit.enums.AlignSelf;
						public static End: org.nativescript.mason.masonkit.enums.AlignSelf;
						public static Center: org.nativescript.mason.masonkit.enums.AlignSelf;
						public static Baseline: org.nativescript.mason.masonkit.enums.AlignSelf;
						public static Stretch: org.nativescript.mason.masonkit.enums.AlignSelf;
						public static FlexStart: org.nativescript.mason.masonkit.enums.AlignSelf;
						public static FlexEnd: org.nativescript.mason.masonkit.enums.AlignSelf;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.AlignSelf;
						public static getEntries(): any;
						public getCssValue(): string;
						public getValue(): number;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.AlignSelf>;
					}
					export module AlignSelf {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.AlignSelf.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.AlignSelf;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.AlignSelf.WhenMappings>;
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
				export module enums {
					export class BorderStyle {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.BorderStyle>;
						public static None: org.nativescript.mason.masonkit.enums.BorderStyle;
						public static Hidden: org.nativescript.mason.masonkit.enums.BorderStyle;
						public static Dotted: org.nativescript.mason.masonkit.enums.BorderStyle;
						public static Dashed: org.nativescript.mason.masonkit.enums.BorderStyle;
						public static Solid: org.nativescript.mason.masonkit.enums.BorderStyle;
						public static Double: org.nativescript.mason.masonkit.enums.BorderStyle;
						public static Groove: org.nativescript.mason.masonkit.enums.BorderStyle;
						public static Ridge: org.nativescript.mason.masonkit.enums.BorderStyle;
						public static Inset: org.nativescript.mason.masonkit.enums.BorderStyle;
						public static Outset: org.nativescript.mason.masonkit.enums.BorderStyle;
						public static getEntries(): any;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.BorderStyle>;
						public getValue(): number;
						public getCss(): string;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.BorderStyle;
					}
					export module BorderStyle {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.BorderStyle.Companion>;
							public isValid(value: string): boolean;
							public fromName(value: string): org.nativescript.mason.masonkit.enums.BorderStyle;
							public getCssNames$masonkit_release(): java.util.List<string>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.BorderStyle;
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
				export module enums {
					export class BoxSizing {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.BoxSizing>;
						public static BorderBox: org.nativescript.mason.masonkit.enums.BoxSizing;
						public static ContentBox: org.nativescript.mason.masonkit.enums.BoxSizing;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.BoxSizing>;
						public static getEntries(): any;
						public getCssValue(): string;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.BoxSizing;
						public getValue(): number;
					}
					export module BoxSizing {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.BoxSizing.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.BoxSizing;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.BoxSizing.WhenMappings>;
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
				export module enums {
					export class Clear {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Clear>;
						public static None: org.nativescript.mason.masonkit.enums.Clear;
						public static Left: org.nativescript.mason.masonkit.enums.Clear;
						public static Right: org.nativescript.mason.masonkit.enums.Clear;
						public static Both: org.nativescript.mason.masonkit.enums.Clear;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.Clear>;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.Clear;
						public getValue(): number;
						public static getEntries(): any;
					}
					export module Clear {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Clear.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.Clear;
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
				export module enums {
					export class Direction {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Direction>;
						public static Inherit: org.nativescript.mason.masonkit.enums.Direction;
						public static LTR: org.nativescript.mason.masonkit.enums.Direction;
						public static RTL: org.nativescript.mason.masonkit.enums.Direction;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.Direction>;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.Direction;
						public getCssValue(): string;
						public static getEntries(): any;
						public getValue(): number;
					}
					export module Direction {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Direction.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.Direction;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Direction.WhenMappings>;
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
				export module enums {
					export class Display {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Display>;
						public static None: org.nativescript.mason.masonkit.enums.Display;
						public static Flex: org.nativescript.mason.masonkit.enums.Display;
						public static Grid: org.nativescript.mason.masonkit.enums.Display;
						public static Block: org.nativescript.mason.masonkit.enums.Display;
						public static Inline: org.nativescript.mason.masonkit.enums.Display;
						public static InlineBlock: org.nativescript.mason.masonkit.enums.Display;
						public static InlineFlex: org.nativescript.mason.masonkit.enums.Display;
						public static InlineGrid: org.nativescript.mason.masonkit.enums.Display;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.Display;
						public static getEntries(): any;
						public getCssValue(): string;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.Display>;
						public getValue(): number;
					}
					export module Display {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Display.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.Display;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Display.WhenMappings>;
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
				export module enums {
					export class DisplayMode {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.DisplayMode>;
						public static None: org.nativescript.mason.masonkit.enums.DisplayMode;
						public static Inline: org.nativescript.mason.masonkit.enums.DisplayMode;
						public static Box: org.nativescript.mason.masonkit.enums.DisplayMode;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.DisplayMode;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.DisplayMode>;
						public getValue(): number;
						public static getEntries(): any;
					}
					export module DisplayMode {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.DisplayMode.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.DisplayMode;
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
				export module enums {
					export class FlexDirection {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.FlexDirection>;
						public static Row: org.nativescript.mason.masonkit.enums.FlexDirection;
						public static Column: org.nativescript.mason.masonkit.enums.FlexDirection;
						public static RowReverse: org.nativescript.mason.masonkit.enums.FlexDirection;
						public static ColumnReverse: org.nativescript.mason.masonkit.enums.FlexDirection;
						public static getEntries(): any;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.FlexDirection;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.FlexDirection>;
						public getCssValue(): string;
						public getValue(): number;
					}
					export module FlexDirection {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.FlexDirection.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.FlexDirection;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.FlexDirection.WhenMappings>;
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
				export module enums {
					export class FlexWrap {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.FlexWrap>;
						public static NoWrap: org.nativescript.mason.masonkit.enums.FlexWrap;
						public static Wrap: org.nativescript.mason.masonkit.enums.FlexWrap;
						public static WrapReverse: org.nativescript.mason.masonkit.enums.FlexWrap;
						public static getEntries(): any;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.FlexWrap;
						public getCssValue(): string;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.FlexWrap>;
						public getValue(): number;
					}
					export module FlexWrap {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.FlexWrap.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.FlexWrap;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.FlexWrap.WhenMappings>;
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
				export module enums {
					export class Float {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Float>;
						public static None: org.nativescript.mason.masonkit.enums.Float;
						public static Left: org.nativescript.mason.masonkit.enums.Float;
						public static Right: org.nativescript.mason.masonkit.enums.Float;
						public static getEntries(): any;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.Float>;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.Float;
						public getValue(): number;
					}
					export module Float {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Float.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.Float;
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
				export module enums {
					export class GridAutoFlow {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.GridAutoFlow>;
						public static Row: org.nativescript.mason.masonkit.enums.GridAutoFlow;
						public static Column: org.nativescript.mason.masonkit.enums.GridAutoFlow;
						public static RowDense: org.nativescript.mason.masonkit.enums.GridAutoFlow;
						public static ColumnDense: org.nativescript.mason.masonkit.enums.GridAutoFlow;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.GridAutoFlow;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.GridAutoFlow>;
						public static getEntries(): any;
						public getCssValue(): string;
						public getValue(): number;
					}
					export module GridAutoFlow {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.GridAutoFlow.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.GridAutoFlow;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.GridAutoFlow.WhenMappings>;
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
				export module enums {
					export class JustifyContent {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.JustifyContent>;
						public static Normal: org.nativescript.mason.masonkit.enums.JustifyContent;
						public static Start: org.nativescript.mason.masonkit.enums.JustifyContent;
						public static End: org.nativescript.mason.masonkit.enums.JustifyContent;
						public static Center: org.nativescript.mason.masonkit.enums.JustifyContent;
						public static Stretch: org.nativescript.mason.masonkit.enums.JustifyContent;
						public static SpaceBetween: org.nativescript.mason.masonkit.enums.JustifyContent;
						public static SpaceAround: org.nativescript.mason.masonkit.enums.JustifyContent;
						public static SpaceEvenly: org.nativescript.mason.masonkit.enums.JustifyContent;
						public static FlexStart: org.nativescript.mason.masonkit.enums.JustifyContent;
						public static FlexEnd: org.nativescript.mason.masonkit.enums.JustifyContent;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.JustifyContent;
						public getCssValue(): string;
						public static getEntries(): any;
						public getValue(): number;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.JustifyContent>;
					}
					export module JustifyContent {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.JustifyContent.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.JustifyContent;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.JustifyContent.WhenMappings>;
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
				export module enums {
					export class JustifyItems {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.JustifyItems>;
						public static Normal: org.nativescript.mason.masonkit.enums.JustifyItems;
						public static Start: org.nativescript.mason.masonkit.enums.JustifyItems;
						public static End: org.nativescript.mason.masonkit.enums.JustifyItems;
						public static Center: org.nativescript.mason.masonkit.enums.JustifyItems;
						public static Baseline: org.nativescript.mason.masonkit.enums.JustifyItems;
						public static Stretch: org.nativescript.mason.masonkit.enums.JustifyItems;
						public static FlexStart: org.nativescript.mason.masonkit.enums.JustifyItems;
						public static FlexEnd: org.nativescript.mason.masonkit.enums.JustifyItems;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.JustifyItems;
						public getCssValue(): string;
						public static getEntries(): any;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.JustifyItems>;
						public getValue(): number;
					}
					export module JustifyItems {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.JustifyItems.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.JustifyItems;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.JustifyItems.WhenMappings>;
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
				export module enums {
					export class JustifySelf {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.JustifySelf>;
						public static Normal: org.nativescript.mason.masonkit.enums.JustifySelf;
						public static Start: org.nativescript.mason.masonkit.enums.JustifySelf;
						public static End: org.nativescript.mason.masonkit.enums.JustifySelf;
						public static Center: org.nativescript.mason.masonkit.enums.JustifySelf;
						public static Baseline: org.nativescript.mason.masonkit.enums.JustifySelf;
						public static Stretch: org.nativescript.mason.masonkit.enums.JustifySelf;
						public static FlexStart: org.nativescript.mason.masonkit.enums.JustifySelf;
						public static FlexEnd: org.nativescript.mason.masonkit.enums.JustifySelf;
						public static getEntries(): any;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.JustifySelf>;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.JustifySelf;
						public getCssValue(): string;
						public getValue(): number;
					}
					export module JustifySelf {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.JustifySelf.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.JustifySelf;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.JustifySelf.WhenMappings>;
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
				export module enums {
					export class ObjectFit {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.ObjectFit>;
						public static Contain: org.nativescript.mason.masonkit.enums.ObjectFit;
						public static Cover: org.nativescript.mason.masonkit.enums.ObjectFit;
						public static Fill: org.nativescript.mason.masonkit.enums.ObjectFit;
						public static None: org.nativescript.mason.masonkit.enums.ObjectFit;
						public static ScaleDown: org.nativescript.mason.masonkit.enums.ObjectFit;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.ObjectFit;
						public static getEntries(): any;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.ObjectFit>;
						public getValue(): number;
					}
					export module ObjectFit {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.ObjectFit.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.ObjectFit;
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
				export module enums {
					export class Overflow {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Overflow>;
						public static Visible: org.nativescript.mason.masonkit.enums.Overflow;
						public static Hidden: org.nativescript.mason.masonkit.enums.Overflow;
						public static Scroll: org.nativescript.mason.masonkit.enums.Overflow;
						public static Clip: org.nativescript.mason.masonkit.enums.Overflow;
						public static Auto: org.nativescript.mason.masonkit.enums.Overflow;
						public static getEntries(): any;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.Overflow;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.Overflow>;
						public getCssValue(): string;
						public getValue(): number;
					}
					export module Overflow {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Overflow.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.Overflow;
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
				export module enums {
					export class Position {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Position>;
						public static Relative: org.nativescript.mason.masonkit.enums.Position;
						public static Absolute: org.nativescript.mason.masonkit.enums.Position;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.Position>;
						public static getEntries(): any;
						public getCssValue(): string;
						public getValue(): number;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.Position;
					}
					export module Position {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Position.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.Position;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.Position.WhenMappings>;
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
				export module enums {
					export class TextAlign {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.TextAlign>;
						public static Auto: org.nativescript.mason.masonkit.enums.TextAlign;
						public static Left: org.nativescript.mason.masonkit.enums.TextAlign;
						public static Right: org.nativescript.mason.masonkit.enums.TextAlign;
						public static Center: org.nativescript.mason.masonkit.enums.TextAlign;
						public static Justify: org.nativescript.mason.masonkit.enums.TextAlign;
						public static Start: org.nativescript.mason.masonkit.enums.TextAlign;
						public static End: org.nativescript.mason.masonkit.enums.TextAlign;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.TextAlign>;
						public static getEntries(): any;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.TextAlign;
						public getCssValue(): string;
						public getValue(): number;
					}
					export module TextAlign {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.TextAlign.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.TextAlign;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.TextAlign.WhenMappings>;
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
				export module enums {
					export class TextType {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.TextType>;
						public static None: org.nativescript.mason.masonkit.enums.TextType;
						public static P: org.nativescript.mason.masonkit.enums.TextType;
						public static Span: org.nativescript.mason.masonkit.enums.TextType;
						public static Code: org.nativescript.mason.masonkit.enums.TextType;
						public static H1: org.nativescript.mason.masonkit.enums.TextType;
						public static H2: org.nativescript.mason.masonkit.enums.TextType;
						public static H3: org.nativescript.mason.masonkit.enums.TextType;
						public static H4: org.nativescript.mason.masonkit.enums.TextType;
						public static H5: org.nativescript.mason.masonkit.enums.TextType;
						public static H6: org.nativescript.mason.masonkit.enums.TextType;
						public static Li: org.nativescript.mason.masonkit.enums.TextType;
						public static Blockquote: org.nativescript.mason.masonkit.enums.TextType;
						public static B: org.nativescript.mason.masonkit.enums.TextType;
						public static Pre: org.nativescript.mason.masonkit.enums.TextType;
						public static Strong: org.nativescript.mason.masonkit.enums.TextType;
						public static Em: org.nativescript.mason.masonkit.enums.TextType;
						public static I: org.nativescript.mason.masonkit.enums.TextType;
						public getCssValue(): string;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.TextType;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.TextType>;
						public static getEntries(): any;
						public getValue(): number;
					}
					export module TextType {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.TextType.Companion>;
							public fromInt(value: number): org.nativescript.mason.masonkit.enums.TextType;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.TextType.WhenMappings>;
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
				export module enums {
					export class VerticalAlign {
						public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.VerticalAlign>;
						public static Baseline: org.nativescript.mason.masonkit.enums.VerticalAlign;
						public static Length: org.nativescript.mason.masonkit.enums.VerticalAlign;
						public static Percent: org.nativescript.mason.masonkit.enums.VerticalAlign;
						public static Sub: org.nativescript.mason.masonkit.enums.VerticalAlign;
						public static Super: org.nativescript.mason.masonkit.enums.VerticalAlign;
						public static Top: org.nativescript.mason.masonkit.enums.VerticalAlign;
						public static TextTop: org.nativescript.mason.masonkit.enums.VerticalAlign;
						public static Middle: org.nativescript.mason.masonkit.enums.VerticalAlign;
						public static Bottom: org.nativescript.mason.masonkit.enums.VerticalAlign;
						public static TextBottom: org.nativescript.mason.masonkit.enums.VerticalAlign;
						public static values(): androidNative.Array<org.nativescript.mason.masonkit.enums.VerticalAlign>;
						public static length(value: number): org.nativescript.mason.masonkit.enums.VerticalAlign;
						public static fromTypeValue(type: number, isPercent: boolean, value: number): org.nativescript.mason.masonkit.enums.VerticalAlign;
						public static getEntries(): any;
						public static percent(value: number): org.nativescript.mason.masonkit.enums.VerticalAlign;
						public getType(): number;
						public setValue$masonkit_release(value: number): void;
						public getCssValue(): string;
						public static valueOf(value: string): org.nativescript.mason.masonkit.enums.VerticalAlign;
						public static fromStyle$masonkit_release(style: org.nativescript.mason.masonkit.Style): org.nativescript.mason.masonkit.enums.VerticalAlign;
						public getValue(): number;
					}
					export module VerticalAlign {
						export class Companion {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.VerticalAlign.Companion>;
							public length($this$length_u24lambda_u242: number): org.nativescript.mason.masonkit.enums.VerticalAlign;
							public fromStyle$masonkit_release(ret: org.nativescript.mason.masonkit.Style): org.nativescript.mason.masonkit.enums.VerticalAlign;
							public percent($this$percent_u24lambda_u243: number): org.nativescript.mason.masonkit.enums.VerticalAlign;
							public fromTypeValue($this$fromTypeValue_u24lambda_u240: number, value: boolean, $this$fromTypeValue_u24lambda_u241: number): org.nativescript.mason.masonkit.enums.VerticalAlign;
						}
						export class WhenMappings {
							public static class: java.lang.Class<org.nativescript.mason.masonkit.enums.VerticalAlign.WhenMappings>;
						}
					}
				}
			}
		}
	}
}

//Generics information:
//org.nativescript.mason.masonkit.Line:1
//org.nativescript.mason.masonkit.Point:1
//org.nativescript.mason.masonkit.Rect:1
//org.nativescript.mason.masonkit.Size:1

