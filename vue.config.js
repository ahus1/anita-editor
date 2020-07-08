module.exports = {
  productionSourceMap: process.env.NODE_ENV !== 'production',
  devServer: {
    proxy: {
      '/.netlify/functions/token': {
        target: 'http://localhost:9000/token.js',
      },
    },
  },
  chainWebpack: (config) => {
    config
      .module
      .rule('adoc')
      .test(/\.adoc$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end();
    config
      .module
      .rule('localconfig')
      .test(/localconfig.js$/)
      .use('val-loader')
      .loader('val-loader')
      .end();
  },
};
