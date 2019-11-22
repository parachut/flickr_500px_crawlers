var fs = require("fs");
const jsonFetch = require("json-fetch");
const groups = require("./AllGroups.json")
let pageNumber;

let fileName = "../Photographers-Groups-JSON/directory.json";
let i = 1;
let startFile = []
fs.writeFile(
  "../Photographers-Groups-JSON/directory.json",
   JSON.stringify(startFile ),
   err =>
     err
       ? console.error("Data not written", err)
       : console.log("Data written")
 );


async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
async function main() {
  for (let i = 0; i < groups.length; i++) {
    console.log("-------------------------------");
    console.log("Group name: " + groups[i].name);
    await wait (3000)
  try{  await fetch(
      "https://legacy-api.500px.com/v1/groups/"+groups[i].id+"/members?&page=1&rpp=100"
    )
      .then(response => response.json())
      .then(data => {
        pageNumber = data.meta.pagination.total_pages;
        console.log("Number of pages: " + pageNumber);
        console.log("-------------------------------");
      });
  } catch (e) {
    console.log("Trying again")
    await wait (10000)
    await fetch(
      "https://legacy-api.500px.com/v1/groups/"+groups[i].id+"/members?&page=1&rpp=100"
    )
      .then(response => response.json())
      .then(data => {
        pageNumber = data.meta.pagination.total_pages;
        console.log("Number of pages: " + pageNumber);
        console.log("-------------------------------");
      });
}
    await main2(pageNumber, groups[i].id);
    await wait (6000)
  }
}

async function main2(pageNumbers, group) {
  try {
    for (let q = 1; q <= pageNumbers; q++) {
      let json;
      console.log("-------------------------------");
      console.log("Page#: " + q);
      await fetch(
        "https://legacy-api.500px.com/v1/groups/"+group+"/members?&page="+q+"&rpp=100"
      )
        .then(response => response.json())
        .then(data => {
          console.log("Number of folks: " + data.members.length);
          console.log("-------------------------------");

       
          json =data.members
          
        });
        await wait (2000)
      await save(json);
      await wait (2000)
    }
  } catch (e) {
    console.log("Cannot go over");
  }
}

async function save(json) {

  let file = [];

 await fs.readFile(fileName, function(err, data) {
    var openedJson = JSON.parse(fs.readFileSync(fileName, "utf8"));
    
    for (let j = json.length - 1; j >= 0; j--) {
      openedJson.unshift(json[j]);
    }
    console.log("Folks alreday in: "+openedJson.length);
    fs.writeFile(fileName, JSON.stringify(openedJson), err =>
    err
      ? console.error("Data not written", err)
      : console.log("Data written")
  );
  });

  await fs.stat(fileName, (err, stats) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(stats.size / 1024000);
    if (stats.size / 1024000 > 25) {

      console.log("Big");
      let newI = i + 1
      i = newI;
      let fileNameNew = "../Photographers-Groups-JSON/directory" + newI + ".json";
      fileName = fileNameNew;
      fs.writeFile(fileName, JSON.stringify(file), err =>
        err
          ? console.error("Data not written", err)
          : console.log("Data written")
      );
    }
  });
}
main();