const fetch = require("node-fetch");

const BACKEND_URL = "https://login.acceleratedmedicallinc.org";

export default async function handler(req, res) {
  console.log("Mirror route hit with query:", req.query);
  try {
    const queryString = new URLSearchParams(req.query).toString();
    const fullUrl = `${BACKEND_URL}?${queryString}`;
    console.log("Fetching from:", fullUrl);
    const response = await fetch(fullUrl);
    const html = await response.text();
    res.setHeader("Content-Type", "text/html");
    res.status(200).send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading content.");
  }
}
