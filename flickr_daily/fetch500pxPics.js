var fs = require("fs");
const jsonFetch = require("json-fetch");
const folk = require("./AllGroups.json")


let pageNumber;

async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
async function main() {
  for (let i = 0; i < folk.length; i++) {
    console.log("-------------------------------");
    console.log("Folk name: " + folk[i].firstname);
    await fetch(
    "https://api.500px.com/v1/photos?feature=user&stream=photos&user_id="+folk[i].id+"&include_states=true&image_size%5B%5D=2048&page=1&rpp=100"
    )
      .then(response => response.json())
      .then(data => {
        pageNumber = data.total_pages;
        console.log(pageNumber);
        console.log("-------------------------------");
      });
      let array =[];
       fs.writeFile(
           "../Photographers-Pics/"+folk[i].id+".json",
            JSON.stringify(array, null, 2),
            err =>
              err
                ? console.error("Data not written", err)
                : console.log("Data written")
          );
          await wait(2000)
    await main2(pageNumber, folk[i].name, folk[i].id);
  }
}

async function main2(pageNumbers, group, id) {
  let dataCollection = [];
  const json = require("../Photographers-Pics/"+id+".json");
  try {
    for (let q = 1; q <= pageNumbers; q++) {
      
      console.log("-------------------------------");
      console.log("Page#: " + q);
      let photos = [];

      await fetch(
       "https://api.500px.com/v1/photos?feature=user&stream=photos&user_id="+id+"&include_states=true&image_size%5B%5D=2048&page="+q+"&rpp=100"
      )
        .then(response => response.json())
        .then(data => {
          console.log("Number of pics: " + data.photos.length);
          console.log("-------------------------------");

          for (let i = 0; i < data.photos.length ; i++) {
            try {
              
              photos[i] = {
                  id:data.photos[i].id,
                  taken_at:data.photos[i].taken_at,
                  rating:data.photos[i].rating,
                  images:data.photos[i].images[0].https_url,
                  name:data.photos[i].name,
                  description:data.photos[i].description,
                  shutter_speed:data.photos[i].shutter_speed,
                  focal_length:data.photos[i].focal_length,
                  aperture:data.photos[i].aperture,
                  camera:data.photos[i].camera,
                  lens:data.photos[i].lens,
                  iso:data.photos[i].iso,
                  location:data.photos[i].location,
                  latitude:data.photos[i].latitude,
                  longitude:data.photos[i].longitude,
                  liked:data.photos[i].liked,
                  comments_count:data.photos[i].comments_count,
                  votes_count:data.photos[i].votes_count,
                  times_viewed:data.photos[i].times_viewed,
                  feature:data.photos[i].feature,
                  category:data.photos[i].category
            
              };
            } catch (e) {
              console.log("Someth ing is up")
            }
          }

          //console.log(json)
          for (let j = photos.length-1; j >= 0; j--) {
            json.unshift(photos[j]);
          }
          // json.concat(dataCollection);

          fs.writeFile(
           "../Photographers-Pics/"+id+".json",
            JSON.stringify(json, null, 2),
            err =>
              err
                ? console.error("Data not written", err)
                : console.log("Data written")
          );
        });
    }
  } catch (e) {
  
    console.log("Cannot go over");
  }
}
main();
