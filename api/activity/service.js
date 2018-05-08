const _ = require ('lodash');
const log = require('log')('app:activity:service');
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

async function usersList (user) {
  var agency = _.find(user.tags, (tag) => {
    return tag.type == 'agency';
  }) || {};
  return {
    title: await dao.User.query(dao.query.userByTitle, user.id, user.title, dao.options.user),
    agency: await dao.User.query(dao.query.userByAgency, user.id, agency.name, dao.options.user),
  };
}

async function getTaskCount (state) {
  var result = await dao.Task.db.query(dao.query.task, state);
  return result.rows[0].count;
}

async function getTaskTypeList () {
  return {
    careers: _.reject((await dao.Task.db.query(dao.query.taskByType, 'career', 4)).rows, { name: 'Acquisition' }).slice(0, 3),
    skills: (await dao.Task.db.query(dao.query.taskByType, 'skill', 4)).rows,
    locations: (await dao.Task.db.query(dao.query.taskByType, 'location', 4)).rows,
  };
}

module.exports = {
  listBadges: listBadges,
  usersList: usersList,
  getTaskCount: getTaskCount,
  getTaskTypeList: getTaskTypeList,
};