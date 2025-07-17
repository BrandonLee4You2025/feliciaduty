import fetch from 'node-fetch';

const BACKEND_URL = 'https://login.acceleratedmedicallinc.org';

export default async function handler(req, res) {
  try {
    const url = `${BACKEND_URL}${req.url.replace('/api/proxy', '')}`;

    const backendRes = await fetch(url, {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(BACKEND_URL).host,
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      redirect: 'manual', // do not auto-follow redirects
    });

    // Copy status
    res.status(backendRes.status);

    // Copy all headers
    backendRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Pipe the response as a stream to support all content types
    const buffer = await backendRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Error fetching backend: ' + error.message);
  }
}
