const fs = require('fs');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

// The NLDD CSS/JS bundle ships inside the lotc-nldd package. URL structure
// (/static/lotc/nldd/dist/...) unchanged; only the physical location moves.
const OUTPUT_DIR = path.resolve(__dirname, 'packages/lotc-nldd/src/lotc_nldd/static/lotc/nldd/dist');
const NLDD = 'node_modules/@nldd/design-system/dist';

// Assets consumed by the theme codegen (nldd theme).
//
// One file: since 0.8.83 `global.css` is NLDD's own umbrella and @imports the
// rest in the order it wants — fonts, variables (which pulls in the generated
// colours), document reset, rich text, form(-section), and fouc, which hides
// the body until the custom elements are :defined. Before that release the set
// was reset + settings + palettes.generated + global + fouc; those first three
// no longer exist, so keeping them here links three 404s.
//
// Measured, because the guess was worse than the truth: with the old list the
// page still renders correctly (0 contrast failures, 0 light islands), since
// global.css pulls in every token by itself. So this is dead weight and console
// noise, not a broken theme — but the manifest should say what is actually
// shipped.
const ASSET_MANIFEST = {
  css: ['css/global.css'],
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
