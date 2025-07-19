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

  for (const base of BACKEND_URLS) {
    const fullUrl = `${base}${fullPath}`;
    try {
      const backendRes = await fetch(fullUrl, {
        method: req.method,
        headers: {
          ...req.headers,
          host: new URL(base).host,
        },
        body: req.method !== 'GET' ? req.body : undefined,
      });

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
