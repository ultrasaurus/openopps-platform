before(function () {
  var config = {
    environment: 'test',
    port: 9999,   // so we can run the app and tests at the same time
    hostName: 'localhost:9999',
    csrf: false,
    dbConnection: {
      host: 'localhost',
      db: 'midastest',
      user: 'midas',
      password: 'midas',
      port: '5432',
    },
    emailProtocol: '',
    // TODO: validateDomains: false,
    // TODO: requireAgency: false,
    // TODO: requireLocation: false,
    // TODO: taskState: 'draft',
    // TODO: draftAdminOnly: false,
  };
  require('../app-koa')(config);
});
