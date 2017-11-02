const _ = require ('lodash');
const log = require('blue-ox')('app:activity:service');
const db = require('../../db');
const dao = require('./dao')(db);

async function listBadges () {
  var tasks = await dao.Task.query(dao.query.taskHistoryQuery, 'completed', dao.options.taskHistory);
  for (var i = 0; i < tasks.length; i++) {
    tasks[i].badges = dao.clean.badge(await dao.Badge.query(dao.query.badgeQuery, tasks[i].id, dao.options.badge));
    tasks[i].participants = await dao.User.query(dao.query.participantsQuery, tasks[i].id, dao.options.participants);
  }
  var cleaned = await dao.clean.taskHistory(tasks);
  return cleaned;
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