import fetch from 'node-fetch';

const BACKEND_URL = 'https://login.acceleratedmedicallinc.org';

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

    const setCookie = backendRes.headers.raw()['set-cookie'];
    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }

    res.setHeader('Access-Control-Allow-Origin', 'https://transconnectapp.vercel.app');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    const contentType = backendRes.headers.get('content-type') || 'text/html';
    res.setHeader('Content-Type', contentType);

    const text = await backendRes.text();
    res.status(backendRes.status).send(text);
  } catch (error) {
    res.status(500).send('Error fetching backend: ' + error.message);
  }
}
