import fetch from 'node-fetch';

const BACKENDS = {
  login: process.env.BACKEND_URL_LOGIN,
  portal: process.env.BACKEND_URL_PORTAL,
  account: process.env.BACKEND_URL_ACCOUNT,
  sso: process.env.BACKEND_URL_SSO,
  www: process.env.BACKEND_URL_WWW,
};

export const config = {
  api: {
    bodyParser: false, // Disable automatic body parsing by Vercel
  },
};

export default async function handler(req, res) {
  try {
    const { backend = '', path = '' } = req.query;
    const backendUrl = BACKENDS[backend];

    if (!backendUrl) {
      return res.status(400).send(`Unknown backend: "${backend}"`);
    }

    const url = new URL(path || '/', backendUrl);

    // Append query parameters except backend and path
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'backend' && key !== 'path') {
        url.searchParams.append(key, value);
      }
    }

    // Convert readable stream to Buffer
    let body;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = await new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
      });
    }

    const backendRes = await fetch(url.toString(), {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(backendUrl).host,
      },
      body,
    });

    const contentType = backendRes.headers.get('content-type') || 'text/plain';
    const text = await backendRes.text();

    res.setHeader('Content-Type', contentType);
    res.status(backendRes.status).send(text);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).send('Internal server error');
  }
}
