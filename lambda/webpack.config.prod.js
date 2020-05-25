const MinifyPlugin = require("babel-minify-webpack-plugin")
const merge = require("webpack-merge")
const common = require("./webpack.config.js")

module.exports = merge(common, {
  plugins: [new MinifyPlugin()]
})
