require("dotenv").config();
const mongo = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";
const Flickr = require("flickr-sdk");

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
        const db = client.db("flickr_500px");
        const collection = db.collection("flickr_members_ID");

        collection.find().toArray(async (err, items) => {
          for (let i = 200; i < items.length; i++) {
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

    for (let i = 1; i <= numberOfPages; i++) {
      await pagesLoop(i, numberOfPics, numberOfPages, id);
    }
  } catch (e) {
    console.log("Try Again - PAGES OF THE MAMBER");
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
    console.log("Try Again - PAGE");
    await pagesLoop(i, pics, pages, id);
  }
}

async function picturesLoop(getPicsNow) {
  for (let i = 0; i < getPicsNow.photos.photo.length; i++) {
    await goOverPicture(i, getPicsNow);
  }
}

async function goOverPicture(i, getPicsNow) {
  try {
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

    //BUILDING OBJECT WITH ALL INFORMATION
    const obj = {
      ...photoInfo.photo,
      ...photoExif.photo,
      ...getSize.sizes
    };
    //CHECK IF THERE IS CAMERA
    if (obj.camera != "") {
      if (obj.camera != null) {
      let getTags = [];
      let getExif = [];
      let lensName;
      let urlOwner;
      let valueF;
      let valueISO;
      let valueMM;
      let valueS;
      let location_coordinates;
      let locationName;
      let date_taken;

      //GETTING TAGS
      for (const detail of obj.tags.tag) {
        getTags.push(detail.raw);
      }
      //GETTING EXIF INFO
      for (const detail of obj.exif) {
        let exifObj = {
          label: detail.label,
          value: detail.raw._content
        };
        getExif.push(exifObj);
      }
      //FINDING VALUES IN EXIF INFO
      const getLens = getExif.find(x => x.label === "Lens Model");
      const getSizeOriginal = obj.size.find(x => x.label === "Original");
      const getF = getExif.find(x => x.label === "Aperture");
      const getISO = getExif.find(x => x.label === "ISO Speed");
      const getMM = getExif.find(x => x.label === "Focal Length");
      const getS = getExif.find(x => x.label === "Exposure");
  
      //GETTING F VALUE
      if (getF) {
        valueF = getF.value;
        valueF = parseFloat(valueF.replace(" mm", ""))
      }
      //GETTING ISO VALUE 
      if (getISO) {
        valueISO = getISO.value;
        valueISO=parseInt(valueISO)
      }
      //GETTING MM VALUE 
      if (getMM) {
        valueMM = getMM.value;
        valueMM =parseInt(valueMM)
      }
      //GETTING S VALUE 
      if (getS) {
        valueS = getS.value;
        valueS =Math.round(eval(valueS) * 10000) / 10000
      }
      //GETTING LENS NAME 
      if (getLens) {
        lensName = getLens.value;
      }
      //GETTING PICTURE SRC 
      if (getSizeOriginal) {
        originalSize = getSizeOriginal.source;
      } else {
        originalSize = obj.size.pop().source;
      }
      //GETTING LOCATION COORDINATES
      if (obj.location) {
        location_coordinates = {
          Latitude: obj.location.latitude,
          Longitude: obj.location.longitude
        };
      }
      //GETTING LOCATION NAME 
      if (obj.location) {
        try
        {locationName =
          obj.location.locality._content + ", " + obj.location.country._content;}catch(e){
            try
        {locationName =
          obj.location.country._content;}catch(e){}
          }
      }
      //GETTING DATE TAKEN
      if (obj.dates.taken) {
        date_taken = new Date(obj.dates.taken).getTime() / 1000;
      }

      //GETTING LINK TO THE PICTURE OWNER
      urlOwner = "https://www.flickr.com/photos/" + obj.owner.path_alias+"/";

      //ADDING TO MONGO
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
          const db = client.db("flickr_500px");
          const collection = db.collection("flickr_pictures");

          collection.insertOne(
            {
              id: obj.id,
              last_crawl: new Date().getTime() / 1000,
              title: obj.title._content,
              img_src: originalSize,
              desc: obj.description._content,
              camera: obj.camera,
              lens: lensName,
              location_coordinates: location_coordinates,
              location: locationName,
              date_taken: date_taken,
              photographer: obj.owner.realname,
              photographer_link: urlOwner,
              f: valueF,
              mm: valueMM,
              iso: valueISO,
              s: valueS,
              likes: photoFaves.photo.total,
              view: obj.views,
              comments: obj.comments._content,
              tags: getTags,
              url: obj.urls.url[0]._content,
              exif: getExif
            },
            (err, result) => {
              if (err) {
                console.log("Duplicates");
              } else {
                console.log("Insert");
              }
              
            }
          );
          client.close();
        }
      );
    }
    } else {
      console.log("No Camera");
    }
  } catch (e) {
    console.log(e.message);
    console.log("Try Again - PICTURE");
    if(e.message!='Permission denied'){
    await goOverPicture(i, getPicsNow);}
  }
}
sendMembers();
