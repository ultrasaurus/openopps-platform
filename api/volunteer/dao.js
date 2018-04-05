const _ = require('lodash');
const dao = require('postgres-gen-dao');

const volunteerQuery = 'select ' +
'task.id, task.title, volunteer."userId", midas_user.name as ownername, midas_user.bounced as bounced, ' +
'midas_user.username as ownerusername, m2.name as name, m2.username as username ' +
'from volunteer inner join task on volunteer."taskId" = task.id ' +
'inner join midas_user on midas_user.id = task."userId" ' +
'inner join midas_user m2 on m2.id = volunteer."userId" ' +
'where volunteer.id = ? ';

const lookupVolunteerQuery = 'select volunteer.id ' +
'from volunteer ' +
'join midas_user on midas_user.id = volunteer."userId" ' +
'where midas_user.id = ? and volunteer."taskId" = ? ';

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
      lookupVolunteer: lookupVolunteerQuery,
      user: userAgencyQuery,
    },
  };
};
