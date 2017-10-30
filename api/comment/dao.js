const _ = require('lodash');
const dao = require('postgres-gen-dao');

module.exports = function (db) {
  return {
    Comment: dao({ db: db, table: 'comment' })
  };
};