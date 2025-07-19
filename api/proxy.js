import fetch from 'node-fetch';

const BASE_DOMAIN = 'acceleratedmedicallinc.org';

const PROXY_CONFIG = {
  'login': 'login.acceleratedmedicallinc.org',
  'account': 'account.acceleratedmedicallinc.org',
  'www': 'www.acceleratedmedicallinc.org',
  'sso': 'sso.acceleratedmedicallinc.org',
  'portal': 'portal.acceleratedmedicallinc.org',
};

export default async function handler(req, res) {
  try {
    // Extract the host from the request URL
    const host = req.headers.host;

    // Check if the host matches the base domain
    if (host.includes(BASE_DOMAIN)) {
      // Extract the subdomain from the host
      const subdomain = host.split('.')[0];

      // Find the matching proxy configuration
      const backendHost = PROXY_CONFIG[subdomain];

      if (backendHost) {
        // Construct the backend URL
        const backendUrl = `https://${backendHost}${req.url}`;

        console.log('Forwarding request to:', backendUrl);
        console.log('Request Headers:', req.headers);

        const backendRes = await fetch(backendUrl, {
          method: req.method,
          headers: {
            ...req.headers,
            host: backendHost, // Forward the original host
            'x-forwarded-for': req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            'x-forwarded-proto': req.headers['x-forwarded-proto'] || req.socket.encrypted ? 'https' : 'http',
            'Cookie': req.headers.cookie, // Forward cookies
          },
          credentials: 'include', // Include credentials
          body: req.method !== 'GET' ? req.body : undefined,
        });

        console.log('Response Status:', backendRes.status);
        console.log('Response Headers:', backendRes.headers);

        let text;
        if (backendRes.headers.get('content-type')?.includes('application/json')) {
          text = await backendRes.json();
        } else {
          text = await backendRes.text();
        }

        res.setHeader('Content-Type', backendRes.headers.get('content-type') || 'text/html');
        res.status(backendRes.status).send(text);
      } else {
        res.status(404).send('Not Found');
      }
    } else {
      res.status(404).send('Not Found');
    }
  } catch (error) {
    console.error('Error fetching backend:', error);
    res.status(500).send('Error fetching backend: ' + error.message);
  }
}
