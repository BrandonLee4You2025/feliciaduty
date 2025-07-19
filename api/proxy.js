const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = (req, res) => {
  createProxyMiddleware({
    target: 'https://login.acceleratedmedicallinc.org',
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // You can modify the request here if needed
    },
    onProxyRes: (proxyRes, req, res) => {
      // You can modify the response here if needed
    },
  })(req, res, () => {});
};
