const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    target: 'node',
    entry: {
      extension: './src/extension.ts',
      'extension-simple': './src/extension-simple.ts',
    },
    output: {
      path: path.resolve(__dirname, 'out'),
      filename: '[name].js',
      libraryTarget: 'commonjs2',
      devtoolModuleFilenameTemplate: '../[resource-path]',
    },
    devtool: isProduction ? false : 'source-map',
    externals: {
      vscode: 'commonjs vscode',
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@/services': path.resolve(__dirname, 'src/services'),
        '@/utils': path.resolve(__dirname, 'src/utils'),
        '@/types': path.resolve(__dirname, 'src/types'),
        '@/providers': path.resolve(__dirname, 'src/providers'),
        '@/commands': path.resolve(__dirname, 'src/commands'),
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: [/node_modules/, /__tests__/, /\.test\.ts$/, /\.spec\.ts$/],
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: 'tsconfig.json',
                transpileOnly: !isProduction,
                compilerOptions: {
                  sourceMap: !isProduction,
                },
              },
            },
          ],
        },
      ],
    },
    optimization: {
      minimize: isProduction,
      minimizer: isProduction
        ? [
            new TerserPlugin({
              terserOptions: {
                compress: {
                  drop_console: true,
                  drop_debugger: true,
                  pure_funcs: ['console.log', 'console.info', 'console.debug'],
                },
                mangle: true,
                output: {
                  comments: false,
                },
              },
              extractComments: false,
            }),
          ]
        : [],
      splitChunks: false,
    },
    plugins: [
      // Copy media files
      new CopyPlugin({
        patterns: [
          {
            from: 'media',
            to: 'media',
            noErrorOnMissing: true,
          },
        ],
      }),
      // Bundle analyzer (only in production)
      ...(isProduction && process.env.ANALYZE
        ? [
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
              reportFilename: 'bundle-report.html',
            }),
          ]
        : []),
    ],
    stats: {
      warnings: false,
    },
  };
};
