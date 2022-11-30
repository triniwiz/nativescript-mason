import { TSCViewBase } from './common';

export class TSCView extends TSCViewBase {
  createNativeView() {
    return MasonView.alloc().initWithFrame(CGRectZero);
  }

  onLoaded(): void {
    super.onLoaded();

    this._children.forEach((item) => {
      if (!item.parent) {
        this._addView(item);
        this.nativeView.addSubview(item.nativeView);
      }
    });

    console.log(this.nativeView.subviews);
  }
}
