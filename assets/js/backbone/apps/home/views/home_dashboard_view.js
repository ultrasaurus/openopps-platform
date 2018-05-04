var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');
var $ = require('jquery');

var ActivityCollection = window.c = require('../../../entities/activities/activities_collection');
var TaskCollection = require('../../../entities/tasks/tasks_collection');
var UIConfig = require('../../../config/ui.json');
var User = require('../../../../utils/user');

// templates
var TaskListView = require('../../tasks/list/views/task_list_view');
var TasksCollection = require('../../../entities/tasks/tasks_collection');
var DashboardTemplate = require('../templates/home_dashboard_template.html');
var AnnoucementTemplate = require('../templates/home_annoucement_template.html');
var SearchTemplate = require('../templates/home_search_template.html');
var UsersTemplate = require('../templates/home_users_feed_template.html');
var AchievementsTemplate = require('../templates/home_achievements_template.html');

var templates = {
  main: _.template(DashboardTemplate),
  annoucement: _.template(AnnoucementTemplate),
  users: _.template(UsersTemplate),
  search: _.template(SearchTemplate),
  achievements: _.template(AchievementsTemplate),
};

var DashboardView = Backbone.View.extend({
  el: '#container',
  initialize: function (options) {
    this.options = options;
    this.queryParams = {};
    this.fireUpCollection();
    this.initializeView();
    this.collection.trigger('browse:task:fetch');
    return this;
  },

  initializeView: function () {
    if (this.taskListView) {
      this.taskListView.cleanup();
    }
    this.taskListView = new TaskListView({
      el: '#task-list',
      collection: this.collection,
      queryParams: this.queryParams,
    });
  },

  fireUpCollection: function () {
    var self = this;
    this.collection = new TasksCollection();
    this.listenToOnce(this.collection, 'browse:task:fetch', function () {
      self.collection.fetch({
        success: function (collection) {
          var userAgency;
          self.collection = collection;
          self.taskListView.collection = collection;
          if (window.cache.currentUser) {
            userAgency = _.where(window.cache.currentUser.tags, { type: 'agency' })[0];
          }
          self.taskListView.filter( undefined, { state: 'open' }, userAgency );
        },
      });
    });
  },

  render: function () {
    var self            = this,
        achievements    = new ActivityCollection({ type: 'badges' }),
        users           = new ActivityCollection({ type: 'users' }),
        search          = new ActivityCollection({ type: 'search' }),
        tasks           = new TaskCollection();

    this.$el.html(templates.main());

    /*
     * Listen for achievements. This callback function uses Backbone's trigger method
     * to retrieve the achievements information whenever the ActivityCollection is
     * fetched successfully.
     * @param ActivityCollection | An activity collection.
     * @param String             | A Backbone event string to bind to..
     * @param Function           | A callback function containing the event data.
     * @see   /assets/js/backbone/entities/activities/activities_collection.js
     */
    this.listenTo(achievements, 'activity:collection:fetch:success', function  (e) {
      var bs = e.toJSON().filter(function (b) {     
        return b.participants.length > 0;
      });
      
      var achievementsHtml = templates.achievements({ achievements: bs });
      self.setTarget('achievements-feed', achievementsHtml);
    });

    this.listenTo(users, 'activity:collection:fetch:success', function (e) {
      var data = { users: e.toJSON() },
          usersHtml = templates.users(data);
      self.setTarget('users-feed', usersHtml);
    });

    this.listenTo(search, 'activity:collection:fetch:success', function (e) {
      var data = { search: e.toJSON() },
          searchHtml = templates.search(data);
      self.setTarget('search-feed', searchHtml);
    });
    
    annoucementHtml = templates.annoucement();
    self.setTarget('annoucement-feed', annoucementHtml);

    var collection = this.collection.chain().pluck('attributes').filter(function (item) {
      // filter out tasks that are full time details with other agencies
      var userAgency = { id: false },
          timeRequiredTag = _.where(item.tags, { type: 'task-time-required' })[0],
          fullTimeTag = false;

      if (window.cache.currentUser) {
        userAgency = _.where(window.cache.currentUser.tags, { type: 'agency' })[0];
      }

      if (timeRequiredTag && timeRequiredTag.name === 'Full Time Detail') {
        fullTimeTag = true;
      }

      if (!fullTimeTag) return item;
      if (fullTimeTag && userAgency && (timeRequiredTag.data.agency.id === userAgency.id)) return item;
    }).filter(function (data) {
      var searchBody = JSON.stringify(_.values(data)).toLowerCase();
      return !term || searchBody.indexOf(term.toLowerCase()) >= 0;
    }).filter(function (data) {
      var test = [];
      _.each(filters, function (value, key) {
        if (_.isArray(value)) {
          test.push(_.some(value, function (val) {
            return data[key] === val || _.contains(data[key], value);
          }));
        } else {
          test.push(data[key] === value || _.contains(data[key], value));
        }
      });
      return test.length === _.compact(test).length;
    }).value();

    this.$el.localize();
    return this;
  },
  setTarget: function (target, inner) {
    var s = '[data-target=' + target + ']';
    $(s).html(inner);
  },
  cleanup: function () {
    this.$el.removeClass('home');
    removeView(this);
  },
});

module.exports = DashboardView;
