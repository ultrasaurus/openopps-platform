const _ = require ('lodash');
const log = require('blue-ox')('app:volunteer:service');
const db = require('../../db');
const dao = require('./dao')(db);

async function addVolunteer (attributes, done) {
  attributes.createdAt = new Date();
  attributes.updatedAt = new Date();
  await dao.Volunteer.insert(attributes).then(async (volunteer) => {
    return done(volunteer);
  }).catch(err => {
    log.info('create: failed to add volunteeer ', err);
    return done(true);
  });
}

async function deleteVolunteer (id, done) {
  await dao.Volunteer.delete('id = ?', id).catch(err => {
    log.info('delete: failed to delete volunteeer ', err);
    return done(true);
  });
}

module.exports = {
  addVolunteer: addVolunteer,
  deleteVolunteer: deleteVolunteer,
};
