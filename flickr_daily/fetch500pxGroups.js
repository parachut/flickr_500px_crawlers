var fs = require("fs");
const jsonFetch = require("json-fetch");
const groups = require("./AllGroups.json");
let pageNumber;
const mongo = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";

// let fileName = "../Photographers-Groups-JSON/directory14.json";
//let i = 1;
// let startFile = []
// fs.writeFile(
//   "../Photographers-Groups-JSON/directory14.json",
//    JSON.stringify(startFile ),
//    err =>
//      err
//        ? console.error("Data not written", err)
//        : console.log("Data written")
//  );

async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
async function main() {
  for (let i = 4800; i < 5080; i++) {
    console.log("-------------------------------");
    console.log("Group name: " + groups[i].name);
    let groupID = groups[i].id;
    console.log("Group ID: " + groupID);
    await wait(3000);
    try {
      await fetch(
        "https://legacy-api.500px.com/v1/groups/" +
          groupID +
          "/members?&page=1&rpp=199"
      )
        .then(response => response.json())
        .then(data => {
          pageNumber = data.meta.pagination.total_pages;
          console.log("Number of pages: " + pageNumber);
          console.log("-------------------------------");
        });
    } catch (e) {
      console.log("Trying again");

      await wait(20000);
      await tryAgain(groupID);
      async function tryAgain(groupID) {
        try {
          await fetch(
            "https://legacy-api.500px.com/v1/groups/" +
              groupID +
              "/members?&page=1&rpp=199"
          )
            .then(response => response.json())
            .then(data => {
              pageNumber = data.meta.pagination.total_pages;
              console.log("Number of pages: " + pageNumber);
              console.log("-------------------------------");
            });
        } catch (e) {
          console.log("Trying again");
          tryAgain(groupID);
        }
      }
    }
    await main2(pageNumber, groupID);
    await wait(6000);
  }
}

async function main2(pageNumbers, group) {
  let allIDs = [];
  try {
    for (let q = 1; q <= pageNumbers; q++) {
      await tryPageAgain(group, q);
      async function tryPageAgain(group, q) {
        let json;
        try {
          console.log("-------------------------------");
          console.log("Page#: " + q);
          await fetch(
            "https://legacy-api.500px.com/v1/groups/" +
              group +
              "/members?&page=" +
              q +
              "&rpp=199"
          )
            .then(response => response.json())
            .then(data => {
              console.log(
                "Number of members: " + data.meta.pagination.total_items
              );
              console.log(
                "Number of folks on one page: " + data.members.length
              );
              console.log("-------------------------------");

              for (let i = 0; i < data.members.length; i++) {
                json = data.members[i].id;
                //  console.log(json)
                allIDs.push(json);
              }
            });
          //console.log(allIDs)
          await wait(2000);

          await save(allIDs);

          await wait(2000);
        } catch (e) {
          console.log("Try Again with that page");
          await tryPageAgain(group, q);
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
}

async function save(IDs) {
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

      const collection = db.collection("groups_members_IDs");

      // collection.find().toArray((err, items) => {
      //     console.log(items)
      // })
      for (let i = 0; i < IDs.length; i++) {
        collection.insertOne({ id: IDs[i] }, (err, result) => {
          if (err) {
            console.log("Duplicate");
          } else {
            console.log("Inserted");
          }
          client.close();
        });
      }
    }
  );
  //   let file = [];

  //  await fs.readFile(fileName, function(err, data) {
  //     var openedJson = JSON.parse(fs.readFileSync(fileName, "utf8"));

  //     for (let j = json.length - 1; j >= 0; j--) {
  //       openedJson.unshift(json[j]);
  //     }
  //     console.log("Folks alreday in: "+openedJson.length);
  //     fs.writeFile(fileName, JSON.stringify(openedJson), err =>
  //     err
  //       ? console.error("Data not written", err)
  //       : console.log("Data written")
  //   );
  //   });

  //   await fs.stat(fileName, (err, stats) => {
  //     if (err) {
  //       console.error(err);
  //       return;
  //     }
  //     console.log(stats.size / 1024000);
  //     if (stats.size / 1024000 > 25) {

  //       console.log("Big");
  //       let newI = i + 1
  //       i = newI;
  //       let fileNameNew = "../Photographers-Groups-JSON/directory14" + newI + ".json";
  //       fileName = fileNameNew;
  //       fs.writeFile(fileName, JSON.stringify(file), err =>
  //         err
  //           ? console.error("Data not written", err)
  //           : console.log("Data written")
  //       );
  //     }
  //   });
}
main();
