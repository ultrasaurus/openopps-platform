const _ = require('lodash');
const db = require('../../db');
const dao = require('postgres-gen-dao');
const badgeDescriptions = require('../../utils').badgeDescriptions;

var getDescription = function () {
  return badgeDescriptions[this.type];
};

module.exports = dao({
  db: db,
  table: 'badge',
  prototype: {
    description: getDescription,
  },
});
