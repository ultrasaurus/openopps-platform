const log = require('blue-ox')('app:admin');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');

var router = new Router();

router.get('/api/admin/metrics', async (ctx, next) => {
  if (ctx.isAuthenticated() && ctx.state.user.isAdmin) {
    ctx.body = await service.getMetrics();  
  } else {
    ctx.status = 401;
  }
});

router.get('/api/admin/activities', async (ctx, next) => {
  if (ctx.isAuthenticated() && ctx.state.user.isAdmin) {
    ctx.body = null;
    //ctx.body = await service.getActivities(); 
  } else {
    ctx.status = 401;
  }
});

router.get('/api/admin/interactions', async (ctx, next) => {
  if (ctx.isAuthenticated() && ctx.state.user.isAdmin) {
    ctx.body = await service.getInteractions();
  } else {
    ctx.status = 401;
  }
});

router.get('/api/admin/taskmetrics', async (ctx, next) => {
  if (ctx.isAuthenticated() && ctx.state.user.isAdmin) {
    var group = ctx.query.group;
    var filter = ctx.query.filter;
    ctx.body = await service.getDashboardTaskMetrics(group, filter);
  } else {
    ctx.status = 401;
  }
});

router.get('/api/admin/export', async (ctx, next) => {
  if (ctx.isAuthenticated() && ctx.state.user.isAdmin) {
    var exportData = await service.getExportData().then(rendered => {
      ctx.response.set('Content-Type', 'text/csv');
      ctx.response.set('Content-disposition', 'attachment; filename=users.csv');
      ctx.body = rendered;
    }).catch(err => {
      log.info(err);
    });
  } else {
    ctx.status = 401;
  }
});

router.get('/api/admin/users', async (ctx, next) => {
  if (ctx.isAuthenticated() && ctx.state.user.isAdmin) {
    var users = {};
    if (ctx.query.page) {
      users = await service.getUsers(ctx.query.page, ctx.query.limit);
    } else {
      users = await service.getUsersFiltered(ctx.query.q);
    }   
    ctx.body = users;
  } else {
    ctx.status = 401;
  }
});

router.get('/api/admin/tasks', async (ctx, next) => {
  if (ctx.isAuthenticated() && ctx.state.user.isAdmin) {
    ctx.body = await service.getTaskStateMetrics();
  } else {
    ctx.status = 401;
  }
});

router.get('/api/admin/agency/:id', async (ctx, next) => {
  if (ctx.isAuthenticated() && ctx.state.user.isAdmin) {
    ctx.body = await service.getAgency(ctx.params.id);
  } else {
    ctx.status = 401;
  }
});

router.get('/api/admin/admin/:id', async (ctx, next) => {
  if (ctx.isAuthenticated() && ctx.state.user.isAdmin) {
    var user = await service.getProfile(ctx.params.id);
    user.isAdmin = ctx.query.action === 'true' ? 't' : 'f';
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

router.get('/api/admin/agencyAdmin/:id', async (ctx, next) => {
  if (ctx.isAuthenticated() && ctx.state.user.isAdmin) {
    var user = await service.getProfile(ctx.params.id);
    user.isAgencyAdmin = ctx.query.action === 'true' ? 't' : 'f';
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

router.get('/api/admin/users/*', async (ctx, next) => {
  if (ctx.isAuthenticated() && ctx.state.user.isAdmin) {
    var users = {};
    var agency = ctx.params[0];
    if (ctx.query.page) {
      users = await service.getUsersForAgency(ctx.query.page, ctx.query.limit, agency);
    } else {
      users = await service.getUsersForAgencyFiltered(ctx.query.q, agency);
    }   
    ctx.body = users;
  } else {
    ctx.status = 401;
  }
});

router.get('/api/admin/tasks/*', async (ctx, next) => {
  if (ctx.isAuthenticated() && ctx.state.user.isAdmin) {
    var agency = ctx.params[0];
    ctx.body = await service.getAgencyTaskStateMetrics(agency);
  } else {
    ctx.status = 401;
  }
});

module.exports = router.routes();