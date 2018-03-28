module.exports = {
  subject: 'New opportunity submitted by a task creator',
  to: '<%- admins %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      owner: model.owner,
      volunteers: model.volunteers,
    };
    done(null, data);
  },
  includes:[
    'task.create.thanks',
  ],
};