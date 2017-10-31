const _ = require('lodash');
const dao = require('postgres-gen-dao');

const userQuery = 'select @m_user.id, @m_user.name ' +
'from @midas_user m_user ' +
'order by "createdAt" desc ' +
'limit 10 ';

const taskQuery = 'select count(*) as count ' +
'from task ' +
'where state = ? ';

const taskHistoryQuery = 'select @task.* ' +
'from @task task ' +
'where state = ? ' +
'order by task."createdAt" desc ' +
'limit 30 ';

const participantsQuery = 'select @m_user.* ' +
'from @midas_user m_user left join volunteer on m_user.id = volunteer."userId" ' +
'where volunteer."taskId" = ? ';

const badgeQuery = 'select badge.*, @user.* ' +
'from badge inner join @midas_user "user" on badge.user = "user".id ' +
'where badge.task = ? ';

var badgeDescriptions = {
  'newcomer': 'have completed your first task.',
  'maker': 'have completed three tasks.',
  'game changer': 'have completed five tasks.',
  'disruptor': 'have completed ten tasks.',
  'partner': 'have completed fifteen tasks.',
  'mentor': 'have created your first ongoing task.',
  'instigator': 'have created your first one-time task.',
  'team builder': 'have accepted at least four people on a task.',
  'local': 'have completed 2 tasks for one agency.',
  'explorer': 'have completed a task for your second agency.',
  'connector': 'have completed a task for your third agency.',
};

const options = {
  user: {
    fetch: { 
      id: '',
      name: '',
    },
  },
  taskHistory: {
    exclude: {
      task: [ 'createdAt', 'state', 'description', 'assignedAt', 'completedAt', 'completedBy', 'publishedAt', 'submittedAt', 'updatedAt' ],
    },
  },
  badge: {
    fetch: {
      user: '',
    },
    exclude: {
      user: [ 'bio', 'completedTasks', 'passwordAttempts', 'createdAt', 'disabled', 'isAdmin', 'isAgencyAdmin', 'updatedAt', 'username' ],
    },
  },
  participants: {
    exclude: {
      m_user: [ 'bio', 'completedTasks', 'passwordAttempts', 'createdAt', 'disabled', 'isAdmin', 'isAgencyAdmin', 'updatedAt', 'username' ],
    },
  },
};

const clean = {
  taskHistory: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.owner = cleaned.userId;
      delete(cleaned.userId);
      if(!_.isEmpty(cleaned.restrict)) {
        cleaned.restrict = JSON.parse(cleaned.restrict);
      }
      return cleaned;
    });
  },
  badge: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.description = badgeDescriptions[record.type];
      return cleaned;
    });
  },
};

module.exports = function (db) {
  return {
    User: dao({ db: db, table: 'midas_user' }),
    Badge: dao({ db: db, table: 'badge'}),
    Task: dao({ db: db, table: 'task' }),
    query: {
      user: userQuery,
      task: taskQuery,
      taskHistoryQuery: taskHistoryQuery,
      participantsQuery: participantsQuery,
      badgeQuery: badgeQuery,
    },
    options: options,
    clean: clean,
  };
};