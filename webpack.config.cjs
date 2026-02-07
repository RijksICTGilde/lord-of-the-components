const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackDeployPlugin = require("html-webpack-deploy-plugin");
const ReplaceInFileWebpackPlugin = require("replace-in-file-webpack-plugin");

module.exports = {
  mode: 'development',
  entry: './fe_src/ts/lotc.ts',
  output: {
    filename: 'lotc.js',
    path: path.resolve(__dirname, 'python/src/lord_of_the_components/static/lotc/dist'),
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
    new HtmlWebpackPlugin({
      template: 'python/src/lord_of_the_components/templates/components/page.html.j2.webpack',
      filename: path.resolve(__dirname, 'python/src/lord_of_the_components/templates/components/page.html.j2'),
      inject: false
    }),
    new HtmlWebpackDeployPlugin({
      usePackagesPath: false,
      getPackagePath: (packageName, packageVersion, packagePath) => path.join(packageName, packagePath),
      packages: {
        '@nl-rvo/assets': {
          copy: [
            { from: 'fonts', to: 'fonts/'},
            { from: 'icons', to: 'icons/'},
            { from: 'images', to: 'images/'}
          ],
          links: [
            'fonts/index.css',
            'icons/index.css',
            'images/index.css',
          ]
        },
        '@nl-rvo/design-tokens': {
          copy: [
            { from: 'dist/index.css', to: 'index.css' },
            { from: 'dist/index.js', to: 'index.mjs' },
          ],
          links: [
            'index.css',
          ],
          scripts: [
            'index.mjs',
          ]
        },
        '@nl-rvo/component-library-css': {
          copy: [
            { from: 'dist/index.css', to: 'index.css' },
          ],
          links: [
            'index.css',
          ]
        },
        '@nl-rvo/css-button': {
          copy: [
            { from: 'dist/index.css', to: 'index.css' },
          ],
          links: [
            'index.css',
          ]
        },
      }
    }),
    new MiniCssExtractPlugin({
      filename: "lotc.css",
      chunkFilename: "[id].css",
    }),
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
