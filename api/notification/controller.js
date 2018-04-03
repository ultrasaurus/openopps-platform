const log = require('log')('app:document');
const Router = require('koa-router');
const request = require('request');
const _ = require('lodash');
const service = require('./service');

var router = new Router();

router.post('/api/notifications', async (ctx, next) => {
  ctx.request.body = ctx.request.body || ctx.request.fields;
  if(ctx.request.header['x-amz-sns-message-type'] && _.includes(ctx.request.header['x-amz-sns-topic-arn'], openopps.AWS_ACCOUNT)) {
    switch (ctx.request.header['x-amz-sns-message-type'].toLowerCase()) {
      case 'subscriptionconfirmation':
        request(ctx.request.body.SubscribeURL);
        ctx.status = 200;
        break;
      case 'notification':
        service.processNotification(ctx.request.body);
        ctx.status = 200;
        break;
      default:
        ctx.status = 400;
    }
  } else {
    ctx.status = 400;
  }
});

module.exports = router.routes();
