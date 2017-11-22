const _ = require('lodash');
const Badge = require('./dao');

const badgeExists = 'Badge already exists';
const tasksCompletedAwards = {
  1: 'newcomer',
  3: 'maker',
  5: 'game changer',
  10: 'disruptor',
  15: 'partner',
};

/**
 * if the badge was not explicitly set to be silent
 * send out a notification to the user
 * @param { Object } badge inserted badge object
 */
function afterCreate (badge) {
  return new Promise(function (resolve, reject) {
    if (badge.silent === true) {
      resolve({ badge: badge });
    } else {
      Badge.db.query('select username, name from midas_user where id = ?', badge.user).then(function (results) {
        var data = {
          user: results.rows[0],
          badge: {
            type: badge.type,
            description: badge.getDescription(),
          },
        };

        // TODO: Send notification
        resolve({ badge: badge });
        // Notification.create({
        //   action: 'badge.create.owner',
        //   model: data,
        // }).then(function () {
        //   resolve({ badge: badge });
        // }, function (err) {
        //   resolve({ badge: badge, err: err});
        // });
      }).catch(reject);
    }
  });
}

function save (badge) {
  return new Promise(function (resolve, reject) {
    Badge.find('type = $type and "user" = $user', badge).then((result) => {
      if(result) {
        resolve({ badge: result[0] });
      } else {
        Badge.insert(badge).then(function (result) {
          afterCreate(result).then(resolve, reject);
        }).catch(reject);
      }
    }, (err) => {
      reject(err);
    });
  });
}

/**
 *
 * Determines if the completion of a task makes a
 * user eligible for a badge, and if so, awards
 * that badge to the user.
 *
 * @param { Object } task
 * @param { Object } user
 * @param { object } opts - optional
 */
function awardForTaskCompletion (task, user, opts) {
  if (_.has(tasksCompletedAwards, user.completedTasks)) {
    return {
      type: tasksCompletedAwards[user.completedTasks],
      user: user.id,
      task: task.id,
      silent: (opts && !_.isUndefined(opts.silent)) ? opts.silent : false,
      createdAt: Date(),
      updatedAt: Date(),
    };
  } else {
    return null;
  }
}

/**
 *
 * Determines if the publishing of a task makes the
 * task creator eligible for a badge, and if so, awards
 * that badge to the user.
 *
 * @param { Object } task
 * @param { Number } userId
 * @param { Object } opts - optional
 */
function awardForTaskPublish (task, userId, opts) {
  var badge = {
    user: userId,
    task: task.id,
    silent: ( opts && ! _.isUndefined( opts.silent ) ) ? opts.silent : false,
    createdAt: Date(),
    updatedAt: Date(),
  };

  var taskType = _.find(task.tags, { type: 'task-time-required' });
  if (taskType && taskType.name) {
    if (taskType.name === 'One time') {
      badge.type = 'instigator';
    }
    else if (taskType.name === 'Ongoing') {
      badge.type = 'mentor';
    }
  }

  return badge.type ? badge : null;
}

module.exports = {
  find: Badge.find,
  findOne: Badge.findOne,
  save: save,
  awardForTaskCompletion: awardForTaskCompletion,
  awardForTaskPublish: awardForTaskPublish,
};
