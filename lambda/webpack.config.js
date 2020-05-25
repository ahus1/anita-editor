require("dotenv").config()

const webpack = require("webpack")

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      CLIENT_ID: JSON.stringify(process.env.CLIENT_ID),
      CLIENT_SECRET: JSON.stringify(process.env.CLIENT_SECRET)
    })
  ]
}
