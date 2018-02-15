const _ = require('lodash');
const dao = require('postgres-gen-dao');

const volunteerQuery = 'select task.id, task.title, midas_user.username ownername, m2.name toname, m2.username tousername ' +
'from volunteer inner join task on volunteer."taskId" = task.id ' +
'inner join midas_user on midas_user.id = task."userId" ' +
'inner join midas_user m2 on m2.id = volunteer."userId" ' +
'where volunteer.id = ? ';

const userAgencyQuery = 'select tagentity.name, midas_user."isAdmin" ' +
'from midas_user inner join tagentity_users__user_tags on midas_user.id = tagentity_users__user_tags.user_tags ' +
'inner join tagentity tagentity on tagentity.id = tagentity_users__user_tags.tagentity_users ' +
'where midas_user.id = ? ' +
"and tagentity.type = 'agency' ";


module.exports = function (db) {
  return {
    Task: dao({ db: db, table: 'task' }),
    Volunteer: dao({ db: db, table: 'volunteer' }),
    query: {
      volunteer: volunteerQuery,
      user: userAgencyQuery,
    },
  };
};
