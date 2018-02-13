var _ = require('underscore');
var Backbone = require('backbone');
var marked = require('marked');
var UIConfig = require('../../../../config/ui.json');
var TagConfig = require('../../../../config/tag');
var TaskListTemplate = require('../templates/task_list_template.html');
var TaskListItem = require('../templates/task_list_item.html');
var NoListItem = require('../templates/no_search_results.html');

var TaskListView = Backbone.View.extend({
  events: {
    'keyup #search': 'search',
    'change #stateFilters input': 'stateFilter',
    'change #js-restrict-task-filter': 'agencyFilter',
  },

  initialize: function (options) {
    this.el = options.el;
    this.collection = options.collection;
    this.queryParams = options.queryParams;
    this.term = this.queryParams.search;
    this.filters = this.queryParams.filters ?
      JSON.parse(this.queryParams.filters) : { state: 'open' };
    this.userAgency = window.cache.currentUser ? window.cache.currentUser.agency : {};
    this.initAgencyFilter();
  },

  render: function () {
    //var peopleToRender = this.collection.chain().pluck('attributes').value();
    var template = _.template(TaskListTemplate)({
      placeholder: 'I\'m looking for opportunities by name, agency, skill, topic, description...',
      user: window.cache.currentUser,
      ui: UIConfig,
      agencyName: this.userAgency.name,
      term: this.term,
      filters: this.filters.state,
    });
    this.$el.html(template);
    this.$el.localize();
    this.fetchData();
    return this;
  },

  fetchData: function () {
    var self = this;
    self.collection.fetch({
      success: function (collection) {
        self.tasks = collection.chain()
          .pluck('attributes')
          .filter( _.bind( filterTaskByAgency, self, self.agency ) )
          .filter( _.bind( filterTaskByTerm, self, self.term ) )
          .filter( _.bind( filterTaskByFilter, self, self.filters ) )
          .value();
        self.renderList();
      },
    });
  },

  renderList: function () {
    var self = this;
    $('#task-search-spinner').hide();
    $('#task-list').html('');
    var start = 0;
    var limit = Math.min(20, self.tasks.length);

    if (self.tasks.length === 0) {
      var settings = {
        ui: UIConfig,
      };
      compiledTemplate = _.template(NoListItem)(settings);
      $('#task-list').append(compiledTemplate);
    } else {
      for (var i = start; i < limit; i++) {
        var obj = self.tasks[i];
        obj.userId = obj.owner.id;
        var item = {
          item: obj,
          user: window.cache.currentUser,
          tagConfig: TagConfig,
          tagShow: ['location', 'skill', 'topic', 'task-time-estimate', 'task-time-required'],
        };
        if (self.tasks[i].tags) {
          item.tags = self.organizeTags(self.tasks[i].tags);
        } else {
          item.tags = [];
        }
        if (self.tasks[i].description) {
          item.item.descriptionHtml = marked(self.tasks[i].description);
        }
        $('#task-list').append(_.template(TaskListItem)(item));
      }
    }
  },

  organizeTags: function (tags) {
    // put the tags into their types
    return _(tags).groupBy('type');
  },

  isAgencyChecked: function () {
    return !!$( '#js-restrict-task-filter:checked' ).length;
  },

  initAgencyFilter: function () {
    this.agency = { data: {} };
    if (this.queryParams.agency) {
      // TODO: ideally we would be able to query the API for agencies
      // and look up the name via the abbreviation. This is basically
      // a hack to determine whether the current user's agency matches
      // the abbreviation passed in the query string.
      this.agency.data.abbr = this.queryParams.agency;
      if (this.userAgency.name &&
          this.userAgency.name.indexOf('(' + this.agency.data.abbr + ')') >= 0) {
        this.agency.data.name = this.userAgency.name;
      } else {
        this.agency.data.name = this.agency.data.abbr;
      }
    } else if (this.isAgencyChecked()) {
      this.agency.data = this.userAgency;
    }
  },

  search: function (event) {
    var $target = this.$(event.currentTarget);
    this.filter($target.val());
  },

  stateFilter: function (event) {
    var states = _($('#stateFilters input:checked')).pluck('value');
    if ( this.isAgencyChecked() ) {
      this.filter( undefined, { state: states }, this.agency );
    } else {
      this.filter(undefined, { state: states }, { data: {} });
    }
  },

  agencyFilter: function ( event ) {
    var isChecked = event.target.checked;
    var states = _( $( '#stateFilters input:checked' ) ).pluck( 'value' );
    this.initAgencyFilter();
    if ( isChecked ) {
      this.filter( undefined, { state: states }, this.agency );
    } else {
      this.filter(undefined, { state: states }, { data: {} });
    }
  },

  filter: function (term, filters, agency) {
    if (typeof term !== 'undefined') this.term = term;
    if (typeof filters !== 'undefined') this.filters = filters;
    if (typeof agency !== 'undefined') this.agency = agency;
    this.tasks = this.collection.chain()
      .pluck('attributes')
      .filter( _.bind( filterTaskByAgency, this, this.agency ) )
      .filter( _.bind( filterTaskByTerm, this, this.term ) )
      .filter( _.bind( filterTaskByFilter, this, this.filters ) )
      .value();
    this.renderList();
  },

  empty: function () {
    this.$el.html('');
  },

  cleanup: function () {
    removeView(this);
  },

});

function filterTaskByAgency ( agency, task ) {
  var getAbbr = _.property( 'abbr' );

  if ( _.isEmpty( agency.data ) ) {
    return task;
  }

  if ( getAbbr( agency.data ) === getAbbr( task.restrict ) ) {
    return _.property( 'restrictToAgency' )( task.restrict ) || _.property( 'projectNetwork' )( task.restrict );
  }

}

function filterTaskByTerm ( term, task ) {
  var searchBody = JSON.stringify( _.values( task ) ).toLowerCase();
  return ( ! term ) || ( searchBody.indexOf( term.toLowerCase() ) >= 0 );
}

function filterTaskByFilter ( filters, task ) {
  var test = [];
  _.each( filters, function ( value, key ) {
    if ( _.isArray( value ) ) {
      test.push( _.some( value, function ( val ) {
        return task[ key ] === val || _.contains( task[ key ], value );
      } ) );
    } else {
      test.push( task[ key ] === value || _.contains( task[ key ], value ) );
    }
  } );
  return test.length === _.compact(test).length;
}

module.exports = TaskListView;
