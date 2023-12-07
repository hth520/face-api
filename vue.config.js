const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  transpileDependencies: true,

  publicPath: "./",

  //关闭eslint校验
  lintOnSave: false,
  configureWebpack: {
    resolve: {
      fallback: {
        fs: false,
        path: false,
        crypto: false,
      },
    },
  },
});
