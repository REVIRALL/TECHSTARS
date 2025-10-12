const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'node',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
  },
  externals: {
    vscode: 'commonjs vscode',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  devtool: process.env.NODE_ENV === 'production' ? 'hidden-source-map' : 'nosources-source-map',
  infrastructureLogging: {
    level: 'log',
  },
};

module.exports = config;
