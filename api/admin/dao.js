const _ = require('lodash');
const dao = require('postgres-gen-dao');

const taskQuery = 'select count(*) as count from task ';

const taskStateQuery = 'select state from task ';

const volunteerQuery = 'select count(*) as count from task where exists (select 1 from volunteer where task.id = volunteer."taskId") ';

const userQuery = 'select count(*) from midas_user where disabled = ? ';

const withTasksQuery = 'select count(distinct "userId") from task ';

const taskHistoryQuery = 'select "assignedAt", "completedAt", "createdAt", "publishedAt", "submittedAt" from task' ;

const postQuery = 'select count(*) from comment ';

const volunteerCountQuery = 'select count(*) from volunteer ';

const userListQuery = 'select midas_user.*, count(*) over() as full_count ' +
  'from midas_user ' +
  'order by "createdAt" desc ' +
  'limit 25 ' +
  'offset ((? - 1) * 25) ';

const userAgencyListQuery = 'select midas_user.*, count(*) over() as full_count ' +
  'from midas_user inner join tagentity_users__user_tags tags on midas_user.id = tags.user_tags ' +
  'inner join tagentity tag on tags.tagentity_users = tag.id ' +
  "where tag.type = 'agency' and lower(data->>'abbr') = ? " +
  'order by "createdAt" desc ' +
  'limit 25 ' +
  'offset ((? - 1) * 25) ';

const userListFilteredQuery = 'select midas_user.*, count(*) over() as full_count ' +
  'from midas_user ' +
  'where lower(username) like ? or lower(name) like ? ' +
  'order by "createdAt" desc ' +
  'limit 25 ' +
  'offset ((? - 1) * 25) ';

const userAgencyListFilteredQuery = 'select midas_user.*, count(*) over() as full_count ' +
  'from midas_user inner join tagentity_users__user_tags tags on midas_user.id = tags.user_tags ' +
  'inner join tagentity tag on tags.tagentity_users = tag.id ' +
  "where (lower(username) like ? or lower(midas_user.name) like ?) and tag.type = 'agency' and lower(data->>'abbr') = ? " +
  'order by "createdAt" desc ' +
  'limit 25 ' +
  'offset ((? - 1) * 25) ';

const userTaskState = 'select state from task where "userId" = ? ';

const participantTaskState = 'select task.state from task inner join volunteer on volunteer."taskId" = task.id where volunteer."userId" = ? ';

const exportUserData = 'select m_user.id, m_user.name, m_user.username, m_user.title, ' +
  'm_user.bio, m_user."isAdmin", m_user.disabled, ' +
  '(' +
    'select tagentity.name ' +
    'from tagentity_users__user_tags left join tagentity on tagentity_users__user_tags.tagentity_users = tagentity.id ' +
    "where tagentity_users__user_tags.user_tags = m_user.id and type = 'location' " +
    'limit 1' +
  ') as location, ' +
  '(' +
    'select tagentity.name ' +
    'from tagentity_users__user_tags left join tagentity on tagentity_users__user_tags.tagentity_users = tagentity.id ' +
    "where tagentity_users__user_tags.user_tags = m_user.id and type = 'agency' " +
    'limit 1' +
  ') as agency ' +
  'from midas_user m_user ';

const taskStateUserQuery = 'select @task.*, @owner.*, @volunteers.* ' +
  'from @task task inner join @midas_user owner on task."userId" = owner.id ' +
  'left join volunteer on volunteer."taskId" = task.id ' +
  'left join @midas_user volunteers on volunteers.id = volunteer."userId" ' +
  'where task.state = ? ';

const taskAgencyStateUserQuery = 'select @task.*, @owner.*, @volunteers.* ' +
  'from @task task inner join @midas_user owner on task."userId" = owner.id ' +
  'left join volunteer on volunteer."taskId" = task.id ' +
  'left join @midas_user volunteers on volunteers.id = volunteer."userId" ' +
  'left join tagentity_users__user_tags tags on owner.id = tags.user_tags ' +
  'left join tagentity tag on tags.tagentity_users = tag.id ' +
  "where task.state = ? and lower(data->>'abbr') = ? ";

var exportFormat = {
  'user_id': 'id',
  'name': {field: 'name', filter: nullToEmptyString},
  'username': {field: 'username', filter: nullToEmptyString},
  'title': {field: 'title', filter: nullToEmptyString},
  'agency': {field: 'agency', filter: nullToEmptyString},
  'location': {field: 'location', filter: nullToEmptyString},
  'bio': {field: 'bio', filter: nullToEmptyString},
  'admin': 'isAdmin',
  'disabled': 'disabled',
};

function nullToEmptyString (str) {
  return str ? str : '';
}

const options = {
  task: {
    fetch: {
      owner: '',
      volunteers: [],
    },
    exclude: {
      task: [ 'projectId', 'description', 'userId', 'createdAt', 'updatedAt', 'deletedAt', 'publishedAt', 'assignedAt',
        'completedAt', 'completedBy', 'submittedAt', 'restrict' ],
      owner: [ 'username', 'title', 'bio', 'photoId', 'photoUrl', 'isAdmin', 'disabled', 'passwordAttempts', 
        'createdAt', 'updatedAt', 'deletedAt', 'completedTasks', 'isAgencyAdmin' ],
      volunteers: [ 'username', 'title', 'bio', 'photoId', 'photoUrl', 'isAdmin', 'disabled', 'passwordAttempts', 
        'createdAt', 'updatedAt', 'deletedAt', 'completedTasks', 'isAgencyAdmin' ],
    },
  },
};

const clean = {
  task: function (records) {
    return records.map(function (record) {
      var cleaned = _.pickBy(record, _.identity);
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
    Task: dao({ db: db, table: 'task' }),
    Volunteer: dao({ db: db, table: 'volunteer' }),
    TagEntity: dao({ db: db, table: 'tagentity' }),
    query: {
      taskQuery: taskQuery,
      taskStateQuery: taskStateQuery,
      volunteerQuery: volunteerQuery,
      userQuery: userQuery,
      withTasksQuery: withTasksQuery,
      taskHistoryQuery: taskHistoryQuery,
      postQuery: postQuery,
      volunteerCountQuery: volunteerCountQuery,
      userListQuery: userListQuery,
      userAgencyListQuery: userAgencyListQuery,
      userListFilteredQuery: userListFilteredQuery,
      userAgencyListFilteredQuery: userAgencyListFilteredQuery,
      userTaskState: userTaskState,
      participantTaskState: participantTaskState,
      exportUserData: exportUserData,
      taskStateUserQuery: taskStateUserQuery,
      taskAgencyStateUserQuery: taskAgencyStateUserQuery,
    },
    clean: clean,
    options: options,
    exportFormat: exportFormat,
  };
};