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

const qwertyArray = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "-",
  "_",
  "+",
  "=",
  "!",
  "@",
  "#",
  "$",
  "%",
  "~",
  "^",
  "&",
  "*",
  "(",
  ")",
  "q",
  "w",
  "e",
  "r",
  "t",
  "y",
  "u",
  "i",
  "o",
  "p",
  "a",
  "s",
  "d",
  "f",
  "g",
  "h",
  "j",
  "k",
  "l",
  "z",
  "x",
  "c",
  "v",
  "b",
  "n",
  "m",
  "?",
  "/",
  "<",
  ">",
  ";",
  ":",
  "[",
  "]",
  "{",
  "}",
  "|"
];
async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
async function groups() {
  let numberOfPages;
  for (const qwertyText of qwertyArray) {
    try {
      const photoInfo = await flickr.groups
        .search({
          text: qwertyText,
          page: 1,
          per_page: 100
        })
        .then(res => JSON.parse(res.text));

      numberOfPages = photoInfo.groups.pages;

      for (let i = 1; i < numberOfPages; i++) {
        try {
          await pagesLoop(i, numberOfPages, qwertyText);
        } catch (e) {
          console.log("Try Page Again");
          await pagesLoop(i, numberOfPages, qwertyText);
        }
      }
    } catch (e) {
      console.log("Array Problem");
    }
  }
}

async function pagesLoop(i, numberOfPages, qwertyText) {
  console.log("-------------------------------");
  console.log("Page Number:" + i);
  console.log("Number of Pages:" + numberOfPages);
  console.log("Character:" + qwertyText);
  console.log("-------------------------------");
  await wait(2000);

  const photoInfo = await flickr.groups
    .search({
      text: qwertyText,
      page: i,
      per_page: 100
    })
    .then(res => JSON.parse(res.text));
  for (let i = 0; i < photoInfo.groups.group.length; i++) {
    try {
      await membersLoop(i, photoInfo);
    } catch (e) {
      console.log("Try members again");
      await membersLoop(i, photoInfo);
    }
  }
}

async function membersLoop(i, photoInfo) {
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

      collection.insertOne(
        {
          id: photoInfo.groups.group[i].nsid
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
groups();
