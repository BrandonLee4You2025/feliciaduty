export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams, pathname } = new URL(req.url);
    const target = searchParams.get("target");
    const proxyPath = pathname.replace("/api/mirror", "") || "/";
    const targetUrl = `https://${target}${proxyPath}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;

    const proxyReq = new Request(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
      redirect: "manual",
    });

    const proxyRes = await fetch(proxyReq);
    const resHeaders = new Headers(proxyRes.headers);

    resHeaders.set("Access-Control-Allow-Origin", "*");
    resHeaders.set("Access-Control-Allow-Credentials", "true");

    if (resHeaders.has("set-cookie")) {
      const raw = resHeaders.get("set-cookie");
      const safe = raw
        .replace(/; ?Secure/gi, "")
        .replace(/; ?SameSite=[^;]+/gi, "");
      resHeaders.set("set-cookie", safe);
    }

    return new Response(proxyRes.body, {
      status: proxyRes.status,
      headers: resHeaders,
    });
  } catch (err) {
    return new Response("Proxy error: " + err.message, { status: 502 });
  }
}
