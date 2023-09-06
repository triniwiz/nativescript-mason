interface UIView extends UIResponder {
  static addKeyframeWithRelativeStartTimeRelativeDurationAnimations(frameStartTime: number, frameDuration: number, animations: () => void): void;

  static alloc(): UIView; // inherited from NSObject

  static animateKeyframesWithDurationDelayOptionsAnimationsCompletion(duration: number, delay: number, options: UIViewKeyframeAnimationOptions, animations: () => void, completion: (p1: boolean) => void): void;

  static animateWithDurationAnimations(duration: number, animations: () => void): void;

  static animateWithDurationAnimationsCompletion(duration: number, animations: () => void, completion: (p1: boolean) => void): void;

  static animateWithDurationDelayOptionsAnimationsCompletion(duration: number, delay: number, options: UIViewAnimationOptions, animations: () => void, completion: (p1: boolean) => void): void;

  static animateWithDurationDelayUsingSpringWithDampingInitialSpringVelocityOptionsAnimationsCompletion(duration: number, delay: number, dampingRatio: number, velocity: number, options: UIViewAnimationOptions, animations: () => void, completion: (p1: boolean) => void): void;

  static appearance(): UIView;

  static appearanceForTraitCollection(trait: UITraitCollection): UIView;

  static appearanceForTraitCollectionWhenContainedIn(trait: UITraitCollection, ContainerClass: typeof NSObject): UIView;

  static appearanceForTraitCollectionWhenContainedInInstancesOfClasses(trait: UITraitCollection, containerTypes: NSArray<typeof NSObject> | (typeof NSObject)[]): UIView;

  static appearanceWhenContainedIn(ContainerClass: typeof NSObject): UIView;

  static appearanceWhenContainedInInstancesOfClasses(containerTypes: NSArray<typeof NSObject> | (typeof NSObject)[]): UIView;

  static beginAnimationsContext(animationID: string, context: interop.Pointer | interop.Reference<any>): void;

  static commitAnimations(): void;

  static createBlockView(): UIView;

  static createFlexView(): UIView;

  static createGridView(): UIView;

  static modifyAnimationsWithRepeatCountAutoreversesAnimations(count: number, autoreverses: boolean, animations: () => void): void;

  static new(): UIView; // inherited from NSObject

  static performSystemAnimationOnViewsOptionsAnimationsCompletion(animation: UISystemAnimation, views: NSArray<UIView> | UIView[], options: UIViewAnimationOptions, parallelAnimations: () => void, completion: (p1: boolean) => void): void;

  static performWithoutAnimation(actionsWithoutAnimation: () => void): void;

  static setAnimationBeginsFromCurrentState(fromCurrentState: boolean): void;

  static setAnimationCurve(curve: UIViewAnimationCurve): void;

  static setAnimationDelay(delay: number): void;

  static setAnimationDelegate(delegate: any): void;

  static setAnimationDidStopSelector(selector: string): void;

  static setAnimationDuration(duration: number): void;

  static setAnimationRepeatAutoreverses(repeatAutoreverses: boolean): void;

  static setAnimationRepeatCount(repeatCount: number): void;

  static setAnimationStartDate(startDate: Date): void;

  static setAnimationTransitionForViewCache(transition: UIViewAnimationTransition, view: UIView, cache: boolean): void;

  static setAnimationWillStartSelector(selector: string): void;

  static setAnimationsEnabled(enabled: boolean): void;

  static transitionFromViewToViewDurationOptionsCompletion(fromView: UIView, toView: UIView, duration: number, options: UIViewAnimationOptions, completion: (p1: boolean) => void): void;

  static transitionWithViewDurationOptionsAnimationsCompletion(view: UIView, duration: number, options: UIViewAnimationOptions, animations: () => void, completion: (p1: boolean) => void): void;

  static userInterfaceLayoutDirectionForSemanticContentAttribute(attribute: UISemanticContentAttribute): UIUserInterfaceLayoutDirection;

  static userInterfaceLayoutDirectionForSemanticContentAttributeRelativeToLayoutDirection(semanticContentAttribute: UISemanticContentAttribute, layoutDirection: UIUserInterfaceLayoutDirection): UIUserInterfaceLayoutDirection;

  _position: Position;

  accessibilityIgnoresInvertColors: boolean;

  alignContent: AlignContent;

  alignItems: AlignItems;

  alignSelf: AlignSelf;

  readonly alignmentRectInsets: UIEdgeInsets;

  alpha: number;

  anchorPoint: CGPoint;

  readonly appliedContentSizeCategoryLimitsDescription: string;

  aspectRatio: number;

  autoresizesSubviews: boolean;

  autoresizingMask: UIViewAutoresizing;

  backgroundColor: UIColor;

  readonly bottomAnchor: NSLayoutYAxisAnchor;

  bounds: CGRect;

  readonly centerXAnchor: NSLayoutXAxisAnchor;

  readonly centerYAnchor: NSLayoutYAxisAnchor;

  clearsContextBeforeDrawing: boolean;

  clipsToBounds: boolean;

  readonly constraints: NSArray<NSLayoutConstraint>;

  contentMode: UIViewContentMode;

  contentScaleFactor: number;

  contentStretch: CGRect;

  direction: Direction;

  directionalLayoutMargins: NSDirectionalEdgeInsets;

  display: Display;

  readonly effectiveUserInterfaceLayoutDirection: UIUserInterfaceLayoutDirection;

  exclusiveTouch: boolean;

  readonly firstBaselineAnchor: NSLayoutYAxisAnchor;

  flexBasisCompat: MasonDimensionCompat;

  flexDirection: FlexDirection;

  flexGrow: number;

  flexShrink: number;

  flexWrap: FlexWrap;

  focusEffect: UIFocusEffect;

  focusGroupIdentifier: string;

  focusGroupPriority: number;

  readonly focused: boolean;

  frame: CGRect;

  gestureRecognizers: NSArray<UIGestureRecognizer>;

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

  readonly hasAmbiguousLayout: boolean;

  readonly heightAnchor: NSLayoutDimension;

  hidden: boolean;

  inBatch: boolean;

  insetsLayoutMarginsFromSafeArea: boolean;

  interactions: NSArray<UIInteraction>;

  readonly intrinsicContentSize: CGSize;

  readonly isMasonEnabled: boolean;

  justifyContent: JustifyContent;

  justifyItems: JustifyItems;

  justifySelf: JustifySelf;

  readonly keyboardLayoutGuide: UIKeyboardLayoutGuide;

  largeContentImage: UIImage;

  largeContentImageInsets: UIEdgeInsets;

  largeContentTitle: string;

  readonly lastBaselineAnchor: NSLayoutYAxisAnchor;

  readonly layer: CALayer;

  readonly layoutGuides: NSArray<UILayoutGuide>;

  layoutMargins: UIEdgeInsets;

  readonly layoutMarginsGuide: UILayoutGuide;

  readonly leadingAnchor: NSLayoutXAxisAnchor;

  readonly leftAnchor: NSLayoutXAxisAnchor;

  maskView: UIView;

  readonly mason: MasonNode;

  readonly masonNodePtr: number;

  readonly masonStylePtr: number;

  maximumContentSizeCategory: string;

  minimumContentSizeCategory: string;

  motionEffects: NSArray<UIMotionEffect>;

  multipleTouchEnabled: boolean;

  opaque: boolean;

  overflow: Overflow;

  overflowX: Overflow;

  overflowY: Overflow;

  overrideUserInterfaceStyle: UIUserInterfaceStyle;

  preservesSuperviewLayoutMargins: boolean;

  readonly readableContentGuide: UILayoutGuide;

  restorationIdentifier: string;

  readonly rightAnchor: NSLayoutXAxisAnchor;

  readonly rootView: UIView;

  readonly safeAreaInsets: UIEdgeInsets;

  readonly safeAreaLayoutGuide: UILayoutGuide;

  scalesLargeContentImage: boolean;

  scrollBarWidthCompat: MasonDimensionCompat;

  semanticContentAttribute: UISemanticContentAttribute;

  showsLargeContentViewer: boolean;

  style: MasonStyle;

  readonly subviews: NSArray<UIView>;

  readonly superview: UIView;

  tag: number;

  tintAdjustmentMode: UIViewTintAdjustmentMode;

  tintColor: UIColor;

  readonly topAnchor: NSLayoutYAxisAnchor;

  readonly trailingAnchor: NSLayoutXAxisAnchor;

  transform3D: CATransform3D;

  translatesAutoresizingMaskIntoConstraints: boolean;

  userInteractionEnabled: boolean;

  readonly viewForFirstBaselineLayout: UIView;

  readonly viewForLastBaselineLayout: UIView;

  readonly widthAnchor: NSLayoutDimension;

  readonly window: UIWindow;

  readonly areAnimationsEnabled: boolean;

  readonly inheritedAnimationDuration: number;

  readonly layerClass: typeof NSObject;

  readonly masonPtr: number;

  readonly requiresConstraintBasedLayout: boolean;

  accessibilityIdentifier: string; // inherited from UIAccessibilityIdentification

  readonly canBecomeFocused: boolean; // inherited from UIFocusItem

  center: CGPoint; // inherited from UIDynamicItem

  readonly collisionBoundingPath: UIBezierPath; // inherited from UIDynamicItem

  readonly collisionBoundsType: UIDynamicItemCollisionBoundsType; // inherited from UIDynamicItem

  readonly coordinateSpace: UICoordinateSpace; // inherited from UIFocusItemContainer

  readonly debugDescription: string; // inherited from NSObjectProtocol

  readonly description: string; // inherited from NSObjectProtocol

  readonly focusItemContainer: UIFocusItemContainer; // inherited from UIFocusEnvironment

  readonly hash: number; // inherited from NSObjectProtocol

  readonly isProxy: boolean; // inherited from NSObjectProtocol

  readonly isTransparentFocusItem: boolean; // inherited from UIFocusItem

  readonly parentFocusEnvironment: UIFocusEnvironment; // inherited from UIFocusEnvironment

  readonly preferredFocusEnvironments: NSArray<UIFocusEnvironment>; // inherited from UIFocusEnvironment

  readonly preferredFocusedView: UIView; // inherited from UIFocusEnvironment

  readonly superclass: typeof NSObject; // inherited from NSObjectProtocol

  readonly traitCollection: UITraitCollection; // inherited from UITraitEnvironment

  transform: CGAffineTransform; // inherited from UIDynamicItem

  readonly; // inherited from NSObjectProtocol

  constructor(o: { coder: NSCoder }); // inherited from NSCoding

  constructor(o: { frame: CGRect });

  actionForLayerForKey(layer: CALayer, event: string): CAAction;

  addConstraint(constraint: NSLayoutConstraint): void;

  addConstraints(constraints: NSArray<NSLayoutConstraint> | NSLayoutConstraint[]): void;

  addGestureRecognizer(gestureRecognizer: UIGestureRecognizer): void;

  addInteraction(interaction: UIInteraction): void;

  addLayoutGuide(layoutGuide: UILayoutGuide): void;

  addMotionEffect(effect: UIMotionEffect): void;

  addSubview(view: UIView): void;

  addSubviews(views: NSArray<UIView> | UIView[]): void;

  addSubviewsAt(views: NSArray<UIView> | UIView[], index: number): void;

  alignmentRectForFrame(frame: CGRect): CGRect;

  bringSubviewToFront(view: UIView): void;

  class(): typeof NSObject;

  configure(block: (p1: MasonNode) => void): void;

  conformsToProtocol(aProtocol: any /* Protocol */): boolean;

  constraintsAffectingLayoutForAxis(axis: UILayoutConstraintAxis): NSArray<NSLayoutConstraint>;

  contentCompressionResistancePriorityForAxis(axis: UILayoutConstraintAxis): number;

  contentHuggingPriorityForAxis(axis: UILayoutConstraintAxis): number;

  convertPointFromCoordinateSpace(point: CGPoint, coordinateSpace: UICoordinateSpace): CGPoint;

  convertPointFromView(point: CGPoint, view: UIView): CGPoint;

  convertPointToCoordinateSpace(point: CGPoint, coordinateSpace: UICoordinateSpace): CGPoint;

  convertPointToView(point: CGPoint, view: UIView): CGPoint;

  convertRectFromCoordinateSpace(rect: CGRect, coordinateSpace: UICoordinateSpace): CGRect;

  convertRectFromView(rect: CGRect, view: UIView): CGRect;

  convertRectToCoordinateSpace(rect: CGRect, coordinateSpace: UICoordinateSpace): CGRect;

  convertRectToView(rect: CGRect, view: UIView): CGRect;

  decodeRestorableStateWithCoder(coder: NSCoder): void;

  didAddSubview(subview: UIView): void;

  didHintFocusMovement(hint: UIFocusMovementHint): void;

  didMoveToSuperview(): void;

  didMoveToWindow(): void;

  didUpdateFocusInContextWithAnimationCoordinator(context: UIFocusUpdateContext, coordinator: UIFocusAnimationCoordinator): void;

  displayLayer(layer: CALayer): void;

  drawLayerInContext(layer: CALayer, ctx: any): void;

  drawRect(rect: CGRect): void;

  drawRectForViewPrintFormatter(rect: CGRect, formatter: UIViewPrintFormatter): void;

  drawViewHierarchyInRectAfterScreenUpdates(rect: CGRect, afterUpdates: boolean): boolean;

  encodeRestorableStateWithCoder(coder: NSCoder): void;

  encodeWithCoder(coder: NSCoder): void;

  endEditing(force: boolean): boolean;

  exchangeSubviewAtIndexWithSubviewAtIndex(index1: number, index2: number): void;

  exerciseAmbiguityInLayout(): void;

  focusItemsInRect(rect: CGRect): NSArray<UIFocusItem>;

  frameForAlignmentRect(alignmentRect: CGRect): CGRect;

  gestureRecognizerShouldBegin(gestureRecognizer: UIGestureRecognizer): boolean;

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

  hitTestWithEvent(point: CGPoint, event: _UIEvent): UIView;

  initWithCoder(coder: NSCoder): this;

  initWithFrame(frame: CGRect): this;

  insertSubviewAboveSubview(view: UIView, siblingSubview: UIView): void;

  insertSubviewAtIndex(view: UIView, index: number): void;

  insertSubviewBelowSubview(view: UIView, siblingSubview: UIView): void;

  invalidateIntrinsicContentSize(): void;

  isDescendantOfView(view: UIView): boolean;

  isEqual(object: any): boolean;

  isKindOfClass(aClass: typeof NSObject): boolean;

  isMemberOfClass(aClass: typeof NSObject): boolean;

  layerWillDraw(layer: CALayer): void;

  layoutIfNeeded(): void;

  layoutMarginsDidChange(): void;

  layoutSublayersOfLayer(layer: CALayer): void;

  layoutSubviews(): void;

  nativeScriptSetFormattedTextDecorationAndTransformLetterSpacingLineHeight(details: NSDictionary<any, any>, letterSpacing: number, lineHeight: number): void;

  nativeScriptSetTextDecorationAndTransformTextDecorationLetterSpacingLineHeight(text: string, textDecoration: string, letterSpacing: number, lineHeight: number): void;

  needsUpdateConstraints(): boolean;

  passThroughParent(): boolean;

  performSelector(aSelector: string): any;

  performSelectorWithObject(aSelector: string, object: any): any;

  performSelectorWithObjectWithObject(aSelector: string, object1: any, object2: any): any;

  pointInsideWithEvent(point: CGPoint, event: _UIEvent): boolean;

  removeConstraint(constraint: NSLayoutConstraint): void;

  removeConstraints(constraints: NSArray<NSLayoutConstraint> | NSLayoutConstraint[]): void;

  removeFromSuperview(): void;

  removeGestureRecognizer(gestureRecognizer: UIGestureRecognizer): void;

  removeInteraction(interaction: UIInteraction): void;

  removeLayoutGuide(layoutGuide: UILayoutGuide): void;

  removeMotionEffect(effect: UIMotionEffect): void;

  resizableSnapshotViewFromRectAfterScreenUpdatesWithCapInsets(rect: CGRect, afterUpdates: boolean, capInsets: UIEdgeInsets): UIView;

  respondsToSelector(aSelector: string): boolean;

  retainCount(): number;

  safeAreaInsetsDidChange(): void;

  self(): this;

  sendSubviewToBack(view: UIView): void;

  setBorder(left: number, top: number, right: number, bottom: number): void;

  setBorderBottom(bottom: number, type: number): void;

  setBorderLeft(left: number, type: number): void;

  setBorderRight(right: number, type: number): void;

  setBorderTop(top: number, type: number): void;

  setColumnGap(column: number, type: number): void;

  setContentCompressionResistancePriorityForAxis(priority: number, axis: UILayoutConstraintAxis): void;

  setContentHuggingPriorityForAxis(priority: number, axis: UILayoutConstraintAxis): void;

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

  setNeedsDisplay(): void;

  setNeedsDisplayInRect(rect: CGRect): void;

  setNeedsFocusUpdate(): void;

  setNeedsLayout(): void;

  setNeedsUpdateConstraints(): void;

  setPadding(left: number, right: number, top: number, bottom: number): void;

  setPaddingBottom(bottom: number, type: number): void;

  setPaddingLeft(left: number, type: number): void;

  setPaddingRight(right: number, type: number): void;

  setPaddingTop(top: number, type: number): void;

  setPassThroughParent(passThroughParent: boolean): void;

  setRowGap(row: number, type: number): void;

  setSize(width: number, height: number): void;

  setSizeHeight(height: number, type: number): void;

  setSizeWidth(width: number, type: number): void;

  shouldUpdateFocusInContext(context: UIFocusUpdateContext): boolean;

  sizeThatFits(size: CGSize): CGSize;

  sizeToFit(): void;

  snapshotViewAfterScreenUpdates(afterUpdates: boolean): UIView;

  systemLayoutSizeFittingSize(targetSize: CGSize): CGSize;

  systemLayoutSizeFittingSizeWithHorizontalFittingPriorityVerticalFittingPriority(targetSize: CGSize, horizontalFittingPriority: number, verticalFittingPriority: number): CGSize;

  tintColorDidChange(): void;

  traitCollectionDidChange(previousTraitCollection: UITraitCollection): void;

  updateConstraints(): void;

  updateConstraintsIfNeeded(): void;

  updateFocusIfNeeded(): void;

  viewForBaselineLayout(): UIView;

  viewPrintFormatter(): UIViewPrintFormatter;

  viewWithTag(tag: number): UIView;

  willMoveToSuperview(newSuperview: UIView): void;

  willMoveToWindow(newWindow: UIWindow): void;

  willRemoveSubview(subview: UIView): void;
}
