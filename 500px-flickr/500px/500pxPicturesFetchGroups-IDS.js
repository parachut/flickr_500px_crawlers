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
        for (let i = 0; i < items.length; i++) {
          let memberID = items[i].id;
          let members = items.length;
          console.log("-------------------------------");
          console.log("Folk ID: " + memberID);
          console.log("Member  number: " + i);
          console.log("Members Length: " + members);

          await userID(memberID);
          await wait(10000);
        }
        client.close();
      });
    }
  );
}
async function userID(id) {
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
    await main2(pageNumber, id);
  } catch (e) {
    //console.log(e);
    console.log("Try Again User ID!");
    await wait(20000);
    await userID(id);
  }
}

async function main2(pageNumbers, id) {
  try {
    for (let q = 1; q <= pageNumbers; q++) {
      await picturesTry(id, q);
    }
  } catch (e) {
    console.log("Try again with the loop");
    await main2(pageNumbers, id);
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

            const db = client.db("flickr_500px");
            const collection = db.collection("pictures_500px_IDs");

            for (let i = 0; i < data.photos.length; i++) {
          
              try {
                if (data.photos[i].camera != "") {
                  if (data.photos[i].camera != null) {
                    if (data.photos[i].camera != ' ') {
                      if (data.photos[i].camera != '  ') {
                       
                    collection.insertOne(
                      {
                        id: data.photos[i].id,
                        member_id:data.photos[i].user_id
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
    console.log("Try Again Pictures Page");
    await picturesTry(id, q);
  }
}
main();
