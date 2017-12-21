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

function processUserTags (user, tags) {
  return Promise.all(tags.map(async (tag) => {
    if(_.isNumber(tag)) {
      return await createUserTag(tag, user);
    } else {
      _.extend(tag, { 'createdAt': new Date(), 'updatedAt': new Date() });
      return await createNewUserTag(tag, user);
    }
  }));
}

async function createNewUserTag (tag, user) {
  return await dao.TagEntity.insert(tag).then(async (t) => {
    return await createUserTag(t.id, user);
  }).catch(err => {
    log.info('user: failed to create tag ', user.username, tag, err);
  });
}

async function createUserTag (tagId, user) {
  return await dao.UserTags.insert({ tagentity_users: tagId, user_tags: user.id }).then(async (tag) => {
    return await dao.TagEntity.findOne('id = ?', tag.tagentity_users).catch(err => {
      log.info('user: failed to load tag entity ', user.id, tagId, err);
    });
  }).catch(err => {
    log.info('user: failed to create tag ', user.username, tagId, err);
  });
}

async function updateProfile (attributes, done) {
  var errors = await User.validateUser(attributes, isUsernameUsed);
  if (!_.isEmpty(errors.invalidAttributes)) {
    return done(errors);
  }
  attributes.updatedAt = new Date();
  await dao.User.update(attributes).then(async (user) => {
    await dao.UserTags.db.query(dao.query.deleteUserTags, attributes.id)
      .then(async () => {
        var tags = attributes.tags || attributes['tags[]'] || [];
        await processUserTags(user, tags).then(tags => {
          user.tags = tags;
        });
        return done(null);
      }).catch (err => { return done({'message':'Error updating profile.'}); });
  }).catch (err => { return done({'message':'Error updating profile.'}); });
}

async function updateProfileStatus (attributes, done) {
  attributes.updatedAt = new Date();
  await dao.User.update(attributes).then(async (user) => {
    return done(null);
  }).catch (err => { return done({'message':'Error updating profile status.'}); });
}

async function canUpdateProfile (ctx) {
  if (+ctx.params.id === ctx.request.body.id) {
    if (ctx.state.user.isAdmin ||
       (ctx.state.user.isAgencyAdmin && checkAgency(ctx.state.user, ctx.params) && await checkRoleEscalation(ctx.request.body)) ||
       (ctx.state.user.id === +ctx.params.id && await checkRoleEscalation(ctx.request.body))) {
      return true;
    }
  }
  return false;
}

async function checkRoleEscalation (attributes) {
  var owner = await dao.User.find('id = ?', attributes.id);
  if (owner.length > 0) {
    if (_.has(attributes, 'isAdmin') && !owner[0].isAdmin) {
      return false;
    }
    if (_.has(attributes, 'isAgencyAdmin') && !owner[0].isAgencyAdmin) {
      return false;
    }
  }
  return true;
}

async function canAdministerAccount (user, attributes) {
  if ((_.has(user, 'isAdmin') && user.isAdmin) || (user.isAgencyAdmin && await checkAgency(user, attributes))) {
    return true;
  }
  return false;
}

async function checkAgency (user, attributes) {
  var owner = (await dao.TagEntity.db.query(dao.query.userAgencyQuery, attributes.id)).rows[0];
  if (owner && owner.isAdmin) {
    return false;
  }
  if (owner && owner.name) {
    return _.find(user.tags, { 'type': 'agency' }).name == owner.name;
  }
  return false;
}

async function updatePassword (attributes) {
  await updateProfilePasswordAttempts(attributes.id);
  attributes.password = await bcrypt.hash(attributes.password, 10);
  attributes.id = (await dao.Passport.find('"user" = ?', attributes.id))[0].id;
  attributes.updatedAt = new Date();
  await dao.Passport.update(attributes);
  return true;
}

async function updateProfilePasswordAttempts (id) {
  var user = (await dao.User.find('id = ?', id))[0];
  user.passwordAttempts = 0;
  return dao.User.update(user);
}

module.exports = {
  list: list,
  findOne: findOne,
  findOneByUsername: findOneByUsername,
  getProfile: getProfile,
  populateBadgeDescriptions: populateBadgeDescriptions,
  getActivities: getActivities,
  updateProfile: updateProfile,
  updateProfileStatus: updateProfileStatus,
  updatePassword: updatePassword,
  processUserTags: processUserTags,
  canAdministerAccount: canAdministerAccount,
  canUpdateProfile: canUpdateProfile,
};
