import fetch from 'node-fetch';

const BACKEND_URL = process.env.BACKEND_URL;

export default async function handler(req, res) {
  try {
    // Extract the path after /api/proxy
    const proxyPath = req.url.replace(/^\/api\/proxy/, '') || '/';

    // Reconstruct full backend URL
    const url = new URL(proxyPath, BACKEND_URL);
    url.search = req.url.includes('?') ? req.url.split('?')[1] : '';

    const backendRes = await fetch(url.toString(), {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(BACKEND_URL).host, // Overwrite host header
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    });

    const contentType = backendRes.headers.get('content-type') || 'text/plain';
    const body = await backendRes.text();

    res.setHeader('Content-Type', contentType);
    res.status(backendRes.status).send(body);
  } catch (error) {
    console.error('Error fetching backend:', error.message);
    res.status(500).send('Error fetching backend: ' + error.message);
  }
}
