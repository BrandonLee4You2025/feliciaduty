import fetch from 'node-fetch';

// Allowed subdomains — wildcard matching logic is handled below
const ALLOWED_DOMAINS = ['acceleratedmedicallinc.org'];

// Extract backend subdomain from the URL path
function getBackendHost(path) {
  const parts = path.split('/').filter(Boolean); // filter out empty segments
  const subdomain = parts[1]; // e.g. /api/proxy/nettest/xyz → "nettest"
  if (!subdomain) return null;
  return `${subdomain}.acceleratedmedicallinc.org`;
}

// Basic wildcard domain validation
function isAllowedHost(host) {
  return ALLOWED_DOMAINS.some(domain => host.endsWith(domain));
}

// Rewrite hardcoded links in HTML to proxy paths
function rewriteHtml(html, backendHost) {
  const origin = `https://${backendHost}`;
  return html.replace(new RegExp(origin, 'g'), '');
}

export default async function handler(req, res) {
  try {
    const path = req.url;

    // Validate and extract backend host
    const backendHost = getBackendHost(path);
    if (!backendHost || !isAllowedHost(backendHost)) {
      res.status(403).send('Forbidden backend host');
      return;
    }

    // Remove `/api/proxy/{subdomain}` from the path to get the real path
    const trimmedPath = path.replace(/^\/api\/proxy\/[^/]+/, '');
    const backendUrl = `https://${backendHost}${trimmedPath || '/'}`;

    // Clone headers
    const headers = {
      ...req.headers,
      host: backendHost
    };

    if (req.headers.cookie) {
      headers.cookie = req.headers.cookie;
    }

    const backendRes = await fetch(backendUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
      redirect: 'manual'
    });

    // Forward headers
    backendRes.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        const rawCookies = backendRes.headers.raw()['set-cookie'];
        if (rawCookies) res.setHeader('Set-Cookie', rawCookies);
      } else {
        res.setHeader(key, value);
      }
    });

    // Handle response type
    const contentType = backendRes.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      let html = await backendRes.text();
      html = rewriteHtml(html, backendHost);
      res.status(backendRes.status).send(html);
    } else {
      const buffer = await backendRes.arrayBuffer();
      res.status(backendRes.status).send(Buffer.from(buffer));
    }

  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error: ' + err.message);
  }
}
