require("dotenv").config();
var FlickrAPI = require("flickrapi"),
  flickrOptions = {
    api_key: "6fa93f111060896376337dc7e2446543",
    secret: "a6a0e636f84f389c",
    user_id: "185143076@N03",
    access_token: "72157711877481932-0c897a1c7aedf41b",
    access_token_secret: "621bb40615604163"
  };


  async function create() {
FlickrAPI.authenticate(flickrOptions, function (error, flickr) {

  let photoID = 49096510598;

  flickr.photos.getInfo(
    {
      photo_id: photoID
    },

function info (err, info) {
      if (err) {
        throw new Error(err);
      }
one(info)
    }
  );
 
  flickr.photos.getExif(
    {
      photo_id: photoID
    },
  function exif (err, exif) {
      
      if (err) {
        throw new Error(err);
      }
 two(exif)
    }
  );
  // const object3 = {...info, ...exif };
  // console.log(object3);
});



function one(info){

}
function two(exif) {
  
}

}