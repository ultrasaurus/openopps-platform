const koa = require('koa');
const blueox = require('blue-ox');
const render = require('koa-ejs');
const sass = require('koa-sass');
const serve = require('koa-static');
const path = require('path');

module.exports = function() {
  // Set up logging
  blueox.beGlobal();
  blueox.useColor = true;
  blueox.level('info');

  var log = blueox('app');
  var qlog = blueox('db');
  var rlog = blueox('app:http');

  const app = new koa();

  // for rendering .ejs views
  render(app, {
    root: path.join(__dirname, 'views'),
    layout: 'layout',
    viewExt: 'ejs',
    cache: false,
    debug: false
  });

  // easy loading of a feature
  feature = function(name) {
    return require(path.join(__dirname, 'api', name, 'controller'));
  }

  // Log our request
  app.use(async (ctx, next) => {
    var start = Date.now(), str = ctx.method + ' ' + ctx.protocol + '://' + ctx.host + ctx.path + (!!ctx.querystring ? '?' + ctx.querystring : '') + '\n';
    str += 'from ' + ctx.ip;
    try {
      await next();
      str += ' -- took ' + qlog.color('warn', (Date.now() - start) + 'ms') + ' -- ' + qlog.color(ctx.status >= 200 && ctx.status < 400 ? 'debug' : 'error', ctx.status) + qlog.color('custom', ' (' + (ctx.length || 'unknown') + ')');
      rlog.info(str);
    } catch (e) {
      str += ' -- took ' + qlog.color('warn', (Date.now() - start) + 'ms');
      str += ' and failed -- ' + qlog.color('error', ctx.status) + ': ';
      if (!!e.stack) {
        str += e.message + '\n';
        str += e.stack;
      } else {
        str += e;
      }
      rlog.error(str);
    }
  });

  // check to see if open opportunities is running
  app.use(async (ctx, next) => {
    if (ctx.path === '/server/status') {
      ctx.body = '{"ok":10}';
      ctx.type = 'json';
      ctx.status = 200;
    } else await next();
  });

  // compile our .scss files if not already done so
  app.use(sass({
    src:  __dirname + '/assets',
    dest: __dirname + '/assets'
  }));

  // serve our static resource files
  app.use(serve(__dirname + '/assets'));

  // load our features (i.e. our api controllers)
  app.use(feature('opportunity'));

  // finally if nothing else matched load main/index.ejs
  app.use(async function(ctx) {
    // Throw 404 for undefined api routes
    if(ctx.path.match("^/api/.*")) {
        ctx.status = 404;
        ctx.body = 'not found';
    } else {
      var data = {
        systemName: "Midas",
        draftAdminOnly: true,
        version: "0.14.4",
        alert: null,
        user: null
      };
      await ctx.render('main/index', data);
    }
  });

  app.listen(3000);
  console.log('App running on port 3000');
}
