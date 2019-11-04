require("dotenv").config();
const timestamp = require("time-stamp");
const vision = require("@google-cloud/vision");
const client = new vision.ImageAnnotatorClient();
const { BigQuery } = require("@google-cloud/bigquery");
const bigQueryClient = new BigQuery();
const datasetId = "crawler_500px_flickr";
const tableId = "posts";
const puppeteer = require("puppeteer");

//---------------------------------------------------------
//             wait function
//---------------------------------------------------------
async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
//---------------------------------------------------------
//             getting images links
//---------------------------------------------------------
function extractItems() {
  const extractedElements = document.querySelectorAll(".photo_link");

  const items = [];
  for (let element of extractedElements) {
    items.push(element.getAttribute("href"));
  }

  return items;
}

//---------------------------------------------------------
//             reading labels and adding element to big query
//---------------------------------------------------------
async function runBigQuery(items) {
  // Performs label detection on the gcs file
  const [result] = await client.labelDetection(`${items.imgSrc}`);
  const labels = result.labelAnnotations;
  let labelAndScores = [];
  for (var i = 0; i < labels.length; i++) {
    labelAndScores.push({
      name: labels[i].description,
      score: Math.round(labels[i].score * 100)
    });
  }
  //adding to big query
  if (items.camera != "") {
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
            labels: labelAndScores
          }
        ]);
      console.log("Post Inserted");
      console.log("/////////////////////////////");
    } catch (e) {
      console.log(JSON.stringify(e));
    }
  }
}
//---------------------------------------------------------
//             scroll function
//---------------------------------------------------------
async function scrapeInfiniteScrollItems(
  page,
  extractItems,
  itemTargetCount,
  scrollDelay = 1500
) {
  let items = [];
  try {
    let previousHeight;
    while (items.length < itemTargetCount) {
      items = await page.evaluate(extractItems);
      previousHeight = await page.evaluate("document.body.scrollHeight");
      await page.evaluate("window.scrollTo(0, document.body.scrollHeight)");
      await page.waitForFunction(
        `document.body.scrollHeight > ${previousHeight}`
      );
      await page.waitFor(scrollDelay);
      console.log(items);
    }
  } catch (e) {}

  return items;
}

(async () => {
  // Set up browser and page.
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 926 });

  // Navigate to the page.
  await page.goto("https://500px.com/popular", { waitUntil: "networkidle2" });

  // Scroll and extract items from the page.
  const items = await scrapeInfiniteScrollItems(
    page,
    extractItems,
    20
  );

  const scrape = await scraping(items);

  // Close the browser.
  await browser.close();
})();

async function scraping(items) {
  const browserScrape = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browserScrape.newPage();
  page.setViewport({ width: 1280, height: 926 });

  console.log(items.length);

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

      var page500 = await page.evaluate(() => {
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
          for (var z = 0; z < dateSearch.length; z++) {
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
        let imgSrc
        let img;
        if (!imgSrcSearch) {
          imgSrc = null;
        } else {
          img = imgSrcSearch.getAttribute("src");
          imgSrc = img;
        }

        //TAGS
        const tagsSearch = document.querySelectorAll(
          '*[class^="Elements__PhotoTag"] p'
        );
        var tags = [];
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
        var tryArray = [];
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
            //var camera = "";
            if (!tryArray[0].name.endsWith("mm")) {
              camera = tryArray[0].name;
            } else {
              camera = null;
            }
          } else {
            camera = cameraArray[1].name;
          }
        }

        //_________________________________________________________
        ///////work on lenses !!!!!
        //Lens
        const lensesSearch = document.querySelectorAll(
          'a[href^="https://500px.com/gear/lenses/"] span'
        );
        let lensArray = [];
        let lens;
        if (!lensesSearch) {
          lens = null;
        } else {
          for (var u = 0; u < lensesSearch.length; u++) {
            lensArray[u] = { name: lensesSearch[u].innerText };
          }

          if (!lensArray[1]) {
            //var lens = "";
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
        //_________________________________________________________
        ///////work on lenses !!!!!

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
        let photographerLink
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
          if (page500.gear[i].name.endsWith("s")) {
            if (!page500.gear[i].name.endsWith("∞s", "")) {
              page500.s =
                Math.round(
                  eval(page500.gear[i].name.replace("s", "")) * 10000
                ) / 10000;
            }
          }
          if (page500.lens === "0") {
            page500.lens = null;
          }
        }
      }

      delete page500.gear;

      if(page500.camera!='')
      {await runBigQuery(page500);}
      else{console.log("No Camera - No BigQuery")}
      await wait(1500);
    } catch (e) {
      console.log(e);
    }
  }

  debugger;
  await page.close();
  await browser.close();
}
