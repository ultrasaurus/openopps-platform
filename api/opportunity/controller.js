const log = require('blue-ox')('app:opportunity');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');
const Badge = require('../badge/service');

var router = new Router();

router.get('/api/task', async (ctx, next) => {
  ctx.body = await service.list();
});

router.get('/api/task/export', async (ctx, next) => {
  if (ctx.isAuthenticated() && ctx.state.user.isAdmin) {
    var exportData = await service.getExportData().then(rendered => {
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=tasks.csv');
      ctx.body = rendered;
    }).catch(err => {
      log.info(err);
    });
  } else {
    ctx.status = 401;
  }
});

router.get('/api/task/:id', async (ctx, next) => {
  var task = await service.findById(ctx.params.id);
  if (ctx.state.user.id === task.userId) { task.isOwner = true; }
  ctx.body = task;
});

router.get('/api/comment/findAllBytaskId/:id', async (ctx, next) => {
  ctx.body = await service.commentsByTaskId(ctx.params.id);
});

router.post('/api/task', async (ctx, next) => {
  log.info('Create opportunity', ctx.request.body);
  ctx.request.body.userId = ctx.session.passport.user;

  var opportunity = await service.createOpportunity(ctx.request.body, function (err, task) {
    log.info(task);
    if (err) {
      ctx.status = 400;
      return ctx.body = { message: err.message || 'Opportunity creation failed.' };
    }
    try {
      service.sendTaskNotification(ctx.req.user, task, task.state === 'draft' ? 'task.create.draft' : 'task.create.thanks');
    } finally {
      ctx.body = task;
    }
  });
});

router.put('/api/task/:id', async (ctx, next) => {
  log.info('Edit opportunity', ctx.request.body);
  ctx.status = 200;
  await service.updateOpportunity(ctx.request.body, function (task, stateChange, error) {
    if (error) {
      ctx.status = 400;
      return ctx.body = { message: error.message || 'Opportunity update failed.' };
    }
    try {
      var badge = Badge.awardForTaskPublish(task, task.userId);
      if(badge) {
        Badge.save(badge).catch(err => {
          log.info('Error saving badge', err);
        });
      }
      if (stateChange) {
        service.sendTaskStateUpdateNotification(ctx.req.user, ctx.request.body);
      }
    } finally {
      ctx.body = { success: true };
    }
  });
});

router.post('/api/task/copy', async (ctx, next) => {
  log.info('Copy opportunity', ctx.request.body);
  ctx.status = 200;

  await service.copyOpportunity(ctx.request.body, ctx.req.user.isAdmin ? ctx.req.user : null, function (error, task) {
    if (error) {
      ctx.flash('error', 'Error Copying Opportunity');
      ctx.status = 400;
      log.info(error);
      return ctx.body = null;
    }
    ctx.body = task;
  });
});

router.delete('/api/task/:id', async (ctx) => {
  ctx.body = await service.deleteTask(ctx.params.id);
});

module.exports = router.routes();
