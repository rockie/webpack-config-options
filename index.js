"use strict";

const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

/**
 * Build common webpack config with simple options.
 * @param {*} entry - Entry directories to start with.
 * @param {string} outputPath
 * @param {string} publicPath
 * @param {object} options
 * @param {string} options.devtool
 * @param {boolean} options.production
 * @param {boolean} options.postcss
 * @param {boolean} options.scss
 * @return {object} Webpack config
 */
module.exports = function (entry, outputPath, publicPath, options) {
    options = Object.assign({scriptPath: 'scripts', stylePath: 'styles'}, options);

    let cssOption = options.production ? "css-loader?modules&importLoaders=1" : "css-loader?sourceMap&modules&importLoaders=1";
    if (options.postcss) {
        cssOption += '!postcss-loader';
    }

    let config = {
        name: "browser",
        entry: entry,
        devtool: options.devtool || (options.production ? '#cheap-module-source-map' : '#source-map'),
        resolve: {
            extensions: ['', '.jsx', '.js', '.css']
        },
        output: {
            path: outputPath,
            filename: path.join(options.scriptPath, "[name].bundle.js"),
            chunkFilename: path.join(options.scriptPath, "[id].bundle.js"),
            publicPath: publicPath
        },
        module: {
            loaders: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    loader: (options.regenerator ? 'regenerator!' : '') + (options.production ? '' : 'react-hot!') + 'babel?' + JSON.stringify({ cacheDirectory: true, presets: ['react', 'es2015', 'stage-0' ], plugins: (options.regenerator ? ['transform-regenerator'] : []).concat(['transform-runtime', 'transform-object-assign', 'add-module-exports']) })
                },
                {
                    test: /\.css$/,                    
                    loader: ExtractTextPlugin.extract("style-loader", cssOption)
                },
                {
                    test: /\.svg$/,
                    loader: 'file?prefix=svg'
                },
                {
                    test: /\.(png|jpg)$/,
                    loader: 'file?prefix=img'
                },
                {
                    test: /\.(woff2?|ttf|eot)$/,
                    loader: 'file?prefix=font'
                }
            ]
        },
        plugins: [
            new ExtractTextPlugin(path.join(options.stylePath, '[name].style.css'), { allChunks: true }),
            new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': options.production ? JSON.stringify('production') : JSON.stringify('development')
                }
            })
        ]
    };

    if (options.postcss) {
        const autoprefixer = require('autoprefixer');
        config.postcss = [ autoprefixer ];
    }

    if (options.scss) {
        config.resolve.extensions.push('.scss');
        config.module.loaders.push({
            test: /(\.scss)$/,
            exclude: /node_modules/,
            loader: ExtractTextPlugin.extract('style-loader', options.production ? cssOption + '!sass-loader' : cssOption + '!sass-loader?sourceMap')
        });
    }

    if (options.production) {
        config.plugins = config.plugins.concat([
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.OccurrenceOrderPlugin(true),
            new webpack.optimize.UglifyJsPlugin({
                mangle: true,
                output: {
                    comments: false
                },
                compress: {
                    warnings: false
                }
            })
        ]);
    } else {
        config.plugins.push(new webpack.HotModuleReplacementPlugin());
    }

    return config;
};