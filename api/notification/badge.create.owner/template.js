module.exports = {
  subject: 'You earned a new badge',
  to: '<%= user.username %>',
  data: function (data, done) {
    done(null, data);
  },
};
