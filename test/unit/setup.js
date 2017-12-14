const _ = require('lodash');
global.openopps = {
  appPath: __dirname,
};
_.extend(openopps, require('../../config/application'));
