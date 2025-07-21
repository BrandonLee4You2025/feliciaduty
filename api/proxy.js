import fetch from "node-fetch";

export const config = {
  runtime: "edge",
};

const BACKENDS = {
  login: "https://login.acceleratedmedicallinc.org",
  portal: "https://portal.acceleratedmedicallinc.org",
  sso: "https://sso.acceleratedmedicallinc.org",
  account: "https://account.acceleratedmedicallinc.org",
  www: "https://www.acceleratedmedicallinc.org",
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const backend = searchParams.get("backend");
  const path = searchParams.get("path") || "/";

  const target = BACKENDS[backend];
  if (!target) {
    return new Response("Invalid backend", { status: 400 });
  }

  const targetUrl = `${target}${path.startsWith("/") ? path : "/" + path}`;
  const response = await fetch(targetUrl, {
    headers: {
      "User-Agent": req.headers.get("user-agent"),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  let body = await response.text();

  if (contentType.includes("text/html")) {
    const base = `https://${req.headers.get("host")}`;

    body = body
      // Rewrite relative href/src like /foo/bar
      .replace(/(href|src)=["'](\/[^"']*)["']/g, (match, attr, url) => {
        return `${attr}="${base}/api/proxy?backend=${backend}&path=${encodeURIComponent(url)}"`;
      })

      // Rewrite absolute URLs with protocol: https://sso.acceleratedmedicallinc.org/path
      .replace(/(["'(\s])https:\/\/(\w+)\.acceleratedmedicallinc\.org(\/[^"')\s]*)/g, (_, prefix, sub, url) => {
        return `${prefix}${base}/api/proxy?backend=${sub}&path=${encodeURIComponent(url)}`;
      })

      // Rewrite protocol-relative URLs: //sso.acceleratedmedicallinc.org/path
      .replace(/(["'(\s])\/\/(\w+)\.acceleratedmedicallinc\.org(\/[^"')\s]*)/g, (_, prefix, sub, url) => {
        return `${prefix}${base}/api/proxy?backend=${sub}&path=${encodeURIComponent(url)}`;
      });
  }

  return new Response(body, {
    status: response.status,
    headers: {
      "Content-Type": contentType,
    },
  });
}
