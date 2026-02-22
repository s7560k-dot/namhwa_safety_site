const https = require('https');
const fs = require('fs');
const path = require('path');

const url = "https://images.pexels.com/photos/1460505/pexels-photo-1460505.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2";
const dest = path.join(__dirname, 'bg_city_night.jpg');

function download(url, dest, cb) {
    const file = fs.createWriteStream(dest);
    const request = https.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    }, function (response) {
        // Handle Redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
            console.log('Redirecting to:', response.headers.location);
            return download(response.headers.location, dest, cb);
        }

        if (response.statusCode !== 200) {
            console.error(`Failed to download: ${response.statusCode}`);
            return;
        }

        response.pipe(file);
        file.on('finish', function () {
            file.close(cb);
        });
    }).on('error', function (err) {
        fs.unlink(dest);
        if (cb) cb(err.message);
    });
}

download(url, dest, (err) => {
    if (err) console.error('Error:', err);
    else console.log('Download Completed Successfully');
});
