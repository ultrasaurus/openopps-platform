const _ = require('lodash');
const dao = require('postgres-gen-dao');

const userQuery = 'select @m_user.id, @m_user.name ' +
'from @midas_user m_user ' +
'order by "createdAt" desc ' +
'limit 10 ';

const taskQuery = 'select count(*) as count ' +
'from task ' +
'where state = ? ';

const options = {
  user: {
    fetch: { 
      id: '',
      name: '',
    },
  },
};

module.exports = function (db) {
  return {
    User: dao({ db: db, table: 'midas_user' }),
    Badge: dao({ db: db, table: 'badge'}),
    Task: dao({ db: db, table: 'task' }),
    query: {
      user: userQuery,
      task: taskQuery,
    },
    options: options,
  };
};