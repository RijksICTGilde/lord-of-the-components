const fs = require('fs');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const OUTPUT_DIR = path.resolve(__dirname, 'python/src/lord_of_the_components/static/lotc/nldd/dist');
const NLDD = 'node_modules/@nldd/design-system/dist';

// Assets consumed by the theme codegen (nldd theme). CSS order matches the
// storybook bootstrap: reset -> settings(tokens) -> global. fouc hides the body
// until custom elements are :defined.
const ASSET_MANIFEST = {
  css: ['css/reset.css', 'css/settings.css', 'css/palettes.generated.css', 'css/global.css', 'css/fouc.css'],
  js: [{ src: 'nldd.js', module: true }],
};

class AssetManifestPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('AssetManifestPlugin', (_c, cb) => {
      const target = path.join(compiler.outputPath, 'assets.json');
      fs.mkdir(path.dirname(target), { recursive: true }, (e) => {
        if (e) return cb(e);
        fs.writeFile(target, JSON.stringify(ASSET_MANIFEST, null, 2) + '\n', cb);
      });
    });
  }
}

module.exports = {
  mode: 'production',
  entry: './fe_src/ts/nldd.ts',
  output: { filename: 'nldd.js', path: OUTPUT_DIR, publicPath: '/static/lotc/nldd/dist/', clean: true },
  module: { rules: [{ test: /\.ts$/i, use: { loader: 'ts-loader', options: { configFile: 'tsconfig.fe.json', transpileOnly: true } }, exclude: /node_modules/ }] },
  resolve: { extensions: ['.ts', '.js'] },
  plugins: [
    new CopyPlugin({ patterns: [
      { from: `${NLDD}/css`, to: 'css' },
      { from: `${NLDD}/fonts`, to: 'fonts', noErrorOnMissing: true },
      { from: `${NLDD}/assets`, to: 'assets', noErrorOnMissing: true },
    ] }),
    new AssetManifestPlugin(),
  ],
};
