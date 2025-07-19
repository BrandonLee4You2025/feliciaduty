import fetch from 'node-fetch';

const BACKEND_URL = 'https://login.acceleratedmedicallinc.org';

export default async function handler(req, res) {
  try {
    // Remove "/api/proxy" and keep the subpath
    const targetPath = req.url.replace(/^\/api\/proxy/, '') || '/';
    const targetUrl = `${BACKEND_URL}${targetPath}`;

    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        // Forward essential headers, strip host to avoid mismatch
        ...Object.fromEntries(
          Object.entries(req.headers).filter(([key]) => !['host', 'content-length'].includes(key))
        ),
        'x-forwarded-for': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        'x-forwarded-proto': req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http'),
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      redirect: 'manual',
    });

    // Forward status and content headers
    res.status(backendRes.status);

    // Forward all headers, including Set-Cookie
    backendRes.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') {
        // Multiple cookies need special handling on Vercel
        const cookies = backendRes.headers.raw()['set-cookie'];
        if (cookies) res.setHeader('Set-Cookie', cookies);
      } else {
        res.setHeader(key, value);
      }
    });

    // Pipe the response body
    const contentType = backendRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await backendRes.json();
      res.json(json);
    } else {
      const text = await backendRes.text();
      res.send(text);
    }

  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).send(`Proxy error: ${err.message}`);
  }
}
