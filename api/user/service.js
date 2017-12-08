const db = require('../../db');
const dao = require('./dao')(db);
const log = require('blue-ox')('app:user:service');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const User = require('../model/User');

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

async function isUsernameUsed (id, username) {
  return await dao.User.find('id != ? and username = ?', id, username);
}

async function getProfile (id) {
  var profile = await findOne(id);
  profile.badges = dao.clean.badge(await dao.Badge.find('"user" = ?', id));
  profile.tags = (await dao.TagEntity.db.query(dao.query.tag, id)).rows;
  return dao.clean.profile(profile);
}

async function populateBadgeDescriptions (user) {
  user.badges = dao.clean.badge(user.badges);
  return user;
}

async function getActivities (id) {
  return {
    tasks: {
      created: dao.clean.activity(await dao.Task.find('"userId" = ?', id)),
      volunteered: (await dao.Task.db.query(dao.query.completed, id)).rows,
    },
  };
}

async function updateProfile (attributes, done) {
  var errors = await User.validateUser(attributes, isUsernameUsed);
  if (!_.isEmpty(errors.invalidAttributes)) {
    return done(errors);
  }
  attributes.updatedAt = new Date();
  await dao.User.update(attributes).then(async () => {
    await dao.UserTags.db.query(dao.query.deleteUserTags, attributes.id)
      .then(async () => {
        (attributes.tags || attributes['tags[]'] || []).map(async (tag) => {
          if(_.isNumber(tag)) {
            await dao.UserTags.insert({ tagentity_users: tag, user_tags: attributes.id }).catch(err => {
              log.info('update user: failed to create tag ', attributes.username, tag, err);
            });
          } else {
            _.extend(tag, { 'createdAt': new Date(), 'updatedAt': new Date() });
            await dao.TagEntity.insert(tag).then(async (t) => {
              await dao.UserTags.insert({ tagentity_users: t.id, user_tags: attributes.id }).catch(err => {
                log.info('update user: failed to create tag ', attributes.username, tag, err);
              });
            }).catch(err => {
              log.info('update user: failed to create tag ', attributes.username, tag, err);
            });
          }
        });
        return done(null);
      }).catch (err => { return done(err); });
  }).catch (err => { return done(err); });
}

async function validateProfile (attributes) {
  var usernameUsed = await isUsernameUsed(attributes.id, attributes.username);
  if (usernameUsed.length > 0) {
    return 'A record with that `username` already exists (' + attributes.username + ').';
  }
  if (attributes.name.match(/[<>]/g)) {
    return 'Name must not contain the special characters < or >';
  }
  if (attributes.title.match(/[<>]/g)) {
    return 'Title must not contain the special characters < or >';
  }
  return null;
}

async function updatePassword (attributes) {
  attributes.password = await bcrypt.hash(attributes.password, 10);
  attributes.id = (await dao.Passport.find('"user" = ?', attributes.id))[0].id;
  await dao.Passport.update(attributes);
  return true;
}

module.exports = {
  list: list,
  findOne: findOne,
  findOneByUsername: findOneByUsername,
  getProfile: getProfile,
  populateBadgeDescriptions: populateBadgeDescriptions,
  getActivities: getActivities,
  updateProfile: updateProfile,
  updatePassword: updatePassword,
};
