"use strict";
require("dotenv").config();
const fs = require("fs");
const timestamp = require("time-stamp");
const { BigQuery } = require("@google-cloud/bigquery");
const bigQueryClient = new BigQuery();
const datasetId = "crawler_500px_flickr";
const tableId = "posts";
const puppeteer = require("puppeteer");
var StartLink = `https://www.flickr.com/explore/2018/04/07`;
var endLink = `https://www.flickr.com/explore/2017/09/03`;
const Flickr = require("flickr-sdk");
const flickr = new Flickr(process.env.FLICKR_API_KEY);
const distance = 400;
const delay = 300;
//let fileName = "./directory.json";
let i = 1;
//let startFile = []
// fs.writeFile(
//   "./directory.json",
//    JSON.stringify(startFile ),
//    err =>
//      err
//        ? console.error("Data not written", err)
//        : console.log("Data written")
//  );

//---------------------------------------------------------
//             wait function
//---------------------------------------------------------
async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
//---------------------------------------------------------
//             getting link from the button
//---------------------------------------------------------
function getNextLink() {
  const getNexPage = document.querySelector(
    'a[data-track^="explore-page-back"]'
  );

  let getNexPageLink;
  if (!getNexPage) {
    console.log("No More");
  } else {
    getNexPageLink = getNexPage.getAttribute("href");
  }
  return {
    getNexPageLink
  };
}

//---------------------------------------------------------
//             getting images links
//---------------------------------------------------------
function extractItems() {
  const extractedElements = document.querySelectorAll('a[class^="overlay"]');

  let items = [];
  for (let element of extractedElements) {
    let id = element.getAttribute("href").split("/");
    items.push(id[3]);
  }
  return items;
}

//---------------------------------------------------------
//             scraping pages (links from array)
//---------------------------------------------------------
async function scrapePages(data) {
  console.log("---------------------------------------------");
  console.log("Number of links: " + data.length);
  console.log("---------------------------------------------");
  for (let i = 0; i < 4; i++) {
    try {
      await wait(3000);
      let photoID = data[i];

      try {
        const photoInfo = await flickr.photos
          .getInfo({
            photo_id: photoID
          })
          .then(res => JSON.parse(res.text));

        const photoExif = await flickr.photos
          .getExif({
            photo_id: photoID
          })
          .then(res => JSON.parse(res.text));

        const obj = { ...photoInfo.photo, ...photoExif.photo };
        console.log(obj);
      } catch (e) {
        console.log(e);
      }
      //await save(json)
    } catch (e) {
      console.log(e);
    }
  }
}
async function save(json) {
  let file = [];

  fs.readFile(fileName, function(err, data) {
    var openedJson = JSON.parse(fs.readFileSync(fileName, "utf8"));

    for (let j = json.length - 1; j >= 0; j--) {
      openedJson.unshift(json[j]);
    }
    console.log("Folks alreday in: " + openedJson.length);
    fs.writeFile(fileName, JSON.stringify(openedJson), err =>
      err ? console.error("Data not written", err) : console.log("Data written")
    );
  });
  //await wait(3000)
  fs.stat(fileName, (err, stats) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(stats.size / 1024000);
    if (stats.size / 1024000 > 25) {
      console.log("Big");
      let newI = i + 1;
      i = newI;
      let fileNameNew = "./directory" + newI + ".json";
      fileName = fileNameNew;
      fs.writeFile(fileName, JSON.stringify(file), err =>
        err
          ? console.error("Data not written", err)
          : console.log("Data written")
      );
    }
  });
  await wait(3000);
}
//---------------------------------------------------------
//             main function
//---------------------------------------------------------

async function main(Link) {
  Link = StartLink;

  if (Link != endLink) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"]
    });
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on("request", req => {
      const whitelist = ["document", "script", "xhr", "fetch"];
      if (!whitelist.includes(req.resourceType())) {
        return req.abort();
      }
      req.continue();
    });
    await page.goto(Link, {
      waitUntil: "networkidle2",
      timeout: 120000
    });
    console.log("---------------------------------------------");
    console.log(Link);
    console.log("---------------------------------------------");

    //---------------------------------------------------------
    //                get and scroll
    //---------------------------------------------------------

    let data = [];
    while (
      await page.evaluate(
        () =>
          document.scrollingElement.scrollTop + window.innerHeight <
          document.scrollingElement.scrollHeight
      )
    ) {
      data = await page.evaluate(extractItems);

      await page.evaluate(y => {
        document.scrollingElement.scrollBy(0, y);
      }, distance);
      await page.waitFor(delay);
    }

    let previousPage = await page.evaluate(getNextLink);
    let newLinkToGo = `https://www.flickr.com${previousPage.getNexPageLink}`;

    console.log(data.length);
    await page.close();
    await browser.close();
    await scrapePages(data);
    await wait(1000);

    StartLink = newLinkToGo;

    main(newLinkToGo);
  } else {
    console.log("Finished");
  }
}

//module.exports =main;

main();
