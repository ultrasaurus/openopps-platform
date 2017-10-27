const koa = require('koa');
const cfenv = require('cfenv');
const blueox = require('blue-ox');
const render = require('koa-ejs');
const sass = require('koa-sass');
const serve = require('koa-static');
const path = require('path');
const session = require('koa-session');
const bodyparser = require('koa-bodyparser');
const passport = require('koa-passport');
const flash = require('koa-better-flash');
const _ = require('lodash');

module.exports = function () {
  // import vars from Cloud Foundry service
  var envVars = cfenv.getAppEnv().getServiceCreds('env-openopps');
  if (envVars) _.extend(process.env, envVars);

  // load configs
  global.openopps = {};
  _.extend(openopps, require('./config/application'));
  _.extend(openopps, require('./config/settings/auth'));
  _.extend(openopps, require('./config/version'));

  // configure logging
  blueox.beGlobal();
  blueox.useColor = true;
  blueox.level('info');

  var log = blueox('app');
  var qlog = blueox('db');
  var rlog = blueox('app:http');

  const app = new koa();

  // configure session
  app.proxy = true;
  app.keys = ['your-session-secret'];
  app.use(session({}, app));

  // initialize flash
  app.use(flash());

  // initialize body parser
  app.use(bodyparser());

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

  // compile our .scss files if not already done so
  // app.use(sass({
  //   src:  __dirname + '/assets',
  //   dest: __dirname + '/assets',
  // }));

  // serve our static resource files
  app.use(serve(__dirname + '/dist'));

  // load main/index.ejs unless api request
  app.use(async function (ctx, next) {
    // Throw 404 for undefined api routes
    if(ctx.path.match('^/api/.*')) {
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
  app.use(feature('admin'));
  app.use(feature('volunteer'));
  app.use(feature('comment'));

  app.listen(3000);
  console.log('App running on port 3000');
};
