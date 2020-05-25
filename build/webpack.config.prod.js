'use strict'

const merge = require('webpack-merge')
const baseConfig = require('./webpack.config.base')

module.exports = merge(baseConfig, {
    mode: 'production',
    optimization: {
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendor",
                    chunks: "all",
                },
            },
        },
    },
    module: {
        rules: [
            {
                test: /\.p?css$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    'postcss-loader'
                ]
            }
        ]
    }
})
