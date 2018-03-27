module.exports = {
  subject: 'You’ve been selected for <%- task.title %>!',
  to: '<%- user.username %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
    };
    done(null, data);
  },
};
