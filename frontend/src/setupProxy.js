const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/gw/channels/1211469/messages',
    createProxyMiddleware({
      target: 'https://flespi.io',
      changeOrigin: true,
    })
  );
};
