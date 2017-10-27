const log = require('blue-ox')('app:comment');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');

var router = new Router();

router.post('/api/comment', async (ctx, next) => {
    if(ctx.isAuthenticated()) {
        var attributes = ctx.request.body;
        _.extend(attributes, { userId: ctx.state.user.id } );
        ctx.body = await service.addComment(attributes);
      } else {
        ctx.status = 401;
      }   
  });
  
module.exports = router.routes();