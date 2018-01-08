module.exports = {
  subject: '"<%- task.title %>" has a new comment on <%= globals.systemName %>',
  to: '<%- owner.username %>',
  data: function (model, done) {
    var data = {
      comment: model.comment,
      commenter: model.commenter,
      task: model.task,
      owner: model.owner,
    };
    done( null, data );
  },
};
  