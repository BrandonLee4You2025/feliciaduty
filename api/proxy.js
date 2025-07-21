import fetch from "node-fetch";

const BACKEND_URLS = {
  login: "https://login.acceleratedmedicallinc.org",
  portal: "https://portal.acceleratedmedicallinc.org",
  sso: "https://sso.acceleratedmedicallinc.org",
  account: "https://account.acceleratedmedicallinc.org",
  www: "https://www.acceleratedmedicallinc.org"
};

export default async function handler(req, res) {
  const { backend, path = "" } = req.query;
  const baseUrl = BACKEND_URLS[backend];

  if (!baseUrl) {
    return res.status(400).send("Invalid backend");
  }

  const fullUrl = `${baseUrl}${path.startsWith("/") ? path : "/" + path}`;

  try {
    const response = await fetch(fullUrl);
    let contentType = response.headers.get("content-type") || "";

    let body = await response.text();

    // Rewrite internal links if content is HTML
    if (contentType.includes("text/html")) {
      body = body.replace(/(https?:\/\/)?([a-z]+)\.acceleratedmedicallinc\.org(\/[^\s"'<>]*)?/gi, (match, proto, sub, rest) => {
        if (BACKEND_URLS[sub]) {
          const cleanPath = encodeURIComponent(rest || "/");
          return `/api/proxy?backend=${sub}&path=${cleanPath}`;
        }
        return match;
      });
    }

    res.setHeader("Content-Type", contentType);
    res.status(response.status).send(body);
  } catch (err) {
    console.error("Proxy error:", err.message);
    res.status(502).send("Proxy fetch failed");
  }
}
