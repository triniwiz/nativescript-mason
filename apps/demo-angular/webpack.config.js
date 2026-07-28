const webpack = require('@nativescript/webpack');
const { resolve } = require('path');

module.exports = (env) => {
  webpack.init(env);
  webpack.useConfig('angular');

  webpack.chainWebpack((config, env) => {
    // shared demo code
    config.resolve.alias.set('@demo/shared', resolve(__dirname, '..', '..', 'tools', 'demo'));

    // MasonKit's source branches on __ANDROID__ / __APPLE__ / __WINDOWS__ and
    // relies on DefinePlugin substitution plus dead-code elimination to drop
    // the branches that don't apply to the target.
    //
    // @nativescript/webpack 5.0.38 defines __ANDROID__, __IOS__, __VISIONOS__
    // and __APPLE__, but not __WINDOWS__. Without the substitution the
    // identifier survives into the bundle as a free variable, and the first
    // style write to reach it throws `ReferenceError: __WINDOWS__ is not
    // defined` from Style.prepareMut — which every property setter goes
    // through, so it takes the app down on launch.
    //
    // Defining it here restores the substitution and with it the dead-code
    // elimination, so on Android and Apple builds the Windows branches fold to
    // false and are dropped, exactly like the other platform branches.
    //
    // This has to live in the app config rather than a `nativescript.webpack.js`
    // shipped by the plugin: that loader `require()`s the file and hardcodes the
    // .js extension, but the built package declares `"type": "module"`, so the
    // file would be parsed as ESM, `module.exports` would not bind, and the
    // loader would silently merge an empty object.
    config.plugin('DefinePlugin').tap((args) => {
      args[0] = {
        ...args[0],
        __WINDOWS__: env.platform === 'windows',
      };

      return args;
    });
  });

  // Example if you need to share images across demo apps:
  // webpack.Utils.addCopyRule({
  //   from: '../../../tools/images',
  // 	to: 'images',
  //   context: webpack.Utils.project.getProjectFilePath('node_modules')
  // });

  return webpack.resolveConfig();
};
