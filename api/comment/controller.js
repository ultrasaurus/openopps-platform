const log = require('blue-ox')('app:comment');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');

var router = new Router();

router.post('/api/comment', async (ctx, next) => {
  if(ctx.isAuthenticated()) {
    var attributes = ctx.request.body;
    _.extend(attributes, { userId: ctx.state.user.id } );
    await service.addComment(attributes, function (errors, comment) {
      if (errors) {
        ctx.status = 400;
        return ctx.body = errors;
      }
      service.sendCommentNotification(ctx.state.user, comment, 'comment.create.owner');
      ctx.body = comment;
    });
  } else {
    ctx.status = 401;
  }
});

router.delete('/api/comment/:id', async (ctx) => {
  if(ctx.isAuthenticated() && ctx.state.user.isAdmin) {
    ctx.body = await service.deleteComment(ctx.params.id);
  } else {
    ctx.status = 403;
  }
});
  
module.exports = router.routes();