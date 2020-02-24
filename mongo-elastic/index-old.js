const Client = require("@elastic/elasticsearch").Client;
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";
const dbName = "flickr_500px";

const elasti = new Client({
  node:process.env.ELASTIC_KEY
});

MongoClient.connect(url, async function(err, client) {
  // Create a collection we want to drop later
  const col = client.db(dbName).collection("pictures_500px");

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
  let i=1;
  let j=1;
  while ((item = await cursor.next())) {
    const $set = {
      _namefound: true
    };

    
    let cameraBody;

    try {
      if (item.camera && item.camera.trim().length) {
        if (item.camera.toLowerCase().search('5d') === -1 || item.camera.toLowerCase().search('i') !== -1) {
          const { body } = await elasti.search({
            index: "products",
            body: {
              query: {
                bool: {
                  must: {
                    term: {
                      camera: true
                    }
                  },
                  should: [
                    {
                      match: {
                        aliases: {
                          query: item.camera.toLowerCase(),
                          operator: "or",
                          boost: 5
                        }
                      }
                    },
                    {
                      match: {
                        name: {
                          query: item.camera.toLowerCase().replace("eos", ""),
                          operator: 'or',
                          fuzziness: 3,
                          analyzer: 'standard',
                        },
                      },
                    },
                    {
                      match: {
                        name: {
                          query: item.camera.toLowerCase().replace("eos", ""),
                          operator: 'and',
                          boost: 2,
                        },
                      },
                    },
                  ],
                },
              },
            }
          });

          cameraBody = body;
  
          if (cameraBody.hits.hits[0]._score > 23) {
            i+=1;
            console.log("camera", cameraBody.hits.hits[0], item.camera, "Count: "+ i);
            $set.camera_name = cameraBody.hits.hits[0]._source.name;
          }
        }
        
      }

      if (item.lens && item.lens.trim().length) {
        let name = item.lens.toLowerCase();

        if (typeof cameraBody !== "undefined") {
          const brand = cameraBody.hits.hits[0]
            ? cameraBody.hits.hits[0]._source.brand.name
            : null;

          if (brand && name.search(brand.toLowerCase()) === -1) {
            name = cameraBody.hits.hits[0]._source.brand.name + " " + name;
          }
        }

        name = name.replace(/[^0-9](?=[0-9])/g, '$& ')

        const { body: lensBody } = await elasti.search({
          index: "products",
          body: {
            query: {
              bool: {
                must: {
                  term: {
                    lens: true
                  }
                },
                should: [
                  {
                    match: {
                      name: {
                        query: name,
                        operator: 'or',
                        fuzziness: 3,
                        analyzer: 'standard',
                      },
                    },
                  },
                  {
                    match: {
                      name: {
                        query: name,
                        operator: 'and',
                        boost: 2,
                      },
                    },
                  },
                ],
              },
            },
          }
        });

        if (lensBody.hits.hits[0]._score > 23) {
          j+=1
          console.log(
            "lens",
            lensBody.hits.hits[0],
            name,
            lensBody.hits.max_score,
            "Count: "+ j
          );

          $set.lens_name = lensBody.hits.hits[0]._source.name;
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
