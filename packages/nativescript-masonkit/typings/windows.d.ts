declare namespace NativeScript.Mason {
  enum Display { None = 0, Flex = 1, Grid = 2, Block = 3, Inline = 4, InlineBlock = 5, InlineFlex = 6, InlineGrid = 7 }
  enum Position { Static = 0, Relative = 1, Absolute = 2, Fixed = 3, Sticky = 4 }
  enum Direction { Inherit = 0, Ltr = 1, Rtl = 2 }
  enum FlexDirection { Row = 0, Column = 1, RowReverse = 2, ColumnReverse = 3 }
  enum FlexWrap { NoWrap = 0, Wrap = 1, WrapReverse = 2 }
  enum Overflow { Visible = 0, Hidden = 1, Scroll = 2, Clip = 3, Auto = 4 }
  enum AlignItems { Normal = -1, Start = 0, End = 1, Center = 2, Baseline = 3, Stretch = 4, FlexStart = 5, FlexEnd = 6 }
  enum AlignSelf { Normal = -1, Start = 0, End = 1, Center = 2, Baseline = 3, Stretch = 4, FlexStart = 5, FlexEnd = 6 }
  enum AlignContent { Normal = -1, Start = 0, End = 1, Center = 2, Stretch = 3, SpaceBetween = 4, SpaceAround = 5, SpaceEvenly = 6, FlexStart = 7, FlexEnd = 8 }
  enum JustifyItems { Normal = -1, Start = 0, End = 1, Center = 2, Baseline = 3, Stretch = 4, FlexStart = 5, FlexEnd = 6 }
  enum JustifySelf { Normal = -1, Start = 0, End = 1, Center = 2, Baseline = 3, Stretch = 4, FlexStart = 5, FlexEnd = 6 }
  enum JustifyContent { Normal = -1, Start = 0, End = 1, Center = 2, Stretch = 3, SpaceBetween = 4, SpaceAround = 5, SpaceEvenly = 6, FlexStart = 7, FlexEnd = 8 }
  enum GridAutoFlow { Row = 0, Column = 1, RowDense = 2, ColumnDense = 3 }
  enum BoxSizing { BorderBox = 0, ContentBox = 1 }
  enum TextAlign { Auto = 0, Left = 1, Right = 2, Center = 3, Justify = 4, Start = 5, End = 6 }
  enum DimensionType { Auto = 0, Points = 1, Percent = 2 }
  enum AvailableSpaceType { Definite = 0, MinContent = 1, MaxContent = 2 }
  enum PseudoState {
    Default = 0x00,
    Hover = 0x01,
    Active = 0x02,
    Focus = 0x04,
    FocusWithin = 0x08,
    FocusVisible = 0x10,
    Disabled = 0x40,
    Checked = 0x80,
  }

  // Int64 measure result is surfaced to JS as a number; pack/unpack via MeasureOutput.
  type MeasureFunc = (knownWidth: number, knownHeight: number, availableWidth: number, availableHeight: number) => number;

  class MeasureOutput {
    static Make(width: number, height: number): number;
    static GetWidth(measureOutput: number): number;
    static GetHeight(measureOutput: number): number;
  }

  class Layout {
    readonly X: number;
    readonly Y: number;
    readonly Width: number;
    readonly Height: number;
    readonly BorderTop: number;
    readonly BorderRight: number;
    readonly BorderBottom: number;
    readonly BorderLeft: number;
    readonly MarginTop: number;
    readonly MarginRight: number;
    readonly MarginBottom: number;
    readonly MarginLeft: number;
    readonly PaddingTop: number;
    readonly PaddingRight: number;
    readonly PaddingBottom: number;
    readonly PaddingLeft: number;
    readonly ContentWidth: number;
    readonly ContentHeight: number;
    readonly ScrollbarWidth: number;
    readonly ScrollbarHeight: number;
    readonly Order: number;
    readonly HasChildren: boolean;
    // IVectorView<Layout> — has .Size and .GetAt(i).
    readonly Children: { Size: number; GetAt(index: number): Layout };
  }

  class Style {
    SetWithValues(
      display: number, position: number, direction: number, flexDirection: number,
      flexWrap: number, overflow: number, alignItems: number, alignSelf: number,
      alignContent: number, justifyItems: number, justifySelf: number, justifyContent: number,
      insetLeftType: number, insetLeftValue: number, insetRightType: number, insetRightValue: number,
      insetTopType: number, insetTopValue: number, insetBottomType: number, insetBottomValue: number,
      marginLeftType: number, marginLeftValue: number, marginRightType: number, marginRightValue: number,
      marginTopType: number, marginTopValue: number, marginBottomType: number, marginBottomValue: number,
      paddingLeftType: number, paddingLeftValue: number, paddingRightType: number, paddingRightValue: number,
      paddingTopType: number, paddingTopValue: number, paddingBottomType: number, paddingBottomValue: number,
      borderLeftType: number, borderLeftValue: number, borderRightType: number, borderRightValue: number,
      borderTopType: number, borderTopValue: number, borderBottomType: number, borderBottomValue: number,
      flexGrow: number, flexShrink: number, flexBasisType: number, flexBasisValue: number,
      widthType: number, widthValue: number, heightType: number, heightValue: number,
      minWidthType: number, minWidthValue: number, minHeightType: number, minHeightValue: number,
      maxWidthType: number, maxWidthValue: number, maxHeightType: number, maxHeightValue: number,
      gapRowType: number, gapRowValue: number, gapColumnType: number, gapColumnValue: number,
      aspectRatio: number,
      gridAutoRows: string, gridAutoColumns: string, gridAutoFlow: number,
      gridColumn: string, gridColumnStart: string, gridColumnEnd: string,
      gridRow: string, gridRowStart: string, gridRowEnd: string,
      gridTemplateRows: string, gridTemplateColumns: string,
      overflowX: number, overflowY: number, scrollbarWidth: number, textAlign: number,
      boxSizing: number, gridArea: string, gridTemplateAreas: string): void;

    UpdateGrid(
      gridAutoRows: string, gridAutoColumns: string, gridColumn: string,
      gridColumnStart: string, gridColumnEnd: string, gridRow: string,
      gridRowStart: string, gridRowEnd: string, gridTemplateRows: string,
      gridTemplateColumns: string, gridArea: string, gridTemplateAreas: string): void;

    PrepareForMutation(): void;
    // IVectorView<UInt8>.
    GetStyleBuffer(): { Size: number; GetAt(index: number): number };
    // Live, mutable style buffer (IBuffer -> writable ArrayBuffer). Write StyleKeys offsets, then
    // call the owning element's SyncStyle.
    readonly Values: any;

    readonly GridAreaCss: string;
    readonly GridTemplateAreasCss: string;
    readonly GridAutoRowsCss: string;
    readonly GridAutoColumnsCss: string;
    readonly GridColumnCss: string;
    readonly GridColumnStartCss: string;
    readonly GridColumnEndCss: string;
    readonly GridRowCss: string;
    readonly GridRowStartCss: string;
    readonly GridRowEndCss: string;
    readonly GridTemplateRowsCss: string;
    readonly GridTemplateColumnsCss: string;
  }

  class Node {
    AddChild(child: Node): void;
    Prepend(child: Node): void;
    AddChildAt(child: Node, index: number): void;
    InsertChildBefore(child: Node, reference: Node): void;
    InsertChildAfter(child: Node, reference: Node): void;
    ReplaceChildAt(child: Node, index: number): Node;
    RemoveChild(child: Node): Node;
    RemoveChildAt(index: number): Node;
    RemoveChildren(): void;
    GetChildAt(index: number): Node;
    SetChildren(children: Node[]): void;
    AddChildren(children: Node[]): void;
    PrependChildren(children: Node[]): void;
    IsChildrenSame(children: Node[]): boolean;

    IsDirty(): boolean;
    MarkDirty(): void;
    IsEqual(other: Node): boolean;

    PseudoStates: number;
    HasPseudoState(flag: number): boolean;
    PreparePseudoBuffer(flags: number): any;

    readonly Style: Style;

    SetMeasure(callback: MeasureFunc): void;
    RemoveMeasure(): void;

    Compute(): void;
    ComputeWH(width: number, height: number): void;
    ComputeSize(widthType: AvailableSpaceType, widthValue: number, heightType: AvailableSpaceType, heightValue: number): void;
    ComputeMaxContent(): void;
    ComputeMinContent(): void;

    GetLayout(): Layout;
    ComputeAndLayout(): Layout;
    ComputeWHAndLayout(width: number, height: number): Layout;
    ComputeMaxContentAndLayout(): Layout;
    ComputeMinContentAndLayout(): Layout;

    PrintTree(): void;
    Destroy(): void;
  }

  class Mason {
    constructor();
    static Instance(): Mason;
    Clear(): void;
    SetDeviceScale(scale: number): void;
    Preflight: boolean;
    CreateNode(anonymous: boolean): Node;
    CreateTextNode(anonymous: boolean): Node;
    CreateImageNode(): Node;
    CreateButtonNode(): Node;
    CreateLineBreakNode(): Node;
    CreateListItemNode(): Node;
    PrintTree(node: Node): void;
  }

  // Implemented by every Mason element (View + the leaf controls). A parent View pulls any child's
  // Node into the layout tree through this.
  interface IMasonElement {
    readonly Node: Node;
    readonly Style: Style;
    SyncStyle(dirtyLow: string, dirtyHigh: string): void;
  }

  // Rasterized visual result (Image + size + overhang) returned by Css.CreateShadow/CreateBorder.
  class CssImageResult {
    readonly Image: any;
    readonly Width: number;
    readonly Height: number;
    readonly Overhang: number;
  }

  // Visual CSS helpers driven by the .windows.ts layer. Colors are 0xAARRGGBB.
  class Css {
    static ApplyBackground(element: any, argb: number): void;
    static ClearBackground(element: any): void;
    static ApplyOpacity(element: any, opacity: number): void;
    static ApplyTransform(element: any, m11: number, m12: number, m21: number, m22: number, offsetX: number, offsetY: number): void;
    static ClearTransform(element: any): void;
    static ApplyCornerRadius(element: any, offsetX: number, offsetY: number, width: number, height: number, radiusX: number, radiusY: number): void;
    static ClearClip(element: any): void;
    static CreateShadow(width: number, height: number, blurRadius: number, spread: number, cornerRadius: number, offsetX: number, offsetY: number, argb: number): CssImageResult;
    static CreateBorder(width: number, height: number, topWidth: number, rightWidth: number, bottomWidth: number, leftWidth: number, topArgb: number, rightArgb: number, bottomArgb: number, leftArgb: number, cornerRadius: number): CssImageResult;
    static ApplyLinearGradient(element: any, angleDegrees: number, stops: string): void;
    static ApplyRadialGradient(element: any, stops: string): void;
    static ReparentChild(parent: any, child: any, index: number): void;
    static RemoveChild(parent: any, child: any): void;
    static ApplyShadow(element: any, offsetX: number, offsetY: number, blurRadius: number, argb: number, cornerRadius: number): void;
    static ClearShadow(element: any): void;
  }

  // A Mason-laid-out WinUI panel (a Microsoft.UI.Xaml.Controls.Panel) — the Windows analogue of the
  // iOS MasonUIView / Android View. Owns a Node and runs Mason layout in its Measure/Arrange
  // overrides. NodeKind: 0 generic/flex, 1 text, 2 image, 3 button, 4 list-item.
  class View /* extends Microsoft.UI.Xaml.Controls.Panel, implements IMasonElement */ {
    constructor();
    constructor(nodeKind: number);
    readonly Node: Node;
    readonly Style: Style;
    readonly NodeKind: number;
    Invalidate(): void;
  }

  // Text leaf — hosts a TextBlock; Mason text node sized from the text's natural size.
  class Text /* Panel, IMasonElement */ {
    constructor();
    readonly Node: Node;
    readonly Style: Style;
    Content: string;
    FontSize: number;
    // CSS font-family list.
    SetFontFamily(families: string): void;
    // Inline-run management: runs are TextNode descriptors composed into the TextBlock's Inlines.
    // All text styling is read from the live style buffer on SyncStyle (no per-property setters).
    SetRun(run: TextNode, index: number): void;
    RemoveRun(run: TextNode): void;
    ClearRuns(): void;
  }

  // Image leaf — hosts an Image; Source is a uri/path.
  class Image /* Panel, IMasonElement */ {
    constructor();
    readonly Node: Node;
    readonly Style: Style;
    Source: string;
  }

  // Button leaf — hosts a Button; Content is the label.
  class Button /* Panel, IMasonElement */ {
    constructor();
    readonly Node: Node;
    readonly Style: Style;
    Content: string;
  }

  // Line break — zero-size leaf backed by a line-break node (inline flow).
  class Br /* Panel, IMasonElement */ {
    constructor();
    readonly Node: Node;
    readonly Style: Style;
  }

  // List item — a container backed by a list-item node.
  class Li /* Panel, IMasonElement */ {
    constructor();
    readonly Node: Node;
    readonly Style: Style;
    Invalidate(): void;
  }

  // <ul>/<ol> container.
  class List /* Panel, IMasonElement */ {
    constructor();
    constructor(ordered: boolean);
    readonly Node: Node;
    readonly Style: Style;
    readonly Ordered: boolean;
    Invalidate(): void;
  }

  // Inline text node (DOM text node).
  class TextNode /* Panel, IMasonElement */ {
    constructor();
    readonly Node: Node;
    readonly Style: Style;
    Data: string;
    SetColor(argb: number): void;
    SetFontSize(px: number): void;
    SetFontWeight(weight: number): void;
    SetLineHeight(multiplier: number): void;
    SetLetterSpacing(px: number): void;
    SetBreak(isBreak: boolean): void;
  }

  // <textarea> — native multiline TextBox.
  class TextArea /* Panel, IMasonElement */ {
    constructor();
    readonly Node: Node;
    readonly Style: Style;
    Value: string;
    Placeholder: string;
    Rows: number;
    Cols: number;
    MaxLength: number;
  }

  // <input> — hosts a stock control chosen by Type (MasonInputType raw value).
  class Input /* Panel, IMasonElement */ {
    constructor();
    readonly Node: Node;
    readonly Style: Style;
    Type: number;
    Value: string;
    Placeholder: string;
    Multiple: boolean;
    Accept: string;
  }
}

// Platform build-time flag (defined by the @nativescript/windows webpack config, like __APPLE__).
declare const __WINDOWS__: boolean;

// @nativescript/windows runtime WinRT interop helpers (present when running on Windows).
declare const NSWinRT: {
  toPromise<T = any>(op: any): Promise<T>;
  asDelegate(typeName: string, fn: (...args: any[]) => any): any;
  asDelegate(fn: (...args: any[]) => any): any;
};
