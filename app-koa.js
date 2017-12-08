const koa = require('koa');
const cfenv = require('cfenv');
const blueox = require('blue-ox');
const render = require('koa-ejs');
const sass = require('koa-sass');
const serve = require('koa-static');
const path = require('path');
const parser = require('koa-better-body');
const CSRF = require('koa-csrf');
const session = require('koa-session');
const redisStore = require('koa-redis');
const passport = require('koa-passport');
const flash = require('koa-better-flash');
const _ = require('lodash');

module.exports = async (config) => {
  // import vars from Cloud Foundry service
  var envVars = cfenv.getAppEnv().getServiceCreds('env-openopps');
  if (envVars) _.extend(process.env, envVars);

  // load configs
  global.openopps = {
    appPath: __dirname,
  };
  _.extend(openopps, require('./config/application'));
  _.extend(openopps, require('./config/session'));
  _.extend(openopps, require('./config/settings/auth'));
  _.extend(openopps, require('./config/version'));
  _.extend(openopps, require('./config/fileStore'));
  _.extend(openopps, require('./config/email'));
  if(config) {
    _.extend(openopps, config);
  }

  // configure logging
  blueox.beGlobal();
  blueox.useColor = true;
  blueox.level('info');

  var log = blueox('app');
  var qlog = blueox('db');
  var rlog = blueox('app:http');

  const app = new koa();

  // initialize flash
  app.use(flash());

  // initialize body parser
  app.use(parser());

  // configure session
  app.proxy = true;
  app.keys = [openopps.session.secret || 'your-secret-key'];
  app.use(session(openopps.session, app));

  // configure CSRF
  app.use(new CSRF({
    invalidSessionSecretMessage: 'Invalid session',
    invalidSessionSecretStatusCode: 403,
    invalidTokenMessage: 'Invalid CSRF token',
    invalidTokenStatusCode: 403,
    excludedMethods: [ 'GET', 'HEAD', 'OPTIONS' ],
    disableQuery: false,
  }));

  // initialize authentication
  require(path.join(__dirname, 'api/auth/passport'));
  app.use(passport.initialize());
  app.use(passport.session());

  // for rendering .ejs views
  render(app, {
    root: path.join(__dirname, 'views'),
    layout: 'layout',
    viewExt: 'ejs',
    cache: false,
    debug: false,
  });

  // easy loading of a feature
  feature = function (name) {
    return require(path.join(__dirname, 'api', name, 'controller'));
  };

  // log request to console
  app.use(async (ctx, next) => {
    var start = Date.now(), str = ctx.method + ' ' + ctx.protocol + '://' + ctx.host + ctx.path + (ctx.querystring ? '?' + ctx.querystring : '') + '\n';
    str += 'from ' + ctx.ip;
    try {
      await next();
      str += ' -- took ' + qlog.color('warn', (Date.now() - start) + 'ms') + ' -- ' + qlog.color(ctx.status >= 200 && ctx.status < 400 ? 'debug' : 'error', ctx.status) + qlog.color('custom', ' (' + (ctx.length || 'unknown') + ')');
      rlog.info(str);
    } catch (e) {
      str += ' -- took ' + qlog.color('warn', (Date.now() - start) + 'ms');
      str += ' and failed -- ' + qlog.color('error', ctx.status) + ': ';
      if (e.stack) {
        str += e.message + '\n';
        str += e.stack;
      } else {
        str += e;
      }
      rlog.error(str);
    }
  });

  // allow external services to see if open opportunities is running
  app.use(async (ctx, next) => {
    if (ctx.path === '/server/status') {
      ctx.body = '{"ok":10}';
      ctx.type = 'json';
      ctx.status = 200;
    } else await next();
  });

  // serve our static resource files
  app.use(serve(__dirname + '/dist'));

  // CSRF Token
  app.use(async (ctx, next) => {
    if(ctx.path === '/csrfToken') {
      ctx.body = { _csrf: ctx.csrf };
    } else await next();
  });

  // load main/index.ejs unless api request
  app.use(async function (ctx, next) {
    // Throw 404 for undefined api routes
    if(ctx.path.match('^/api/.*')) {
      // JSON request for better-body parser are in request.fields
      ctx.request.body = ctx.request.body || ctx.request.fields;
      await next();
    } else {
      var data = {
        systemName:  openopps.systemName,
        draftAdminOnly: openopps.draftAdminOnly,
        version: openopps.version,
        alert: null,
        user: ctx.state.user || null,
      };
      await ctx.render('main/index', data);
    }
  });

  // load our features (i.e. our api controllers)
  app.use(feature('auth'));
  app.use(feature('opportunity'));
  app.use(feature('user'));
  app.use(feature('autocomplete'));
  app.use(feature('location'));
  app.use(feature('admin'));
  app.use(feature('volunteer'));
  app.use(feature('activity'));
  app.use(feature('comment'));
  app.use(feature('document'));

  app.listen(openopps.port);
  console.log('App running at ' + openopps.hostName + ':' + openopps.port);
};
