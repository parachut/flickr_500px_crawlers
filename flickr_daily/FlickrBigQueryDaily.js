"use strict";
require("dotenv").config();
const timestamp = require("time-stamp");
const { BigQuery } = require("@google-cloud/bigquery");
const bigQueryClient = new BigQuery();
const datasetId = "crawler_500px_flickr";
const tableId = "posts";
const puppeteer = require("puppeteer");
var Link = `https://www.flickr.com/explore`;

//---------------------------------------------------------
//             wait function
//---------------------------------------------------------
async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
//---------------------------------------------------------
//       reading labels and adding element to big query
//---------------------------------------------------------
async function runBigQuery(items) {
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
          url: items.url,
          //labels: labelAndScores,
          exif: items.exifSpecs
        }
      ]);
    console.log("Post Inserted");
  } catch (e) {
    console.log(JSON.stringify(e));
  }
}
//---------------------------------------------------------
//             function for scraping pages
//---------------------------------------------------------
function scrape() {
  //TITLE
  let title;
  const titleSearch = document.querySelector("h1");
  if (!titleSearch) {
    title = null;
  } else {
    title = titleSearch.innerText;
  }

  //Desc
  const descSearch = document.querySelector("h2");
  let desc;
  if (!descSearch) {
    desc = null;
  } else {
    desc = descSearch.innerText;
  }

  //views
  const viewString = document.querySelector(
    '*[class^="stat-item view-count"] span'
  );
  let view;
  let views;
  if (!viewString) {
    view = null;
  } else {
    views = viewString.innerText;
    view = parseInt(views.replace(",", ""));
  }

  //faves
  const favesString = document.querySelector(
    '*[class^="stat-item fave-count"] span'
  );
  let like;
  let likes = null;
  if (!favesString) {
    likes = null;
  } else {
    like = favesString.innerText;
    likes = parseInt(like.replace(",", ""));
  }

  //comments
  const commString = document.querySelector(
    '*[class^="stat-item comment-count"] span'
  );
  let comments;
  let comment;
  if (!commString) {
    comments = null;
  } else {
    comment = commString.innerText;
    comments = parseInt(comment.replace(",", ""));
  }

  //image source
  const imgSrcSearch = document.querySelector("img.main-photo");
  let imgSrc;
  let img;
  if (!imgSrcSearch) {
    imgSrc = null;
  } else {
    img = imgSrcSearch.getAttribute("src");
    imgSrc = "https:" + img;
  }

  //tags
  const tagsString1 = document.querySelectorAll('a[href^="/photos/tags/"]');
  let tags = [];
  if (!tagsString1) {
    tags = null;
  } else {
    for (let i = 0; i < tagsString1.length; i++) {
      tags[i] = tagsString1[i].innerText;
    }
    tags.splice(0, 1);
  }

  //date taken
  const dateSearch = document.querySelector('span[class^="date-taken-label"]');
  let dateTaken;
  let dateTakenString;
  if (!dateSearch) {
    dateTaken = null;
  } else if (dateSearch.innerText.startsWith("Uploaded")) {
    dateTaken = null;
  } else {
    dateTakenString = dateSearch.innerText.replace("Taken on ", "");
    dateTaken = new Date(dateTakenString).getTime() / 1000;
  }

  //EXIF names
  const exifSearch = document.querySelectorAll('span[class^="exif-name"]');
  let exif = [];
  if (!exifSearch) {
    exif[0] = { exif: "" };
  } else {
    for (let i = 0; i < exifSearch.length; i++) {
      exif[i] = exifSearch[i].innerText.replace(" - ", "");
    }
    exif.splice(0, 0);
  }

  //EXIF values
  const valuesSearch = document.querySelectorAll('span[class^="exif-value"]');
  let exifValues = [];
  if (!exifSearch) {
    exifValues[0] = { exifValues: "" };
  } else {
    for (let i = 0; i < valuesSearch.length; i++) {
      exifValues[i] = valuesSearch[i].innerText;
    }
    exifValues.splice(0, 0);
  }

  //SPECS
  let exifSpecs = [];
  for (let i = 0; i < exif.length; i++) {
    exifSpecs[i] = { name: exif[i], value: exifValues[i] };
  }

  //camera info
  const cameraSearch = document.querySelector(
    'a[href^="https://www.flickr.com/cameras/"]'
  );
  let camera;
  let cameraS;
  let cameraTrim;
  if (!cameraSearch) {
    const cameraSearch2 = document.querySelector(
      '*[class^="exif-camera-name"]'
    );
    if (!cameraSearch2) {
      camera = "";
    } else {
      camera = cameraSearch2.innerText;
    }
  } else {
    cameraS = cameraSearch.innerText;
    cameraTrim = cameraS.trim();
    camera = cameraTrim;
  }

  //lens
  const lensSearch = document.querySelector('*[class^="lens-string"]');
  let lens;
  let lensS;
  if (!lensSearch) {
    lens = null;
  } else {
    lensS = lensSearch.innerText;
    lens = lensS;
  }

  //f
  const fString = document.querySelector(
    'li[class^="c-charm-item-aperture two-up"] span'
  );
  let f;
  let fS;
  if (!fString) {
    f = null;
  } else {
    fS = fString.innerText;
    f = parseFloat(fS.replace("ƒ/", ""));
  }

  //mm
  const mmString1 = document.querySelector(
    'li[class^="c-charm-item-focal-length two-up"] span'
  );
  let mm;
  let mmsS;
  if (!mmString1) {
    mm = null;
  } else {
    mmS = mmString1.innerText;
    mm = parseInt(mmS);
  }

  //ISO
  const isoString = document.querySelector(
    'li[class^="c-charm-item-iso two-up"] span'
  );
  let iso;
  let isoS;
  if (!isoString) {
    iso = null;
  } else {
    isoS = isoString.innerText;
    iso = parseInt(isoS.replace(/\D/g, ""));
  }

  //s
  const sString = document.querySelector(
    'li[class^="c-charm-item-exposure-time two-up"] span'
  );
  let s;
  let sS;
  if (!sString) {
    s = null;
  } else {
    sS = sString.innerText;
    s = Math.round(eval(sS.replace("s", "")) * 10000) / 10000;
  }

  //photographer
  const photographerSearch = document.querySelector('a[class^="owner-name"]');
  let photographer;
  let photoS;
  if (!photographerSearch) {
    photographer = null;
  } else {
    photoS = photographerSearch.innerText;
    photographer = photoS;
  }

  //place
  const placeLinkSearch = document.querySelector(
    'a[class^="location-name-link"]'
  );
  let location;
  if (!placeLinkSearch) {
    location = null;
  } else {
    location = placeLinkSearch.innerText;
  }

  //photographer link
  const photographerLinkSearch = document.querySelector(
    'a[class^="owner-name"]'
  );
  let photographerLink;
  let photoLS;
  if (!photographerLinkSearch) {
    photographerLink = null;
  } else {
    photoLS = photographerLinkSearch.getAttribute("href");
    photographerLink = "https://flickr.com" + photoLS;
  }

  let url = window.location.href;

  return {
    title,
    imgSrc,
    desc,
    camera,
    lens,
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
    tags,
    url: url,
    exifSpecs
  };
}
//---------------------------------------------------------
//             getting images links
//---------------------------------------------------------
function extractItems() {
  const extractedElements = document.querySelectorAll('a[class^="overlay"]');

  let items = [];
  for (let element of extractedElements) {
    items.push(element.getAttribute("href"));
  }
  return items;
}

//---------------------------------------------------------
//             scraping pages (links from array)
//---------------------------------------------------------
async function scrapePages(data) {
  //opening browser and page
  const browserScrape = await puppeteer.launch({
    args: ["--no-sandbox"],
    headless: true
  });
  const pageScrape = await browserScrape.newPage();

  await pageScrape.setRequestInterception(true);
  pageScrape.on("request", req => {
    const whitelist = ["document", "script", "xhr", "fetch"];
    if (!whitelist.includes(req.resourceType())) {
      return req.abort();
    }
    req.continue();
  });

  for (let i = 0; i < data.length; i++) {
    try {
      console.log("---------------------------------------------");
      console.log("Picture Number: " + i);
      console.log("Number of links: " + data.length);
      console.log("https://www.flickr.com" + data[i]);
      console.log("---------------------------------------------");

      await pageScrape.goto("https://www.flickr.com" + `${data[i]}`, {
        waitUntil: "networkidle2",
        timeout: 120000
      });

      let scraping = await pageScrape.evaluate(scrape);
      if (scraping.camera != "") {
        await runBigQuery(scraping);
      } else {
        scraping = null;
        console.log("No Camera - No Big Query");
      }
    } catch (e) {
      console.log(e);
    }
  }

  await pageScrape.close();
  await browserScrape.close();
}
//---------------------------------------------------------
//             main function
//---------------------------------------------------------

async function main() {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    headless: true
  });
  const page = await browser.newPage();

  await page.goto(Link, {
    waitUntil: "networkidle2",
    timeout: 120000
  });
  await page.setRequestInterception(true);
  page.on("request", req => {
    const whitelist = ["document", "script", "xhr", "fetch"];
    if (!whitelist.includes(req.resourceType())) {
      return req.abort();
    }
    req.continue();
  });
  console.log("---------------------------------------------");
  console.log(Link);
  console.log("---------------------------------------------");

  //---------------------------------------------------------
  //                get and scroll
  //---------------------------------------------------------

  let data = [];
  const distance = 300;
  const delay = 500;
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

  console.log("---------------------------------------------");
  console.log(data.length);
  console.log("---------------------------------------------");
  await page.close();
  await browser.close();
  await scrapePages(data);
  await wait(1000);
}
//main()
module.exports = main;
