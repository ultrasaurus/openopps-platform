const _ = require ('lodash');
var crypto = require('crypto');
const bcrypt = require('bcryptjs');
const log = require('blue-ox')('app:auth:service');
const db = require('../../db');
const dao = require('./dao')(db);

const baseUser = {
  isAdmin: false,
  isAgencyAdmin: false,
  disabled: false,
  passwordAttempts: 0,
  completedTasks: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const basePassport = {
  protocol: 'local',
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function register (attributes, done) {
  if (!attributes.password || attributes.password === '') {
    return done(new Error('password may not be blank'));
  }
  await dao.User.insert(_.extend(baseUser, attributes)).then(async (user) => {
    log.info('created user', user);
    (attributes.tags || attributes['tags[]'] || []).map(tag => {
      dao.UserTags.insert({ tagentity_users: tag, user_tags: user.id }).catch(err => {
        log.info('register: failed to create tag ', attributes.username, tag, err);
      });
    });
    var passport = {
      user: user.id,
      password: await bcrypt.hash(attributes.password, 10),
      accessToken: crypto.randomBytes(48).toString('base64'),
    };
    await dao.Passport.insert(_.extend(basePassport, passport)).then(passport => {
      log.info('created passport', passport);
    }).catch(err => {
      log.info('register: failed to create passport ', attributes.username, err);
    });
    return done(null, user);
  }).catch(err => {
    log.info('register: failed to create user ', attributes.username, err);
    return done(true);
  });
}

module.exports = {
  register: register,
};
