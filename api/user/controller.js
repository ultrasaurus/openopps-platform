const log = require('blue-ox')('app:user');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');

var router = new Router();

router.get('/api/user/all', async (ctx, next) => {
  ctx.body = await service.list();
})

router.get('/api/user/:id', async (ctx, next) => {
  ctx.body = await service.getProfile(ctx.params.id);
})

router.get('/api/user/activities/:id', async (ctx, next) => {
  ctx.body = await service.getActivities(ctx.params.id);
})

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
})

module.exports = router.routes();
