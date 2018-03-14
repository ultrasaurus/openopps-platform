module.exports = {
  subject: 'Application withdrawn',
  to: '<%- owner.username %>',
  cc: '',
  data: function (model, done) {
    var data = {
      task: model.task,
      user: model.user,
      owner: model.owner,
    };
    done(null, data);
  },
};
