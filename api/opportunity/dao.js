const _ = require('lodash');
var dao = require('postgres-gen-dao');

const taskQuery = "select @task.*, @tags.*, @owner.id, @owner.name " +
  "from @task task " +
  "join @midas_user owner on owner.id = task.\"userId\"" +
  "left join tagentity_tasks__task_tags task_tags on task_tags.task_tags = task.id " +
  "left join @tagentity tags on tags.id = task_tags.tagentity_tasks ";

const userQuery = "select @midas_user.*, @agency.* " +
  "from @midas_user midas_user " +
  "join tagentity_users__user_tags user_tags on user_tags.user_tags = midas_user.id " +
  "join @tagentity agency on agency.id = user_tags.tagentity_users " +
  "where agency.type = 'agency'";

const volunteerQuery = "select volunteer.id, volunteer.\"userId\", midas_user.name " +
  "from volunteer " +
  "join midas_user on midas_user.id = volunteer.\"userId\" " +
  "where volunteer.\"taskId\" = ?";

const commentsQuery = "select @comment.*, @user.* " +
  "from @comment comment " +
  "join @midas_user \"user\" on \"user\".id = comment.\"userId\" " +
  "where comment.\"taskId\" = ?";

const options = {
   task: {
    fetch: {
      owner: '',
      tags: []
    },
    exclude: {
      task: [ 'deletedAt' ],
      tags: [ 'deletedAt' ]
    }
  },
  user: {
    fetch: { agency: '' },
    exclude: {
      midas_user: [ 'deletedAt', 'passwordAttempts', 'isAdmin', 'isAgencyAdmin', 'disabled' ],
      agency: [ 'deletedAt' ]
    }
  },
  comment: {
    fetch: {
      user: ''
    },
    exclude: {
      comment: [ 'deletedAt' ],
      user: [
        'title', 'bio', 'photoId', 'isAdmin', 'disabled', 'passwordAttempts',
        'createdAt', 'updatedAt', 'deletedAt', 'completedTasks', 'isAgencyAdmin'
      ]
    }
  }
};

const clean = {
  task: function(record) {
    var cleaned = _.pickBy(record, _.identity)
    cleaned.tags = cleaned.tags.map(function(tag) { return _.pickBy(tag, _.identity); });
    if(!_.isEmpty(cleaned.restrict)) {
      cleaned.restrict = JSON.parse(cleaned.restrict);
    }
    return cleaned;
  },
  user: function(record) {
    var cleaned = _.pickBy(record, _.identity)
    cleaned.agency = _.pickBy(cleaned.agency, _.identity)
    return cleaned;
  },
  comments: function(records) {
    return records.map(function(record) {
      var cleaned = _.pickBy(record, _.identity);
      cleaned.user = _.pickBy(cleaned.user, _.identity);
      return cleaned;
    });
  }
}

module.exports = function(db) {
  return {
    Task: dao({ db: db, table: 'task' }),
    User: dao({ db: db, table: 'midas_user' }),
    TagEntity: dao({ db: db, table: 'tagentity' }),
    Volunteer: dao({ db: db, table: 'volunteer' }),
    Comment: dao({ db: db, table: 'comment' }),
    query: {
      task: taskQuery,
      user: userQuery,
      volunteer: volunteerQuery,
      comments: commentsQuery
    },
    options: options,
    clean: clean
  };
};
