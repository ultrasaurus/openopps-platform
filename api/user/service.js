const db = require('../../db');
const dao = require('./dao')(db);

async function list() {
  return dao.clean.users(await dao.User.query(dao.query.user, {}, dao.options.user));
}

async function findOne(id) {
  return await dao.User.findOne('id = ?', id);
}

module.exports = {
  list: list,
  findOne: findOne
};
