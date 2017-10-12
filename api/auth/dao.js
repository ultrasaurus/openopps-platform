const _ = require('lodash');
var dao = require('postgres-gen-dao');

const options = { };

const clean = { };

module.exports = function (db) {
  return {
    User: dao({ db: db, table: 'midas_user' }),
    Passport: dao({ db: db, table: 'passport' }),
    UserTags: dao({ db: db, table: 'tagentity_users__user_tags' }),
    query: { },
    options: options,
    clean: clean,
  };
};
