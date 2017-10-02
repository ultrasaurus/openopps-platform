var gen = require('postgres-gen');

var defaults = {
  host: 'localhost',
  db: 'midas',
  user: 'midas',
  password: 'midas'
};

module.exports = gen(defaults);
