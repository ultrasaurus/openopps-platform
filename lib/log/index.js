const blueox = require('blue-ox');

// configure logging
blueox.beGlobal();
blueox.useColor = true;
blueox.level('info');

module.exports = ( source ) => { 
  return blueox(source);
}


