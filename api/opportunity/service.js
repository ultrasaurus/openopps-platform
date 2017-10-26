const _ = require ('lodash');
const log = require('blue-ox')('app:opportunity:service');
const db = require('../../db');
const dao = require('./dao')(db);

const baseTask = {
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function findById (id) {
  var results = await dao.Task.query(dao.query.task + ' where task.id = ?', id, dao.options.task);
  if(results.length === 0) {
    return {};
  }
  var task = dao.clean.task(results[0]);
  task.owner = dao.clean.user((await dao.User.query(dao.query.user + ' and midas_user.id = ?', task.userId, dao.options.user))[0]);
  task.volunteers = (await dao.Task.db.query(dao.query.volunteer, task.id)).rows;
  return task;
}

async function list () {
  return await dao.Task.query(dao.query.task, {}, dao.options.task);
}

async function commentsByTaskId (id) {
  var comments = await dao.Comment.query(dao.query.comments, id, dao.options.comment);
  return { comments: dao.clean.comments(comments) };
}

async function createOpportunity (attributes, done) {
  await dao.Task.insert(_.extend(baseTask, attributes)).then(async (task) => {
    (attributes.tags || attributes['tags[]'] || []).map(tag => {
      dao.TaskTags.insert({ tagentity_tasks: tag, task_tags: task.id }).catch(err => {
        log.info('register: failed to create tag ', attributes.title, tag, err);
      });
    });
    task.submittedAt = attributes.state === 'submitted' ? new Date : null;
    task.owner = attributes.userId;
    return done(null, task);
  }).catch(err => {
    log.info('create: failed to create opportunity ', attributes.title, err);
    return done(true);
  });
}

async function updateOpportunity (attributes, done) {
  await dao.Task.update(attributes).then(async () => {
    await dao.TaskTags.db.query(dao.query.deleteTaskTags, attributes.id)
      .then(async () => {
        (attributes.tags || attributes['tags[]'] || []).map(tag => {
          dao.TaskTags.insert({ tagentity_tasks: tag, task_tags: attributes.id }).catch(err => {
            log.info('register: failed to update tag ', attributes.username, tag, err);
          });
        });
        return done(true);
      }).catch (err => { return done(err); });
  }).catch (err => { return done(err); });
}

async function copyOpportunity (attributes, done) {
  var results = await dao.Task.findOne('id = ?', attributes.taskId);
  var tags = await dao.TaskTags.find('task_tags = ?', attributes.taskId);
  if(results === null) {
    return {};
  }
  var task = {
    title: attributes.title,
    userId: results.userId,
    state: 'draft',
    description: results.description,
  };

  await dao.Task.insert(_.extend(baseTask, task))
    .then(async (task) => {
      tags.map(tag => {
        dao.TaskTags.insert({ tagentity_tasks: tag.tagentityTasks, task_tags: task.id }).catch(err => {
          log.info('register: failed to update tag ', attributes.username, tag, err);
        });
      });
      return done(null, { 'taskId': task.id });
    }).catch (err => { return done(err); });
}

module.exports = {
  findById: findById,
  list: list,
  commentsByTaskId: commentsByTaskId,
  createOpportunity: createOpportunity,
  updateOpportunity: updateOpportunity,
  copyOpportunity: copyOpportunity,
};
