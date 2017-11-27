const _ = require ('lodash');
const log = require('blue-ox')('app:opportunity:service');
const db = require('../../db');
const dao = require('./dao')(db);
const json2csv = require('json2csv');
const notification = require('../notification/service');

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
  return dao.clean.tasks(await dao.Task.query(dao.query.task + ' order by task."createdAt" desc', {}, dao.options.task));
}

async function commentsByTaskId (id) {
  var comments = await dao.Comment.query(dao.query.comments, id, dao.options.comment);
  return { comments: dao.clean.comments(comments) };
}

async function createOpportunity (attributes, done) {
  attributes.submittedAt = attributes.state === 'submitted' ? new Date : null;
  attributes.createdAt = new Date();
  attributes.updatedAt = new Date();
  await dao.Task.insert(attributes).then(async (task) => {
    (attributes.tags || attributes['tags[]'] || []).map(tag => {
      dao.TaskTags.insert({ tagentity_tasks: tag, task_tags: task.id }).catch(err => {
        log.info('register: failed to create tag ', attributes.title, tag, err);
      });
    });
    task.owner = attributes.userId;
    return done(null, task);
  }).catch(err => {
    log.info('create: failed to create opportunity ', attributes.title, err);
    return done(true);
  });
}

async function sendTaskNotification (user, task, action) {
  var data = {
    action: action,
    model: {
      task: task,
      user: user,
    },
  };
  notification.createNotification(data);
}

async function updateOpportunity (attributes, done) {
  var origTask = await dao.Task.findOne('id = ?', attributes.id);
  attributes.assignedAt = attributes.state === 'assigned' && origTask.state !== 'assigned' ? new Date : origTask.assignedAt;
  attributes.publishedAt = attributes.state === 'open' && origTask.state !== 'open' ? new Date : origTask.publishedAt;
  attributes.completedAt = attributes.state === 'completed' && origTask.state !== 'completed' ? new Date : origTask.completedAt;
  attributes.submittedAt = attributes.state === 'submitted' && origTask.state !== 'submitted' ? new Date : origTask.submittedAt;
  attributes.updatedAt = new Date();
  await dao.Task.update(attributes).then(async () => {
    await dao.TaskTags.db.query(dao.query.deleteTaskTags, attributes.id)
      .then(async () => {
        (attributes.tags || attributes['tags[]'] || []).map(tag => {
          dao.TaskTags.insert({ tagentity_tasks: typeof(tag) == 'object' ? tag.id : tag, task_tags: attributes.id }).catch(err => {
            log.info('register: failed to update tag ', attributes.id, tag, err);
          });
        });
        return done(origTask.state !== attributes.state);
      }).catch (err => { return done(null, err); });
  }).catch (err => { return done(null, err); });
}

function sendTaskStateUpdateNotification (user, task) {
  switch (task.state) {
    case 'assigned':
      sendTaskAssignedNotification(user, task);
      break;
    case 'completed':
      sendTaskCompletedNotification(user, task);
      break;
    case 'open':
      sendTaskNotification(user, task, 'task.update.opened');
      break;
    case 'submitted':
      sendTaskNotification(user, task, 'task.update.submitted');
      break;
  }
}

async function getNotificationTemplateData (user, task, action) {
  var volunteers = (await dao.Task.db.query(dao.query.volunteerListQuery, task.id)).rows;
  var data = {
    action: action,
    model: {
      task: task,
      owner: user,
      volunteers: _.map(volunteers, 'username').join(', '),
    },
  };
  return data;
}

async function sendTaskAssignedNotification (user, task) {
  var data = await getNotificationTemplateData(user, task, 'task.update.assigned');
  notification.createNotification(data);
}

async function sendTaskCompletedNotification (user, task) {
  var data = await getNotificationTemplateData(user, task, 'task.update.completed');
  notification.createNotification(data);
}

async function copyOpportunity (attributes, adminAttributes, done) {
  var results = await dao.Task.findOne('id = ?', attributes.taskId);
  var tags = await dao.TaskTags.find('task_tags = ?', attributes.taskId);
  if(results === null) {
    return {};
  }
  var task = {
    title: attributes.title,
    userId: adminAttributes == null ? results.userId : adminAttributes.id,
    restrict: adminAttributes == null ? results.restrict : getRestrictValues(adminAttributes),
    state: 'draft',
    description: results.description,
  };
  
  var newTask = _.extend(baseTask, task);
  delete(newTask.id);
  delete(newTask.completedBy);
  delete(newTask.completedAt);
  await dao.Task.insert(newTask)
    .then(async (task) => {
      tags.map(tag => {
        dao.TaskTags.insert({ tagentity_tasks: tag.tagentityTasks, task_tags: task.id }).catch(err => {
          log.info('register: failed to update tag ', attributes.username, tag, err);
        });
      });
      return done(null, { 'taskId': task.id });
    }).catch (err => { return done(err); });
}

function getRestrictValues (adminAttributes) {
  var record = _.find(adminAttributes.tags, { 'type': 'agency' });
  var restrict = {
    name: record.name,
    abbr: record.data.abbr,
    slug: record.data.slug,
    domain: record.data.domain,
    projectNetwork: false,
  };
  return restrict;
}

async function deleteTask (id) {
  await dao.TaskTags.delete('task_tags = ?', id).then(async (task) => {
    dao.Volunteer.delete('"taskId" = ?', id).then(async (task) => {
      dao.Task.delete('id = ?', id).then(async (task) => {
        return id;
      }).catch(err => {
        log.info('delete: failed to delete task ', err);
        return false;
      });
    }).catch(err => {
      log.info('delete: failed to delete volunteer from task ', err);
      return false;
    });    
  }).catch(err => {
    log.info('delete: failed to delete task tags ', err);
    return false;
  });
}

async function getExportData () {
  var records = (await dao.Task.db.query(dao.query.taskExportQuery, 'agency')).rows;
  var fieldNames = _.keys(dao.exportFormat);
  var fields = _.values(dao.exportFormat);

  fields.forEach(function (field, fIndex, fields) {
    if (typeof(field) === 'object') {
      records.forEach(function (rec, rIndex, records) {
        records[rIndex][field.field] = field.filter.call(this, rec[field.field]);
      });
      fields[fIndex] = field.field;
    }
  });

  return json2csv({
    data: records,
    fields: fields,
    fieldNames: fieldNames,
  });
}

module.exports = {
  findById: findById,
  list: list,
  commentsByTaskId: commentsByTaskId,
  createOpportunity: createOpportunity,
  updateOpportunity: updateOpportunity,
  copyOpportunity: copyOpportunity,
  deleteTask: deleteTask,
  getExportData: getExportData,
  sendTaskNotification: sendTaskNotification,
  sendTaskStateUpdateNotification: sendTaskStateUpdateNotification,
};
