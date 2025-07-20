import fetch from 'node-fetch';

// Backend targets from environment variables
const BACKENDS = {
  login: process.env.BACKEND_URL_LOGIN,     // e.g. https://login.acceleratedmedicallinc.org
  portal: process.env.BACKEND_URL_PORTAL,   // e.g. https://portal.acceleratedmedicallinc.org
  account: process.env.BACKEND_URL_ACCOUNT, // e.g. https://account.acceleratedmedicallinc.org
  sso: process.env.BACKEND_URL_SSO,         // e.g. https://sso.acceleratedmedicallinc.org
  www: process.env.BACKEND_URL_WWW,         // e.g. https://www.acceleratedmedicallinc.org
};

export default async function handler(req, res) {
  try {
    // Parse backend key and path/query from URL
    const match = req.url.match(/^\/api\/proxy\/([^\/]+)(\/.*)?$/);
    if (!match) {
      return res.status(400).send('Invalid proxy path; expected /api/proxy/{backend}/...');
    }

    const [, backendKey, pathAndQuery = '/'] = match;

    const targetBase = BACKENDS[backendKey];
    if (!targetBase) {
      return res.status(502).send(`Unknown backend key: ${backendKey}`);
    }

    // Construct full URL to backend
    const backendUrl = new URL(pathAndQuery, targetBase);

    // Forward the request to backend
    const backendRes = await fetch(backendUrl.toString(), {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(targetBase).host, // Set Host header to backend's host
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      redirect: 'manual',
    });

    // Forward set-cookie headers if any
    const setCookie = backendRes.headers.raw()['set-cookie'];
    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }

    // Copy content-type header and status code
    res.setHeader('Content-Type', backendRes.headers.get('content-type') || 'text/html');
    res.status(backendRes.status);

    // Return backend response body
    const body = await backendRes.buffer();
    res.send(body);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Proxy error: ' + error.message);
  }
}
