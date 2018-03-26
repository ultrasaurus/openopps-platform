module.exports = {
  subject: 'Your opportunity is complete — thank you!',
  to: '<%- volunteers %>',
  data: function (model, done) {
    var data = {
      task: model.task,
      owner: model.owner,
      volunteers: model.volunteers,
      survey: openopps.survey,
    };
    done(null, data);
  },
};
