const _ = require('lodash');
var dao = require('postgres-gen-dao');

const userQuery = 'select @m_user.id, @m_user.name, @m_user.title, @tags.* ' +
  'from @midas_user m_user ' +
  'left join tagentity_users__user_tags user_tags on user_tags.user_tags = m_user.id ' +
  'left join @tagentity tags on tags.id = user_tags.tagentity_users ';

const tagQuery = 'select tags.* ' +
  'from tagentity tags ' +
  'inner join tagentity_users__user_tags user_tags on tags.id = user_tags.tagentity_users ' +
  'where user_tags.user_tags = ?';

const taskCompletedQuery = 'select task.* ' +
  'from task join volunteer on task.id = volunteer."taskId" ' +
  'where volunteer."userId" = ?';

const options = {
  user: {
    fetch: {
      tags: [],
    },
    exclude: {
      tags: [ 'deletedAt', 'createdAt', 'updatedAt', 'data' ],
    },
  },
  profile: {
    fetch: {
      badges: [],
      tags: [],
    },
    exclude: {
      m_user: [ 'deletedAt', 'passwordAttempts', 'isAdmin', 'isAgencyAdmin', 'disabled' ],
      tags: [ 'deletedAt', 'createdAt', 'updatedAt' ],
    },
  },
  activity: {
    tasks: {
      fetch: {
        created: [],
        volunteered: [],
      },
    },
  },
};

const clean = {
  users: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.tags = (cleaned.tags || []).map(function (tag) {
        return _.pickBy(tag, _.identity);
      });
      return cleaned;
    });
  },
  profile: function (record) {
    var cleaned = _.pickBy(record, _.identity);
    cleaned.badges = (cleaned.badges || []).map(function (badge) {
      return _.pickBy(badge, _.identity);
    });
    cleaned.tags = (cleaned.tags || []).map(function (tag) {
      return _.pickBy(tag, _.identity);
    });
    return cleaned;
  },
  activity: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.owner = cleaned.userId;
      if(!_.isEmpty(cleaned.restrict)) {
        cleaned.restrict = JSON.parse(cleaned.restrict);
      }
      return cleaned;
    });
  },
};

module.exports = function (db) {
  return {
    User: dao({ db: db, table: 'midas_user' }),
    TagEntity: dao({ db: db, table: 'tagentity' }),
    Badge: dao({ db: db, table: 'badge'}),
    Task: dao({ db: db, table: 'task' }),
    query: {
      user: userQuery,
      tag: tagQuery,
      completed: taskCompletedQuery,
    },
    options: options,
    clean: clean,
  };
};
