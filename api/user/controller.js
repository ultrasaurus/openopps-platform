const log = require('blue-ox')('app:user');
const validator = require('validator');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');

var router = new Router();

router.get('/api/user/all', async (ctx, next) => {
  if(ctx.isAuthenticated()) {
    ctx.body = await service.list();
  } else {
    ctx.status = 401;
  }
});

router.get('/api/user', async (ctx, next) => {
  if(ctx.isAuthenticated()) {
    ctx.body = ctx.state.user;
  } else {
    ctx.status = 401;
  }
});

router.get('/api/user/:id', async (ctx, next) => {
  if(ctx.isAuthenticated()) {
    if(ctx.params.id == ctx.state.user.id) {
      ctx.body = ctx.state.user;
    } else {
      ctx.body = await service.getProfile(ctx.params.id);
    }
  } else {
    ctx.status = 401;
  }
});

router.get('/api/user/username/:username', async (ctx, next) => {
  // don't allow empty usernames
  if (!ctx.params.username) {
    return ctx.send(true);
  }
  log.info('looking up username', ctx.params.username);
  // only allow email usernames, so check if the email is valid
  if (validator.isEmail(ctx.params.username) !== true) {
    return ctx.body = true;
  }
  // check if a user already has this email
  await service.findOneByUsername(ctx.params.username.toLowerCase(), function (err, user) {
    if (err) {
      ctx.status = 400;
      return ctx.body = { message:'Error looking up username.' };
    } else if (!user) {
      return ctx.body = false;
    } else {
      return ctx.body = true;
    }
  });
});

router.get('/api/user/activities/:id', async (ctx, next) => {
  ctx.body = await service.getActivities(ctx.params.id);
});

router.get('/api/user/photo/:id', async (ctx, next) => {
  var user = await service.findOne(ctx.params.id);
  if (!user) {
    ctx.redirect('/images/default-user-icon-profile.png');
  }
  if (user.photoId) {
    ctx.status = 307;
    ctx.redirect('/api/upload/get/' + user.photoId);
  }
  else if (user.photoUrl) {
    ctx.status = 307;
    ctx.redirect(user.photoUrl);
  }
  else {
    ctx.status = 307;
    ctx.redirect('/images/default-user-icon-profile.png');
  }
});

module.exports = router.routes();
