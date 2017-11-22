var _ = require('lodash');
var utils = require('../../utils');
var db = require('../../db');
var dao = require('postgres-gen-dao');

var getDescription = function () {
  return utils.badgeDescriptions[this.type];
};

module.exports = dao({
  db: db,
  table: 'badge',
  prototype: {
    description: getDescription,
  },
});
