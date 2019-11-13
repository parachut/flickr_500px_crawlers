"use strict";
require("dotenv").config();
const timestamp = require("time-stamp");
const { BigQuery } = require("@google-cloud/bigquery");
const bigQueryClient = new BigQuery();
const datasetId = "crawler_500px_flickr";
const tableId = "posts";
const puppeteer = require("puppeteer");
const links = [
  "https://500px.com/popular",
  "https://500px.com/upcoming",
  "https://500px.com/fresh"
];
//---------------------------------------------------------
//             getting images links
//---------------------------------------------------------
function extractItems() {
  const extractedElements = document.querySelectorAll(".photo_link");

  let items = [];
  for (let element of extractedElements) {
    items.push(element.getAttribute("href"));
  }

  return items;
}

//---------------------------------------------------------
//             reading labels and adding element to big query
//---------------------------------------------------------
async function runBigQuery(items) {
  if (items.camera != "" &&
  items.camera !='') {
    //adding to big query
    try {
      await bigQueryClient
        .dataset(datasetId)
        .table(tableId)
        .insert([
          {
            last_crawl: new Date().getTime() / 1000,
            title: items.title,
            img_src: items.imgSrc,
            desc: items.desc,
            camera: items.camera,
            lens: items.lens,
            location: items.location,
            date_taken: items.dateTaken,
            photographer: items.photographer,
            photographer_link: items.photographerLink,
            f: items.f,
            mm: items.mm,
            iso: items.iso,
            s: items.s,
            likes: items.likes,
            view: items.view,
            comments: items.comments,
            tags: items.tags,
            url: items.url
          }
        ]);
      console.log("Post Inserted");
      console.log("/////////////////////////////");
    } catch (e) {
      console.log(JSON.stringify(e));
    }
  } else {
    console.log("NO CAM");
  }
}
//---------------------------------------------------------
//             scroll function
//---------------------------------------------------------
async function scrapeInfiniteScrollItems(
  page,
  extractItems,
  itemTargetCount,
  scrollDelay = 1700
) {
  let items = [];
  try {
    let previousHeight;
    while (items.length < itemTargetCount) {
      items = await page.evaluate(extractItems);
      console.log(items.length);
      previousHeight = await page.evaluate("document.body.scrollHeight");
      await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
      await page.waitForFunction(
        `document.body.scrollHeight > ${previousHeight}`
      );
      await page.wai;
      await page.waitFor(scrollDelay);
    }
  } catch (e) {}

  return items;
}

async function main() {
  // Set up browser and page.
  for (let i = 0; i < links.length; i++) {
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
    // Navigate to the page.
    try {
      console.log("---------------------------------------------");
      console.log(links[i]);
      console.log("---------------------------------------------");
      await page.goto(links[i], { waitUntil: "networkidle2", timeout: 120000 });

      // Scroll and extract items from the page.
      let items = await scrapeInfiniteScrollItems(page, extractItems, 5000);
      await page.close();
      await browser.close();
      await scraping(items);
    } catch (e) {
      console.log(e);
    }

    //scraping
  }
}

async function scraping(items) {
  const browserScrape = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"]
  });
  const page = await browserScrape.newPage();
  await page.setRequestInterception(true);

  page.on("request", req => {
    const whitelist = ["document", "script", "xhr", "fetch"];
    if (!whitelist.includes(req.resourceType())) {
      return req.abort();
    }
    req.continue();
  });

  console.log("---------------------------------------------");
  console.log(items.length);
  console.log("---------------------------------------------");

  for (let k = 0; k < items.length; k++) {
    try {
      console.log("---------------------------------------------");
      console.log("Item number: " + k);
      console.log("Number of Links: " + items.length);
      console.log("Link: " + "https://500px.com" + items[k]);
      console.log("---------------------------------------------");

      await page.goto("https://500px.com" + `${items[k]}`, {
        waitUntil: "networkidle2",
        timeout: 120000
      });
      await page
      .waitForSelector
      ('*[class^="Elements__PhotoDateTooltip"] p')
      await page
      .waitForSelector
      ('*[data-id^="photo-gear"] p')

      
      
      let page500 = await page.evaluate(() => {
        //TITLE
        const title1 = document.querySelector("title");
        let title;
        if (!title1) {
          title = null;
        } else {
          title = title1.innerText.replace(" / 500px", "");
        }

        //date taken
        const dateSearch = document.querySelectorAll(
          '*[class^="Elements__PhotoDateTooltip"] p'
        );
        let dateArray = [];
        let dateTaken;
        if (!dateSearch) {
          dateTaken = null;
        } else {
          for (let z = 0; z < dateSearch.length; z++) {
            dateArray[z] = { name: dateSearch[z].innerText };
          }
          if (!dateArray[2]) {
            dateTaken = null;
          } else {
            dateTakenFromArray = dateArray[2].name;
            dateTaken = new Date(dateTakenFromArray).getTime() / 1000;
          }
        }

        //location
        const placeLinkSearch = document.querySelector(
          'a[href^="/discover/place/"]'
        );
        let location;
        let locationAll;
        let locationSplit;
        if (!placeLinkSearch) {
          location = null;
        } else {
          locationAll = placeLinkSearch.getAttribute("href");
          locationSplit = locationAll.split("/");
          location = locationSplit.pop().replace(" ", "");
        }

        //VIEWS
        const views = document.querySelector('*[data-id="photo-Views"] h3');
        let view;
        if (!views) {
          view = null;
        } else {
          view = parseInt(views.innerText.replace(/\D/g, ""));
        }

        //LIKES
        const likesString12 = document.querySelector(
          '*[class^="Elements__PhotoButton"] a'
        );
        let likes;
        if (!likesString12) {
          likes = null;
        } else {
          likes = parseInt(
            likesString12.innerText.replace(".", "").replace("k", "000")
          );
        }

        //COMM
        const commString = document.querySelector(
          'h4[class^="StyledTypography__HeadingSmall"]'
        );
        let comments;
        if (!commString) {
          comments = null;
        } else {
          comments = parseInt(commString.innerText);
        }

        //IMGSRC
        const imgSrcSearch = document.querySelector("img.photo-show__img");
        let imgSrc;

        if (!imgSrcSearch) {
          imgSrc = null;
        } else {
          imgSrc = imgSrcSearch.getAttribute("src");
        }

        //TAGS
        const tagsSearch = document.querySelectorAll(
          '*[class^="Elements__PhotoTag"] p'
        );
        let tags = [];
        if (!tagsSearch) {
          tags = null;
        } else {
          for (let i = 0; i < tagsSearch.length; i++) {
            tags[i] = tagsSearch[i].innerText;
          }
        }

        ///try for the cam info
        const trySearch = document.querySelectorAll(
          '*[data-id^="photo-gear"] p'
        );
        let tryArray = [];
        if (!trySearch) {
          tryArray[0] = { cam: "" };
        } else {
          for (let m = 0; m < trySearch.length; m++) {
            tryArray[m] = { name: trySearch[m].innerText };
          }
        }

        //CAMERA
        const cameraSearch = document.querySelectorAll(
          'a[href^="https://500px.com/gear/cameras/"] span'
        );
        let cameraArray = [];
        let camera;
        if (!cameraSearch) {
          camera = "";
        } else {
          for (let r = 0; r < cameraSearch.length; r++) {
            cameraArray[r] = { name: cameraSearch[r].innerText };
          }
          if (!cameraArray[1]) {
            if (!tryArray[0].name.endsWith("mm")) {
              camera = tryArray[0].name;
            } else {
              camera = "";
            }
          } else {
            camera = cameraArray[1].name;
          }
        }

        const lensesSearch = document.querySelectorAll(
          'a[href^="https://500px.com/gear/lenses/"] span'
        );
        let lensArray = [];
        let lens;
        if (!lensesSearch) {
          lens = null;
        } else {
          for (let u = 0; u < lensesSearch.length; u++) {
            lensArray[u] = { name: lensesSearch[u].innerText };
          }

          if (!lensArray[1]) {
            if (!cameraArray[1]) {
              if (tryArray[1] === undefined) {
                lens = null;
              } else {
                lens = tryArray[1].name;
              }
            } else if (cameraArray[1]) {
              if (tryArray[0] === undefined) {
                lens = null;
              } else {
                lens = tryArray[0].name;
              }
            }
          } else {
            lens = lensArray[1].name;
          }
        }

        //getting all the styled boxes
        const gearNotHref = document.querySelectorAll(
          '*[data-id^="photo-gear"] p'
        );
        let gear = [];
        if (!gearNotHref) {
          gear = [];
        } else {
          for (let q = 0; q < gearNotHref.length; q++) {
            gear[q] = { name: gearNotHref[q].innerText };
          }
        }

        //CATEGORY need work
        const categorySearch = document.querySelector(
          'a[href^="https://500px.com/popular/"] span'
        );
        let category;
        if (!categorySearch) {
          category = null;
        } else {
          category = categorySearch.innerText;
        }

        //PHOTOGRAPHER
        const photographerSearch = document.querySelector(
          'p[class^="StyledTypography__Paragraph"] a'
        );
        let photographer;
        if (!photographerSearch) {
          photographer = null;
        } else {
          photographer = photographerSearch.innerText;
        }

        //PHOTOGRAPHER LINK
        const photographerLinkSearch = document.querySelector(
          'p[class^="StyledTypography__Paragraph"] a'
        );
        let photographerLink;
        if (!photographerLinkSearch) {
          photographerLink = null;
        } else {
          photographerLink = photographerLinkSearch.getAttribute("href");
        }

        let url = window.location.href;
        let f = null;
        let mm = null;
        let iso = null;
        let s = null;

        return {
          title,
          imgSrc,
          camera,
          lens,
          tryArray,
          location,
          dateTaken,
          photographer,
          photographerLink,
          f,
          mm,
          iso,
          s,
          likes,
          view,
          comments,
          category,
          tags,
          gear,
          url: url
        };
      });

      if (page500.gear != []) {
        for (let i = 0; i < page500.gear.length; i++) {
          if (page500.gear[i].name.startsWith("ƒ/")) {
            page500.f = parseFloat(page500.gear[i].name.replace("ƒ/", ""));
          }
          if (page500.gear[i].name.endsWith("mm")) {
            page500.mm = parseFloat(page500.gear[i].name.replace("mm", ""));
          }
          if (page500.gear[i].name.startsWith("ISO")) {
            page500.iso = parseInt(page500.gear[i].name.replace("ISO", ""));
          }
          if (page500.gear[i].name.endsWith("∞s", "")) {
            page500.s = null;
          }
          if (page500.gear[i].name.endsWith("s")) {
            if (page500.gear[i].name.endsWith("∞s")) {
              page500.s = null;
            }
            else{
            page500.s =
              Math.round(eval(page500.gear[i].name.replace("∞", "").replace("s", "")) * 10000) /
              10000;}
          }
          if (page500.lens === "0") {
            page500.lens = null;
          }
          if (page500.lens === "0mm") {
            page500.lens = null;
          }
          if (page500.camera === "0") {
            page500.camera = '';
          }
          if (page500.mm === 0) {
            page500.mm = null;
          }
          if (page500.f === 0) {
            page500.f = null;
          }
          if (page500.iso === 0) {
            page500.iso = null;
          }
        }
      }

      delete page500.gear;
      console.log("/////////////////////////////");
     // console.log(page500);
      await runBigQuery(page500);
    } catch (e) {
      console.log(e);
    }
  }

  debugger;
  await page.close();
  await browserScrape.close();
}

module.exports = main;
//main();
