import fetch from 'node-fetch';

// Define your backend targets via environment variables
const BACKENDS = {
  login: process.env.BACKEND_URL,   // https://login.acceleratedmedicallinc.org
  portal: process.env.BACKEND_URL_PORTAL,   // https://portal.acceleratedmedicallinc.org
  account: process.env.BACKEND_URL_ACCOUNT, // https://account.acceleratedmedicallinc.org
  sso: process.env.BACKEND_URL_SSO,         // https://sso.acceleratedmedicallinc.org
  www: process.env.BACKEND_URL_WWW,         // https://www.acceleratedmedicallinc.org
};

export default async function handler(req, res) {
  try {
    const match = req.url.match(/^\/api\/proxy\/([^\/]+)(\/.*)?(\?.*)?$/);

    if (!match) {
      return res.status(400).send('Invalid proxy path.');
    }

    const [, backendKey, pathSuffix = '/', query = ''] = match;
    const target = BACKENDS[backendKey];

    if (!target) {
      return res.status(502).send(`Unknown backend: ${backendKey}`);
    }

    const backendUrl = new URL(pathSuffix + (query || ''), target);

    const backendRes = await fetch(backendUrl.toString(), {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(target).host,
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
