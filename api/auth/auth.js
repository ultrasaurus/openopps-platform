const _ = require ('lodash');

async function baseAuth (ctx, next) {
  if(ctx.isAuthenticated()) {
    await next();
  } else {
    ctx.body = { message: 'You must be logged in to view this page' };
    ctx.status = 401;
  }
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
