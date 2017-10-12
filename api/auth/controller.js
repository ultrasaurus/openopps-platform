const log = require('blue-ox')('app:authentication');
const Router = require('koa-router');
const _ = require('lodash');
const service = require('./service');
const passport = require('koa-passport');

const router = new Router();

function getMessage (err) {
  return (err === 'locked') ?
    'Your account has been locked, please reset your password.' :
    (err === 'invalid domain') ?
      'You need to have a .gov or .mil email address.' :
      'Invalid email address or password.';
}

router.post('/api/auth/local', async (ctx, next) => {
  await passport.authenticate('local', (err, user, info, status) => {
    if (err || !user) {
      log.info('Authentication Error: ', err);
      var message;
      if (err && err.originalError === 'invalid domain') {
        message = getMessage(err.originalError);
      } else {
        message = getMessage(err);
      }
      if (ctx.accepts('json')) {
        ctx.status = 403;
        return ctx.body = { message: message };
      } else {
        ctx.flash('message', message);
        return ctx.redirect('/');
      }
    } else {
      ctx.body = { success: true };
      return ctx.login(user);
    }
  })(ctx, next);
});

router.post('/api/auth/local/register', async (ctx, next) => {
  log.info('Register user', ctx.request.body);

  if (!ctx.request.body.username) {
    ctx.flash('error', 'Error.Passport.Username.Missing');
    ctx.status = 400;
    return ctx.body = { message: 'No username was entered.' };
  }

  if (!ctx.request.body.password) {
    ctx.flash('error', 'Error.Passport.Password.Missing');
    ctx.status = 400;
    return ctx.body = { message: 'No password was entered.' };
  }

  await service.register(ctx.request.body, function (err, user) {
    if (err) {
      req.flash('error', 'Error.Passport.Registration.Failed');
      ctx.status = 400;
      return ctx.body = { message: err.message || 'Registration failed.' };
    }
    ctx.body = { success: true };
    return ctx.login(user);
  });
});

module.exports = router.routes();
