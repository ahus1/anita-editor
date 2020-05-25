'use strict'

const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const {VueLoaderPlugin} = require('vue-loader')

const utils = require('./utils')

module.exports = {
    resolve: {
        extensions: ['.js', '.vue', '.json'],
        alias: {
            'assets': utils.resolve('assets')
        }
    },

    module: {
        rules: [
            {
                test: /localconfig.js$/,
                use: [
                    {
                        loader: `val-loader`,
                    },
                ],
            },
            {
                test: /\.vue$/,
                use: 'vue-loader'
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                        name: utils.assetsPath('img/[name].[hash:7].[ext]')
                    }
                }
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                        name: utils.assetsPath('fonts/[name].[hash:7].[ext]')
                    }
                }
            },
            {
                test: /\.adoc$/,
                use: [
                    'raw-loader'
                ]
            },
        ]
    },

    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'public/index.html',
            inject: true
        }),
        new VueLoaderPlugin(),
        new CopyWebpackPlugin([{
            from: utils.resolve('static'),
            to: utils.resolve('dist'),
            toType: 'dir'
        }])
    ],

}
