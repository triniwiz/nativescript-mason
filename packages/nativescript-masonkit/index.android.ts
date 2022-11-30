import { TSCViewBase } from './common';

export class TSCView extends TSCViewBase {
  createNativeView() {
    return new org.nativescript.mason.masonkit.View(this._context);
  }

  //@ts-ignore
  get android() {
    return this.nativeViewProtected as org.nativescript.mason.masonkit.View;
  }

  initNativeView(): void {
    super.initNativeView();

    console.time('initNativeView');
    const style = this.android.getStyle();
    style.setFlexDirection(org.nativescript.mason.masonkit.FlexDirection.Column);
    style.setAlignContent(org.nativescript.mason.masonkit.AlignContent.Stretch);
    console.timeEnd('initNativeView');
  }

  onLoaded(): void {
    super.onLoaded();
    console.time('onLoaded');

    const views = this._children.filter((item) => {
      if (!item.parent) {
        this._addView(item);
      }
      return !item.parent;
    });

    const array = Array.create('android.view.View', views.length);

    views.forEach((item, index) => {
      array[index] = item.nativeView;
    });

    this.nativeView.addViews(array);

    // this._children.forEach((item) => {
    //   if (!item.parent) {
    //     this._addView(item);
    //     this.nativeView.addView(item.nativeView);
    //   }
    // });
    console.timeEnd('onLoaded');
  }
}
