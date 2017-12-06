module.exports = {
  
  subject: 'Thanks for your interest in <%= task.title %>',
  to: '<%- user.username %>',
  cc: '<%- owner.username %>',
  data: function ( model, done ) {
    var data = {
      task: model.task,
      owner: model.owner,
      user: model.user,
    };
    done( null, data );
  },
};
