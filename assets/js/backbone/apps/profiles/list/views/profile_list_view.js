var _ = require('underscore');
var Backbone = require('backbone');
var ProfileListTemplate = require('../templates/profile_list_template.html');
var ProfileListTable = require('../templates/profile_list_table.html');

var PeopleListView = Backbone.View.extend({
  initialize: function (options) {
    this.el = options.el;
    this.collection = options.collection;
  },

  render: function () {
    //var peopleToRender = this.collection.chain().pluck('attributes').value();
    var template = _.template(ProfileListTemplate)({});
    this.$el.html(template);
    this.$el.localize();
    this.fetchData();
  },

  fetchData: function () {
    var self = this;
    self.collection.fetch({
      success: function (collection) {
        var peopleToRender = collection.chain().pluck('attributes').value();
        var template = _.template(ProfileListTable)({ people: peopleToRender });
        self.$('#browse-search-spinner').hide();
        self.$('.table-responsive').html(template);
      },
    });
  },

  empty: function () {
    this.$el.html('');
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = PeopleListView;
