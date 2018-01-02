const _ = require ('lodash');
const log = require('blue-ox')('app:volunteer:service');
const db = require('../../db');
const dao = require('./dao')(db);
const notification = require('../notification/service');

async function addVolunteer (attributes, done) {
  var volunteer = await dao.Volunteer.find('"taskId" = ? and "userId" = ?', attributes.taskId, attributes.userId);
  if (volunteer.length == 0) {
    attributes.createdAt = new Date();
    attributes.updatedAt = new Date();
    await dao.Volunteer.insert(attributes).then(async (volunteer) => {
      return done(null, volunteer);
    }).catch(err => {
      log.info('create: failed to add volunteeer ', err);
      return done({'message':'error adding volunteer'}, null);
    });
  } else {
    volunteer[0].silent = 'true';
    return done(null, volunteer[0]);
  }
}

async function deleteVolunteer (vId, taskId, done) {
  var notificationInfo = (await dao.Volunteer.db.query(dao.query.volunteer, vId)).rows;
  await dao.Volunteer.delete('id = ? and "taskId" = ?', vId, taskId).catch(err => {
    log.info('delete: failed to delete volunteeer ', err);
    return done(null, {'message':'error deleting volunteer'});
  });
  return done(notificationInfo, null);
}

async function canAddVolunteer (attributes, user) {
  if (typeof attributes.userId !== 'undefined' && !user.isAdmin) {
    return false;
  }
  return true;
}

async function canRemoveVolunteer (id, user) {
  var task = await dao.Task.findOne('id = ?', id).catch(() => { return null; });
  return task && (task.userId === user.id || user.isAdmin || (user.isAgencyAdmin && await checkAgency(user, task.userId)));
}

async function checkAgency (user, ownerId) {
  var owner = (await dao.Task.db.query(dao.query.user, ownerId)).rows[0];
  if (owner && owner.agency) {
    return user.tags ? _.find(user.tags, { 'type': 'agency' }).name == owner.agency.name : false;
  }
  return false;
}

async function sendAddedVolunteerNotification (user, volunteer, action) {
  var notificationInfo = (await dao.Volunteer.db.query(dao.query.volunteer, volunteer.id)).rows;
  var data = {
    action: action,
    model: {
      task: { id: notificationInfo[0].id, title: notificationInfo[0].title },
      owner: { username: notificationInfo[0].ownername },
      user: user,
    },
  };
  notification.createNotification(data);
}

async function sendDeletedVolunteerNotification (notificationInfo, action) {
  var data = {
    action: action,
    model: {
      task: { title: notificationInfo.title },
      owner: { username: notificationInfo.ownername },
      user: { name: notificationInfo.toname, username: notificationInfo.tousername},
    },
  };
  notification.createNotification(data);
}

module.exports = {
  addVolunteer: addVolunteer,
  deleteVolunteer: deleteVolunteer,
  canAddVolunteer: canAddVolunteer,
  canRemoveVolunteer: canRemoveVolunteer,
  sendAddedVolunteerNotification: sendAddedVolunteerNotification,
  sendDeletedVolunteerNotification: sendDeletedVolunteerNotification,
};
