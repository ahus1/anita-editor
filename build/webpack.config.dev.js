'use strict'

const webpack = require('webpack')
const merge = require('webpack-merge')
const baseConfig = require('./webpack.config.base')

const HOST = 'localhost'
const PORT = 8080

module.exports = merge(baseConfig, {
    mode: 'development',

    devServer: {
        clientLogLevel: 'warning',
        hot: true,
        contentBase: 'dist',
        compress: true,
        host: HOST,
        port: PORT,
        open: false,
        overlay: {warnings: false, errors: true},
        publicPath: '/',
        quiet: true,
        proxy: {
            '/token': 'http://localhost:9000/token.js'
        }
    },

    module: {
        rules: [
            {
                test: /\.p?css$/i,
                use: [
                    'vue-style-loader',
                    { loader: 'css-loader', options: { importLoaders: 1 } },
                    'postcss-loader'
                ],
            },
        ]
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ]
})
