import fetch from 'node-fetch';

const BACKEND_URL = process.env.BACKEND_URL; // Use environment variable

export default async function handler(req, res) {
  try {
    // Construct the full URL, preserving the original path and query parameters
    const url = new URL(req.url, `https://${req.headers.host}`);
    url.protocol = 'https:';
    url.host = new URL(BACKEND_URL).host;
    url.pathname = url.pathname.replace('/api/proxy', '');

    // Log the constructed URL for debugging
    console.log('Proxied URL:', url.toString());

    const backendRes = await fetch(url.toString(), {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(BACKEND_URL).host,
      },
      body: req.method !== 'GET' ? req.body : undefined,
    });

    const text = await backendRes.text();

    res.setHeader('Content-Type', backendRes.headers.get('content-type') || 'text/html');
    res.status(backendRes.status).send(text);
  } catch (error) {
    console.error('Error fetching backend:', error); // Log error for debugging
    res.status(500).send('Error fetching backend: ' + error.message);
  }
}
