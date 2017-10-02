const _ = require('lodash');
const Badge = require('./dao');

const badgeExists = 'Badge already exists';
const tasksCompletedAwards = {
  1: 'newcomer',
  3: 'maker',
  5: 'game changer',
  10: 'disruptor',
  15: 'partner'
};

/**
 * make sure each users has no more than one badge of each type
 * @param badge must have { type: string, user: integer}
 */
function beforeCreate(badge) {
  return new Promise(function(resolve, reject) {
    Badge.findOne('type = $type and "user" = $user', badge).then(function() {
      reject(new Error(badgeExists));
    }).catch(function (err) {
      if(!_.isString(err)) {
        reject(err)
      } else {
        resolve();
      }
    });
  });
}

/**
 * if the badge was not explicitly set to be silent
 * send out a notification to the user
 * @param badge inserted badge object
 */
function afterCreate(badge) {
  return new Promise(function(resolve, reject) {
    if (badge.silent === true) {
      resolve({ badge: badge });
    } else {
      Badge.db.query('select username, name from midas_user where id = ?', badge.user).then(function(results) {
        var data = {
          user: results.rows[0],
          badge: {
            type: badge.type,
            description: badge.getDescription()
          }
        };

        Notification.create({
          action: 'badge.create.owner',
          model: data
        }).then(function() {
          resolve({ badge: badge });
        }, function(err) {
          resolve({ badge: badge, err: err});
        });
      }).catch(reject);
    }
  });
}

function save(badge) {
  return new Promise(function(resolve, reject) {
    beforeCreate(badge).then(function() {
      console.log('getting ready to insert badge');
      Badge.insert(badge).then(function(result) {
        afterCreate(result).then(resolve, reject);
      }).catch(reject);
    }, function(err) {
      resolve({err: err})
    });
  });
}

/**
 *
 * Determines if the completion of a task makes a
 * user eligible for a badge, and if so, awards
 * that badge to the user.
 * Takes an optional callback
 *
 * @param {object} task
 * @param {object} user
 * @param {object} opts - optional
 */
function awardForTaskCompletion(task, user, opts) {
  return new Promise(function(resolve, reject) {
    if (_.has(tasksCompletedAwards, user.completedTasks)) {
      console.log('Found badge type');
      var badge = {
        type: tasksCompletedAwards[user.completedTasks],
        user: user.id,
        task: task.id,
        silent: (opts && !_.isUndefined(opts.silent)) ? opts.silent : false,
        createdAt: Date(),
        updatedAt: Date()
      };
      save(badge).then(function(result) {
        if(result.err && result.err.message !== badgeExists) {
          reject(result.err)
        } else {
          resolve(result.badge ? [result.badge] : []);
        }
      }, reject);
    } else {
      // result is empty array for no badges!
      resolve([]);
    }
  });
}

/**
 *
 * Determines if the publishing of a task makes the
 * task creator eligible for a badge, and if so, awards
 * that badge to the user.
 * Takes an optional callback
 *
 * @param { Array } tasks
 * @param { Number } userId
 * @param { Object } opts - optional
 */
function awardForTaskPublish(tasks, userId, opts) {
  return new Promise(function(resolve, reject) {
    var badge   = { user: userId },
        counter = { ongoing: 0, oneTime: 0 },
        ongoingTaskId, oneTimeTaskId;
    // Check if the badge update should be occurring silently by checking the `opts`.
    badge.silent = ( opts && ! _.isUndefined( opts.silent ) ) ? opts.silent : false;

    // WHERE I LEFT OFF ON 09/29/17

    tasks.forEach(function(t) {
      var taskType = _.where(t.tags, { type: 'task-time-required' });
      if (taskType[0] && taskType[0].name) {
        if (taskType[0].name === 'One time') {
          counter.oneTime++;
          oneTimeTaskId = t.id;
        }
        else if (taskType[0].name === 'Ongoing') {
          counter.ongoing++;
          ongoingTaskId = t.id;
        }
      }
    });

    if (counter.ongoing === 1) {
      badge.type = 'mentor';
      badge.task = ongoingTaskId;
    }
    else if (counter.oneTime === 1) {
      badge.type = 'instigator';
      badge.task = oneTimeTaskId;
    }

    if (badge.type) {
      Badge.findOrCreate(badge, badge, function(err, b) {
        b = [b];
        // swallow a potential error (expected) that the badge
        // already exists
        if (err && err._e.toString().match('Badge already exists')) {
          err = null;
          b = [];
        } else {
          sails.log.verbose('awardForTaskPublish badge created (badge)', b)
        }
        if (err) sails.log.error(err);
        if (done) return done(err, b);
        return;
      });
    } else {
      // result is empty array for no badges!
      resolve([]);
    }
  });
}

module.exports = {
  find: Badge.find,
  findOne: Badge.findOne,
  awardForTaskCompletion: awardForTaskCompletion
};
