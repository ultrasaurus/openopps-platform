module.exports = {
  subject: 'New opportunity submitted by a task creator',
  to: '<%- admin.username %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
      admin: model.admin,
    };
    done(null, data);
  },
  includes:[
    'task.create.thanks',
  ],
};