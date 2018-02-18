const _ = require('lodash');

// load configs
  config = {
    appPath: __dirname,
  };
  _.extend(config, require('./application'));
  _.extend(config, require('./session'));
  _.extend(config, require('./settings/auth'));
  _.extend(config, require('./cache'));
  _.extend(config, require('./version'));
  _.extend(config, require('./fileStore'));
  _.extend(config, require('./email'));

module.exports = config;