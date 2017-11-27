module.exports = {
  subject: 'New Opportunity Submission',
  to: '<%= user.username %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
    };
    done(null, data);
  },
};
  