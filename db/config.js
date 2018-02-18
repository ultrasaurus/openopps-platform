console.log('loading: db/config')
const fs = require('fs');
const path = require('path');

const fileData = fs.readFileSync(path.resolve(__dirname, '../database.json'));
const config = JSON.parse(fileData);

console.log('config:', config);

module.exports = config;