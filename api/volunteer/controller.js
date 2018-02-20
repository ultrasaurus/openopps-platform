const log = require('log')('app:volunteer');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');

var router = new Router();

router.post('/api/volunteer', auth, async (ctx, next) => {
  if (await service.canAddVolunteer(ctx.request.body, ctx.state.user)) {
    var attributes = ctx.request.body;
    attributes.userId = +attributes.userId || ctx.state.user.id;
    await service.addVolunteer(attributes, function (err, volunteer) {
      if (err) {
        return ctx.body = err;
      }
      if (volunteer.silent == null || volunteer.silent == 'false') {
        service.sendAddedVolunteerNotification(ctx.state.user, volunteer, 'volunteer.create.thanks');
      }
      return ctx.body = volunteer;
    });
  } else {
    ctx.status = 401;
    return ctx.body = null;
  }
});

router.post('/api/volunteer/assign', auth, async (ctx, next) => {
  if (await service.canManageVolunteers(ctx.query.taskId, ctx.state.user)) {
    await service.assignVolunteer(+ctx.query.volunteerId, ctx.params.assign, function (err, volunteer) {
      return ctx.body = err ? err : volunteer;
    });
  } else {
    ctx.status = 401;
    return ctx.body = null;
  }
});

router.delete('/api/volunteer/:id', auth, async (ctx, next) => {
  if (await service.canManageVolunteers(ctx.query.taskId, ctx.state.user)) {
    await service.deleteVolunteer(+ctx.params.id, +ctx.query.taskId, function (notificationInfo, err) {
      if (!err) {
        service.sendDeletedVolunteerNotification(notificationInfo[0], 'volunteer.destroy.decline');
      } else {
        ctx.status = 400;
      }
      ctx.body = null;
    });
  } else {
    ctx.status = 401;
    return ctx.body = null;
  }
});

module.exports = router.routes();
