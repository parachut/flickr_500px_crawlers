const express = require("express")
const path = require('path')
const FlickrBiqQueryJS = require('./FlickrBigQuery.js')

const app = express();

app.get('/flickr-yearly', (req, res)=>{
    res.send('<h1>Flickr Crawler Year</h1>')
} )
const PORT = process.env.PORT || 7000;
app.listen(PORT, ()=> console.log(`Server Started on port ${PORT}`));
