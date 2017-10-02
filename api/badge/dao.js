var _ = require('lodash');
var db = require('../../db');
var dao = require('postgres-gen-dao')

var badgeDescriptions = {
  // should be able to follow "You are awared this badge because you "
  // for email notifications

  // <type: description>
  'newcomer': 'have completed your first task.',
  'maker': 'have completed three tasks.',
  'game changer': 'have completed five tasks.',
  'disruptor': 'have completed ten tasks.',
  'partner': 'have completed fifteen tasks.',
  'mentor': 'have created your first ongoing task.',
  'instigator': 'have created your first one-time task.',
  'team builder': 'have accepted at least four people on a task.',

  // the badges below have yet to be implemented
  'local': 'have completed 2 tasks for one agency.',
  'explorer': 'have completed a task for your second agency.',
  'connector': 'have completed a task for your third agency.',
};

var getDescription = function() {
  return badgeDescriptions[this.type];
}

module.exports = dao({
  db: db,
  table: 'badge',
  prototype: {
    description: getDescription
  }
});
