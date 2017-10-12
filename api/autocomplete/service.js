const db = require('../../db');
const dao = require('./dao')(db);

async function tagByType (type, name) {
  var query = dao.query.tagByType;
  query += name ? ' and lower(name) like ?' : '';
  return await dao.TagEntity.query(query, type, '%' + name.toLowerCase() + '%');
}

module.exports = {
  tagByType: tagByType,
};
