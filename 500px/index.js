const express = require("express")
const path = require('path')
const BiqQuery500pxJS = require('./500pxBiqQuery.js')

const app = express();

app.get('/500px-yearly', (req, res)=>{
    res.send('<h1>500px Crawler Year</h1>')
} )
const PORT = process.env.PORT || 6000;
app.listen(PORT, ()=> console.log(`Server Started on port ${PORT}`));
