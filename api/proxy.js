// /pages/api/mirror.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { target } = req.query;

  if (!target) {
    return res.status(400).send("Missing 'target' parameter.");
  }

  try {
    const url = new URL(target);
    const method = req.method;
    const headers = { ...req.headers };
    delete headers.host;

    const proxyRes = await fetch(url.href, {
      method,
      headers,
      body: ["GET", "HEAD"].includes(method) ? undefined : req.body,
      redirect: 'manual',
    });

    // Set CORS headers (optional)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    proxyRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(proxyRes.status);
    proxyRes.body.pipe(res);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(502).send("Proxy error: " + err.message);
  }
}
