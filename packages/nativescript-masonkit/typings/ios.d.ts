interface UIView {
  readonly isMasonEnabled: boolean;
  readonly mason: MasonNode;
  readonly masonNodePtr: number;
  readonly masonPtr: number;
  readonly masonStylePtr: number;
  style: MasonStyle;

  alignContent: AlignContent;

  alignItems: AlignItems;

  alignSelf: AlignSelf;

  direction: Direction;

  display: Display;

  flexBasisCompat: MasonDimensionCompat;

  flexDirection: FlexDirection;

  flexGrow: number;

  flexShrink: number;

  flexWrap: FlexWrap;

  inBatch: boolean;

  justifyContent: JustifyContent;

  justifyItems: JustifyItems;

  justifySelf: JustifySelf;

  overflow: Overflow;

  position: Position;

  gridAutoColumns: NSArray<MinMax>;

  gridAutoFlow: FlexGridAutoFlowWrap;

  gridAutoRows: NSArray<MinMax>;

  gridColumnCompat: LineGridPlacementCompat;

  gridRowCompat: LineGridPlacementCompat;

  gridTemplateColumns: NSArray<TrackSizingFunction>;

  gridTemplateRows: NSArray<TrackSizingFunction>;

  aspectRatio: number;

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

  setColumnGap(column: number, type: number): void;

  setGap(width: number, height: number): void;

  setGapWithWidthHeightType(width: number, width_type: number, height: number, height_type: number);

  setRowGap(row: number, type: number): void;

  addSubviews(views: NSArray<UIView> | UIView[]): void;

  addSubviewsAt(views: NSArray<UIView> | UIView[], index: number): void;

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

  setSize(width: number, height: number): void;

  setSizeHeight(height: number, type: number): void;

  setSizeWidth(width: number, type: number): void;

  setPadding(left: number, right: number, top: number, bottom: number): void;

  setPaddingBottom(bottom: number, type: number): void;

  setPaddingLeft(left: number, type: number): void;

  setPaddingRight(right: number, type: number): void;

  setPaddingTop(top: number, type: number): void;

  setBorder(left: number, top: number, right: number, bottom: number): void;

  setBorderBottom(bottom: number, type: number): void;

  setBorderLeft(left: number, type: number): void;

  setBorderRight(right: number, type: number): void;

  setBorderTop(top: number, type: number): void;
}
