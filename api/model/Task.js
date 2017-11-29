const _ = require('lodash');

module.exports = {
  create: (task) => {
    return _.extend({
      state: openopps.taskState || 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, task);
  },
  getOwnerId: function (task) {
    var id = (typeof task.owner === 'object') ? task.owner.id : task.owner;
    return id;
  },
  isOpen: function (task) {
    if (_.indexOf(['open', 'public', 'assigned'], task.state) != -1) {
      return true;
    }
    return false;
  },

  isClosed: function (task) {
    if (_.indexOf(['closed', 'archived', 'completed'], task.state) != -1) {
      return true;
    }
    return false;
  },

  // if user is given and is the owner, sets isOwner
  // returns task if public or user has special access
  // returns null if task should not be accessed based on given user
  authorized: function (task, user) {
    task.isOwner = false;
    // check if current user is owner
    if (user && (this.getOwnerId(task) == user.id)) {
      task.isOwner = true;
      return task;   // owners always have access
    }
    // admins always have access
    if (user && user.isAdmin) return task;

    // all states except draft and submitted are public
    if ((task.state !== 'draft') && (task.state !== 'submitted')) {
      return task;
    }
    // Default denied: return no task
    return null;
  },
};
