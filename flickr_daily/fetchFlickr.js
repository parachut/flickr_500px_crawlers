require("dotenv").config();


const Flickr = require("flickr-sdk");

var flickr = new Flickr(
  Flickr.OAuth.createPlugin(
    process.env.FLICKR_API_KEY,
    process.env.FLICKR_SECRET,
    process.env.FLICKR_ACCESS_TOKEN,
    process.env.FLICKR_ACCESS_TOKEN_SECRET
  )
);


async function create() {
  let photoID = 40589640284;

  try {
    const photoInfo = await flickr.groups
      .search({
        //photo_id: photoID
        // page: 1,
        text: "1",
        page: "1"
      })
      .then(res => JSON.parse(res.text));
    console.log(photoInfo.groups.group[0].nsid);
    
  } catch (e) {
    console.log(e);
  }
}
create();
