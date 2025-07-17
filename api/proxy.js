import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const { url, method, headers, body } = req;

    // Extract the subdomain and path from the URL after `/api/proxy/`
    const proxyPath = url.replace(/^\/api\/proxy\//, ''); // remove /api/proxy/
    const [subdomain, ...pathParts] = proxyPath.split('/');
    const backendUrl = `https://${subdomain}.acceleratedmedicallinc.org/${pathParts.join('/')}`;

    const proxyRes = await fetch(backendUrl, {
      method,
      headers: {
        ...headers,
        host: `${subdomain}.acceleratedmedicallinc.org`,
      },
      body: method !== 'GET' && method !== 'HEAD' ? body : undefined,
      redirect: 'manual',
    });

    // Set headers
    proxyRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(proxyRes.status);
    proxyRes.body.pipe(res);
  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(500).send('Proxy error: ' + err.message);
  }
}
