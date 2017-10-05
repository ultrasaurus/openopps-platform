const db = require('../../db');
const dao = require('./dao')(db);

async function list() {
  return dao.clean.users(await dao.User.query(dao.query.user, {}, dao.options.user));
}

module.exports = {
  list: list
};
