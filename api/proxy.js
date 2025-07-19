import fetch from 'node-fetch';

const BACKEND_URLS = [
  'https://login.acceleratedmedicallinc.org',
  'https://sso.acceleratedmedicallinc.org',
  'https://portal.acceleratedmedicallinc.org',
  'https://www.acceleratedmedicallinc.org',
  'https://account.acceleratedmedicallinc.org',
];

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/proxy', '');
    const query = url.search; // includes '?auth=2&login_hint=...'

    const fullPath = path + query; // e.g. '/login?auth=2&login_hint=abc'

    for (const base of BACKEND_URLS) {
      const fullUrl = `${base}${fullPath}`;
      try {
        console.log(`Forwarding request to: ${fullUrl}`);
        console.log('Request Headers:', req.headers);

        const backendRes = await fetch(fullUrl, {
          method: req.method,
          headers: {
            ...req.headers,
            host: new URL(base).host,
            'x-forwarded-for': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            'x-forwarded-proto': req.headers['x-forwarded-proto'] || req.socket.encrypted ? 'https' : 'http',
            'Cookie': req.headers.cookie, // Forward cookies
          },
          credentials: 'include', // Include credentials
          body: req.method !== 'GET' ? req.body : undefined,
        });

        console.log('Response Status:', backendRes.status);
        console.log('Response Headers:', backendRes.headers);

        if (backendRes.status === 404) continue;

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
        return;
      } catch (err) {
        console.warn(`Failed to fetch from ${fullUrl}:`, err.message);
      }
    }

    res.status(404).send('No backend responded.');
  } catch (error) {
    console.error('Error fetching backend:', error);
    res.status(500).send('Error fetching backend: ' + error.message);
  }
}
