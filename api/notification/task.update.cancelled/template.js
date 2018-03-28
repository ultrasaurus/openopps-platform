module.exports = {
  subject: 'Opportunity has been canceled',
  to: '<%- users %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      owner: model.owner,
      volunteers: model.volunteers,
    };
    done(null, data);
  },
  includes:[
    'task.update.canceled',
  ],
};