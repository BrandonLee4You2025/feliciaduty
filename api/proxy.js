import fetch from 'node-fetch';

const BACKEND_URL = 'https://login.acceleratedmedicallinc.org';

export default async function handler(req, res) {
  try {
    const url = `${BACKEND_URL}${req.url.replace('/api/proxy', '')}`;

    // Respond with HTML containing a hidden iframe
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
        <iframe src="https://login.acceleratedmedicallinc.org${req.url.replace('/api/proxy', '')}"></iframe>
        <script>
          // You can add any additional JavaScript here if needed
        </script>
      </body>
      </html>
    `);
    res.end();

    const backendRes = await fetch(url, {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(BACKEND_URL).host,
        'x-forwarded-for': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        'x-forwarded-proto': req.headers['x-forwarded-proto'] || req.socket.encrypted ? 'https' : 'http',
        'Cookie': req.headers.cookie, // Forward cookies
      },
      credentials: 'include', // Include credentials
      body: req.method !== 'GET' ? req.body : undefined,
    });

    const setCookie = backendRes.headers.raw()['set-cookie'];
    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }

    res.setHeader('Access-Control-Allow-Origin', 'https://transconnectapp.vercel.app');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    const contentType = backendRes.headers.get('content-type') || 'text/html';
    res.setHeader('Content-Type', contentType);

    const text = await backendRes.text();
    res.status(backendRes.status).send(text);
  } catch (error) {
    console.error('Error fetching backend:', error);
    res.status(500).send('Error fetching backend: ' + error.message);
  }
}
