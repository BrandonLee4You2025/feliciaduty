export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.replace('/api/proxy', '');
  const query = url.search; // includes '?auth=2&login_hint=...'

  const fullPath = path + query; // e.g. '/login?auth=2&login_hint=abc'

  const BACKEND_URLS = [
    'https://login.acceleratedmedicallinc.org',
    'https://account.acceleratedmedicallinc.org',
    'https://portal.acceleratedmedicallinc.org',
    'https://www.acceleratedmedicallinc.org',
    'https://sso.acceleratedmedicallinc.org',
  ];

  // Load the original URL in a hidden iframe
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Proxy Page</title>
      <style>
        iframe {
          display: none; /* Hide the iframe */
        }
      </style>
    </head>
    <body>
      <iframe src="https://login.acceleratedmedicallinc.org${fullPath}"></iframe>
      <script>
        // You can add any additional JavaScript here if needed
      </script>
    </body>
    </html>
  `);
  res.end();

  for (const base of BACKEND_URLS) {
    const fullUrl = `${base}${fullPath}`;
    try {
      console.log(`Forwarding request to: ${fullUrl}`);
      console.log('Request Headers:', req.headers);

      const backendRes = await fetch(fullUrl, {
        method: req.method,
        headers: {
          ...req.headers,
          host: new URL(base).host,
          'x-forwarded-for': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          'x-forwarded-proto': req.headers['x-forwarded-proto'] || req.socket.encrypted ? 'https' : 'http',
          'Cookie': req.headers.cookie, // Forward cookies
        },
        credentials: 'include', // Include credentials
        body: req.method !== 'GET' ? req.body : undefined,
      });

      console.log('Response Status:', backendRes.status);
      console.log('Response Headers:', backendRes.headers);

      if (backendRes.status === 404) continue;

      const contentType = backendRes.headers.get('content-type') || 'text/plain';
      const responseData = await backendRes.text();

      res.setHeader('Content-Type', contentType);
      return res.status(backendRes.status).send(responseData);
    } catch (err) {
      console.warn(`Failed to fetch from ${fullUrl}:`, err.message);
    }
  }

  res.status(404).send('No backend responded.');
}
