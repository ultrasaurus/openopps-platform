const _ = require ('lodash');
const log = use('log')('app:comment:service');
const db = require('../../db');
const dao = require('./dao')(db);
const notification = require('../notification/service');
const Comment = require('../model/Comment');

async function addComment (attributes, done) {
  // var errors = await Comment.validateComment(attributes);
  // if (!_.isEmpty(errors.invalidAttributes)) {
  //   return done(errors, null);
  // }
  _.extend(attributes, {
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return done(null, await dao.Comment.insert(attributes));
}

async function deleteComment (id) {
  await dao.Comment.delete('id = ?', id).then(async (task) => {
    return id;
  }).catch(err => {
    log.info('delete: failed to delete task ', err);
    return false;
  });
}

async function sendCommentNotification (user, comment, action) {
  var notificationData = (await dao.Comment.db.query(dao.query.commentQuery, comment.id)).rows;
  var data = {
    action: action,
    model: {
      comment: { id: notificationData[0].commentid, value: notificationData[0].value },
      commenter: { id: user.id, name: user.name },
      task: { id: notificationData[0].taskid, title: notificationData[0].tasktitle},
      owner: { name: notificationData[0].ownername, username: notificationData[0].ownerusername },
    },
  };
  notification.createNotification(data);
}

module.exports = {
  addComment: addComment,
  deleteComment: deleteComment,
  sendCommentNotification: sendCommentNotification, 
};
