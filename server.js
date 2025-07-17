const express = require("express");
const fetch = require("node-fetch");
const app = express();

const BACKEND_URL = "https://login.acceleratedmedicallinc.org";

app.get("/mirror", async (req, res) => {
  try {
    // Construct the query string from the request
    const queryString = Object.keys(req.query)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(req.query[key])}`)
      .join('&');

    // Append the query string to the backend URL
    const fullUrl = `${BACKEND_URL}${queryString ? '?' + queryString : ''}`;

    // Fetch content from the backend
    const response = await fetch(fullUrl);
    const html = await response.text();

    // Set the content type and send the response
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
