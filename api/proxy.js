import fetch from 'node-fetch';

const BACKEND_URL = 'https://login.acceleratedmedicallinc.org';

export default async function handler(req, res) {
  try {
    const url = `${BACKEND_URL}${req.url.replace('/api/proxy', '')}`;

    const headers = { ...req.headers };

    // Strip Vercel-specific or problematic headers
    delete headers['host'];
    delete headers['x-forwarded-for'];
    delete headers['x-vercel-id'];

    const backendRes = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      redirect: 'manual',
    });

    // Copy response headers
    backendRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(backendRes.status);

    // Use .buffer() to handle both text/html and binary (e.g. images)
    const body = await backendRes.buffer();
    res.send(body);
  } catch (err) {
    res.status(500).send('Proxy error: ' + err.message);
  }
}
