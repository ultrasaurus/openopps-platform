const log = require('blue-ox')('app:volunteer');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');

var router = new Router();

router.post('/api/volunteer', async (ctx, next) => {
  var attributes = ctx.request.body;
  attributes.userId = ctx.req.user.id;
  var opportunity = await service.addVolunteer(attributes, function (err, volunteer) {
    if (err) {
      ctx.body = null;
    }
    ctx.body = volunteer;
  });
});

router.delete('/api/volunteer/:id', async (ctx, next) => {
  await service.deleteVolunteer(ctx.params.id);
});

module.exports = router.routes();