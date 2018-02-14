const blueox = require('blue-ox');

// configure logging
blueox.beGlobal();
blueox.useColor = true;
blueox.level('debug');

module.exports = ( source ) => {
  return blueox(source);
}


