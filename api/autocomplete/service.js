const log = use('log')('app:autocomplete:service');
const db = require('../../db');
const dao = require('./dao')(db);

async function tagByType (type, name) {
  var query = dao.query.tagByType;
  query += name ? ' and lower(name) like ?' : '';
  var result = await dao.TagEntity.query(query, type, name ? '%' + name.toLowerCase() + '%' : '');
  return result.map(tag => {
    tag.field = 'name';
    tag.value = tag.name;
    return tag;
  });
}

async function userByName (name) {
  var result = await dao.User.query(
    dao.query.userByName, name ? '%' + name.toLowerCase() + '%' || name.toLowerCase() + '%' || '%' + name.toLowerCase() : null
  );
  return result.map(tag => {
    tag.field = 'name';
    tag.value = tag.name;
    return tag;
  });
}

module.exports = {
  tagByType: tagByType,
  userByName: userByName,
};
