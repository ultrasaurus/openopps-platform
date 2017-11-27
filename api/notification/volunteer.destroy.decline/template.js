module.exports = {
  subject: 'An update on <%- task.title %>',
  to: '<%- user.username %>',
  cc: '<%- owner.username %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
      owner: model.owner,
    };
    done(null, data);
  },
};
