const express = require("express");
const path = require("path");
const FlickrBiqQueryDailyJS = require("./FlickrBigQueryDaily.js");
const Crawler500pxBigQuery = require("./500pxBigQuery.js");
const FlickrYear = require("./FlickrBigQuery.js")
//import main  from "./FlickrBigQueryDaily.js";
const app = express();

app.get("/", async function(req, res) {
  req.connection.setTimeout(100000);
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
  req.connection.setTimeout(100000);
  if (
    process.env.STAGE === "production" &&
    req.get("X-Appengine-Cron") !== "true"
  ) {
    return res.status(401).end();
  }
  res.send("ok!");
  await FlickrBiqQueryDailyJS();

  
  console.log("Finished")
});

app.get("/flickr-year", async function(req, res) {
  req.connection.setTimeout(100000);
  if (
    process.env.STAGE === "production" &&
    req.get("X-Appengine-Cron") !== "true"
  ) {
    return res.status(401).end();
  }
  res.send("ok!");
  await FlickrYear();

  
  console.log("Finished")
});

app.get("/500px-daily", async function(req, res) {
  req.connection.setTimeout(100000);
  if (
    process.env.STAGE === "production" &&
    req.get("X-Appengine-Cron") !== "true"
  ) {
    return res.status(401).end();
  }
  res.send("ok!");
  await Crawler500pxBigQuery();


  console.log("Finished")
});

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Server Started on port ${PORT}`));
