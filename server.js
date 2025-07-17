const express = require("express");
const fetch = require("node-fetch");
const app = express();

const BACKEND_URL = "https://login.acceleratedmedicallinc.org";

app.get("/mirror", async (req, res) => {
  console.log("Mirror route hit with query:", req.query);
  try {
    // Construct the query string from the request
    const queryString = new URLSearchParams(req.query).toString();
    // Append the query string to the backend URL
    const fullUrl = `${BACKEND_URL}?${queryString}`;
    console.log("Fetching from:", fullUrl);
    const response = await fetch(fullUrl);
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
