var API500px = require('500px'),
    api500px = new API500px("EY74uNvI4ha3mt7B");

    api500px.photos.getPopular({'sort': 'created_at', 'rpp': '100'},  function(error, results) {
        if (error) {
          // Error!
          return;
        }
        console.log(results)
       
        // Do something
      });