require("dotenv").config();
// var Flickr = require("flickrapi");
// //var flickr = new Flickr(process.env.FLICKR_API_KEY);
// var flickr = Flickr.tokenOnly({
//   // or Flickr.authenticate
//   api_key: process.env.FLICKR_API_KEY,
//   progress: false
// });

// var Flickr = require("flickrapi"),
//     flickrOptions = {
//       api_key: process.env.FLICKR_API_KEY,
//       secret: process.env.FLICKR_API_KEY
//     };

const Flickr = require("flickr-sdk");
// var oauth = new Flickr.OAuth(
//   process.env.FLICKR_CONSUMER_KEY,
//   process.env.FLICKR_CONSUMER_SECRET
// );

const flickr = new Flickr(process.env.FLICKR_API_KEY);

// var flickr = new Flickr(
//   Flickr.OAuth.createPlugin(
//     process.env.FLICKR_CONSUMER_KEY,
//     process.env.FLICKR_CONSUMER_SECRET,
//     process.env.FLICKR_OAUTH_TOKEN,
//     process.env.FLICKR_OAUTH_TOKEN_SECRET
//   )
// );

// flickr.test
//   .login()
//   .then(function(res) {
//     console.log("yay!", res.body);
//   })
//   .catch(function(err) {
//     console.error("bonk", err);
//   });

// var flickr = new Flickr(Flickr.OAuth.createPlugin(
//   process.env.FLICKR_CONSUMER_KEY,
//   process.env.FLICKR_CONSUMER_SECRET,
//   process.env.FLICKR_OAUTH_TOKEN,
//   process.env.FLICKR_OAUTH_TOKEN_SECRET
// ));

// api_key: "6fa93f111060896376337dc7e2446543",
// secret: "a6a0e636f84f389c",
// user_id: "185143076@N03",
// access_token: "72157711877481932-0c897a1c7aedf41b",
// access_token_secret: "621bb40615604163"

async function create() {
  let photoID = 40589640284;

  try {
    const photoInfo = await flickr.photos
      .getInfo({
        photo_id: photoID
      })
      .then(res => JSON.parse(res.text));

    const photoExif = await flickr.photos
      .getExif({
        photo_id: photoID
      })
      .then(res => JSON.parse(res.text));

    const obj = { ...photoInfo.photo, ...photoExif.photo };
    console.log(obj);
  } catch (e) {
    console.log(e);
  }
}
create();
