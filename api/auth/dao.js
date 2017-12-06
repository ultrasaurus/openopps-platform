const _ = require('lodash');
var dao = require('postgres-gen-dao');

const userQuery = 'select @m_user.*, @tags.* ' +
  'from @midas_user m_user ' +
  'left join tagentity_users__user_tags user_tags on user_tags.user_tags = m_user.id ' +
  'left join @tagentity tags on tags.id = user_tags.tagentity_users ' +
  'where m_user.disabled = false and m_user.id = ?';

const options = {
  user: {
    fetch: {
      tags: [],
    },
    exclude: {
      m_user: [ 'deletedAt', 'createdAt', 'updatedAt', 'passwordAttempts', 'disabled' ],
      tags: [ 'deletedAt', 'createdAt', 'updatedAt' ],
    },
  },
  badge: {
    exclude: [ 'deletedAt', 'createdAt', 'updatedAt' ],
  },
};

const clean = {
  user: function (user) {
    var cleaned = _.pickBy(user, _.identity);
    cleaned.tags = cleaned.tags.map(tag => {
      return _.pickBy(tag, _.identity);
    });
    cleaned.badges = cleaned.badges.map(badge => {
      return _.pickBy(badge, _.identity);
    });
    return cleaned;
  },
};

module.exports = function (db) {
  return {
    User: dao({ db: db, table: 'midas_user' }),
    UserPasswordReset: dao({ db: db, table: 'userpasswordreset' }),
    Passport: dao({ db: db, table: 'passport' }),
    UserTags: dao({ db: db, table: 'tagentity_users__user_tags' }),
    TagEntity: dao({ db: db, table: 'tagentity' }),
    Badge: dao({ db: db, table: 'badge'}),
    query: {
      user: userQuery,
    },
    options: options,
    clean: clean,
  };
};
