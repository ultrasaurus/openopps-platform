const db = require('../../db');
const dao = require('./dao')(db);

async function findOne(id) {
    return await dao.File.findOne('"userId" = ?', id);
}
  
module.exports = {
list: list,
findOne: findOne
};