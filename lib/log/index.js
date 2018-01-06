const blueox = require('blue-ox');
console.log("hello from lib/log");

// configure logging
blueox.beGlobal();
blueox.useColor = true;
blueox.level('info');

module.exports = ( source ) => { 
  return blueox(source);
  //return new MyClass( arg1,arg2,arg3 ) 

}


