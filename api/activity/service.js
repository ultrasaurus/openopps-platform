const _ = require ('lodash');
const log = require('blue-ox')('app:activity:service');
const db = require('../../db');
const dao = require('./dao')(db);

async function listBadges () {
  
}

async function newUsersList () {
  return await dao.User.query(dao.query.user, {}, dao.options.user);
}

async function getTaskCount (state) {
  var result = await dao.Task.db.query(dao.query.task, state);
  return result.rows[0].count;
}

module.exports = {
  listBadges: listBadges,
  newUsersList: newUsersList,
  getTaskCount: getTaskCount,
};