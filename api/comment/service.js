const _ = require ('lodash');
const log = require('blue-ox')('app:comment:service');
const db = require('../../db');
const dao = require('./dao')(db);

async function addComment (attributes) {
    _.extend(attributes, {
        createdAt: new Date(),
        updatedAt: new Date(),
    });
    return await dao.Comment.insert(attributes);
}

module.exports = {
    addComment: addComment,
};