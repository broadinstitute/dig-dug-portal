module.exports = {
  devServer: {
    writeToDisk: true // https://webpack.js.org/configuration/dev-server/#devserverwritetodisk-
  },
  pages: {
    manhattan: {
      // entry for the page
      entry: "src/views/Manhattan/main.js",
      // the source template
      template: "public/index.html",
      // output as dist/index.html
      filename: "manhattan.html",
      // when using title option,
      // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
      title: "Manhattan Page",
      // chunks to include on this page, by default includes
      // extracted common chunks and vendor chunks.
      chunks: ["chunk-vendors", "chunk-common", "manhattan"]
    }
  }
};
