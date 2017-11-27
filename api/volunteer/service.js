const _ = require ('lodash');
const log = require('blue-ox')('app:volunteer:service');
const db = require('../../db');
const dao = require('./dao')(db);
const notification = require('../notification/service');

async function addVolunteer (attributes, done) {
  attributes.createdAt = new Date();
  attributes.updatedAt = new Date();
  await dao.Volunteer.insert(attributes).then(async (volunteer) => {
    return done(null, volunteer);
  }).catch(err => {
    log.info('create: failed to add volunteeer ', err);
    return done(err, null);
  });
}

async function deleteVolunteer (id, done) {
  var notificationInfo = (await dao.Volunteer.db.query(dao.query.volunteer, id)).rows;
  await dao.Volunteer.delete('id = ?', id).catch(err => {
    log.info('delete: failed to delete volunteeer ', err);
    return done(null, err);
  });
  return done(notificationInfo, null);
}

async function sendAddedVolunteerNotification (user, volunteer, action) {
  var notificationInfo = (await dao.Volunteer.db.query(dao.query.volunteer, volunteer.id)).rows;
  var data = {
    action: action,
    model: {
      task: { title: notificationInfo[0].title },
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
  sendAddedVolunteerNotification: sendAddedVolunteerNotification,
  sendDeletedVolunteerNotification: sendDeletedVolunteerNotification,
};
