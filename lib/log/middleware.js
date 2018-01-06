const rlog = use('log')('app:http');
const qlog = use('log')('db');

module.exports = ( app ) => {
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
}



