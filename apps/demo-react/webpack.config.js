const webpack = require('@nativescript/webpack');
const { resolve } = require('path');

module.exports = (env) => {
  webpack.init(env);

  webpack.chainWebpack((config) => {
    config.devServer.hotOnly(true);
    config.devServer.hot(true);

    // shared demo code
    config.resolve.alias.set('@demo/shared', resolve(__dirname, '..', '..', 'tools', 'demo'));

    // Force a SINGLE @nativescript/core copy — same fix as demo-solid. The masonkit
    // plugin is linked from outside this demo's node_modules, so without this it
    // resolves its `@nativescript/core` import to a different copy than the app
    // does, producing two `Color` classes etc. and silently dropping style props.
    config.resolve.alias.set('@nativescript/core', resolve(__dirname, 'node_modules', '@nativescript', 'core'));
    config.resolve.alias.set('react-dom', resolve(__dirname, 'node_modules', '@tanstack', 'react-nativescript-router', 'dist', 'esm', 'react-dom.js'));

    // MasonKit branches on __ANDROID__ / __APPLE__ / __WINDOWS__ via DefinePlugin
    // substitution. @nativescript/webpack defines the others but not __WINDOWS__,
    // so it survives as a free variable and throws on the first style write
    // (see apps/demo-angular/webpack.config.js for the full writeup).
    config.plugin('DefinePlugin').tap((args) => {
      args[0] = {
        ...args[0],
        __WINDOWS__: env.platform === 'windows',
      };
      return args;
    });
  });

  // @nativescript/webpack's built-in 'ts' rule only matches `.ts$` (no JSX
  // support baked in). React's JSX doesn't need a special compiler like Solid's
  // fine-grained-reactivity transform does — TypeScript's own `jsx: "react-jsx"`
  // transform is enough — so just point ts-loader at `.tsx` too instead of
  // pulling in babel.
  webpack.chainWebpack((config) => {
    config.resolve.extensions.prepend('.tsx').prepend('.jsx');

    config.module
      .rule('tsx')
      .test(/\.tsx$/)
      .use('ts-loader')
      .loader('ts-loader')
      .options({
        transpileOnly: true,
        allowTsInNodeModules: true,
        compilerOptions: {
          sourceMap: true,
          declaration: false,
        },
      });
  });

  // The masonkit package is symlinked from packages/ (not node_modules/), so
  // @nativescript/webpack's 'hmr-core' rule (which excludes /node_modules/)
  // still matches its compiled output and appends a `module.hot.accept()`
  // snippet. That snippet references the now-elided `module` wrapper param on
  // masonkit's ESM-only output and crashes at require time. Exclude it.
  webpack.chainWebpack(
    (config) => {
      if (config.module.rules.has('hmr-core')) {
        config.module.rule('hmr-core').exclude.add(/dist[\\/]packages[\\/]nativescript-masonkit/);
      }
    },
    { order: 10 },
  );

  return webpack.resolveConfig();
};
