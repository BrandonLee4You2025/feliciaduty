import fetch from 'node-fetch';

const BACKEND_URL = 'https://login.acceleratedmedicallinc.org/?auth=2';

export default async function handler(req, res) {
  try {
    const url = `${BACKEND_URL}${req.url.replace('/api/proxy', '')}`;

    const backendRes = await fetch(url, {
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
    res.status(500).send('Error fetching backend: ' + error.message);
  }
}
