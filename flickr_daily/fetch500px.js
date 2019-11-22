var fs = require("fs");
const jsonFetch = require("json-fetch");

let pageNumber;
const special = [
  "aerial",
  "architecture",
  "automotive",
  "event",
  "fashion",
  "food",
  "interior",
  "lifestyle",
  "maternity_newborn",
  "nature_landscape",
  "pets_animals",
  "photojournalism",
  "portrait_headshots",
  "sports",
  "still_life_product",
  "urban",
  "wedding",
  "panorama"
];

let fileName = "../Photographers-Directory-JSON/directory.json";
let i = 1;
let startFile = []
fs.writeFile(
  "../Photographers-Directory-JSON/directory.json",
   JSON.stringify(startFile, null, 2),
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
  for (let i = 0; i < special.length; i++) {
    console.log("-------------------------------");
    console.log("Specialty: " + special[i]);
    await fetch(
      "https://api.500px.com/v1/photographers/search?q%5Buser_specialties_specialty_eq%5D=" +
        special[i] +
        "&include_thumbnail=true&thumbnail_sizes%5B%5D=3&page=1&rpp=100"
    )
      .then(response => response.json())
      .then(data => {
        pageNumber = data.meta.pagination.total_pages;
        console.log("Number of pages: " + pageNumber);
        console.log("-------------------------------");
      });

    await main2(pageNumber, special[i]);
    await wait(5000);
  }
}

async function main2(pageNumbers, special) {


  try {
    for (let q = 1; q <= pageNumbers; q++) {
      let json;
      console.log("-------------------------------");
      console.log("Page#: " + q);
      await fetch(
        "https://api.500px.com/v1/photographers/search?q%5Buser_specialties_specialty_eq%5D=" +
          special +
          "&include_thumbnail=true&thumbnail_sizes%5B%5D=3&page=" +
          q +
          "&rpp=100"
      )
        .then(response => response.json())
        .then(data => {
          console.log("Number of folks: " + data.photographer_profiles.length);
          console.log("-------------------------------");
          json = data.photographer_profiles;
        });
      await wait(2000);
      await save(json, q);
      await wait(2000);
    }
  } catch (e) {

    console.log(e);
  }
}

async function save(json, q) {
  let file = [];
  
  await fs.readFile(fileName, function(err, data) {
    var openedJson = JSON.parse(fs.readFileSync(fileName, "utf8"));

    for (let j = json.length - 1; j >= 0; j--) {
      openedJson.unshift(json[j]);
    }
    console.log("Folks alreday in: " + openedJson.length);
    fs.writeFile(fileName, JSON.stringify(openedJson), function(err) {
      if (err) throw err;
      console.log('The "data to append" was appended to file!');
    });
  });

  fs.stat(fileName, (err, stats) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(stats.size / 1024000);
    if (stats.size / 1024000 > 25) {
      console.log("Big");
      let newI = i + 1;
      i = newI;
      let fileNameNew = "../Photographers-Directory-JSON/directory" + newI + ".json";
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