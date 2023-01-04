interface UIView {
  readonly isMasonEnabled: boolean;
  readonly mason: MasonNode;
  readonly masonNodePtr: number;
  readonly masonPtr: number;
  readonly masonStylePtr: number;
  style: MasonStyle;

  addSubviews(views: NSArray<UIView> | UIView[]): void;

  addSubviewsAt(views: NSArray<UIView> | UIView[], index: number): void;

  setGap(width: number, height: number): void;

  setInset(left: number, top: number, right: number, bottom: number): void;

  setMargin(left: number, top: number, right: number, bottom: number): void;

  setMaxSize(width: number, height: number): void;

  setMinSize(width: number, height: number): void;

  setSize(width: number, height: number): void;

  setPadding(left: number, top: number, right: number, bottom: number): void;

  setBorder(left: number, top: number, right: number, bottom: number): void;
}
