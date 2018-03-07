var _ = require('underscore');
var Backbone = require('backbone');
var marked = require('marked');
var UIConfig = require('../../../../config/ui.json');
var TagConfig = require('../../../../config/tag');
var TaskListTemplate = require('../templates/task_list_template.html');
var TaskListItem = require('../templates/task_list_item.html');
var NoListItem = require('../templates/no_search_results.html');
var Pagination = require('../../../../components/pagination.html');

var TaskListView = Backbone.View.extend({
  events: {
    'keyup #search'                   : 'search',
    'change #stateFilters input'      : 'stateFilter',
    'click #select-all-filters'       : 'selectAllStateFilter',
    'change #js-restrict-task-filter' : 'agencyFilter',
    'click a.page'                    : 'clickPage',
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
        self.collection = collection;
        self.tasks = collection.chain()
          .pluck('attributes')
          .filter( _.bind( filterTaskByAgency, self, self.agency ) )
          .filter( _.bind( filterTaskByTerm, self, self.term ) )
          .filter( _.bind( filterTaskByFilter, self, self.filters ) )
          .value();
        self.renderList(1);
      },
    });
  },

  renderList: function (page) {
    $('#task-search-spinner').hide();
    $('#task-list').html('');
    if (this.tasks.length === 0) {
      var settings = {
        ui: UIConfig,
      };
      compiledTemplate = _.template(NoListItem)(settings);
      $('#task-list').append(compiledTemplate);
      $('#task-page').hide();
    } else {
      var pageSize = 20;
      var start = (page - 1) * pageSize;
      var stop = page * pageSize;
      $('#task-list').append(this.tasks.slice(start, stop).map(function (task) {
        return this.renderItem(task);
      }.bind(this)));
      this.renderPagination({
        page: page,
        numberOfPages: Math.ceil(this.tasks.length/pageSize),
        pages: [],
      });
    }
  },

  renderItem: function (task) {
    var obj = task;
    obj.userId = obj.owner.id;
    var item = {
      item: obj,
      user: window.cache.currentUser,
      tagConfig: TagConfig,
      tagShow: ['location', 'skill', 'topic', 'task-time-estimate', 'task-time-required'],
    };
    if (task.tags) {
      item.tags = this.organizeTags(task.tags);
    } else {
      item.tags = [];
    }
    if (task.description) {
      item.item.descriptionHtml = marked(task.description);
    }
    return _.template(TaskListItem)(item);
  },

  clickPage: function (e) {
    if (e.preventDefault) e.preventDefault();
    this.renderList($(e.currentTarget).data('page'));
    window.scrollTo(0, 0);
  },

  renderPagination: function (data) {
    if(data.numberOfPages < 8) {
      for (var j = 1; j <= data.numberOfPages; j++)
        data.pages.push(j);
    } else if (data.page < 5) {
      data.pages = [1, 2, 3, 4, 5, 0, data.numberOfPages];
    } else if (data.page >= data.numberOfPages - 3) {
      data.pages = [1, 0];
      for (var i = data.numberOfPages - 4; i <= data.numberOfPages; i++)
        data.pages.push(i);
    } else {
      data.pages = [1, 0, data.page - 1, data.page, data.page + 1, 0, data.numberOfPages];
    }
    var pagination = _.template(Pagination)(data);
    $('#task-page').html(pagination);
    $('#task-page').show();
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

  selectAllStateFilter: function() {
    var checkBoxes = $('#stateFilters input[type="checkbox"]');
    checkBoxes.prop('checked', !checkBoxes.prop('checked'));

    var states = _($('#stateFilters input:checked')).pluck('value');
    this.filter(undefined, { state: states }, { data: {} });
  },

  stateFilter: function (event) {
    var states = _($('#stateFilters input:checked')).pluck('value');
    if ( this.isAgencyChecked() ) {
      this.filter( undefined, { state: states }, this.agency );
    } else {
      this.filter(undefined, { state: states }, { data: {} });
    }
  },

  agencyFilter: function (event) {
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
    this.renderList(1);
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
