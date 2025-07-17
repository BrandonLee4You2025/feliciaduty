const express = require("express");
const fetch = require("node-fetch");
const app = express();

const BACKEND_URL = "https://login.acceleratedmedicallinc.org";

app.get("/mirror", async (req, res) => {
  try {
    const loginHint = req.query.login_hint ? `?login_hint=${encodeURIComponent(req.query.login_hint)}` : "";
    const response = await fetch(`${BACKEND_URL}${loginHint}`);
    const html = await response.text();
    res.set("Content-Type", "text/html");
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading content.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Mirror frontend running on port " + PORT);
});
