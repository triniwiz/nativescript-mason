/**
 * Loads MasonKit before the app's own entry module.
 *
 * @nativescript/webpack's app-css-loader puts `import "./app.css"` at the very top
 * of the app entry, and core parses a stylesheet - splitting every shorthand
 * (`border-radius`, `margin`, `padding`, `background`, ...) into longhands - as
 * soon as it is imported. MasonKit swaps in its own shorthand converters when its
 * properties register, which used to happen only when the app entry imported
 * MasonKit, i.e. after app.css. So app.css was split by core's converters instead:
 * `border-radius: 0 4px 0 4px` lost its 0 corners on a button, `padding: 0` was
 * dropped on mason views, and `rem`/`em` lost their units.
 *
 * Adding the package to the bundle entry right before the app entry registers
 * MasonKit's properties first, exactly as if it were the app's first import.
 *
 * @param {typeof import('@nativescript/webpack')} webpack
 */
module.exports = (webpack) => {
  webpack.chainWebpack((config) => {
    const bundle = config.entry('bundle');
    const entries = bundle.values();
    const appEntry = entries.lastIndexOf(webpack.Utils.platform.getEntryPath());
    if (appEntry === -1 || entries.includes('@triniwiz/nativescript-masonkit')) {
      return;
    }
    entries.splice(appEntry, 0, '@triniwiz/nativescript-masonkit');
    bundle.clear();
    entries.forEach((entry) => bundle.add(entry));
  });
};
