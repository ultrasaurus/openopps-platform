const _ = require('lodash');

const AuditTypes = {
  'TASK_CHANGE_OWNER': {
    action: 'TASK_CHANGE_OWNER',
    description: 'Ownership of a task is transferred from one user to another user.',
    data: ['taskId', 'originalOwner', 'newOwner'],
  },
};

function getRole (user) {
  return user.isAdmin ?
    'Admin' : user.isAgencyAdmin ? 
      'Agency Admin' : 'General User';
}

module.exports = {
  createAudit: (type, user, auditData) => {
    var audit = _.cloneDeep(AuditTypes[type]);
    audit.userId = user.id;
    audit.role = getRole(user);
    audit.dateInserted = new Date();
    audit.data = _.reduce(audit.data, (result, key) => {
      result[key] = auditData[key];
      return result;
    }, {});
    return audit;
  },
};