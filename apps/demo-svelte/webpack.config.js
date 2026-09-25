const webpack = require('@nativescript/webpack');

module.exports = (env) => {
  webpack.init(env);
  webpack.useConfig('svelte');

  webpack.chainWebpack((config, env) => {
    // MasonKit branches on __WINDOWS__ too; NativeScript webpack only defines
    // the Android and Apple flags.
    config.plugin('DefinePlugin').tap((args) => {
      args[0] = { ...args[0], __WINDOWS__: env.platform === 'windows' };
      return args;
    });
    config.watchOptions({ ignored: ['**/src-native/**', '**/platforms/**'] });
  });

  return webpack.resolveConfig();
};
