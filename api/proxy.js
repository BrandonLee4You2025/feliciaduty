import fetch from 'node-fetch';

const ALLOWED_BACKEND_DOMAINS = [
  'login.acceleratedmedicallinc.org',
  'sso.acceleratedmedicallinc.org',
  'portal.acceleratedmedicallinc.org',
  'account.acceleratedmedicallinc.org',
  // Add more as needed
];

function extractSubdomain(pathname) {
  const parts = pathname.split('/');
  if (parts.length >= 3 && parts[1] === 'proxy') {
    return parts[2]; // e.g., "nettest"
  }
  return null;
}

function buildBackendUrl(req) {
  const subdomain = extractSubdomain(req.url);
  const backendDomain = subdomain ? `${subdomain}.acceleratedmedicallinc.org` : 'login.acceleratedmedicallinc.org';
  
  if (!ALLOWED_BACKEND_DOMAINS.includes(backendDomain)) {
    throw new Error('Unauthorized subdomain access');
  }

  const backendPath = req.url.replace(`/api/proxy/${subdomain}`, '');
  return { url: `https://${backendDomain}${backendPath}`, backendDomain };
}

function rewriteHtml(html, backendDomain) {
  const backendOrigin = `https://${backendDomain}`;
  const proxyPrefix = `/api/proxy/${backendDomain.split('.')[0]}`;

  // Basic rewriting of URLs (you may improve this with a parser for robustness)
  return html.replace(
    new RegExp(backendOrigin, 'g'),
    proxyPrefix
  );
}

export default async function handler(req, res) {
  try {
    const { url: backendUrl, backendDomain } = buildBackendUrl(req);

    const headers = { ...req.headers };
    headers.host = backendDomain;

    const backendRes = await fetch(backendUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      redirect: 'manual',
    });

    // Set headers
    backendRes.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        const rawCookies = backendRes.headers.raw()['set-cookie'];
        if (rawCookies) res.setHeader('Set-Cookie', rawCookies);
      } else {
        res.setHeader(key, value);
      }
    });

    // Handle HTML rewriting
    const contentType = backendRes.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const html = await backendRes.text();
      const rewrittenHtml = rewriteHtml(html, backendDomain);
      res.status(backendRes.status).send(rewrittenHtml);
    } else {
      const buffer = await backendRes.arrayBuffer();
      res.status(backendRes.status).send(Buffer.from(buffer));
    }

  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).send('Proxy error: ' + err.message);
  }
}
