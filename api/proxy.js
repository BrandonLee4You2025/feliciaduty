const fetch = require("node-fetch");
const cheerio = require("cheerio");

const BACKENDS = {
  login: "https://login.acceleratedmedicallinc.org",
  sso: "https://sso.acceleratedmedicallinc.org",
  portal: "https://portal.acceleratedmedicallinc.org",
  account: "https://account.acceleratedmedicallinc.org",
  www: "https://www.acceleratedmedicallinc.org"
};

export default async function handler(req, res) {
  const { backend, path = "/", ...query } = req.query;

  const base = BACKENDS[backend];
  if (!base) {
    return res.status(400).send("Invalid backend");
  }

  const fullUrl = `${base}${path}${Object.keys(query).length ? `?${new URLSearchParams(query)}` : ""}`;
  console.log("Proxying to:", fullUrl);

  try {
    const response = await fetch(fullUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: new URL(base).host,
      },
      redirect: "manual",
    });

    const contentType = response.headers.get("content-type");
    const body = await response.text();

    // 🧠 If it's HTML, rewrite the links
    if (contentType && contentType.includes("text/html")) {
      const $ = cheerio.load(body);

      // Rewrite all links and resources
      $("[href], [src], [action]").each((_, el) => {
        const $el = $(el);
        const attr = $el.attr("href") ? "href" : $el.attr("src") ? "src" : "action";
        const original = $el.attr(attr);
        if (!original || original.startsWith("data:") || original.startsWith("javascript:")) return;

        const parsed = new URL(original, base);
        const matchedBackend = Object.entries(BACKENDS).find(([key, url]) =>
          parsed.hostname.includes(new URL(url).hostname)
        );

        if (matchedBackend) {
          const newBackend = matchedBackend[0];
          const newPath = parsed.pathname;
          const newQuery = parsed.searchParams.toString();
          const rewritten = `/api/proxy?backend=${newBackend}&path=${newPath}${newQuery ? `&${newQuery}` : ""}`;
          $el.attr(attr, rewritten);
        }
      });

      res.setHeader("Content-Type", "text/html");
      return res.send($.html());
    }

    // 🧠 Not HTML — just forward it as-is
    res.status(response.status);
    response.headers.forEach((v, k) => res.setHeader(k, v));
    return res.send(body);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy failed.");
  }
}
