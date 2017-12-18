var _ = require('lodash');
var fs = require('fs');
var pgp = require('pg-promise')();
var parse = require('csv-parse/lib/sync');

// load db config file
try {
  var pgConfig = process.env.DATABASE_URL;
  console.log('DATABASE_URL =', pgConfig);
  if (typeof(pgConfig) == 'undefined') {
    var connections = require('../../config/connections').connections;
    var config = process.env.NODE_ENV !== 'test' ? connections.postgresql : connections.postgresqlTest;
    pgConfig = {
      user: config.user,
      password: config.password,
      database: config.database,
      db: config.database,
      host: config.host,
      port: 5432,
    };
    global.openopps = {
      appPath: __dirname,
    };
    _.extend(openopps, { dbConnection: pgConfig });
    var register = require('../../api/auth/service').register;
    var createOpportunity = require('../../api/opportunity/service').createOpportunity;
    console.log('using local config: ', pgConfig);
  }
  var db = pgp(pgConfig);
} catch(e) {
  console.log('Please create postgresql configuration in config/connections file, err: ', e);
  process.exit(1);
}

module.exports = {
  end: function () {
    pgp.end();
  },
  checkTagTableSetup: function () {
    return this.checkTableSetup('tagentity');
  },
  checkTableSetup: function (tableName) {
    // check that the tag table is set up, fail and close db connection if not
    return this.hasTable(tableName).then(function (hasTable) {
      if (!hasTable) {
        console.log("\n Database 'midas' needs to have 'tagentity' table.\n Maybe you need to run: npm run migrate\n" );
        pgp.end();
        reject(new Error('Missing table: tagentity'));
      }
    }).catch(function (err) {
      console.log('\n',err.message);
      if (err.message == 'database "midas" does not exist') {
        console.log(' You can create the database with: createdb midas\n');
      }
      reject(err);
    });
  },
  hasTable: function (tableName) {
    var query = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' \
                    AND table_name = $1)";
    return db.any(query, tableName).then(function (data) {
      return data[0].exists;
    });
  },
  importUsersFromFile: function (userFile) {
    console.log('importing:', userFile);
    if (fs.existsSync(userFile)) {
      input = fs.readFileSync(userFile);
      var users = parse(input, {columns: true});
      return Promise.all(users.map(async (user) => {
        return await register(user, () => { });
      }));
    } else {
      var msg = "File Not Found: '" + userFile + "'";
      console.log(msg);
      throw new Error(msg);
    }
  },
  importTasksFromFile: function (taskFile) {
    console.log('importing:', taskFile);
    if (fs.existsSync(taskFile)) {
      input = fs.readFileSync(taskFile);
      var tasks = parse(input, {columns: true});
      return Promise.all(tasks.map(async (task) => {
        return await createOpportunity(task, () => { });
      }));
    } else {
      var msg = "File Not Found: '" + taskFile + "'";
      console.log(msg);
      throw new Error(msg);
    }
  },
  importTagsFromFile: function (tagFile, tagType) {
    console.log('importing:', tagFile);
    var tags = [];
    // load tags from file
    if (fs.existsSync(tagFile)) {
      lines = fs.readFileSync(tagFile).toString().split('\n');
      tags = _.map(lines, function (line) {
        if (tagType == 'agency') {
          var match = line.match(/\((.+)\)/);
          if (match && match.length > 1) {
            var abbr = match[1];
            return { name: line, abbr: abbr, slug: abbr.toLowerCase(), domain: [abbr.toLowerCase() + '.gov'], allowRestrictAgency: true};
          }
        }
        return { name: line };
      });
    } else {
      var msg = "File Not Found: '" + tagFile + "'";
      console.log(msg);
      throw new Error(msg);
    }

    var date = new Date();

    // returns a promise
    return db.tx(function (t) {
      tagQueries = [];
      var query_text = 'INSERT INTO tagEntity ("type","name","data","createdAt","updatedAt") SELECT $1, $2, to_json($3::text), $4, $5 WHERE NOT EXISTS (SELECT id FROM tagEntity WHERE "name" = $5 AND "type" = $6)';
      for (i in tags) {
        if (!_.isEmpty(tags[i])) {
          var tagData = JSON.stringify(tags[i]);
          console.log('>', tagData);
          var query_data = [tagType, tags[i].name, tagData, date, date, tags[i].name, tagType];
          var query = t.none(query_text, query_data);
          tagQueries.push(query);
        }
      }
      return t.batch(tagQueries);
    });
  },
};
