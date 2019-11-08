const express = require("express")
const path = require('path')
const FlickrBiqQueryJS = require('./FlickrBigQuery.js')

const app = express();

app.get("/flickr-infinity", (req, res) => {
    if (
      process.env.STAGE === "production" &&
      req.get("X-Appengine-Cron") !== "true"
    ) {
      return res.status(401).end();
    }
  
    await FlickrBiqQueryJS();
  
    res.send("ok!");
  });

const PORT = process.env.PORT || 7000;
app.listen(PORT, ()=> console.log(`Server Started on port ${PORT}`));
