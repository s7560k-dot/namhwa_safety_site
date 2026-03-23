const https = require('https');
const fs = require('fs');
const path = require('path');

const url = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Hong_Kong_Night_View_Victoria_Harbour.jpg/1920px-Hong_Kong_Night_View_Victoria_Harbour.jpg";
const dest = path.join(__dirname, 'bg_city_night.jpg');

const file = fs.createWriteStream(dest);
https.get(url, function (response) {
    response.pipe(file);
    file.on('finish', function () {
        file.close(() => console.log('Download Completed'));
    });
}).on('error', function (err) {
    fs.unlink(dest);
    console.error('Error downloading image:', err.message);
});
