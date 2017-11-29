const _ = require('lodash');

module.exports = {
  create: (user) => {
    if(_.isArray(user)) {
      return user.map((u) => { return create(u); });
    }
    return _.extend({
      isAdmin: false,
      isAgencyAdmin: false,
      disabled: false,
      passwordAttempts: 0,
      completedTasks: 0,
    }, user);
  },
};
