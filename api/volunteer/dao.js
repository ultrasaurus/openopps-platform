const _ = require('lodash');
const dao = require('postgres-gen-dao');

const volunteerQuery = 'select task.title, midas_user.username ownername, m2.name toname, m2.username tousername ' +
'from volunteer inner join task on volunteer."taskId" = task.id ' +
'inner join midas_user on midas_user.id = task."userId" ' +
'inner join midas_user m2 on m2.id = volunteer."userId" ' +
'where volunteer.id = ? ';

module.exports = function (db) {
  return {
    Volunteer: dao({ db: db, table: 'volunteer' }),
    query: {
      volunteer: volunteerQuery,
    },
  };
};