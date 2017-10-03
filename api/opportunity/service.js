const db = require('../../db');
const dao = require('./dao')(db);

async function findById(id) {
  var results = await dao.Task.query(dao.query.task + " where task.id = ?", id, dao.options.task);
  if(results.length === 0) {
    return {};
  }
  var task = dao.clean.task(results[0]);
  task.owner = dao.clean.user((await dao.User.query(dao.query.user + " and midas_user.id = ?", task.userId, dao.options.user))[0]);
  task.volunteers = (await dao.Task.db.query(dao.query.volunteer, task.id)).rows;
  return task;
}

async function list() {
  return await dao.Task.query(dao.query.task, {}, dao.options.task);
}

module.exports = {
  findById: findById,
  list: list
};
