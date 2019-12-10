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

async function main() {
  //getting groups ID from mongo
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

      const collection = db.collection("groups_ID");

      collection.find().toArray(async (err, items) => {
        for (let i = 9000; i < items.length; i++) {
          let groupID = items[i].id;
          let collectionLength = items.length;

          console.log("-------------------------------");
          console.log("Group ID: " + groupID);
          console.log("Numbers of folks in Mongo: " + collectionLength);
          console.log("Group number " + i);
          console.log("-------------------------------");

          await getMembersGroupInfo(groupID);

          await wait(200);
        }
        client.close();
      });
    }
  );
}

async function getMembersGroupInfo(id) {
  try {
    let members;
    let pages;

    const getMembers = await flickr.groups.members
      .getList({
        group_id: id,
        per_page: 100
      })
      .then(res => JSON.parse(res.text));

    members = getMembers.members.total;
    pages = getMembers.members.pages;

    for (let i = 1; i <= pages; i++) {
      await loopPages(i, members, pages, id);
    }
  } catch (e) {
    console.log(e);
    await getMembersGroupInfo(id);
  }
}

async function loopPages(i, members, pages, id) {
  try {
    console.log("------------------------------");
    console.log("Page number:" + i);
    console.log("Number of pages:" + pages);
    console.log("Number of members:" + members);
    console.log("------------------------------");
    await wait(1000);

    const photoInfo = await flickr.groups.members
      .getList({
        group_id: id,
        per_page: 100,
        page: i
      })
      .then(res => JSON.parse(res.text));

    for (let i = 0; i < photoInfo.members.member.length; i++) {
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

          collection.insertOne(
            {
              id: photoInfo.members.member[i].nsid
            },
            (err, result) => {
              if (err) {
                console.log(err.errmsg);
              } else {
                console.log("Insert");
              }
              client.close();
            }
          );
        }
      );
    }
  } catch (e) {
    console.log("Try page on more time");
    await loopPages(i, members, pages, id);
  }
}

main();
