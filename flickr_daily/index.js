const express = require("express");
const path = require("path");
const FlickrBiqQueryDailyJS = require("./FlickrBigQueryDaily.js");
const Crawler500pxBigQuery = require("./500pxBigQuery.js")

const app = express();

app.get("/crawlers/flickr-daily", (req, res) => {
  if (
    process.env.STAGE === "production" &&
    req.get("X-Appengine-Cron") !== "true"
  ) {
    return res.status(401).end();
  }

  await FlickrBiqQueryDailyJS();

  res.send("ok!");
});


app.get("/crawlers/500px-daily", (req, res) => {
    if (
      process.env.STAGE === "production" &&
      req.get("X-Appengine-Cron") !== "true"
    ) {
      return res.status(401).end();
    }
  
    await Crawler500pxBigQuery();
  
    res.send("ok!");
  });


const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Server Started on port ${PORT}`));
