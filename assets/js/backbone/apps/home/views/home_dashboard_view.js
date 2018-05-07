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
    this.initializeView();
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

  render: function () {
    var self = this;
    var achievements = new ActivityCollection({ type: 'badges' });
    var users = new ActivityCollection({ type: 'users' });
    var search = new ActivityCollection({ type: 'search' });

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
    this.listenTo(search, 'activity:collection:fetch:success', function (e) {
      var data = { search: e.toJSON()[0] };
      var searchHtml = templates.search(data);
      self.setTarget('search-feed', searchHtml);
    });

    this.listenTo(achievements, 'activity:collection:fetch:success', function  (e) {
      var bs = e.toJSON().filter(function (b) {     
        return b.participants.length > 0;
      });
      
      var achievementsHtml = templates.achievements({ achievements: bs });
      self.setTarget('achievements-feed', achievementsHtml);
    });

    this.listenTo(users, 'activity:collection:fetch:success', function (e) {
      var data = { users: e.toJSON()[0] };
      var usersHtml = templates.users(data);
      self.setTarget('users-feed', usersHtml);
    });
    
    annoucementHtml = templates.annoucement();
    self.setTarget('annoucement-feed', annoucementHtml);

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
