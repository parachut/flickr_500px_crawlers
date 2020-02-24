const mongo = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";
var fs = require("fs");
const jsonFetch = require("json-fetch");

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
      const db = client.db("flickr_500px");
      const collection = db.collection("groups_members_500px");

      collection.find().toArray(async (err, items) => {
        for (let i = 273563; i < items.length; i++) {
          let memberID = items[i].id;
          let members = items.length;
          console.log("-------------------------------");
          console.log("Folk ID: " + memberID);
          console.log("Member  number: " + i);
          console.log("Members Length: " + members);

          await userID(memberID,i);
          await wait(10000);
        }
        client.close();
      });
    }
  );
}
async function userID(id,i) {
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
        console.log("Total Pages: " + pageNumber);
        console.log("-------------------------------");
      });
    await main2(pageNumber, id,i);
  } catch (e) {
    //console.log(e);
    console.log("Try Again User ID!");
    await wait(20000);
    await userID(id,i);
  }
}

async function main2(pageNumbers, id,i) {
  try {
    for (let q = 1; q <= pageNumbers; q++) {
      await picturesTry(id, q,i);
    }
  } catch (e) {
    console.log("Try again with the loop");
    await main2(pageNumbers, id,i);
  }
}

async function picturesTry(id, q, i) {
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
        console.log("Mongo Number: " + i);
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

            const db = client.db("flickr_500px");
            const collection = db.collection("pictures_500px");

            for (let j = 0; j < data.photos.length; j++) {
              let date_taken;
              //let focal;
              let iso;
              try {
                if (data.photos[j].camera != "") {
                  if (data.photos[j].camera != null) {
                    if (data.photos[j].camera != ' ') {
                      if (data.photos[j].camera != '  ') {
                        date_taken = new Date(data.photos[j].taken_at).getTime()/1000
                        //focal = parseFloat(data.photos[j].focal_length)
                        iso = parseInt(data.photos[j].iso)
                    collection.insertOne(
                      {
                        id: data.photos[j].id,
                        taken_at: date_taken/1000,
                        rating: data.photos[j].rating,
                        images: data.photos[j].images[0].https_url,
                        name: data.photos[j].name,
                        description: data.photos[j].description,
                        shutter_speed: data.photos[j].shutter_speed,
                        focal_length: data.photos[j].focal_length,
                        aperture: data.photos[j].aperture,
                        camera: data.photos[j].camera,
                        lens: data.photos[j].lens,
                        iso: iso,
                        location: data.photos[j].location,
                        latitude: data.photos[j].latitude,
                        longitude: data.photos[j].longitude,
                        comments_count: data.photos[j].comments_count,
                        votes_count: data.photos[j].votes_count,
                        times_viewed: data.photos[j].times_viewed,
                        feature: data.photos[j].feature,
                        category: data.photos[j].category,
                        tags: data.photos[j].tags
                      },
                      (err, result) => {
                        if (err) {
                          console.log("Duplicate");
                        } else {
                          console.log("Insert");
                        }
                      }
                    );
                  }
                }
                }
                } 
              } catch (e) {
                console.log("Something is up with Mongo");
              }
            }
            client.close();
          }


        );
      });
  } catch (e) {
    console.log(e.message)
    if(e.message !="Cannot read property 'length' of undefined"){
    console.log("Try Again Pictures Page");
    await picturesTry(id, q, i);}
  }
}
main();
