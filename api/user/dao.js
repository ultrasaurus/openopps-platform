const _ = require('lodash');
var dao = require('postgres-gen-dao');

const userQuery = "select @m_user.id, @m_user.name, @m_user.title, @tags.*" +
  "from @midas_user m_user " +
  "left join tagentity_users__user_tags user_tags on user_tags.user_tags = m_user.id " +
  "left join @tagentity tags on tags.id = user_tags.tagentity_users ";

const options = {
  user: {
    fetch: {
      tags: []
    },
    exclude: {
      tags: [ 'deletedAt', 'createdAt', 'updatedAt', 'data' ]
    }
  }
};

 const clean = {
  users: function(records) {
    return records.map(function(record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.tags = (cleaned.tags || []).map(function(tag) {
        return _.pickBy(tag, _.identity)
      });
      return cleaned;
    });
  }
}

 module.exports = function(db) {
  return {
    User: dao({ db: db, table: 'midas_user' }),
    TagEntity: dao({ db: db, table: 'tagentity' }),
    query: {
      user: userQuery
    },
    options: options,
    clean: clean
  };
};
