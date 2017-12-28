const _ = require ('lodash');

async function baseAuth (ctx, next) {
  ctx.isAuthenticated() ? await next() : ctx.status = 401;
}

module.exports = baseAuth;

module.exports.isAdmin = async (ctx, next) => {
  await baseAuth(ctx, async () => {
    ctx.state.user.isAdmin ? await next() : ctx.status = 403;
  });
};

module.exports.isAgencyAdmin = async (ctx, next) => {
  await baseAuth(ctx, async () => {
    ctx.state.user.isAgencyAdmin ? await next() : ctx.status = 403;
  });
};

module.exports.isAdminOrAgencyAdmin = async (ctx, next) => {
  await baseAuth(ctx, async () => {
    ctx.state.user.isAdmin || ctx.state.user.isAgencyAdmin ? await next() : ctx.status = 403;
  });
};
