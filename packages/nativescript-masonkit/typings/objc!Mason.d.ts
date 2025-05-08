
declare const enum AlignContent {

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

declare const enum AlignItems {

	Normal = -1,

	Start = 0,

	End = 1,

	Center = 2,

	Baseline = 3,

	Stretch = 4,

	FlexStart = 5,

	FlexEnd = 6
}

declare const enum AlignSelf {

	Normal = -1,

	Start = 0,

	End = 1,

	Center = 2,

	Baseline = 3,

	Stretch = 4,

	FlexStart = 5,

	FlexEnd = 6
}

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

declare const enum CMasonTrackSizingFunction_Tag {

	Single = 0,

	Repeat = 1
}

declare const enum DecorationLine {

	None = 0,

	Underline = 1,

	Overline = 2,

	LineThrough = 3
}

declare const enum Direction {

	Inherit = 0,

	LTR = 1,

	RTL = 2
}

declare const enum Display {

	None = 0,

	Flex = 1,

	Grid = 2,

	Block = 3
}

declare const enum FlexDirection {

	Row = 0,

	Column = 1,

	RowReverse = 2,

	ColumnReverse = 3
}

declare const enum FlexGridAutoFlowWrap {

	Row = 0,

	Column = 1,

	RowDense = 2,

	ColumnDense = 3
}

declare const enum FlexWrap {

	NoWrap = 0,

	Wrap = 1,

	WrapReverse = 2
}

declare const enum FontStyle {

	Normal = 0,

	Italic = 1,

	Oblique = 2
}

declare class GridPlacementCompat extends NSObject {

	static alloc(): GridPlacementCompat; // inherited from NSObject

	static new(): GridPlacementCompat; // inherited from NSObject

	readonly cssValue: string;

	readonly jsonValue: string;

	readonly type: GridPlacementCompatType;

	readonly value: number;

	static readonly Auto: GridPlacementCompat;

	constructor(o: { line: number; });

	constructor(o: { span: number; });

	initWithLine(line: number): this;

	initWithSpan(span: number): this;
}

declare const enum GridPlacementCompatType {

	Auto = 0,

	Line = 1,

	Span = 2
}

declare class GridTrackRepetition extends NSObject {

	static Count(value: number): GridTrackRepetition;

	static alloc(): GridTrackRepetition; // inherited from NSObject

	static new(): GridTrackRepetition; // inherited from NSObject

	readonly type: number;

	readonly value: number;

	static readonly AutoFill: GridTrackRepetition;

	static readonly AutoFit: GridTrackRepetition;
}

declare const enum JustifyContent {

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

declare const enum JustifyItems {

	Normal = -1,

	Start = 0,

	End = 1,

	Center = 2,

	Baseline = 3,

	Stretch = 4,

	FlexStart = 5,

	FlexEnd = 6
}

declare const enum JustifySelf {

	Normal = -1,

	Start = 0,

	End = 1,

	Center = 2,

	Baseline = 3,

	Stretch = 4,

	FlexStart = 5,

	FlexEnd = 6
}

declare class LineGridPlacementCompat extends NSObject {

	static alloc(): LineGridPlacementCompat; // inherited from NSObject

	static new(): LineGridPlacementCompat; // inherited from NSObject

	readonly end: GridPlacementCompat;

	readonly start: GridPlacementCompat;
}

declare const enum MasonBoxSizing {

	BorderBox = 0,

	ContentBox = 1
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

declare class MasonImg extends UIImageView {

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

	readonly mason: NSCMason;

	readonly node: MasonNode;

	src: string;

	readonly style: MasonStyle;

	readonly uiView: UIView;

	configure(block: (p1: MasonNode) => void): void;

	isNodeDirty(): boolean;

	markNodeDirty(): void;
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

declare class MasonNode extends NSObject {

	static alloc(): MasonNode; // inherited from NSObject

	static new(): MasonNode; // inherited from NSObject

	readonly children: NSArray<MasonNode>;

	data: any;

	readonly isDirty: boolean;

	readonly layoutCache: MasonLayout;

	readonly nativePtr: interop.Pointer | interop.Reference<any>;

	readonly owner: MasonNode;

	style: MasonStyle;

	constructor(o: { mason: NSCMason; children: NSArray<MasonNode> | MasonNode[]; });

	addChildren(children: NSArray<MasonNode> | MasonNode[]): void;

	attachAndApply(): void;

	compute(): void;

	computeMaxContent(): void;

	computeMinContent(): void;

	computeWithMaxContent(): void;

	computeWithMinContent(): void;

	computeWithSize(width: number, height: number): void;

	computeWithViewSize(): void;

	computeWithViewSizeWithLayout(layout: boolean): void;

	configure(block: (p1: MasonNode) => void): void;

	getRoot(): MasonNode;

	initWithMasonChildren(doc: NSCMason, nodes: NSArray<MasonNode> | MasonNode[]): this;

	layout(): MasonLayout;

	markDirty(): void;

	setChildrenWithValue(value: NSArray<MasonNode> | MasonNode[]): void;
}

declare class MasonStyle extends NSObject {

	static alloc(): MasonStyle; // inherited from NSObject

	static new(): MasonStyle; // inherited from NSObject

	alignContent: AlignContent;

	alignItems: AlignItems;

	alignSelf: AlignSelf;

	borderCompat: MasonLengthPercentageRectCompat;

	boxSizing: MasonBoxSizing;

	direction: Direction;

	display: Display;

	flexDirection: FlexDirection;

	flexGrow: number;

	flexShrink: number;

	flexWrap: FlexWrap;

	gapCompat: MasonLengthPercentageSizeCompat;

	gridAutoColumns: NSArray<MinMax>;

	gridAutoFlow: FlexGridAutoFlowWrap;

	gridAutoRows: NSArray<MinMax>;

	gridColumnCompat: LineGridPlacementCompat;

	gridColumnEndCompat: GridPlacementCompat;

	gridColumnStartCompat: GridPlacementCompat;

	gridRowCompat: LineGridPlacementCompat;

	gridRowEndCompat: GridPlacementCompat;

	gridRowStartCompat: GridPlacementCompat;

	gridTemplateColumns: NSArray<TrackSizingFunction>;

	gridTemplateRows: NSArray<TrackSizingFunction>;

	insetCompat: MasonLengthPercentageAutoRectCompat;

	justifyContent: JustifyContent;

	justifyItems: JustifyItems;

	justifySelf: JustifySelf;

	marginCompat: MasonLengthPercentageAutoRectCompat;

	maxSizeCompat: MasonDimensionSizeCompat;

	minSizeCompat: MasonDimensionSizeCompat;

	overflowX: Overflow;

	overflowY: Overflow;

	paddingCompat: MasonLengthPercentageRectCompat;

	position: Position;

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

declare class MasonText extends UIView {

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

	decorationLine: DecorationLine;

	readonly font: NSCFontFace;

	fontSize: number;

	fontStyle: FontStyle;

	fontWeight: string;

	readonly node: MasonNode;

	readonly owner: MasonText;

	readonly style: MasonStyle;

	text: string;

	textTransform: TextTransform;

	readonly textValues: NSData;

	textWrap: TextWrap;

	txtToRender: NSMutableAttributedString;

	readonly type: MasonTextType;

	readonly uiView: UIView;

	whiteSpace: WhiteSpace;

	constructor(o: { mason: NSCMason; });

	constructor(o: { mason: NSCMason; type: MasonTextType; });

	constructor(o: { node: MasonNode; });

	addView(view: UIView, index: number): void;

	configure(block: (p1: MasonNode) => void): void;

	initWithMason(mason: NSCMason): this;

	initWithMasonType(mason: NSCMason, textType: MasonTextType): this;

	initWithNode(masonNode: MasonNode): this;

	invalidateStyle(state: number): void;

	isNodeDirty(): boolean;

	markNodeDirty(): void;

	removeView(view: UIView): void;

	setBackgroundColorWithUi(color: UIColor): void;

	setColorWithUi(color: UIColor): void;

	setDecorationColorWithUi(color: UIColor): void;

	setFontStyleSlant(style: FontStyle, slant: number): void;

	syncStyle(state: string, textState: string): void;

	updateText(value: string): void;
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

	B = 12
}

declare class MasonUIView extends UIView {

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

	_position: Position;

	alignContent: AlignContent;

	alignItems: AlignItems;

	alignSelf: AlignSelf;

	aspectRatio: number;

	direction: Direction;

	display: Display;

	flexBasisCompat: MasonDimensionCompat;

	flexDirection: FlexDirection;

	flexGrow: number;

	flexShrink: number;

	flexWrap: FlexWrap;

	gridAutoColumns: NSArray<MinMax>;

	gridAutoFlow: FlexGridAutoFlowWrap;

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

	justifyContent: JustifyContent;

	justifyItems: JustifyItems;

	justifySelf: JustifySelf;

	readonly mason: NSCMason;

	readonly node: MasonNode;

	overflowX: Overflow;

	overflowY: Overflow;

	scrollBarWidthCompat: MasonDimensionCompat;

	style: MasonStyle;

	readonly uiView: UIView;

	addSubviews(views: NSArray<UIView> | UIView[]): void;

	addSubviewsAt(views: NSArray<UIView> | UIView[], index: number): void;

	addView(view: UIView): void;

	addViewAt(view: UIView, at: number): void;

	configure(block: (p1: MasonNode) => void): void;

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

	isNodeDirty(): boolean;

	markNodeDirty(): void;

	requestLayout(): void;

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

	createImageView(): MasonImg;

	createNode(): MasonNode;

	createTextNode(): MasonNode;

	createTextView(): MasonText;

	createTextViewWithType(type: MasonTextType): MasonText;

	createView(): MasonUIView;

	nodeForView(view: UIView, isLeaf: boolean): MasonNode;

	printTree(node: MasonNode): void;
}

interface NodeArray {
	array: interop.Pointer | interop.Reference<interop.Pointer | interop.Reference<any>>;
	length: number;
}
declare var NodeArray: interop.StructType<NodeArray>;

declare const enum Overflow {

	Unset = 0,

	Visible = 1,

	Hidden = 2,

	Scroll = 3
}

declare const enum Position {

	Relative = 0,

	Absolute = 1
}

interface Repeat_Body {
	_0: number;
	_1: number;
	_2: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>;
}
declare var Repeat_Body: interop.StructType<Repeat_Body>;

declare const enum TextTransform {

	None = 0,

	Capitalize = 1,

	Uppercase = 2,

	Lowercase = 3,

	FullWidth = 4,

	FullSizeKana = 5,

	MathAuto = 6
}

declare const enum TextWrap {

	Wrap = 0,

	NoWrap = 1,

	Balance = 2
}

declare class TrackSizingFunction extends NSObject {

	static AutoRepeat(gridTrackRepetition: GridTrackRepetition, value: NSArray<MinMax> | MinMax[]): TrackSizingFunction;

	static Single(value: MinMax): TrackSizingFunction;

	static alloc(): TrackSizingFunction; // inherited from NSObject

	static new(): TrackSizingFunction; // inherited from NSObject

	readonly isRepeating: boolean;

	readonly value: any;
}

declare const enum WhiteSpace {

	Normal = 0,

	Pre = 1,

	PreWrap = 2,

	PreLine = 3,

	Nowrap = 4
}

declare function mason_clear(mason: interop.Pointer | interop.Reference<any>): void;

declare function mason_destroy_non_repeated_track_sizing_function_array(array: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>): void;

declare function mason_init(): interop.Pointer | interop.Reference<any>;

declare function mason_node_add_child(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_add_child_at(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>, index: number): void;

declare function mason_node_add_children(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, children: interop.Pointer | interop.Reference<interop.Pointer | interop.Reference<any>>, children_size: number): void;

declare function mason_node_array_destroy(array: interop.Pointer | interop.Reference<NodeArray>): void;

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

declare function mason_node_new_node(mason: interop.Pointer | interop.Reference<any>): interop.Pointer | interop.Reference<any>;

declare function mason_node_new_node_with_children(mason: interop.Pointer | interop.Reference<any>, children: interop.Pointer | interop.Reference<interop.Pointer | interop.Reference<any>>, children_size: number): interop.Pointer | interop.Reference<any>;

declare function mason_node_new_node_with_context(mason: interop.Pointer | interop.Reference<any>, measure_data: interop.Pointer | interop.Reference<any>, measure: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<any>, p2: number, p3: number, p4: number, p5: number) => number>): interop.Pointer | interop.Reference<any>;

declare function mason_node_remove_child(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>): interop.Pointer | interop.Reference<any>;

declare function mason_node_remove_child_at(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, index: number): interop.Pointer | interop.Reference<any>;

declare function mason_node_remove_children(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_remove_context(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>): void;

declare function mason_node_replace_child_at(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, child: interop.Pointer | interop.Reference<any>, index: number): interop.Pointer | interop.Reference<any>;

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

declare function mason_style_sync_compute_and_layout(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, data: string | interop.Pointer | interop.Reference<any>, size: number, state: number, layout: interop.FunctionReference<(p1: interop.Pointer | interop.Reference<number>) => interop.Pointer | interop.Reference<any>>): interop.Pointer | interop.Reference<any>;

declare function mason_style_sync_style(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, state: number): void;

declare function mason_style_sync_style_with_buffer(mason: interop.Pointer | interop.Reference<any>, node: interop.Pointer | interop.Reference<any>, state: number, buffer: string | interop.Pointer | interop.Reference<any>, buffer_size: number): void;

declare function mason_util_create_non_repeated_track_sizing_function_with_type_value(track_type: number, track_value: number): CMasonMinMax;

declare function mason_util_destroy_string(string: string | interop.Pointer | interop.Reference<any>): void;

declare function mason_util_parse_non_repeated_track_sizing_function(value: interop.Pointer | interop.Reference<CMasonNonRepeatedTrackSizingFunctionArray>): interop.Pointer | interop.Reference<any>;
