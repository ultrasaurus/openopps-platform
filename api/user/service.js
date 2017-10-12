const db = require('../../db');
const dao = require('./dao')(db);

async function list () {
  return dao.clean.users(await dao.User.query(dao.query.user, {}, dao.options.user));
}

async function findOne (id) {
  return await dao.User.findOne('id = ?', id);
}

async function findOneByUsername (username, done) {
  await dao.User.find('username = ?', username).then(users => {
    done(null, users[0]);
  }).catch(err => {
    done(err);
  });
}

async function getProfile (id) {
  var profile = await findOne(id);
  profile.badges = await dao.Badge.find('"user" = ?', id);
  profile.tags = (await dao.TagEntity.db.query(dao.query.tag, id)).rows;
  return dao.clean.profile(profile);
}

async function getActivities (id) {
  return {
    tasks: {
      created: dao.clean.activity(await dao.Task.find('"userId" = ?', id)),
      volunteered: (await dao.Task.db.query(dao.query.completed, id)).rows,
    },
  };
}

module.exports = {
  list: list,
  findOne: findOne,
  findOneByUsername: findOneByUsername,
  getProfile: getProfile,
  getActivities: getActivities,
};
