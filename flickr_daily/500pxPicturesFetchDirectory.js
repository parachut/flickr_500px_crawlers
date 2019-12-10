var fs = require("fs");
const jsonFetch = require("json-fetch");
const mongo = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";

async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
async function main() {
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

      const collection = db.collection("directory_members");

      collection.find().toArray(async (err, items) => {
        for (let i = 1000; i < items.length; i++) {
          let memberID = items[i].id;

          await pageNumbers(memberID);
          await wait(10000);
        }
        client.close();
      });
    }
  );
}

async function pageNumbers(id) {
  try {
    let pageNumber;
    await fetch(
      "https://api.500px.com/v1/photos?feature=user&stream=photos&user_id=" +
        id +
        "&include_states=true&image_size%5B%5D=2048&include_tags=true&page=1&rpp=199"
    )
      .then(response => response.json())
      .then(data => {
        pageNumber = data.total_pages;
        console.log("-------------------------------");
        console.log("Folk ID: " + id);
        console.log("Total Pages: " + pageNumber);
        console.log("-------------------------------");
      });
    await main2(pageNumber, id);
  } catch {
    console.log("Try Again!");
    await wait(20000);
    await pageNumber(pageNumber, id);
  }
}

async function main2(pageNumbers, id) {
  try {
    for (let q = 1; q <= pageNumbers; q++) {
      await picturesTry(id, q);
    }
  } catch (e) {
    console.log("ERROR");
  }
}

async function picturesTry(id, q) {
  try {
    await wait(3000);
    await fetch(
      "https://api.500px.com/v1/photos?feature=user&stream=photos&user_id=" +
        id +
        "&include_states=true&image_size%5B%5D=2048&include_tags=true&page=" +
        q +
        "&rpp=199"
    )
      .then(response => response.json())
      .then(data => {
        console.log("-------------------------------");
        console.log("Page#: " + q);
        console.log("Member ID: " + id);
        console.log("Number of pics: " + data.photos.length);
        console.log("-------------------------------");

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
            const collection = db.collection("directory_pictures");

            for (let i = 0; i < data.photos.length; i++) {
              try {
                if (data.photos[i].camera != "") {
                  if (data.photos[i].camera != null) {
                    collection.insertOne(
                      {
                        id: data.photos[i].id,
                        taken_at: data.photos[i].taken_at,
                        rating: data.photos[i].rating,
                        images: data.photos[i].images[0].https_url,
                        name: data.photos[i].name,
                        description: data.photos[i].description,
                        shutter_speed: data.photos[i].shutter_speed,
                        focal_length: data.photos[i].focal_length,
                        aperture: data.photos[i].aperture,
                        camera: data.photos[i].camera,
                        lens: data.photos[i].lens,
                        iso: data.photos[i].iso,
                        location: data.photos[i].location,
                        latitude: data.photos[i].latitude,
                        longitude: data.photos[i].longitude,
                        liked: data.photos[i].liked,
                        comments_count: data.photos[i].comments_count,
                        votes_count: data.photos[i].votes_count,
                        times_viewed: data.photos[i].times_viewed,
                        feature: data.photos[i].feature,
                        category: data.photos[i].category,
                        tags: data.photos[i].tags
                      },
                      (err, result) => {
                        if (err) {
                          console.log("Duplicate");
                        } else {
                          console.log("Insert");
                        }
                        client.close();
                      }
                    );
                  }
                }
              } catch (e) {
                console.log("Something is up");
              }
            }
          }
        );
      });
  } catch (e) {
    console.log("Try Again Pictures Page");
    await picturesTry(id, q);
  }
}
main();
