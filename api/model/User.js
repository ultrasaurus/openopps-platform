const _ = require('lodash');

module.exports = {
  create: (user) => {
    return _.extend({
      isAdmin: false,
      isAgencyAdmin: false,
      disabled: false,
      passwordAttempts: 0,
      completedTasks: 0,
    }, user);
  },
};
