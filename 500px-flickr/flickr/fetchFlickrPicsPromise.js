require("dotenv").config();
const mongo = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";
const Flickr = require("flickr-sdk");
var request = require("request");

var flickr = new Flickr(
  Flickr.OAuth.createPlugin(
    process.env.FLICKR_API_KEY,
    process.env.FLICKR_SECRET,
    process.env.FLICKR_ACCESS_TOKEN,
    process.env.FLICKR_ACCESS_TOKEN_SECRET
  )
);
async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
//getting members ids from mongo
async function sendMembers() {
  try {
    mongo.connect(
      url,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true
      },
      (err, client) => {
        if (err) {
          console.error(err);
          return;
        }
        const db = client.db("groupsID");
        const collection = db.collection("flickr_members_ID");

        collection.find().toArray(async (err, items) => {
          for (let i = 1; i < items.length; i++) {
            let memberID = items[i].id;

            console.log("-------------------------------");
            console.log("Folk ID: " + memberID);
            console.log("Numbers of folks in Mongo: " + items.length);
            console.log("Folk number " + i);
            console.log("-------------------------------");

            await getMemberInfo(memberID);
            await wait(20000);
          }
          client.close();
        });
      }
    );
  } catch (e) {
    console.log("Mongo Problem");
  }
}

async function getMemberInfo(id) {
  let numberOfPics;
  let numberOfPages;
  try {
    const getPics = await flickr.people
      .getPhotos({
        user_id: id,
        per_page: 100
      })
      .then(res => JSON.parse(res.text));

    numberOfPics = getPics.photos.total;
    numberOfPages = getPics.photos.pages;

    for (let i = 1; i <= pages; i++) {
      await pagesLoop(i, numberOfPics, numberOfPages, id);
    }
  } catch (e) {
    console.log("Need to try again to get info about the member");
    await getMemberInfo(id);
  }
}
async function pagesLoop(i, pics, pages, id) {
  try {
    console.log("------------------------------");
    console.log("Page number:" + i);
    console.log("Number of pages:" + pages);
    console.log("Number of pics:" + pics);
    console.log("------------------------------");

    //await wait(2000);

    const getPicturesLength = await flickr.people
      .getPhotos({
        page: i,
        user_id: id,
        per_page: 100
      })
      .then(res => JSON.parse(res.text));

    await picturesLoop(getPicturesLength);

    await wait(2000);
  } catch (e) {
    console.log("Try Again - Number of Pictures");
    await pagesLoop(i, pics, pages, id);
  }
}

async function picturesLoop(getPicsNow) {
  for (let i = 0; i < getPicsNow.photos.photo.length; i++) {

    await goOverPage(i);
    async function goOverPage(i) {
      const photoInfo = await flickr.photos
        .getInfo({
          photo_id: getPicsNow.photos.photo[i].id
        })
        .then(res => JSON.parse(res.text));

      const photoFaves = await flickr.photos
        .getFavorites({
          photo_id: getPicsNow.photos.photo[i].id
        })
        .then(res => JSON.parse(res.text));

      const photoExif = await flickr.photos
        .getExif({
          photo_id: getPicsNow.photos.photo[i].id
        })
        .then(res => JSON.parse(res.text));

      const getSize = await flickr.photos
        .getSizes({
          photo_id: getPicsNow.photos.photo[i].id
        })
        .then(res => JSON.parse(res.text));

      const obj = {
        ...photoInfo.photo,
        ...photoExif.photo,
        ...getSize.sizes
      };

      if (obj.camera != "") {
        let getTags = [];
        for (const detail of obj.tags.tag) {
          getTags.push(detail.raw);
        }

        let getExif = [];
        for (const detail of obj.exif) {
          let exifObj = {
            label: detail.label,
            value: detail.raw._content
          };
          getExif.push(exifObj);
        }
        const trylens = getExif.find(x => x.label === "Lens Model");
        const getSize = obj.size.find(x => x.label === "Original");
        const getF = getExif.find(x => x.label === "Aperture");
        const getISO = getExif.find(x => x.label === "ISO Speed");
        const getMM = getExif.find(x => x.label === "Focal Length");
        const getS = getExif.find(x => x.label === "Exposure");
        const getLat = getExif.find(x => x.label === "GPS Latitude");
        const getLong = getExif.find(x => x.label === "GPS Longitude");

        let picLocation;
        if (getLat && getLong) {
          picLocation = { Latitude: getLat, Longitude: getLong };
        }

        let getLens;
        if (!trylens) {
          getLens = "";
        } else {
          getLens = trylens.value;
        }

        let urlOwner = "https://www.flickr.com/photos/" + obj.owner.path_alias;

        mongo.connect(
          url,
          {
            useNewUrlParser: true,
            useUnifiedTopology: true
          },
          (err, client) => {
            if (err) {
              console.error(err);
              return;
            }
            const db = client.db("groupsID");
            const collection = db.collection("flickr_pics_API");

            collection.insertOne(
              {
                id: obj.id,
                last_crawl: new Date().getTime() / 1000,
                title: obj.title._content,
                img_src: getSize.source,
                desc: obj.description._content,
                camera: obj.camera,
                lens: getLens,
                location: picLocation,
                date_taken: obj.dates.taken,
                photographer: obj.owner.realname,
                photographer_link: urlOwner,
                f: parseFloat(getF.value.replace(" mm", "")),
                mm: parseInt(getMM.value),
                iso: parseInt(getISO.value),
                s: Math.round(eval(getS.value) * 10000) / 10000,
                likes: photoFaves.photo.total,
                views: obj.views,
                comments: obj.comments._content,
                tags: getTags,
                url: obj.urls.url[0]._content,
                exif: getExif
              },
              (err, result) => {
                if (err) {
                  console.log("dublicates");
                } else {
                  console.log("Insert");
                }
                client.close();
              }
            );
          }
        );
      } else {
        console.log("No Camera");
      }
    }
  }
}
sendMembers();
