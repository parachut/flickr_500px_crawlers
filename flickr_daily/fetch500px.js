var fs = require("fs");
const jsonFetch = require("json-fetch");
const json = require("./data.json");

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

async function main() {
  for (let i = 0; i < special.length; i++) {
    console.log("-------------------------------");
    console.log("Specialty: "+special[i]);
    await fetch(
      "https://api.500px.com/v1/photographers/search?q%5Buser_specialties_specialty_eq%5D=" +
        special[i] +
        "&include_thumbnail=true&thumbnail_sizes%5B%5D=3&page=1&rpp=100"
    )
      .then(response => response.json())
      .then(data => {
        pageNumber = data.meta.pagination.total_pages;
        console.log(pageNumber);
        console.log("-------------------------------");
      });
    await main2(pageNumber, special[i]);
  }
}

async function main2(pageNumbers, special) {
  let dataCollection = [];
  try{for (let q = 1; q <= pageNumbers; q++) {
    console.log("-------------------------------");
    console.log("Page#: "+q);
    let photographers = [];

    await fetch(
      "https://api.500px.com/v1/photographers/search?q%5Buser_specialties_specialty_eq%5D=" +
        special +
        "&include_thumbnail=true&thumbnail_sizes%5B%5D=3&page=" +
        q +
        "&rpp=100"
    )
      .then(response => response.json())
      .then(data => {
        console.log("Number of folks: "+data.photographer_profiles.length);
        console.log("-------------------------------");

        for (let i = 0; i < data.photographer_profiles.length - 1; i++) {
          try {
            let camerasCount = [];
            let specialtiesCount = [];
            let tryFirst;
            let tryLast;
            try {
              for (
                let j = 0;
                j < data.photographer_profiles[i].specialties.length;
                j++
              ) {
                specialtiesCount[j] = {
                  specialty:
                    data.photographer_profiles[i].specialties[j].specialty
                };
              }
            } catch (e) {
              specialtiesCount = null;
            }

            try {
              for (
                let j = 0;
                j < data.photographer_profiles[i].cameras.length;
                j++
              ) {
                camerasCount[j] = {
                  camera: data.photographer_profiles[i].cameras[j].friendly_name
                };
              }
            } catch (e) {
              specialtiesCount = null;
            }

            try {
              tryFirst = data.photographer_profiles[i].firstname;
            } catch (e) {
              tryFirst = null;
            }
            try {
              tryLast = data.photographer_profiles[i].lastname;
            } catch (e) {
              tryLast = null;
            }

            photographers[i] = {
              firstName: tryFirst,
              lastName: tryLast,
              id: data.photographer_profiles[i].id,
              contacts: data.photographer_profiles[i].user.contacts,
              country: data.photographer_profiles[i].user.country,
              city: data.photographer_profiles[i].user.city,
              specialties: specialtiesCount,
              cameras: camerasCount
            };
          } catch (e) {}
        }

        //console.log(json)
        for (let j = photographers.length - 1; j >= 0; j--) {
          json.unshift(photographers[j]);
        }
        // json.concat(dataCollection);

        fs.writeFile("./data.json", JSON.stringify(json, null, 2), err =>
          err
            ? console.error("Data not written", err)
            : console.log("Data written")
        );
      });
  }}catch(e){
    console.log("Cannot go over: "+q)
  }
}
main();
