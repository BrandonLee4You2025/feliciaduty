import fetch from 'node-fetch';

const BACKEND_URL = 'https://login.acceleratedmedicallinc.org';

export default async function handler(req, res) {
  try {
    const targetUrl = `${BACKEND_URL}${req.url.replace('/api/proxy', '')}`;

    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...Object.fromEntries(
          Object.entries(req.headers).filter(([key]) => key.toLowerCase() !== 'host')
        ),
        host: new URL(BACKEND_URL).host,
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
    });

    // Forward response headers
    backendRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(backendRes.status);
    backendRes.body.pipe(res);
  } catch (error) {
    res.status(500).send('Proxy failed: ' + error.message);
  }
}
