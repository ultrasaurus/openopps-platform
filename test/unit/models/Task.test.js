const _ = require('lodash');
const chai = require('chai');
const assert = chai.assert;

const taskFixtures = require('../../fixtures/task');
const userFixtures = require('../../fixtures/user');
const models = require('../../../api/model');
const Task = models.Task;
const User = models.User;

describe('Task model', function () {
  var task;

  describe('default properties', function () {
    beforeEach(function () {
      task = Task.create({});
    });

    describe('attributes', function () {
      it('owner may be null', function () {
        assert.equal(task.owner, null);
      });
      it('state default to configured state', function () {
        assert.equal(task.state, openopps.taskState, 'badge should default to configured state');
      });
      it('publishedAt defaults to nil', function () {
        assert.equal(task.publishedAt, null, 'publishedAt defaults to null');
      });
      it('assignedAt defaults to nil', function () {
        assert.equal(task.assignedAt, null, 'assignedAt defaults to null');
      });
      it('completedAt defaults to nil', function () {
        assert.equal(task.completedAt, null, 'completedAt defaults to null');
      });
      it('submittedAt defaults to nil', function () {
        assert.equal(task.submittedAt, null, 'submittedAt defaults to null');
      });
    });
  });

  describe('.authorized', function () {
    describe('without user', function () {
      it('draft and submitted tasks are hidden', function () {
        ['draft', 'submitted'].forEach(function (state) {
          // we have a fixture named for each state
          var task = Task.create(taskFixtures[state]);
          result = Task.authorized(task, null);
          assert.equal(result, null, 'for state '+state);
        });
      });
      it('public tasks are visible', function () {
        (['open', 'assigned', 'completed', 'archived']).forEach(function (state) {
          // we have a fixture named for each state
          var task = Task.create(taskFixtures[state]);
          result = Task.authorized(task, null);
          assert.equal(result, task);
        });
      });
    });
    describe('with user not owner', function () {
      var owner, user;
      beforeEach(function () {
        owner = 1;
        user = User.create(userFixtures.minAttrs);
      });
      it('draft tasks are hidden', function () {
        var task = Task.create(taskFixtures.draft);
        task.owner = owner;
        result = Task.authorized(task, user);
        assert.equal(result, null);
      });
    });
    describe('with user owner', function () {
      var user;
      beforeEach(function () {
        user = User.create(userFixtures.minAttrs);
      });
      it('draft tasks are visible', function () {
        var task = Task.create(_.extend(taskFixtures.draft, { owner: user }));
        result = Task.authorized(task, user);
        assert.equal(result, task);
      });
    });
    describe('with user admin', function () {
      var user;
      beforeEach(function () {
        user = User.create(userFixtures.minAttrs);
        user.isAdmin = true;
      });
      it('draft tasks are visible', function () {
        Task.create(taskFixtures.draft);
        result = Task.authorized(task, user);
        assert.equal(result, task);
      });
    });
  });

  describe('.isOpen', function () {
    it('open, public and assigned tasks are open', function () {
      ['open', 'public', 'assigned'].forEach(function (state) {
        // we have a fixture named for each state
        var task = Task.create(taskFixtures[state]);
        result = Task.isOpen(task);
        assert.equal(result, true, 'for state '+state);
      });
    });
    it('closed, archived and completed tasks are not open', function () {
      ['closed', 'archived', 'completed'].forEach(function (state) {
        // we have a fixture named for each state
        var task = Task.create(taskFixtures[state]);
        result = Task.isOpen(task);
        assert.equal(result, false, 'for state '+state);
      });
    });
  });

  describe('.isClosed', function () {
    it('open, public and assigned tasks are not closed', function () {
      ['open', 'public', 'assigned'].forEach(function (state) {
        // we have a fixture named for each state
        var task = Task.create(taskFixtures[state]);
        result = Task.isClosed(task);
        assert.equal(result, false, 'for state '+state);
      });
    });
    it('closed, archived and completed tasks are closed', function () {
      ['closed', 'archived', 'completed'].forEach(function (state) {
        // we have a fixture named for each state
        var task = Task.create(taskFixtures[state]);
        result = Task.isClosed(task);
        assert.equal(result, true, 'for state '+state);
      });
    });
  });

  describe('owner attribute', function () {
    var task;
    beforeEach(function () {
      var user = User.create(userFixtures.minAttrs);
      task = Task.create(_.extend(taskFixtures.draft, { owner: user }));
    });

    it('populates object with correct data', function (done) {
      assert.property(task, 'owner');
      assert.equal(task.owner.username, userFixtures.minAttrs.username);
      done();
    });
  });

});
