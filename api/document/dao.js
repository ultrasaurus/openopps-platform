const _ = require('lodash');
var dao = require('postgres-gen-dao');

module.exports = function(db) {
    return {
      File: dao({ db: db, table: 'file' }),
    };
  };
  