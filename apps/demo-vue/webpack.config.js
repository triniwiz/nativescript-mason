const webpack = require('@nativescript/webpack');
const { resolve } = require('path');

module.exports = (env) => {
  webpack.init(env);

  // Apply Vue config first
  webpack.useConfig('vue');

  webpack.chainWebpack((config) => {
    // shared demo code
    config.resolve.alias.set('@demo/shared', resolve(__dirname, '..', '..', 'tools', 'demo'));
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
  });

  // Example of how to share common images across demo apps:
  // webpack.Utils.addCopyRule({
  //   from: '../../../tools/images',
  // 	to: 'images',
  //   context: webpack.Utils.project.getProjectFilePath('node_modules')
  // });

  return webpack.resolveConfig();
};
