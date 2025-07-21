// /api/mirror.js
import { NextResponse } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const url = new URL(req.url);
    const target = url.searchParams.get("target"); // like login.mytestproject.org
    const path = url.pathname.replace("/api/mirror", "") || "/";
    const fullTargetUrl = `https://${target}${path}${url.search}`;

    // Build the forwarded request
    const proxyReq = new Request(fullTargetUrl, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
      redirect: "manual",
    });

    const proxyRes = await fetch(proxyReq);

    // Copy headers (optionally filter or modify here)
    const resHeaders = new Headers(proxyRes.headers);
    resHeaders.set("Access-Control-Allow-Origin", "*");
    resHeaders.set("Access-Control-Allow-Credentials", "true");

    // Rewrite cookies if needed (optional advanced step)
    if (resHeaders.has("set-cookie")) {
      const raw = resHeaders.get("set-cookie");
      const safe = raw.replace(/; ?Secure/gi, "").replace(/; ?SameSite=[^;]+/gi, "");
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
