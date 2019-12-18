const Client = require("@elastic/elasticsearch").Client;

const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";
const dbName = "flickr_500px";

const elasti = new Client({
  node:
    "https://avnadmin:dxceju1p3zefthxn@es-1c0c548d-parachut-222d.aivencloud.com:21267"
});

MongoClient.connect(url, function(err, client) {
  // Create a collection we want to drop later
  const col = client.db(dbName).collection("pictures_500px");
  col
    .find({
      $and: [
        { _namefound: null },
        {
          $or: [
            { camera: { $exists: true, $ne: "" } },
            { lens: { $exists: true, $ne: "" } }
          ]
        }
      ]
    })
    .limit(1)
    .forEach(async function(item) {
      if (item.camera && item.camera.trim().length) {
        const { body: cameraBody } = await elasti.search({
          index: "products",
          body: {
            query: {
              match: {
                name: {
                  query: item.camera.toLowerCase(),
                  operator: "and",
                  fuzziness: "AUTO",
                  analyzer: "standard"
                }
              }
            }
          }
        });

        console.log("camera", body.hits.hits[0]);

        /* col.update(
          { camera_db: item.camera },
          {
            $set: { camera: body.hits.hits[0]._source.name, _namefound: true }
          },
          { multi: true }
        ); */
      }

      if (item.lens && item.lens.trim().length) {
        const { body: lensBody } = await elasti.search({
          index: "products",
          body: {
            query: {
              match: {
                name: {
                  query: item.lens.toLowerCase(),
                  operator: "and",
                  fuzziness: "AUTO",
                  analyzer: "standard"
                }
              }
            }
          }
        });

        console.log("lens", body.hits.hits[0]);

        /* col.update(
          { lens: item.lens },
          {
            $set: { lens_db: body.hits.hits[0]._source.name, _namefound: true }
          },
          { multi: true }
        ); */
      }
    });
});
