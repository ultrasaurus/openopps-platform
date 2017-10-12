const _ = require('lodash');
var dao = require('postgres-gen-dao');

const tagByType = 'select @tagentity.* from @tagentity tagentity where tagentity.type = ?';

const options = {
  tagByType: {
    exclude: {
      tagentity: [ 'deletedAt' ],
    },
  },
};

module.exports = function (db) {
  return {
    TagEntity: dao({ db: db, table: 'tagentity' }),
    query: {
      tagByType: tagByType,
    },
    options: options,
  };
};
