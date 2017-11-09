const _ = require ('lodash');
const log = require('blue-ox')('app:comment:service');
const db = require('../../db');
const dao = require('./dao')(db);

async function addComment (attributes) {
  _.extend(attributes, {
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return await dao.Comment.insert(attributes);
}

async function deleteComment (id) {
  await dao.Comment.delete('id = ?', id).then(async (task) => {
    return id;
  }).catch(err => {
    log.info('delete: failed to delete task ', err);
    return false;
  });
}

module.exports = {
  addComment: addComment,
  deleteComment: deleteComment,
};