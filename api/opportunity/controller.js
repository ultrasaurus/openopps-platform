const log = require('log')('app:opportunity');
const Router = require('koa-router');
const _ = require('lodash');
const auth = require('../auth/auth');
const service = require('./service');
const notification = require('../notification/service');
const badgeService = require('../badge/service')(notification);
const Badge = require('../model/Badge');

var router = new Router();

router.get('/api/task', async (ctx, next) => {
  ctx.body = await service.list();
});

router.get('/api/task/export', auth.isAdmin, async (ctx, next) => {
  var exportData = await service.getExportData().then(rendered => {
    ctx.response.set('Content-Type', 'text/csv');
    ctx.response.set('Content-disposition', 'attachment; filename=tasks.csv');
    ctx.body = rendered;
  }).catch(err => {
    log.info(err);
  });
});

router.get('/api/task/:id', async (ctx, next) => {
  var task = await service.findById(ctx.params.id, ctx.state.user ? true : false);
  if (typeof ctx.state.user !== 'undefined' && ctx.state.user.id === task.userId) {
    task.isOwner = true;
  }
  if (task.isOwner ||
    (_.has(ctx.state.user, 'isAdmin') && ctx.state.user.isAdmin) ||
    ((_.has(ctx.state.user, 'isAgencyAdmin') && ctx.state.user.isAgencyAdmin) &&
      (ctx.state.user.tags && (_.find(ctx.state.user.tags, { 'type': 'agency' }) || {}).name == task.owner.agency.name))) {
    task.canEditTask = true;
  }
  ctx.body = task;
});

router.get('/api/comment/findAllBytaskId/:id', async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    ctx.body = await service.commentsByTaskId(ctx.params.id);
  } else {
    ctx.body = { 'comments': [] };
  }
});

router.post('/api/task', auth, async (ctx, next) => {
  ctx.request.body.userId = ctx.session.passport.user;
  var opportunity = await service.createOpportunity(ctx.request.body, function (errors, task) {
    if (errors) {
      ctx.status = 400;
      return ctx.body = errors;
    }
    service.sendTaskNotification(ctx.state.user, task, task.state === 'draft' ? 'task.create.draft' : 'task.create.thanks');
    ctx.body = task;
  });
});

router.put('/api/task/:id', auth, async (ctx, next) => {
  if (await service.canUpdateOpportunity(ctx.state.user, ctx.request.body.id)) {
    ctx.status = 200;
    await service.updateOpportunity(ctx.request.body, function (task, stateChange, errors) {
      if (errors) {
        ctx.status = 400;
        return ctx.body = errors;
      }
      try {
        awardBadge(task);
        checkTaskState(stateChange, ctx.state.user, ctx.request.body, task);
      } finally {
        ctx.body = { success: true };
      }
    });
  } else {
    ctx.status = 401;
    ctx.body = null;
  }
});

router.put('/api/publishTask/:id', auth, async (ctx, next) => {
  if (await service.canAdministerTask(ctx.state.user, ctx.request.body.id)) {
    await service.publishTask(ctx.request.body, function (done) {
      ctx.body = { success: true };
    }).catch(err => {
      log.info(err);
    });
  }
});

router.post('/api/task/copy', auth, async (ctx, next) => {
  if (await service.canUpdateOpportunity(ctx.state.user, ctx.request.body.taskId)) {
    await service.copyOpportunity(ctx.request.body, ctx.state.user.isAdmin ? ctx.state.user : null, function (error, task) {
      if (error) {
        ctx.flash('error', 'Error Copying Opportunity');
        ctx.status = 400;
        log.info(error);
        return ctx.body = null;
      }
      ctx.body = task;
    });
  } else {
    ctx.status = 403;
  }
});

function awardBadge (task) {
  var badge = Badge.awardForTaskPublish(task, task.userId);
  if(badge) {
    badgeService.save(badge).catch(err => {
      log.info('Error saving badge', badge, err);
    });
  }
}

function checkTaskState (stateChange, user, body, task) {
  if (stateChange) {
    service.sendTaskStateUpdateNotification(user, body);
    if(task.state === 'completed') {
      service.volunteersCompleted(task);
    }
  }
}

router.delete('/api/task/:id', auth, async (ctx) => {
  if (await service.canAdministerTask(ctx.state.user, ctx.params.id)) {
    await service.findOne(ctx.params.id).then(async task => {
      if (['draft', 'submitted'].indexOf(task.state) != -1) {
        ctx.body = await service.deleteTask(ctx.params.id);
      } else {
        log.info('Wrong state');
        ctx.status = 400;
      }
    }).catch(err => {
      log.info('Error occured', err);
      ctx.status = 400;
    });
  } else {
    ctx.status = 403;
  }
});

module.exports = router.routes();
