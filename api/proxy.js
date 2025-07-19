// pages/api/proxy/[...path].js
import fetch from 'node-fetch';

const SUBDOMAIN_MAP = {
  login: 'https://login.acceleratedmedicallinc.org',
  account: 'https://account.acceleratedmedicallinc.org',
  portal: 'https://portal.acceleratedmedicallinc.org',
  www: 'https://www.acceleratedmedicallinc.org',
  sso: 'https://sso.acceleratedmedicallinc.org',
};

export default async function handler(req, res) {
  try {
    const fullPath = req.url.replace(/^\/api\/proxy\//, ''); // Remove "/api/proxy/"
    const [subdomain, ...pathParts] = fullPath.split('/');
    const backendHost = SUBDOMAIN_MAP[subdomain];

    if (!backendHost) {
      return res.status(400).send(`Unknown subdomain "${subdomain}"`);
    }

    const targetUrl = `${backendHost}/${pathParts.join('/')}${req.url.includes('?') ? `?${req.url.split('?')[1]}` : ''}`;

    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(backendHost).host,
        'x-forwarded-for': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        'x-forwarded-proto': req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http'),
      },
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined,
    });

    const contentType = backendRes.headers.get('content-type') || 'text/html';
    res.setHeader('Content-Type', contentType);

    if (contentType.includes('application/json')) {
      const json = await backendRes.json();
      res.status(backendRes.status).json(json);
    } else {
      const text = await backendRes.text();
      res.status(backendRes.status).send(text);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Proxy error: ' + error.message);
  }
}
