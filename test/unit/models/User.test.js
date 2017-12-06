var chai = require('chai');
var assert = chai.assert;
chai.use(require('chai-datetime'));
var users = require('../../fixtures/user');
const User = require('../../../api/model').User;


describe('UserModel', function () {
  var createAttrs, expectedAttrs;
  beforeEach(function () {
    createAttrs = (JSON.parse(JSON.stringify(users.allAttrs)));
    createAttrs.username.toUpperCase();   // shouldn't matter, saves as lower
    expectedAttrs = (JSON.parse(JSON.stringify(users.allAttrs)));
    expectedAttrs.id = 1;
    delete expectedAttrs.password;
  });

  describe('new user', function () {
    var user = {};
    beforeEach(function () {
      user = User.create(createAttrs);
    });
    describe('#create', function () {
      it('should have username', function () {
        assert.equal(user.username, expectedAttrs.username);
      });
      it('should have name', function () {
        assert.equal(user.name, expectedAttrs.name);
      });
      it('should not be an admin', function () {
        assert.equal(user.isAdmin, false);
      });
      it('should not be an agency admin', function () {
        assert.equal(user.isAgencyAdmin, false);
      });
      it('should not be disabled', function () {
        assert.equal(user.disabled, false);
      });
      it('should not have any completed tasks', function () {
        assert.equal(user.completedTasks, 0);
      });
      it('should not have any failed login attempts', function () {
        assert.equal(user.passwordAttempts, 0);
      });
    });
  });
});
