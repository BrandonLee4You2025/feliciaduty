import fetch from 'node-fetch';

const BACKEND_URL = 'https://login.acceleratedmedicallinc.org'; // or your actual backend

export default async function handler(req, res) {
  try {
    const path = req.url.replace(/^\/api\/proxy/, '') || '/';
    const fullUrl = `${BACKEND_URL}${path}`;

    console.log("Proxying to:", fullUrl);

    const init = {
      method: req.method,
      headers: { ...req.headers },
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = req;
    }

    const backendRes = await fetch(fullUrl, init);

    const contentType = backendRes.headers.get('content-type') || 'text/html';
    const body = await backendRes.text();

    res.setHeader('Content-Type', contentType);
    res.status(backendRes.status).send(body);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).send("Proxy failed: " + error.message);
  }
}
