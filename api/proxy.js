const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = (req, res) => {
  const proxy = createProxyMiddleware({
    target: 'https://login.acceleratedmedicallinc.org',
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      // Modify the request headers if needed
      proxyReq.setHeader('Host', 'login.acceleratedmedicallinc.org');
    },
    onProxyRes: (proxyRes, req, res) => {
      // Modify the response headers if needed
    },
  });

  proxy(req, res, (err) => {
    if (err) {
      console.error('Proxy error:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });
};
