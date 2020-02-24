const Client = require("@elastic/elasticsearch").Client;

const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";
const dbName = "flickr_500px";
// "https://avnadmin:dxceju1p3zefthxn@es-1c0c548d-parachut-222d.aivencloud.com:21267"
const elasti = new Client({
  node:
    "https://elastic:acNbgQRsl0OUznitAboYVss6@cb0a068fb8d64b3294ede898764e8f96.us-central1.gcp.cloud.es.io:9243"
});

MongoClient.connect(url, async function(err, client) {
  // Create a collection we want to drop later
  const col = client.db(dbName).collection("flickr_pictures");

  const cursor = col.find({
    $and: [
      {
        $or: [
          { camera: { $exists: true, $ne: "" } },
          { lens: { $exists: true, $ne: "" } }
        ]
      }
    ]
  });

  let item;
  let i = 0;
  let j = 0;
  while ((item = await cursor.next())) {
    const $set = {
      _namefound: true
    };

    let cameraBody;

    try {
      if (item.camera && item.camera.trim().length) {
        console.log("Just show: ", item.camera);
        //let name = item.camera.toLowerCase();
        if (
          item.camera.toLowerCase().search("panasonic lumix dmc-fz00") === -1
        ) {
          console.log("Just show again : ", item.camera.toLowerCase());
          //name = name.replace("Digital", "");
          const { body } = await elasti.search({
            index: "products",
            body: {
              query: {
                // multi_match: {
                //   fields: [
                //     "name",
                //     "aliases",
                //     "name._2gram",
                //     "name._3gram",
                //     "aliases._2gram",
                //     "aliases._3gram"
                //   ],
                //   query: item.camera.toLowerCase(),
                //   // must: {
                //   //   term: {
                //   //     camera: true
                //   //   }
                //   // },
                //   type: "best_fields",
                //   tie_breaker: 3
                // },

                multi_match: {
                  fields: ["name^1.5", "aliases^7"],
                  query: item.camera.toLowerCase(),
                  type: "best_fields"
                }
              }
            }
          });
          cameraBody = body;
        }
        if (cameraBody.hits.hits[0]._source.name === item.camera) {
          console.log("perfect match");
          cameraBody.hits.hits[0]._score = cameraBody.hits.hits[0]._score + 5;
        }

        if (cameraBody.hits.hits[0]._score > 27) {
          i += 1;
          console.log(
            "camera",
            cameraBody.hits.hits[0],
            item.camera,
            cameraBody.hits.hits[0]._score,
            i
          );
          $set.camera_name = cameraBody.hits.hits[0]._source.name;
        } else {
          console.log(
            cameraBody.hits.hits[0]._score,
            item.camera,
            cameraBody.hits.hits[0]._source.name
          );
        }
        // }
      }

      if (item.lens && item.lens.trim().length) {
        let name = item.lens.toLowerCase();

        if (typeof cameraBody !== "undefined") {
          const brand = cameraBody.hits.hits[0]
            ? cameraBody.hits.hits[0]._source.brand.name
            : null;

          console.log(brand);
          console.log(name);
          if (brand && name.search(brand.toLowerCase()) === -1) {
            //  console.log("Confirm: ", brand, name);

            if (name.includes("canon") === true) {
              name = name.replace(/[^0-9](?=[0-9])/g, "$& ");
            } else if (name.includes("panasonic") === true) {
              name = name.replace(/[^0-9](?=[0-9])/g, "$& ");
            } else if (name.includes("nikon") === true) {
              name = name.replace(/[^0-9](?=[0-9])/g, "$& ");
            } else if (name.includes("sony") === true) {
              name = name.replace(/[^0-9](?=[0-9])/g, "$& ");
            } else {
              name = cameraBody.hits.hits[0]._source.brand.name + " " + name;
              name = name.replace(/[^0-9](?=[0-9])/g, "$& ");
            }
          }
        }

        const { body: lensBody } = await elasti.search({
          index: "products",
          body: {
            query: {
              multi_match: {
                fields: [
                  "name^1",
                  "aliases",
                  "name._2gram",
                  "name._3gram",
                  "aliases._2gram",
                  "aliases._3gram"
                ],
                query: name,
                type: "best_fields"
                // tie_breaker: 0.3
              }
            }
          }
        });

        if (
          lensBody.hits.hits[0]._source.name.toLowerCase() ===
          item.lens.toLowerCase()
        ) {
          console.log("perfect match");
          lensBody.hits.hits[0]._score = lensBody.hits.hits[0]._score + 5;
        }
        if (
          cameraBody.hits.hits[0]._source.brand.name + " " + name ===
          lensBody.hits.hits[0]._source.name.toLowerCase()
        ) {
          console.log("perfect match");
          lensBody.hits.hits[0]._score = lensBody.hits.hits[0]._score + 5;
        }

        if (lensBody.hits.hits[0]._score > 27) {
          j += 1;
          console.log(
            "lens",
            lensBody.hits.hits[0],
            name,
            lensBody.hits.max_score,
            lensBody.hits.hits[0]._source.name,
            "Count: " + j
          );

          $set.lens_name = lensBody.hits.hits[0]._source.name;
        } else {
          console.log(
            name,
            lensBody.hits.max_score,
            lensBody.hits.hits[0]._source.name
          );
        }
      }

      await col.updateOne(
        { _id: item._id },
        {
          $set
        },
        { multi: true }
      );
    } catch (e) {
      console.log(e);
      console.log(item.lens);
    }
  }
});
