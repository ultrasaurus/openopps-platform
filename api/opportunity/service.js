const _ = require ('lodash');
const log = require('log')('app:opportunity:service');
const db = require('../../db');
const dao = require('./dao')(db);
const notification = require('../notification/service');
const badgeService = require('../badge/service')(notification);
const Badge =  require('../model/Badge');
const json2csv = require('json2csv');
const moment = require('moment');
const Task = require('../model/Task');

const baseTask = {
  createdAt: new Date(),
  updatedAt: new Date(),
};

function findOne (id) {
  return dao.Task.findOne('id = ?', id);
}

async function findById (id, loggedIn) {
  var results = await dao.Task.query(dao.query.task + ' where task.id = ?', id, dao.options.task);
  if(results.length === 0) {
    return {};
  }
  var task = dao.clean.task(results[0]);
  task.owner = dao.clean.user((await dao.User.query(dao.query.user, task.userId, dao.options.user))[0]);
  task.volunteers = loggedIn ? (await dao.Task.db.query(dao.query.volunteer, task.id)).rows : undefined;
  return task;
}

async function list () {
  return dao.clean.tasks(await dao.Task.query(dao.query.task + ' order by task."createdAt" desc', {}, dao.options.task));
}

async function commentsByTaskId (id) {
  var comments = await dao.Comment.query(dao.query.comments, id, dao.options.comment);
  return { comments: dao.clean.comments(comments) };
}

function processTaskTags (task, tags) {
  return Promise.all(tags.map(async (tag) => {
    if(_.isNumber(tag)) {
      return await createTaskTag(tag, task);
    } else {
      _.extend(tag, { 'createdAt': new Date(), 'updatedAt': new Date() });
      if (tag.id) {
        return await createTaskTag(tag.id, task);
      }
      return await createNewTaskTag(tag, task);
    }
  }));
}

async function createNewTaskTag (tag, task) {
  return await dao.TagEntity.insert(tag).then(async (t) => {
    return await createTaskTag(t.id, task);
  }).catch(err => {
    log.info('task: failed to create tag ', task.title, tag, err);
  });
}

async function createTaskTag (tagId, task) {
  return await dao.TaskTags.insert({ tagentity_tasks: tagId, task_tags: task.id }).then(async (tag) => {
    return await dao.TagEntity.findOne('id = ?', tag.tagentity_tasks).catch(err => {
      log.info('update task: failed to load tag entity ', task.id, tagId, err);
    });
  }).catch(err => {
    log.info('task: failed to create tag ', task.title, tagId, err);
  });
}

async function createOpportunity (attributes, done) {
  var errors = await Task.validateOpportunity(attributes);
  if (!_.isEmpty(errors.invalidAttributes)) {
    return done(errors, null);
  }
  attributes.submittedAt = attributes.state === 'submitted' ? new Date : null;
  attributes.createdAt = new Date();
  attributes.updatedAt = new Date();
  await dao.Task.insert(attributes).then(async (task) => {
    var tags = attributes.tags || attributes['tags[]'] || [];
    await processTaskTags(task, tags).then(tags => {
      task.tags = tags;
    });
    task.owner = attributes.userId;
    return done(null, task);
  }).catch(err => {
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

async function canUpdateOpportunity (user, id) {
  var task = await dao.Task.findOne('id = ?', id);
  if (task.userId == user.id || user.isAdmin || (user.isAgencyAdmin && await checkAgency(user, task.userId))) {
    return true;
  }
  return false;
}

async function canAdministerTask (user, id) {
  var task = await dao.Task.findOne('id = ?', id);
  if (task && (user.isAdmin || (user.isAgencyAdmin && await checkAgency(user, task.userId)))) {
    return true;
  }
  return false;
}

async function checkAgency (user, ownerId) {
  var owner = await dao.clean.user((await dao.User.query(dao.query.user, ownerId, dao.options.user))[0]);
  if (owner && owner.agency) {
    return user.tags ? _.find(user.tags, { 'type': 'agency' }).name == owner.agency.name : false;
  }
  return false;
}

async function updateOpportunityState (attributes, done) {
  var origTask = await dao.Task.findOne('id = ?', attributes.id);
  attributes.updatedAt = new Date();
  attributes.assignedAt = attributes.state === 'assigned' && !origTask.assignedAt ? new Date : origTask.assignedAt;
  attributes.publishedAt = attributes.state === 'open' && !origTask.publishedAt ? new Date : origTask.publishedAt;
  attributes.completedAt = attributes.state === 'completed' && !origTask.completedAt ? new Date : origTask.completedAt;
  await dao.Task.update(attributes).then(async (task) => {
    return done(task, origTask.state !== task.state);
  }).catch (err => {
    return done(null, false, {'message':'Error updating task.'});
  });
}

async function updateOpportunity (attributes, done) {
  var errors = await Task.validateOpportunity(attributes);
  if (!_.isEmpty(errors.invalidAttributes)) {
    return done(null, null, errors);
  }
  var origTask = await dao.Task.findOne('id = ?', attributes.id);
  var tags = attributes.tags || attributes['tags[]'] || [];
  attributes.assignedAt = attributes.state === 'assigned' && origTask.state !== 'assigned' ? new Date : origTask.assignedAt;
  attributes.publishedAt = attributes.state === 'open' && origTask.state !== 'open' ? new Date : origTask.publishedAt;
  attributes.completedAt = attributes.state === 'completed' && origTask.state !== 'completed' ? new Date : origTask.completedAt;
  attributes.submittedAt = attributes.state === 'submitted' && origTask.state !== 'submitted' ? new Date : origTask.submittedAt;
  attributes.updatedAt = new Date();
  await dao.Task.update(attributes).then(async (task) => {
    task.userId = task.userId || origTask.userId; // userId is null if editted by owner
    task.tags = [];
    await dao.TaskTags.db.query(dao.query.deleteTaskTags, task.id)
      .then(async () => {
        await processTaskTags(task, tags).then(tags => {
          task.tags = tags;
          return done(task, origTask.state !== task.state);
        });
      }).catch (err => { return done(null, false, {'message':'Error updating task.'}); });
  }).catch (err => {
    return done(null, false, {'message':'Error updating task.'});
  });
}

async function publishTask (attributes, done) {
  attributes.publishedAt = new Date();
  attributes.updatedAt = new Date();
  await dao.Task.update(attributes).then(async (task) => {
    return done(true);
  }).catch (err => {
    return done(false);
  });
}

function volunteersCompleted (task) {
  dao.Volunteer.find('"taskId" = ?', task.id).then(volunteers => {
    var userIds = volunteers.map(v => { return v.userId; });
    dao.User.db.query(dao.query.userTasks, [userIds]).then(users => {
      users.rows.map(user => {
        var badge = Badge.awardForTaskCompletion(task, user);
        if(badge) {
          badgeService.save(badge).catch(err => {
            log.info('Error saving badge', badge, err);
          });
        }
      });
    }).catch(err => {
      log.info('volunteers completed: error loading user tasks completed count', task.id, err);
    });
  }).catch(err => {
    log.info('volunteers completed: error loading volunteers', task.id, err);
  });
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

  var newTask = _.extend(_.clone(baseTask), task);
  await dao.Task.insert(newTask)
    .then(async (task) => {
      tags.map(tag => {
        dao.TaskTags.insert({ tagentity_tasks: tag.tagentityTasks, task_tags: task.id }).catch(err => {
          log.info('register: failed to update tag ', attributes.username, tag, err);
        });
      });
      return done(null, { 'taskId': task.id });
    }).catch (err => { return done({'message':'Error copying task.'}); });
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

async function sendTasksDueNotifications (action, i) {
  var now = new Date(new Date().toISOString().split('T')[0]);
  var dateToCheck = i == 0 ? moment(new Date()).format('MM/DD/YYYY') : moment(new Date()).add(i, 'days').format('MM/DD/YYYY');

  await dao.Task.query(dao.query.tasksDueQuery, dateToCheck, 'assigned')
    .then(async (tasks) => {
      for (var i=0; i<tasks.length; i++) {
        var taskDetail = (await dao.Task.db.query(dao.query.tasksDueDetailQuery, tasks[i].id)).rows[0];
        var data = {
          action: action,
          model: {
            task: {
              id: tasks[i].id,
              title: tasks[i].title,
            },
            owner: {
              name: taskDetail.name,
              username: taskDetail.username,
            },
            volunteers: _.map((await dao.Task.db.query(dao.query.volunteerListQuery, tasks[i].id)).rows, 'username').join(', '),
          },
        };
        if (data.model.volunteers.length > 0) {
          notification.createNotification(data);
        }
      }
    });
}

module.exports = {
  findOne: findOne,
  findById: findById,
  list: list,
  commentsByTaskId: commentsByTaskId,
  createOpportunity: createOpportunity,
  updateOpportunityState: updateOpportunityState,
  updateOpportunity: updateOpportunity,
  publishTask: publishTask,
  copyOpportunity: copyOpportunity,
  deleteTask: deleteTask,
  getExportData: getExportData,
  volunteersCompleted: volunteersCompleted,
  sendTaskNotification: sendTaskNotification,
  sendTaskStateUpdateNotification: sendTaskStateUpdateNotification,
  sendTasksDueNotifications: sendTasksDueNotifications,
  canUpdateOpportunity: canUpdateOpportunity,
  canAdministerTask: canAdministerTask,
};
