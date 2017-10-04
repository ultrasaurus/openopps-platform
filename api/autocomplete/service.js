const db = require('../../db');
const dao = require('./dao')(db);

async function tagByType(type) {
  return await dao.TagEntity.query(dao.query.tagByType, type);
}

module.exports = {
  tagByType: tagByType
};
