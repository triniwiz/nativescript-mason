
declare const enum AvailableSpace_Tag {

	Definite = 0,

	MinContent = 1,

	MaxContent = 2
}

interface CMasonBuffer {
	data: interop.Pointer | interop.Reference<any>;
	size: number;
}
declare var CMasonBuffer: interop.StructType<CMasonBuffer>;

interface CMasonInlineChildSegment {
	node: interop.Pointer | interop.Reference<any>;
	descent: number;
}
declare var CMasonInlineChildSegment: interop.StructType<CMasonInlineChildSegment>;

interface CMasonInlineTextSegment {
	width: number;
	ascent: number;
	descent: number;
}
declare var CMasonInlineTextSegment: interop.StructType<CMasonInlineTextSegment>;

interface CMasonMinMax {
	min_type: number;
	min_value: number;
	max_type: number;
	max_value: number;
}
declare var CMasonMinMax: interop.StructType<CMasonMinMax>;

interface CMasonNonRepeatedTrackSizingFunctionArray {
	array: interop.Pointer | interop.Reference<CMasonMinMax>;
	length: number;
}
declare var CMasonNonRepeatedTrackSizingFunctionArray: interop.StructType<CMasonNonRepeatedTrackSizingFunctionArray>;

declare const enum CMasonSegment_Tag {

	Text = 0,

	InlineChild = 1
}

declare const enum CMasonTrackSizingFunction_Tag {

	Single = 0,

	Repeat = 1
}

declare class GridPlacementCompat extends NSObject {

	static alloc(): GridPlacementCompat; // inherited from NSObject

	static new(): GridPlacementCompat; // inherited from NSObject

	readonly cssValue: string;

	readonly jsonValue: string;

	readonly type: MasonGridPlacementCompatType;

	readonly value: number;

	static readonly Auto: GridPlacementCompat;

	constructor(o: { line: number; });

	constructor(o: { span: number; });

	initWithLine(line: number): this;

	initWithSpan(span: number): this;
}

declare class LineGridPlacementCompat extends NSObject {

	static alloc(): LineGridPlacementCompat; // inherited from NSObject

	static new(): LineGridPlacementCompat; // inherited from NSObject

	readonly end: GridPlacementCompat;

	readonly start: GridPlacementCompat;
}

declare const enum MasonAlignContent {

	Normal = -1,

	Start = 0,

	End = 1,

	Center = 2,

	Stretch = 3,

	SpaceBetween = 4,

	SpaceAround = 5,

	SpaceEvenly = 6,

	FlexStart = 7,

	FlexEnd = 8
}

declare const enum MasonAlignItems {

	Normal = -1,

	Start = 0,

	End = 1,

	Center = 2,

	Baseline = 3,

	Stretch = 4,

	FlexStart = 5,

	FlexEnd = 6
}

declare const enum MasonAlignSelf {

	Normal = -1,

	Start = 0,

	End = 1,

	Center = 2,

	Baseline = 3,

	Stretch = 4,

	FlexStart = 5,

	FlexEnd = 6
}

declare const enum MasonBoxSizing {

	BorderBox = 0,

	ContentBox = 1
}

interface MasonCharacterData {

	data: string;

	length: number;

	appendData(s: string): MasonCharacterData;

	deleteDataWithOffsetCount(offset: number, count: number): MasonCharacterData;

	deleteDataWithRange(range: NSRange): MasonCharacterData;

	insertDataAt(s: string, offset: number): MasonCharacterData;

	replaceDataWithOffsetCountWith(offset: number, count: number, s: string): MasonCharacterData;

	replaceDataWithRangeWith(range: NSRange, s: string): MasonCharacterData;

	substringDataWithOffsetCount(offset: number, count: number): string;
}
declare var MasonCharacterData: {

	prototype: MasonCharacterData;
};

declare const enum MasonDecorationLine {

	None = 0,

	Underline = 1,

	Overline = 2,

	LineThrough = 3
}

declare class MasonDimensionCompat extends NSObject {

	static alloc(): MasonDimensionCompat; // inherited from NSObject

	static new(): MasonDimensionCompat; // inherited from NSObject

	readonly cssValue: string;

	readonly jsonValue: string;

	readonly type: MasonDimensionCompatType;

	readonly value: number;

	static readonly Auto: MasonDimensionCompat;

	static readonly Zero: MasonDimensionCompat;

	constructor(o: { percent: number; });

	constructor(o: { points: number; });

	initWithPercent(percent: number): this;

	initWithPoints(points: number): this;
}

declare const enum MasonDimensionCompatType {

	Auto = 0,

	Points = 1,

	Percent = 2
}

declare class MasonDimensionPointCompat extends NSObject {

	static alloc(): MasonDimensionPointCompat; // inherited from NSObject

	static new(): MasonDimensionPointCompat; // inherited from NSObject

	x: MasonDimensionCompat;

	y: MasonDimensionCompat;
}

declare class MasonDimensionRectCompat extends NSObject {

	static alloc(): MasonDimensionRectCompat; // inherited from NSObject

	static new(): MasonDimensionRectCompat; // inherited from NSObject

	bottom: MasonDimensionCompat;

	left: MasonDimensionCompat;

	right: MasonDimensionCompat;

	top: MasonDimensionCompat;

	constructor();

	init(left: MasonDimensionCompat, right: MasonDimensionCompat, top: MasonDimensionCompat, bottom: MasonDimensionCompat): this;
}

declare class MasonDimensionSizeCompat extends NSObject {

	static alloc(): MasonDimensionSizeCompat; // inherited from NSObject

	static new(): MasonDimensionSizeCompat; // inherited from NSObject

	height: MasonDimensionCompat;

	width: MasonDimensionCompat;
}

declare const enum MasonDirection {

	Inherit = 0,

	LTR = 1,

	RTL = 2
}

declare const enum MasonDisplay {

	None = 0,

	Flex = 1,

	Grid = 2,

	Block = 3,

	Inline = 4,

	InlineBlock = 5,

	InlineFlex = 6,

	InlineGrid = 7
}

declare class MasonDocument extends NSObject {

	static alloc(): MasonDocument; // inherited from NSObject

	static new(): MasonDocument; // inherited from NSObject

	readonly documentElement: MasonElement;

	readonly mason: NSCMason;

	readonly node: MasonNode;

	constructor(o: { mason: NSCMason; });

	initWithMason(instance: NSCMason): this;
}

interface MasonElement extends NSObjectProtocol {

	node: MasonNode;

	style: MasonStyle;

	uiView: UIView;

	addChildAtElement?(element: MasonElement, index: number): void;

	addChildAtNode?(node: MasonNode, index: number): void;

	addChildAtText?(text: string, index: number): void;

	append?(element: MasonElement): void;

	appendWithElements?(elements: NSArray<MasonElement> | MasonElement[]): void;

	appendWithNode?(node: MasonNode): void;

	appendWithNodes?(nodes: NSArray<MasonNode> | MasonNode[]): void;

	appendWithText?(text: string): void;

	appendWithTexts?(texts: NSArray<string> | string[]): void;

	attachAndApply?(): void;

	compute?(): void;

	compute?(width: number, height: number): void;

	computeMaxContent?(): void;

	computeMinContent?(): void;

	computeWithMaxContent?(): void;

	computeWithMinContent?(): void;

	computeWithSize?(width: number, height: number): void;

	computeWithViewSize?(): void;

	computeWithViewSizeWithLayout?(layout: boolean): void;

	configure?(block: (p1: MasonStyle) => void): void;

	isNodeDirty?(): boolean;

	layout?(): MasonLayout;

	markNodeDirty?(): void;

	prepend?(element: MasonElement): void;

	prependWithElements?(elements: NSArray<MasonElement> | MasonElement[]): void;

	prependWithNode?(node: MasonNode): void;

	prependWithNodes?(nodes: NSArray<MasonNode> | MasonNode[]): void;

	prependWithString?(string: string): void;

	prependWithStrings?(strings: NSArray<string> | string[]): void;

	requestLayout?(): void;
}
declare var MasonElement: {

	prototype: MasonElement;
};

declare const enum MasonFlexDirection {

	Row = 0,

	Column = 1,

	RowReverse = 2,

	ColumnReverse = 3
}

declare const enum MasonFlexWrap {

	NoWrap = 0,

	Wrap = 1,

	WrapReverse = 2
}

declare const enum MasonFontStyle {

	Normal = 0,

	Italic = 1,

	Oblique = 2
}

declare const enum MasonGridAutoFlowWrap {

	Row = 0,

	Column = 1,

	RowDense = 2,

	ColumnDense = 3
}

declare const enum MasonGridPlacementCompatType {

	Auto = 0,

	Line = 1,

	Span = 2
}

declare class MasonGridTrackRepetition extends NSObject {

	static Count(value: number): MasonGridTrackRepetition;

	static alloc(): MasonGridTrackRepetition; // inherited from NSObject

	static new(): MasonGridTrackRepetition; // inherited from NSObject

	readonly cssValue: string;

	readonly type: number;

	readonly value: number;

	static readonly AutoFill: MasonGridTrackRepetition;

	static readonly AutoFit: MasonGridTrackRepetition;
}

declare class MasonImg extends UIImageView implements MasonElement {

	static alloc(): MasonImg; // inherited from NSObject

	static appearance(): MasonImg; // inherited from UIAppearance

	/**
	 * @since 8.0
	 */
	static appearanceForTraitCollection(trait: UITraitCollection): MasonImg; // inherited from UIAppearance

	/**
	 * @since 8.0
	 * @deprecated 9.0
	 */
	static appearanceForTraitCollectionWhenContainedIn(trait: UITraitCollection, ContainerClass: typeof NSObject): MasonImg; // inherited from UIAppearance

	/**
	 * @since 9.0
	 */
	static appearanceForTraitCollectionWhenContainedInInstancesOfClasses(trait: UITraitCollection, containerTypes: NSArray<typeof NSObject> | typeof NSObject[]): MasonImg; // inherited from UIAppearance

	/**
	 * @since 5.0
	 * @deprecated 9.0
	 */
	static appearanceWhenContainedIn(ContainerClass: typeof NSObject): MasonImg; // inherited from UIAppearance

	/**
	 * @since 9.0
	 */
	static appearanceWhenContainedInInstancesOfClasses(containerTypes: NSArray<typeof NSObject> | typeof NSObject[]): MasonImg; // inherited from UIAppearance

	static new(): MasonImg; // inherited from NSObject

	didLayout: () => void;

	readonly mason: NSCMason;

	onStateChange: (p1: MasonLoadingState, p2: NSError) => void;

	src: string;

	readonly debugDescription: string; // inherited from NSObjectProtocol

	readonly description: string; // inherited from NSObjectProtocol

	readonly hash: number; // inherited from NSObjectProtocol

	readonly isProxy: boolean; // inherited from NSObjectProtocol

	readonly node: MasonNode; // inherited from MasonElement

	readonly style: MasonStyle; // inherited from MasonElement

	readonly superclass: typeof NSObject; // inherited from NSObjectProtocol

	readonly uiView: UIView; // inherited from MasonElement

	readonly  // inherited from NSObjectProtocol

	addChildAtElement(element: MasonElement, index: number): void;

	addChildAtNode(node: MasonNode, index: number): void;

	addChildAtText(text: string, index: number): void;

	append(element: MasonElement): void;

	appendWithElements(elements: NSArray<MasonElement> | MasonElement[]): void;

	appendWithNode(node: MasonNode): void;

	appendWithNodes(nodes: NSArray<MasonNode> | MasonNode[]): void;

	appendWithText(text: string): void;

	appendWithTexts(texts: NSArray<string> | string[]): void;

	attachAndApply(): void;

	class(): typeof NSObject;

	compute(): void;

	computeMaxContent(): void;

	computeMinContent(): void;

	computeWithMaxContent(): void;

	computeWithMinContent(): void;

	computeWithSize(width: number, height: number): void;

	computeWithViewSize(): void;

	computeWithViewSizeWithLayout(layout: boolean): void;

	configure(block: (p1: MasonStyle) => void): void;

	conformsToProtocol(aProtocol: any /* Protocol */): boolean;

	isEqual(object: any): boolean;

	isKindOfClass(aClass: typeof NSObject): boolean;

	isMemberOfClass(aClass: typeof NSObject): boolean;

	isNodeDirty(): boolean;

	layout(): MasonLayout;

	markNodeDirty(): void;

	performSelector(aSelector: string): any;

	performSelectorWithObject(aSelector: string, object: any): any;

	performSelectorWithObjectWithObject(aSelector: string, object1: any, object2: any): any;

	prepend(element: MasonElement): void;

	prependWithElements(elements: NSArray<MasonElement> | MasonElement[]): void;

	prependWithNode(node: MasonNode): void;

	prependWithNodes(nodes: NSArray<MasonNode> | MasonNode[]): void;

	prependWithString(string: string): void;

	prependWithStrings(strings: NSArray<string> | string[]): void;

	requestLayout(): void;

	respondsToSelector(aSelector: string): boolean;

	retainCount(): number;

	self(): this;

	syncStyle(state: string): void;

	updateImage(image: UIImage): void;
}

declare const enum MasonJustifyContent {

	Normal = -1,

	Start = 0,

	End = 1,

	Center = 2,

	Stretch = 3,

	SpaceBetween = 4,

	SpaceAround = 5,

	SpaceEvenly = 6,

	FlexStart = 7,

	FlexEnd = 8
}

declare const enum MasonJustifyItems {

	Normal = -1,

	Start = 0,

	End = 1,

	Center = 2,

	Baseline = 3,

	Stretch = 4,

	FlexStart = 5,

	FlexEnd = 6
}

declare const enum MasonJustifySelf {

	Normal = -1,

	Start = 0,

	End = 1,

	Center = 2,

	Baseline = 3,

	Stretch = 4,

	FlexStart = 5,

	FlexEnd = 6
}

declare class MasonLayout extends NSObject {

	static alloc(): MasonLayout; // inherited from NSObject

	static new(): MasonLayout; // inherited from NSObject

	readonly children: NSArray<MasonLayout>;

	readonly height: number;

	readonly order: number;

	readonly width: number;

	readonly x: number;

	readonly y: number;

	static readonly zero: MasonLayout;
}

declare class MasonLengthPercentageAutoCompat extends NSObject {

	static alloc(): MasonLengthPercentageAutoCompat; // inherited from NSObject

	static new(): MasonLengthPercentageAutoCompat; // inherited from NSObject

	readonly cssValue: string;

	readonly jsonValue: string;

	readonly type: MasonLengthPercentageAutoCompatType;

	readonly value: number;

	static readonly Auto: MasonLengthPercentageAutoCompat;

	static readonly Zero: MasonLengthPercentageAutoCompat;

	constructor(o: { percent: number; });

	constructor(o: { points: number; });

	initWithPercent(percent: number): this;

	initWithPoints(points: number): this;
}

declare const enum MasonLengthPercentageAutoCompatType {

	Auto = 0,

	Points = 1,

	Percent = 2
}

declare class MasonLengthPercentageAutoPointCompat extends NSObject {

	static alloc(): MasonLengthPercentageAutoPointCompat; // inherited from NSObject

	static new(): MasonLengthPercentageAutoPointCompat; // inherited from NSObject

	x: MasonLengthPercentageAutoCompat;

	y: MasonLengthPercentageAutoCompat;
}

declare class MasonLengthPercentageAutoRectCompat extends NSObject {

	static alloc(): MasonLengthPercentageAutoRectCompat; // inherited from NSObject

	static new(): MasonLengthPercentageAutoRectCompat; // inherited from NSObject

	bottom: MasonLengthPercentageAutoCompat;

	left: MasonLengthPercentageAutoCompat;

	right: MasonLengthPercentageAutoCompat;

	top: MasonLengthPercentageAutoCompat;

	constructor();

	init(left: MasonLengthPercentageAutoCompat, right: MasonLengthPercentageAutoCompat, top: MasonLengthPercentageAutoCompat, bottom: MasonLengthPercentageAutoCompat): this;
}

declare class MasonLengthPercentageAutoSizeCompat extends NSObject {

	static alloc(): MasonLengthPercentageAutoSizeCompat; // inherited from NSObject

	static new(): MasonLengthPercentageAutoSizeCompat; // inherited from NSObject

	height: MasonLengthPercentageAutoCompat;

	width: MasonLengthPercentageAutoCompat;
}

declare class MasonLengthPercentageCompat extends NSObject {

	static alloc(): MasonLengthPercentageCompat; // inherited from NSObject

	static new(): MasonLengthPercentageCompat; // inherited from NSObject

	readonly cssValue: string;

	readonly jsonValue: string;

	readonly type: MasonLengthPercentageCompatType;

	readonly value: number;

	static readonly Zero: MasonLengthPercentageCompat;

	constructor(o: { percent: number; });

	constructor(o: { points: number; });

	initWithPercent(percent: number): this;

	initWithPoints(points: number): this;
}

declare const enum MasonLengthPercentageCompatType {

	Points = 0,

	Percent = 1
}

declare class MasonLengthPercentagePointCompat extends NSObject {

	static alloc(): MasonLengthPercentagePointCompat; // inherited from NSObject

	static new(): MasonLengthPercentagePointCompat; // inherited from NSObject

	x: MasonLengthPercentageCompat;

	y: MasonLengthPercentageCompat;
}

declare class MasonLengthPercentageRectCompat extends NSObject {

	static alloc(): MasonLengthPercentageRectCompat; // inherited from NSObject

	static new(): MasonLengthPercentageRectCompat; // inherited from NSObject

	bottom: MasonLengthPercentageCompat;

	left: MasonLengthPercentageCompat;

	right: MasonLengthPercentageCompat;

	top: MasonLengthPercentageCompat;

	constructor();

	init(left: MasonLengthPercentageCompat, right: MasonLengthPercentageCompat, top: MasonLengthPercentageCompat, bottom: MasonLengthPercentageCompat): this;
}

declare class MasonLengthPercentageSizeCompat extends NSObject {

	static alloc(): MasonLengthPercentageSizeCompat; // inherited from NSObject

	static new(): MasonLengthPercentageSizeCompat; // inherited from NSObject

	height: MasonLengthPercentageCompat;

	width: MasonLengthPercentageCompat;
}

declare const enum MasonLineHeight {

	Normal = 0,

	Pre = 1,

	PreWrap = 2,

	PreLine = 3
}

declare const enum MasonLoadingState {

	Loading = 0,

	Loaded = 1,

	Error = 2
}

declare class MasonNode extends NSObject {

	static alloc(): MasonNode; // inherited from NSObject

	static new(): MasonNode; // inherited from NSObject

	readonly computedLayout: MasonLayout;

	readonly document: MasonDocument;

	inBatch: boolean;

	readonly isDirty: boolean;

	readonly mason: NSCMason;

	readonly nativePtr: interop.Pointer | interop.Reference<any>;

	readonly parent: MasonNode;

	readonly parentElement: MasonElement;

	readonly parentNode: MasonNode;

	readonly type: MasonNodeType;

	constructor(o: { mason: NSCMason; children: NSArray<MasonNode> | MasonNode[]; });

	appendChild(child: MasonNode): void;

	getChildren(): NSArray<MasonNode>;

	getLayoutChildren(): NSArray<MasonNode>;

	getRoot(): UIView;

	getRootNode(): MasonNode;

	initWithMasonChildren(doc: NSCMason, nodes: NSArray<MasonNode> | MasonNode[]): this;

	markDirty(): void;

	setChildrenWithValue(value: NSArray<MasonNode> | MasonNode[]): void;
}

declare const enum MasonNodeType {

	Element = 0,

	Text = 1,

	Document = 2
}

declare const enum MasonOverflow {

	Visible = 0,

	Hidden = 1,

	Scroll = 2,

	Clip = 3,

	Auto = 4
}

declare class MasonOverflowPointCompat extends NSObject {

	static alloc(): MasonOverflowPointCompat; // inherited from NSObject

	static new(): MasonOverflowPointCompat; // inherited from NSObject

	readonly cssValue: string;

	x: MasonOverflow;

	y: MasonOverflow;
}

declare const enum MasonPosition {

	Relative = 0,

	Absolute = 1
}

declare class MasonScroll extends UIScrollView implements MasonElement, UIScrollViewDelegate {

	static alloc(): MasonScroll; // inherited from NSObject

	static appearance(): MasonScroll; // inherited from UIAppearance

	/**
	 * @since 8.0
	 */
	static appearanceForTraitCollection(trait: UITraitCollection): MasonScroll; // inherited from UIAppearance

	/**
	 * @since 8.0
	 * @deprecated 9.0
	 */
	static appearanceForTraitCollectionWhenContainedIn(trait: UITraitCollection, ContainerClass: typeof NSObject): MasonScroll; // inherited from UIAppearance

	/**
	 * @since 9.0
	 */
	static appearanceForTraitCollectionWhenContainedInInstancesOfClasses(trait: UITraitCollection, containerTypes: NSArray<typeof NSObject> | typeof NSObject[]): MasonScroll; // inherited from UIAppearance

	/**
	 * @since 5.0
	 * @deprecated 9.0
	 */
	static appearanceWhenContainedIn(ContainerClass: typeof NSObject): MasonScroll; // inherited from UIAppearance

	/**
	 * @since 9.0
	 */
	static appearanceWhenContainedInInstancesOfClasses(containerTypes: NSArray<typeof NSObject> | typeof NSObject[]): MasonScroll; // inherited from UIAppearance

	static new(): MasonScroll; // inherited from NSObject

	readonly mason: NSCMason;

	readonly debugDescription: string; // inherited from NSObjectProtocol

	readonly description: string; // inherited from NSObjectProtocol

	readonly hash: number; // inherited from NSObjectProtocol

	readonly isProxy: boolean; // inherited from NSObjectProtocol

	readonly node: MasonNode; // inherited from MasonElement

	readonly style: MasonStyle; // inherited from MasonElement

	readonly superclass: typeof NSObject; // inherited from NSObjectProtocol

	readonly uiView: UIView; // inherited from MasonElement

	readonly  // inherited from NSObjectProtocol

	addChildAtElement(element: MasonElement, index: number): void;

	addChildAtNode(node: MasonNode, index: number): void;

	addChildAtText(text: string, index: number): void;

	addView(view: UIView): void;

	addViewAt(view: UIView, at: number): void;

	append(element: MasonElement): void;

	appendWithElements(elements: NSArray<MasonElement> | MasonElement[]): void;

	appendWithNode(node: MasonNode): void;

	appendWithNodes(nodes: NSArray<MasonNode> | MasonNode[]): void;

	appendWithText(text: string): void;

	appendWithTexts(texts: NSArray<string> | string[]): void;

	attachAndApply(): void;

	class(): typeof NSObject;

	compute(): void;

	computeMaxContent(): void;

	computeMinContent(): void;

	computeWithMaxContent(): void;

	computeWithMinContent(): void;

	computeWithSize(width: number, height: number): void;

	computeWithViewSize(): void;

	computeWithViewSizeWithLayout(layout: boolean): void;

	configure(block: (p1: MasonStyle) => void): void;

	conformsToProtocol(aProtocol: any /* Protocol */): boolean;

	isEqual(object: any): boolean;

	isKindOfClass(aClass: typeof NSObject): boolean;

	isMemberOfClass(aClass: typeof NSObject): boolean;

	isNodeDirty(): boolean;

	layout(): MasonLayout;

	markNodeDirty(): void;

	performSelector(aSelector: string): any;

	performSelectorWithObject(aSelector: string, object: any): any;

	performSelectorWithObjectWithObject(aSelector: string, object1: any, object2: any): any;

	prepend(element: MasonElement): void;

	prependWithElements(elements: NSArray<MasonElement> | MasonElement[]): void;

	prependWithNode(node: MasonNode): void;

	prependWithNodes(nodes: NSArray<MasonNode> | MasonNode[]): void;

	prependWithString(string: string): void;

	prependWithStrings(strings: NSArray<string> | string[]): void;

	requestLayout(): void;

	respondsToSelector(aSelector: string): boolean;

	retainCount(): number;

	/**
	 * @since 11.0
	 */
	scrollViewDidChangeAdjustedContentInset(scrollView: UIScrollView): void;

	scrollViewDidEndDecelerating(scrollView: UIScrollView): void;

	scrollViewDidEndDraggingWillDecelerate(scrollView: UIScrollView, decelerate: boolean): void;

	scrollViewDidEndScrollingAnimation(scrollView: UIScrollView): void;

	scrollViewDidEndZoomingWithViewAtScale(scrollView: UIScrollView, view: UIView, scale: number): void;

	scrollViewDidScroll(scrollView: UIScrollView): void;

	scrollViewDidScrollToTop(scrollView: UIScrollView): void;

	/**
	 * @since 3.2
	 */
	scrollViewDidZoom(scrollView: UIScrollView): void;

	scrollViewShouldScrollToTop(scrollView: UIScrollView): boolean;

	scrollViewWillBeginDecelerating(scrollView: UIScrollView): void;

	scrollViewWillBeginDragging(scrollView: UIScrollView): void;

	/**
	 * @since 3.2
	 */
	scrollViewWillBeginZoomingWithView(scrollView: UIScrollView, view: UIView): void;

	/**
	 * @since 5.0
	 */
	scrollViewWillEndDraggingWithVelocityTargetContentOffset(scrollView: UIScrollView, velocity: CGPoint, targetContentOffset: interop.Pointer | interop.Reference<CGPoint>): void;

	self(): this;

	setSize(width: number, height: number): void;

	syncStyle(state: string): void;

	viewForZoomingInScrollView(scrollView: UIScrollView): UIView;
}

declare class MasonStyle extends NSObject {

	static alloc(): MasonStyle; // inherited from NSObject

	static new(): MasonStyle; // inherited from NSObject

	alignContent: MasonAlignContent;

	alignItems: MasonAlignItems;

	alignSelf: MasonAlignSelf;

	borderCompat: MasonLengthPercentageRectCompat;

	boxSizing: MasonBoxSizing;

	direction: MasonDirection;

	display: MasonDisplay;

	flexDirection: MasonFlexDirection;

	flexGrow: number;

	flexShrink: number;

	flexWrap: MasonFlexWrap;

	gapCompat: MasonLengthPercentageSizeCompat;

	gridAutoColumns: NSArray<MinMax>;

	gridAutoFlow: MasonGridAutoFlowWrap;

	gridAutoRows: NSArray<MinMax>;

	gridColumnCompat: LineGridPlacementCompat;

	gridColumnEndCompat: GridPlacementCompat;

	gridColumnStartCompat: GridPlacementCompat;

	gridRowCompat: LineGridPlacementCompat;

	gridRowEndCompat: GridPlacementCompat;

	gridRowStartCompat: GridPlacementCompat;

	gridTemplateColumns: NSArray<TrackSizingFunction>;

	readonly gridTemplateColumnsCSS: string;

	gridTemplateRows: NSArray<TrackSizingFunction>;

	readonly gridTemplateRowsCSS: string;

	insetCompat: MasonLengthPercentageAutoRectCompat;

	justifyContent: MasonJustifyContent;

	justifyItems: MasonJustifyItems;

	justifySelf: MasonJustifySelf;

	marginCompat: MasonLengthPercentageAutoRectCompat;

	maxSizeCompat: MasonDimensionSizeCompat;

	minSizeCompat: MasonDimensionSizeCompat;

	overflowCompat: MasonOverflowPointCompat;

	overflowX: MasonOverflow;

	overflowY: MasonOverflow;

	paddingCompat: MasonLengthPercentageRectCompat;

	position: MasonPosition;

	sizeCompat: MasonDimensionSizeCompat;

	sizeCompatHeight: MasonDimensionCompat;

	sizeCompatWidth: MasonDimensionCompat;

	textAlign: MasonTextAlign;

	values: NSData;

	valuesCompat: NSMutableData;

	constructor(o: { node: MasonNode; });

	initWithNode(node: MasonNode): this;

	setBorderBottom(value: number, type: number): void;

	setBorderLeft(value: number, type: number): void;

	setBorderRight(value: number, type: number): void;

	setBorderTop(value: number, type: number): void;

	setBorderWithValueType(value: number, type: number): void;

	setColumnGap(value: number, type: number): void;

	setFlexBasis(value: number, type: number): void;

	setGapColumn(value: number, type: number): void;

	setGapRow(value: number, type: number): void;

	setInsetBottom(value: number, type: number): void;

	setInsetLeft(value: number, type: number): void;

	setInsetRight(value: number, type: number): void;

	setInsetTop(value: number, type: number): void;

	setInsetWithValueType(value: number, type: number): void;

	setMarginBottom(value: number, type: number): void;

	setMarginLeft(value: number, type: number): void;

	setMarginRight(value: number, type: number): void;

	setMarginTop(value: number, type: number): void;

	setMarginWithValueType(value: number, type: number): void;

	setMaxSizeHeight(value: number, type: number): void;

	setMaxSizeWidth(value: number, type: number): void;

	setMaxSizeWidthHeight(value: number, type: number): void;

	setMinSizeHeight(value: number, type: number): void;

	setMinSizeWidth(value: number, type: number): void;

	setMinSizeWidthHeight(value: number, type: number): void;

	setPaddingBottom(value: number, type: number): void;

	setPaddingLeft(value: number, type: number): void;

	setPaddingRight(value: number, type: number): void;

	setPaddingTop(value: number, type: number): void;

	setPaddingWithValueType(value: number, type: number): void;

	setRowGap(value: number, type: number): void;

	setScrollBarWidth(value: number): void;

	setSizeHeight(value: number, type: number): void;

	setSizeWidth(value: number, type: number): void;

	setSizeWidthHeight(value: number, type: number): void;

	updateNativeStyle(): void;
}

declare class MasonSwiftHelpers extends NSObject {

	static addChildAtElement(parent: MasonElement, element: MasonElement, index: number): void;

	static addChildAtNode(parent: MasonElement, node: MasonNode, index: number): void;

	static addChildAtText(parent: MasonElement, text: string, index: number): void;

	static alloc(): MasonSwiftHelpers; // inherited from NSObject

	static append(parent: MasonElement, element: MasonElement): void;

	static appendElements(parent: MasonElement, elements: NSArray<MasonElement> | MasonElement[]): void;

	static appendNode(parent: MasonElement, node: MasonNode): void;

	static appendNodes(parent: MasonElement, nodes: NSArray<MasonNode> | MasonNode[]): void;

	static appendText(parent: MasonElement, text: string): void;

	static appendTexts(parent: MasonElement, texts: NSArray<string> | string[]): void;

	static attachAndApply(element: MasonElement): void;

	static compute(element: MasonElement): void;

	static computeMaxContent(element: MasonElement): void;

	static computeMinContent(element: MasonElement): void;

	static computeWithMaxContent(element: MasonElement): void;

	static computeWithMinContent(element: MasonElement): void;

	static computeWithSize(element: MasonElement, width: number, height: number): void;

	static computeWithViewSize(element: MasonElement): void;

	static computeWithViewSizeLayout(element: MasonElement, layout: boolean): void;

	static configure(element: MasonElement, block: (p1: MasonStyle) => void): void;

	static isNodeDirty(element: MasonElement): boolean;

	static layout(element: MasonElement): MasonLayout;

	static markNodeDirty(element: MasonElement): void;

	static new(): MasonSwiftHelpers; // inherited from NSObject

	static prepend(parent: MasonElement, element: MasonElement): void;

	static prependElements(parent: MasonElement, elements: NSArray<MasonElement> | MasonElement[]): void;

	static prependNode(parent: MasonElement, node: MasonNode): void;

	static prependNodes(parent: MasonElement, nodes: NSArray<MasonNode> | MasonNode[]): void;

	static prependString(parent: MasonElement, string: string): void;

	static prependStrings(parent: MasonElement, strings: NSArray<string> | string[]): void;

	static requestLayout(element: MasonElement): void;
}

declare class MasonText extends UIView implements MasonElement {

	static alloc(): MasonText; // inherited from NSObject

	static appearance(): MasonText; // inherited from UIAppearance

	/**
	 * @since 8.0
	 */
	static appearanceForTraitCollection(trait: UITraitCollection): MasonText; // inherited from UIAppearance

	/**
	 * @since 8.0
	 * @deprecated 9.0
	 */
	static appearanceForTraitCollectionWhenContainedIn(trait: UITraitCollection, ContainerClass: typeof NSObject): MasonText; // inherited from UIAppearance

	/**
	 * @since 9.0
	 */
	static appearanceForTraitCollectionWhenContainedInInstancesOfClasses(trait: UITraitCollection, containerTypes: NSArray<typeof NSObject> | typeof NSObject[]): MasonText; // inherited from UIAppearance

	/**
	 * @since 5.0
	 * @deprecated 9.0
	 */
	static appearanceWhenContainedIn(ContainerClass: typeof NSObject): MasonText; // inherited from UIAppearance

	/**
	 * @since 9.0
	 */
	static appearanceWhenContainedInInstancesOfClasses(containerTypes: NSArray<typeof NSObject> | typeof NSObject[]): MasonText; // inherited from UIAppearance

	static new(): MasonText; // inherited from NSObject

	backgroundColorValue: number;

	color: number;

	decorationColor: number;

	decorationLine: MasonDecorationLine;

	readonly font: NSCFontFace;

	fontSize: number;

	fontStyle: MasonFontStyle;

	fontWeight: string;

	text: string;

	textOverflowCompat: MasonTextOverflowCompat;

	textTransform: MasonTextTransform;

	readonly textValues: NSMutableData;

	textWrap: MasonTextWrap;

	readonly type: MasonTextType;

	whiteSpace: MasonWhiteSpace;

	readonly debugDescription: string; // inherited from NSObjectProtocol

	readonly description: string; // inherited from NSObjectProtocol

	readonly hash: number; // inherited from NSObjectProtocol

	readonly isProxy: boolean; // inherited from NSObjectProtocol

	readonly node: MasonNode; // inherited from MasonElement

	readonly style: MasonStyle; // inherited from MasonElement

	readonly superclass: typeof NSObject; // inherited from NSObjectProtocol

	readonly uiView: UIView; // inherited from MasonElement

	readonly  // inherited from NSObjectProtocol

	constructor(o: { mason: NSCMason; });

	constructor(o: { mason: NSCMason; type: MasonTextType; });

	addChild(child: MasonNode): void;

	addChildAtElement(element: MasonElement, index: number): void;

	addChildAtNode(node: MasonNode, index: number): void;

	addChildAtText(text: string, index: number): void;

	addView(view: UIView): void;

	addViewAt(view: UIView, at: number): void;

	append(element: MasonElement): void;

	appendWithElements(elements: NSArray<MasonElement> | MasonElement[]): void;

	appendWithNode(node: MasonNode): void;

	appendWithNodes(nodes: NSArray<MasonNode> | MasonNode[]): void;

	appendWithText(text: string): void;

	appendWithTexts(texts: NSArray<string> | string[]): void;

	attachAndApply(): void;

	class(): typeof NSObject;

	compute(): void;

	computeMaxContent(): void;

	computeMinContent(): void;

	computeWithMaxContent(): void;

	computeWithMinContent(): void;

	computeWithSize(width: number, height: number): void;

	computeWithViewSize(): void;

	computeWithViewSizeWithLayout(layout: boolean): void;

	configure(block: (p1: MasonStyle) => void): void;

	conformsToProtocol(aProtocol: any /* Protocol */): boolean;

	getDefaultAttributes(): NSDictionary<string, any>;

	initWithMason(mason: NSCMason): this;

	initWithMasonType(mason: NSCMason, textType: MasonTextType): this;

	insertChildAt(child: MasonNode, index: number): void;

	invalidateStyle(state: number): void;

	isEqual(object: any): boolean;

	isKindOfClass(aClass: typeof NSObject): boolean;

	isMemberOfClass(aClass: typeof NSObject): boolean;

	isNodeDirty(): boolean;

	layout(): MasonLayout;

	markNodeDirty(): void;

	performSelector(aSelector: string): any;

	performSelectorWithObject(aSelector: string, object: any): any;

	performSelectorWithObjectWithObject(aSelector: string, object1: any, object2: any): any;

	prepend(element: MasonElement): void;

	prependWithElements(elements: NSArray<MasonElement> | MasonElement[]): void;

	prependWithNode(node: MasonNode): void;

	prependWithNodes(nodes: NSArray<MasonNode> | MasonNode[]): void;

	prependWithString(string: string): void;

	prependWithStrings(strings: NSArray<string> | string[]): void;

	removeChild(child: MasonNode): MasonNode;

	requestLayout(): void;

	respondsToSelector(aSelector: string): boolean;

	retainCount(): number;

	self(): this;

	setBackgroundColorWithUi(color: UIColor): void;

	setColorWithUi(color: UIColor): void;

	setDecorationColorWithUi(color: UIColor): void;

	setFontStyleSlant(style: MasonFontStyle, slant: number): void;

	syncStyleTextState(state: string, textState: string): void;
}

declare const enum MasonTextAlign {

	Auto = 0,

	Left = 1,

	Right = 2,

	Center = 3,

	Justify = 4,

	Start = 5,

	End = 6
}

declare class MasonTextNode extends MasonNode implements MasonCharacterData {

	static alloc(): MasonTextNode; // inherited from NSObject

	static new(): MasonTextNode; // inherited from NSObject

	data: string; // inherited from MasonCharacterData

	readonly length: number; // inherited from MasonCharacterData

	constructor(o: { mason: NSCMason; data: string; attributes: NSDictionary<string, any>; });

	appendData(s: string): this;

	attributed(): NSAttributedString;

	deleteDataWithOffsetCount(offset: number, count: number): this;

	deleteDataWithRange(range: NSRange): this;

	initWithMasonDataAttributes(doc: NSCMason, text: string, attrs: NSDictionary<string, any>): this;

	insertDataAt(s: string, offset: number): this;

	replaceDataWithOffsetCountWith(offset: number, count: number, s: string): this;

	replaceDataWithRangeWith(range: NSRange, s: string): this;

	substringDataWithOffsetCount(offset: number, count: number): string;
}

declare class MasonTextOverflowCompat extends NSObject {

	static Custom(value: string): MasonTextOverflowCompat;

	static Ellipse(value: string): MasonTextOverflowCompat;

	static alloc(): MasonTextOverflowCompat; // inherited from NSObject

	static new(): MasonTextOverflowCompat; // inherited from NSObject

	static readonly Clip: MasonTextOverflowCompat;
}

declare const enum MasonTextTransform {

	None = 0,

	Capitalize = 1,

	Uppercase = 2,

	Lowercase = 3,

	FullWidth = 4,

	FullSizeKana = 5,

	MathAuto = 6
}

declare const enum MasonTextType {

	None = 0,

	P = 1,

	Span = 2,

	Code = 3,

	H1 = 4,

	H2 = 5,

	H3 = 6,

	H4 = 7,

	H5 = 8,

	H6 = 9,

	Li = 10,

	Blockquote = 11,

	B = 12,

	Pre = 13
}

declare const enum MasonTextWrap {

	Wrap = 0,

	NoWrap = 1,

	Balance = 2,

	Pretty = 3
}

declare class MasonUIView extends UIView implements MasonElement {

	static alloc(): MasonUIView; // inherited from NSObject

	static appearance(): MasonUIView; // inherited from UIAppearance

	/**
	 * @since 8.0
	 */
	static appearanceForTraitCollection(trait: UITraitCollection): MasonUIView; // inherited from UIAppearance

	/**
	 * @since 8.0
	 * @deprecated 9.0
	 */
	static appearanceForTraitCollectionWhenContainedIn(trait: UITraitCollection, ContainerClass: typeof NSObject): MasonUIView; // inherited from UIAppearance

	/**
	 * @since 9.0
	 */
	static appearanceForTraitCollectionWhenContainedInInstancesOfClasses(trait: UITraitCollection, containerTypes: NSArray<typeof NSObject> | typeof NSObject[]): MasonUIView; // inherited from UIAppearance

	/**
	 * @since 5.0
	 * @deprecated 9.0
	 */
	static appearanceWhenContainedIn(ContainerClass: typeof NSObject): MasonUIView; // inherited from UIAppearance

	/**
	 * @since 9.0
	 */
	static appearanceWhenContainedInInstancesOfClasses(containerTypes: NSArray<typeof NSObject> | typeof NSObject[]): MasonUIView; // inherited from UIAppearance

	static createBlockView(mason: NSCMason): MasonUIView;

	static createFlexView(mason: NSCMason): MasonUIView;

	static createGridView(mason: NSCMason): MasonUIView;

	static new(): MasonUIView; // inherited from NSObject

	_position: MasonPosition;

	alignContent: MasonAlignContent;

	alignItems: MasonAlignItems;

	alignSelf: MasonAlignSelf;

	aspectRatio: number;

	direction: MasonDirection;

	display: MasonDisplay;

	flexBasisCompat: MasonDimensionCompat;

	flexDirection: MasonFlexDirection;

	flexGrow: number;

	flexShrink: number;

	flexWrap: MasonFlexWrap;

	gridAutoColumns: NSArray<MinMax>;

	gridAutoFlow: MasonGridAutoFlowWrap;

	gridAutoRows: NSArray<MinMax>;

	gridColumnCompat: LineGridPlacementCompat;

	gridColumnEndCompat: GridPlacementCompat;

	gridColumnStartCompat: GridPlacementCompat;

	gridRowCompat: LineGridPlacementCompat;

	gridRowEndCompat: GridPlacementCompat;

	gridRowStartCompat: GridPlacementCompat;

	gridTemplateColumns: NSArray<TrackSizingFunction>;

	gridTemplateRows: NSArray<TrackSizingFunction>;

	inBatch: boolean;

	justifyContent: MasonJustifyContent;

	justifyItems: MasonJustifyItems;

	justifySelf: MasonJustifySelf;

	readonly mason: NSCMason;

	overflowX: MasonOverflow;

	overflowY: MasonOverflow;

	scrollBarWidthCompat: MasonDimensionCompat;

	readonly debugDescription: string; // inherited from NSObjectProtocol

	readonly description: string; // inherited from NSObjectProtocol

	readonly hash: number; // inherited from NSObjectProtocol

	readonly isProxy: boolean; // inherited from NSObjectProtocol

	readonly node: MasonNode; // inherited from MasonElement

	readonly style: MasonStyle; // inherited from MasonElement

	readonly superclass: typeof NSObject; // inherited from NSObjectProtocol

	readonly uiView: UIView; // inherited from MasonElement

	readonly  // inherited from NSObjectProtocol

	addChildAtElement(element: MasonElement, index: number): void;

	addChildAtNode(node: MasonNode, index: number): void;

	addChildAtText(text: string, index: number): void;

	addSubviews(views: NSArray<UIView> | UIView[]): void;

	addSubviewsAt(views: NSArray<UIView> | UIView[], index: number): void;

	addView(view: UIView): void;

	addViewAt(view: UIView, at: number): void;

	append(element: MasonElement): void;

	appendWithElements(elements: NSArray<MasonElement> | MasonElement[]): void;

	appendWithNode(node: MasonNode): void;

	appendWithNodes(nodes: NSArray<MasonNode> | MasonNode[]): void;

	appendWithText(text: string): void;

	appendWithTexts(texts: NSArray<string> | string[]): void;

	attachAndApply(): void;

	class(): typeof NSObject;

	compute(): void;

	computeMaxContent(): void;

	computeMinContent(): void;

	computeWithMaxContent(): void;

	computeWithMinContent(): void;

	computeWithSize(width: number, height: number): void;

	computeWithViewSize(): void;

	computeWithViewSizeWithLayout(layout: boolean): void;

	configure(block: (p1: MasonStyle) => void): void;

	conformsToProtocol(aProtocol: any /* Protocol */): boolean;

	getBorder(): MasonLengthPercentageRectCompat;

	getBorderBottom(): MasonLengthPercentageCompat;

	getBorderLeft(): MasonLengthPercentageCompat;

	getBorderRight(): MasonLengthPercentageCompat;

	getBorderTop(): MasonLengthPercentageCompat;

	getColumnGap(): MasonLengthPercentageCompat;

	getGap(): MasonLengthPercentageSizeCompat;

	getInset(): MasonLengthPercentageAutoRectCompat;

	getInsetBottom(): MasonLengthPercentageAutoCompat;

	getInsetLeft(): MasonLengthPercentageAutoCompat;

	getInsetRight(): MasonLengthPercentageAutoCompat;

	getInsetTop(): MasonLengthPercentageAutoCompat;

	getMargin(): MasonLengthPercentageAutoRectCompat;

	getMarginBottom(): MasonLengthPercentageAutoCompat;

	getMarginLeft(): MasonLengthPercentageAutoCompat;

	getMarginRight(): MasonLengthPercentageAutoCompat;

	getMarginTop(): MasonLengthPercentageAutoCompat;

	getMaxSize(): MasonDimensionSizeCompat;

	getMaxSizeHeight(): MasonDimensionCompat;

	getMaxSizeWidth(): MasonDimensionCompat;

	getMinSize(): MasonDimensionSizeCompat;

	getMinSizeHeight(): MasonDimensionCompat;

	getMinSizeWidth(): MasonDimensionCompat;

	getPadding(): MasonLengthPercentageRectCompat;

	getPaddingBottom(): MasonLengthPercentageCompat;

	getPaddingLeft(): MasonLengthPercentageCompat;

	getPaddingRight(): MasonLengthPercentageCompat;

	getPaddingTop(): MasonLengthPercentageCompat;

	getRowGap(): MasonLengthPercentageCompat;

	getSize(): MasonDimensionSizeCompat;

	getSizeHeight(): MasonDimensionCompat;

	getSizeWidth(): MasonDimensionCompat;

	isEqual(object: any): boolean;

	isKindOfClass(aClass: typeof NSObject): boolean;

	isMemberOfClass(aClass: typeof NSObject): boolean;

	isNodeDirty(): boolean;

	layout(): MasonLayout;

	markNodeDirty(): void;

	performSelector(aSelector: string): any;

	performSelectorWithObject(aSelector: string, object: any): any;

	performSelectorWithObjectWithObject(aSelector: string, object1: any, object2: any): any;

	prepend(element: MasonElement): void;

	prependWithElements(elements: NSArray<MasonElement> | MasonElement[]): void;

	prependWithNode(node: MasonNode): void;

	prependWithNodes(nodes: NSArray<MasonNode> | MasonNode[]): void;

	prependWithString(string: string): void;

	prependWithStrings(strings: NSArray<string> | string[]): void;

	requestLayout(): void;

	respondsToSelector(aSelector: string): boolean;

	retainCount(): number;

	self(): this;

	setBorder(left: number, top: number, right: number, bottom: number): void;

	setBorderBottom(bottom: number, type: number): void;

	setBorderLeft(left: number, type: number): void;

	setBorderRight(right: number, type: number): void;

	setBorderTop(top: number, type: number): void;

	setColumnGap(column: number, type: number): void;

	setGap(width: number, height: number): void;

	setGapWithWidthHeightType(width: number, width_type: number, height: number, height_type: number): void;

	setInset(left: number, top: number, right: number, bottom: number): void;

	setInsetBottom(bottom: number, type: number): void;

	setInsetLeft(left: number, type: number): void;

	setInsetRight(right: number, type: number): void;

	setInsetTop(top: number, type: number): void;

	setMargin(left: number, top: number, right: number, bottom: number): void;

	setMarginBottom(bottom: number, type: number): void;

	setMarginLeft(left: number, type: number): void;

	setMarginRight(right: number, type: number): void;

	setMarginTop(top: number, type: number): void;

	setMaxSize(width: number, height: number): void;

	setMaxSizeHeight(height: number, type: number): void;

	setMaxSizeWidth(width: number, type: number): void;

	setMinSize(width: number, height: number): void;

	setMinSizeHeight(height: number, type: number): void;

	setMinSizeWidth(width: number, type: number): void;

	setPadding(left: number, right: number, top: number, bottom: number): void;

	setPaddingBottom(bottom: number, type: number): void;

	setPaddingLeft(left: number, type: number): void;

	setPaddingRight(right: number, type: number): void;

	setPaddingTop(top: number, type: number): void;

	setRowGap(row: number, type: number): void;

	setSize(width: number, height: number): void;

	setSizeHeight(height: number, type: number): void;

	setSizeWidth(width: number, type: number): void;

	syncStyle(state: string): void;
}

declare var MasonVersionNumber: number;

declare var MasonVersionString: interop.Reference<number>;

declare const enum MasonWhiteSpace {

	Normal = 0,

	Pre = 1,

	PreWrap = 2,

	PreLine = 3,

	NoWrap = 4,

	BreakSpaces = 5
}

declare class MaxSizing extends NSObject {

	static FitContent(fit: number): MaxSizing;

	static FitContentPercent(fit: number): MaxSizing;

	static Fraction(flex: number): MaxSizing;

	static Percent(percent: number): MaxSizing;

	static Points(points: number): MaxSizing;

	static alloc(): MaxSizing; // inherited from NSObject

	static new(): MaxSizing; // inherited from NSObject

	readonly cssValue: string;

	readonly jsonValue: string;

	readonly value: number;

	static readonly Auto: MaxSizing;

	static readonly MaxContent: MaxSizing;

	static readonly MinContent: MaxSizing;
}

declare class MeasureOutput extends NSObject {

	static alloc(): MeasureOutput; // inherited from NSObject

	static new(): MeasureOutput; // inherited from NSObject
}

declare class MinMax extends NSObject {

	static FitContentPercentWithFit(fit: number): MinMax;

	static FitContentWithFit(fit: number): MinMax;

	static FlexWithFlex(flex: number): MinMax;

	static PercentWithPercent(percent: number): MinMax;

	static PointsWithPoints(points: number): MinMax;

	static alloc(): MinMax; // inherited from NSObject

	static fromTypeValue(minType: number, minValue: number, maxType: number, maxValue: number): MinMax;

	static new(): MinMax; // inherited from NSObject

	readonly cssValue: string;

	readonly jsonValue: string;

	static readonly Auto: MinMax;

	constructor();

	init(min: MinSizing, max: MaxSizing): this;
}

declare class MinSizing extends NSObject {

	static Percent(percent: number): MinSizing;

	static Points(points: number): MinSizing;

	static alloc(): MinSizing; // inherited from NSObject

	static new(): MinSizing; // inherited from NSObject

	readonly cssValue: string;

	readonly jsonValue: string;

	readonly value: number;

	static readonly Auto: MinSizing;

	static readonly MaxContent: MinSizing;

	static readonly MinContent: MinSizing;
}

declare class NSCFontDescriptors extends NSObject {

	static alloc(): NSCFontDescriptors; // inherited from NSObject

	static new(): NSCFontDescriptors; // inherited from NSObject

	constructor(o: { family: string; });

	initWithFamily(family: string): this;

	setFontStyle(value: string): void;

	setFontWeight(value: string): void;

	update(value: string): void;
}

declare const enum NSCFontDisplay {

	Auto = 0,

	Block = 1,

	Fallback = 2,

	Optional = 3,

	Swap = 4
}

declare class NSCFontFace extends NSObject {

	static alloc(): NSCFontFace; // inherited from NSObject

	static importFromRemoteWithUrlLoadCallback(url: string, load: boolean, callback: (p1: NSArray<NSCFontFace>, p2: string) => void): void;

	static loadFromStyleWithStyle(style: string): NSCFontFace;

	static new(): NSCFontFace; // inherited from NSObject

	readonly ascentOverride: string;

	readonly descentOverride: string;

	display: NSCFontDisplay;

	readonly family: string;

	readonly font: any;

	readonly fontData: NSData;

	status: NSCFontFaceStatus;

	style: string;

	weight: NSCFontWeight;

	constructor();

	constructor(o: { data: string; });

	constructor(o: { family: string; });

	constructor(o: { family: string; data: NSData; });

	constructor(o: { family: string; source: string; });

	init(family: string, source: string, descriptors: NSCFontDescriptors): this;

	initData(family: string, data: NSData, descriptors: NSCFontDescriptors): this;

	initWithFamily(family: string): this;

	initWithFamilyData(family: string, source: NSData): this;

	initWithFamilySource(family: string, source: string): this;

	load(callback: (p1: string) => void): void;

	setFontDisplayWithValue(value: string): void;

	setFontStyleWithValueAngle(value: string, angle: string): void;

	setFontWeightWithValue(value: string): void;

	updateDescriptorWithValue(value: string): void;
}

declare class NSCFontFaceSet extends NSObject {

	static alloc(): NSCFontFaceSet; // inherited from NSObject

	static new(): NSCFontFaceSet; // inherited from NSObject

	onStatus: (p1: NSCFontFaceSetStatus) => void;

	readonly size: number;

	status: NSCFontFaceSetStatus;

	static readonly instance: NSCFontFaceSet;

	add(font: NSCFontFace): void;

	array(): NSArray<any>;

	check(font: string, text: string): boolean;

	clear(): void;

	delete(font: NSCFontFace): void;

	iter(): NSEnumerator<any>;

	load(font: string, text: string, callback: (p1: NSArray<NSCFontFace>, p2: string) => void): void;
}

declare const enum NSCFontFaceSetStatus {

	Loading = 0,

	Loaded = 1
}

declare const enum NSCFontFaceStatus {

	Unloaded = 0,

	Loading = 1,

	Loaded = 2,

	Error = 3
}

declare const enum NSCFontWeight {

	Thin = 0,

	ExtraLight = 1,

	Light = 2,

	Normal = 3,

	Medium = 4,

	SemiBold = 5,

	Bold = 6,

	ExtraBold = 7,

	Black = 8
}

declare class NSCMason extends NSObject {

	static alloc(): NSCMason; // inherited from NSObject

	static new(): NSCMason; // inherited from NSObject

	static setShared(value: NSCMason): void;

	readonly nativePtr: interop.Pointer | interop.Reference<any>;

	static shared: NSCMason;

	clear(): void;

	configureStyleForView(view: UIView, block: (p1: MasonStyle) => void): void;

	createDocument(): MasonDocument;

	createImageView(): MasonImg;

	createNode(): MasonNode;

	createScrollView(): MasonScroll;

	createTextNode(data: string): MasonTextNode;

	createTextView(): MasonText;

	createTextViewWithType(type: MasonTextType): MasonText;

	createView(): MasonUIView;

	layoutForView(view: UIView): MasonLayout;

	nodeForView(view: UIView, isLeaf: boolean): MasonNode;

	printTree(node: MasonNode): void;

	styleForView(view: UIView): MasonStyle;
}

interface NodeArray {
	array: interop.Pointer | interop.Reference<interop.Pointer | interop.Reference<any>>;
	length: number;
}
declare var NodeArray: interop.StructType<NodeArray>;

interface Repeat_Body {
	_0: number;
	_1: number;
	_2: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>;
}
declare var Repeat_Body: interop.StructType<Repeat_Body>;

declare class TrackSizingFunction extends NSObject {

	static AutoRepeat(gridTrackRepetition: MasonGridTrackRepetition, value: NSArray<MinMax> | MinMax[]): TrackSizingFunction;

	static Single(value: MinMax): TrackSizingFunction;

	static alloc(): TrackSizingFunction; // inherited from NSObject

	static new(): TrackSizingFunction; // inherited from NSObject

	readonly cssValue: string;

	readonly isRepeating: boolean;

	readonly value: any;
}

declare function mason_clear(mason: interop.Pointer | interop.Reference<any>): void;

declare function mason_destroy_non_repeated_track_sizing_function_array(array: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>): void;

declare function mason_init(): interop.Pointer | interop.Reference<any>;

declare function mason_node_add_child(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_add_child_at(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>, index: number): void;

declare function mason_node_add_children(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, children: interop.Pointer | interop.Reference<interop.Pointer | interop.Reference<any>>, children_size: number): void;

declare function mason_node_array_destroy(array: interop.Pointer | interop.Reference<NodeArray>): void;

declare function mason_node_clear_segments(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_compute(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_compute_max_content(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_compute_min_content(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_compute_wh(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, width: number, height: number): void;

declare function mason_node_destroy(node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_dirty(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): boolean;

declare function mason_node_get_child_at(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, index: number): interop.Pointer | interop.Reference<any>;

declare function mason_node_get_children(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): interop.Pointer | interop.Reference<NodeArray>;

declare function mason_node_insert_child_after(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>, reference: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_insert_child_before(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>, reference: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_is_children_same(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, children: interop.Pointer | interop.Reference<interop.Pointer | interop.Reference<any>>, children_size: number): boolean;

declare function mason_node_is_equal(node_a: interop.Pointer | interop.Reference<any>, node_b: interop.Pointer | interop.Reference<any>): boolean;

declare function mason_node_layout(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, layout: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<number>) => interop.Pointer | interop.Reference<any>>): interop.Pointer | interop.Reference<any>;

declare function mason_node_mark_dirty(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_new_node(mason: interop.Pointer | interop.Reference<any>, anonymous: boolean): interop.Pointer | interop.Reference<any>;

declare function mason_node_new_node_with_children(mason: interop.Pointer | interop.Reference<any>, children: interop.Pointer | interop.Reference<interop.Pointer | interop.Reference<any>>, children_size: number): interop.Pointer | interop.Reference<any>;

declare function mason_node_new_node_with_context(mason: interop.Pointer | interop.Reference<any>, measure_data: interop.Pointer | interop.Reference<any>, measure: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<any>, p2: number, p3: number, p4: number, p5: number) => number>): interop.Pointer | interop.Reference<any>;

declare function mason_node_new_text_node(mason: interop.Pointer | interop.Reference<any>, anonymous: boolean): interop.Pointer | interop.Reference<any>;

declare function mason_node_new_text_node_with_children(mason: interop.Pointer | interop.Reference<any>, children: interop.Pointer | interop.Reference<interop.Pointer | interop.Reference<any>>, children_size: number): interop.Pointer | interop.Reference<any>;

declare function mason_node_new_text_node_with_context(mason: interop.Pointer | interop.Reference<any>, measure_data: interop.Pointer | interop.Reference<any>, measure: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<any>, p2: number, p3: number, p4: number, p5: number) => number>): interop.Pointer | interop.Reference<any>;

declare function mason_node_prepend(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_prepend_children(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, children: interop.Pointer | interop.Reference<interop.Pointer | interop.Reference<any>>, children_size: number): void;

declare function mason_node_remove_child(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>): interop.Pointer | interop.Reference<any>;

declare function mason_node_remove_child_at(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, index: number): interop.Pointer | interop.Reference<any>;

declare function mason_node_remove_children(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_remove_context(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_replace_child_at(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>, index: number): interop.Pointer | interop.Reference<any>;

declare function mason_node_set_apple_node(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, apple_node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_set_children(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, children: interop.Pointer | interop.Reference<interop.Pointer | interop.Reference<any>>, children_size: number): void;

declare function mason_node_set_context(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, measure_data: interop.Pointer | interop.Reference<any>, measure: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<any>, p2: number, p3: number, p4: number, p5: number) => number>): void;

declare function mason_print_tree(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_release(mason: interop.Pointer | interop.Reference<any>): void;

declare function mason_style_get_grid_auto_columns(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>;

declare function mason_style_get_grid_auto_rows(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>;

declare function mason_style_get_style_buffer(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): interop.Pointer | interop.Reference<CMasonBuffer>;

declare function mason_style_get_style_buffer_apple(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): interop.Pointer | interop.Reference<any>;

declare function mason_style_release_style_buffer(buffer: interop.Pointer | interop.Reference<CMasonBuffer>): void;

declare function mason_style_set_grid_auto_columns(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, value: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>): void;

declare function mason_style_set_grid_auto_rows(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, value: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>): void;

declare function mason_util_create_non_repeated_track_sizing_function_with_type_value(track_type: number, track_value: number): CMasonMinMax;

declare function mason_util_destroy_string(string: string | interop.Pointer | interop.Reference<any>): void;

declare function mason_util_parse_non_repeated_track_sizing_function(value: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>): interop.Pointer | interop.Reference<any>;
