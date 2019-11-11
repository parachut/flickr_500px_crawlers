const express = require("express");
const path = require("path");
const FlickrBiqQueryDailyJS = require("./FlickrBigQueryDaily.js");
const Crawler500pxBigQuery = require("./500pxBigQuery.js");
//import main  from "./FlickrBigQueryDaily.js";
const app = express();

app.get("/", async function(req, res) {
  if (
    process.env.STAGE === "production" &&
    req.get("X-Appengine-Cron") !== "true"
  ) {
    return res.status(401).end();
  }

  res.send("ok!");
  console.log("All good")
});

app.get("/flickr-daily", async function(req, res) {
  if (
    process.env.STAGE === "production" &&
    req.get("X-Appengine-Cron") !== "true"
  ) {
    return res.status(401).end();
  }

  await FlickrBiqQueryDailyJS();

  res.send("ok!");
  console.log("Finished")
});

app.get("/500px-daily", async function(req, res) {
  if (
    process.env.STAGE === "production" &&
    req.get("X-Appengine-Cron") !== "true"
  ) {
    return res.status(401).end();
  }

  await Crawler500pxBigQuery();

  res.send("ok!");
  console.log("Finished")
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Server Started on port ${PORT}`));
