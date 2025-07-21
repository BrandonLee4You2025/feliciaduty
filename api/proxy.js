import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host;

    const subdomain = req.query.subdomain;
    const path = req.query.path || '/';

    if (!subdomain || !/^[a-z0-9\-]+$/i.test(subdomain)) {
      return res.status(400).send('Invalid or missing subdomain.');
    }

    const targetUrl = new URL(`https://${subdomain}.acceleratedmedicallinc.org${path}`);

    // Forward headers, preserving cookies and auth headers
    const headers = {
      ...req.headers,
      host: targetUrl.host,
    };

    // Remove Vercel-specific headers
    delete headers['x-vercel-id'];
    delete headers['x-vercel-proxy-signature'];

    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      redirect: 'manual',
      credentials: 'include',
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req.body,
    });

    const responseBody = await response.buffer();
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, value);
      }
    });

    res.status(response.status).send(responseBody);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).send('Proxy error');
  }
}
