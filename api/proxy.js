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
        'x-forwarded-for': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        'x-forwarded-proto': req.headers['x-forwarded-proto'] || req.socket.encrypted ? 'https' : 'http',
        'Cookie': req.headers.cookie, // Forward cookies
      },
      credentials: 'include', // Include credentials
      body: req.method !== 'GET' ? req.body : undefined,
    });

    let text;
    if (backendRes.headers.get('content-type')?.includes('application/json')) {
      text = await backendRes.json();
    } else {
      text = await backendRes.text();
    }

    res.setHeader('Content-Type', backendRes.headers.get('content-type') || 'text/html');
    res.status(backendRes.status).send(text);
  } catch (error) {
    console.error('Error fetching backend:', error);
    res.status(500).send('Error fetching backend: ' + error.message);
  }
}
