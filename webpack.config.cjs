const fs = require('fs');
const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const ReplaceInFileWebpackPlugin = require("replace-in-file-webpack-plugin");

const OUTPUT_DIR = path.resolve(__dirname, 'python/src/lord_of_the_components/static/lotc/dist');

// Asset manifest consumed by the codegen (see plan v7 T0.1 / F6). The order matches
// the historical page.html.j2 link order so the generated <c-page> stays byte-stable.
// Paths are relative to the dist output directory.
const ASSET_MANIFEST = {
  css: [
    'lotc.css',
    '@nl-rvo/assets/fonts/index.css',
    '@nl-rvo/assets/icons/index.css',
    '@nl-rvo/assets/images/index.css',
    '@nl-rvo/design-tokens/index.css',
    '@nl-rvo/component-library-css/index.css',
    '@nl-rvo/css-button/index.css',
  ],
  js: [
    { src: 'lotc.js' },
    { src: '@nl-rvo/design-tokens/index.mjs', module: true },
  ],
};

// Tiny inline plugin: write the asset manifest into the dist dir once the build has emitted.
// Replaces HtmlWebpackPlugin — instead of generating page.html.j2 we emit assets.json that
// the theme codegen reads to produce the per-theme <c-page> template.
class AssetManifestPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('AssetManifestPlugin', (_compilation, callback) => {
      const target = path.join(compiler.outputPath, 'assets.json');
      fs.mkdir(path.dirname(target), { recursive: true }, (mkdirErr) => {
        if (mkdirErr) return callback(mkdirErr);
        fs.writeFile(target, JSON.stringify(ASSET_MANIFEST, null, 2) + '\n', callback);
      });
    });
  }
}

module.exports = {
  mode: 'development',
  entry: './fe_src/ts/lotc.ts',
  output: {
    filename: 'lotc.js',
    path: OUTPUT_DIR,
    publicPath: '/static/lotc/dist/',
    library: 'lotc',
    libraryTarget: 'umd',
    clean: true,
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.ts$/i,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.fe.json',
          },
        },
        exclude: /node_modules/
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
              sassOptions: {
                outputStyle: "expanded",
              },
            },
          },
        ],
      },
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: [
    // Copy the @nl-rvo package assets into dist/@nl-rvo/... (previously done by
    // html-webpack-deploy-plugin, which required html-webpack-plugin).
    new CopyPlugin({
      patterns: [
        { from: 'node_modules/@nl-rvo/assets/fonts', to: '@nl-rvo/assets/fonts' },
        { from: 'node_modules/@nl-rvo/assets/icons', to: '@nl-rvo/assets/icons' },
        { from: 'node_modules/@nl-rvo/assets/images', to: '@nl-rvo/assets/images' },
        { from: 'node_modules/@nl-rvo/design-tokens/dist/index.css', to: '@nl-rvo/design-tokens/index.css' },
        { from: 'node_modules/@nl-rvo/design-tokens/dist/index.js', to: '@nl-rvo/design-tokens/index.mjs' },
        { from: 'node_modules/@nl-rvo/component-library-css/dist/index.css', to: '@nl-rvo/component-library-css/index.css' },
        { from: 'node_modules/@nl-rvo/css-button/dist/index.css', to: '@nl-rvo/css-button/index.css' },
      ],
    }),
    new MiniCssExtractPlugin({
      filename: "lotc.css",
      chunkFilename: "[id].css",
    }),
    new AssetManifestPlugin(),
    // Rewrite relative url() references in the icons CSS to absolute /static paths.
    new ReplaceInFileWebpackPlugin([{
      dir: 'python/src/lord_of_the_components/static/lotc/dist/@nl-rvo/assets/icons/',
      files: ['index.css'],
      rules: [{
        search: /url\("(?!\/)/ig,
        replace: 'url("/static/lotc/dist/@nl-rvo/assets/icons/'
      }]
    }])
  ]
};
