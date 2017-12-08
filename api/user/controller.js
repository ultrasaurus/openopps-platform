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
      ctx.body = await service.populateBadgeDescriptions(ctx.state.user);
    } else {
      ctx.body = await service.getProfile(ctx.params.id);
    }
  } else {
    ctx.status = 403;
  }
});

router.get('/api/user/username/:username', async (ctx, next) => {
  if (!ctx.params.username) {
    return ctx.send(true);
  }
  log.info('looking up username', ctx.params.username);
  if (validator.isEmail(ctx.params.username) !== true) {
    return ctx.body = true;
  }
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
  if (ctx.isAuthenticated()) {
    ctx.body = await service.getActivities(ctx.params.id);
  } else {
    ctx.status = 401;
  }
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

router.put('/api/user/:id', async (ctx, next) => {
  if (ctx.isAuthenticated() && +ctx.params.id === ctx.request.body.id && (ctx.state.user.id === +ctx.params.id || ctx.req.user.isAdmin)) {
    ctx.status = 200;
    await service.updateProfile(ctx.request.body, function (errors) {
      if (errors) {
        ctx.status = 400;
        return ctx.body = errors;
      }
      ctx.body = { success: true };
    });
  } else {
    ctx.status = 401;
  }
});

router.get('/api/user/disable/:id', async (ctx, next) => {
  if (ctx.isAuthenticated() && ctx.state.user.isAdmin) {
    var user = await service.getProfile(ctx.params.id);
    user.disabled = 't';
    await service.updateProfile(user, function (error) {
      if (error) {
        log.info(error);
      }
      ctx.body = { user };
    });
  } else {
    ctx.status = 401;
  }
});

router.get('/api/user/enable/:id', async (ctx, next) => {
  if (ctx.isAuthenticated() && ctx.state.user.isAdmin) {
    var user = await service.getProfile(ctx.params.id);
    user.disabled = 'f';
    await service.updateProfile(user, function (error) {
      if (error) {
        log.info(error);
      }
      ctx.body = { user };
    });
  } else {
    ctx.status = 401;
  }
});

router.post('/api/user/resetPassword', async (ctx, next) => {
  ctx.body = service.updatePassword(ctx.request.body);
});

module.exports = router.routes();
