const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'resource.html');
const data = fs.readFileSync(file, 'utf16le');
fs.writeFileSync(file, data, 'utf8');
console.log('Converted to UTF-8');
