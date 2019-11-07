const express = require("express")
const path = require('path')
const FlickrBiqQueryDailyJS = require('./FlickrBigQueryDaily.js')

const app = express();

app.get('/', (req, res)=>{
    res.send('<h1>Flickr Crawler</h1>')
} )
const PORT = process.env.PORT || 8000;
app.listen(PORT, ()=> console.log(`Server Started on port ${PORT}`));
