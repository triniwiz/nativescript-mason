const webpack = require('@nativescript/webpack');
const { resolve } = require('path');

module.exports = (env) => {
  webpack.init(env);

  // Apply Vue config first
  webpack.useConfig('vue');

  webpack.chainWebpack((config, env) => {
    // shared demo code
    config.resolve.alias.set('@demo/shared', resolve(__dirname, '..', '..', 'tools', 'demo'));

    // NativeScript webpack defines the Android and Apple platform constants,
    // but not __WINDOWS__. MasonKit branches on all three, so without this
    // substitution the Windows checks survive as free variables and crash the
    // Android app the first time a MasonKit native event is registered.
    config.plugin('DefinePlugin').tap((args) => {
      args[0] = {
        ...args[0],
        __WINDOWS__: env.platform === 'windows',
      };

      return args;
    });

    config.resolve.set('fallback', {
      path: false,
      util: false,
      url: false,
      os: false,
      crypto: false,
      stream: false,
      process: false,
      http: false,
      https: false,
      fs: false,
      assert: false,
      net: false,
      constants: false,
      zlib: false,
      tty: false,
      vm: false,
      async_hooks: false,
    });
    // Exclude native source directories from file watching to avoid
    // "too many files" errors caused by the symlinked masonkit package
    config.watchOptions({
      ignored: ['**/src-native/**', '**/platforms/**'],
    });
  });

  // Example of how to share common images across demo apps:
  // webpack.Utils.addCopyRule({
  //   from: '../../../tools/images',
  // 	to: 'images',
  //   context: webpack.Utils.project.getProjectFilePath('node_modules')
  // });

  return webpack.resolveConfig();
};
