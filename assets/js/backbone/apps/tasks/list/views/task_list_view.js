var _ = require('underscore');
var Backbone = require('backbone');
var marked = require('marked');
var UIConfig = require('../../../../config/ui.json');
var TagConfig = require('../../../../config/tag');
var TagFactory = require('../../../../components/tag_factory');
var TaskListTemplate = require('../templates/task_list_template.html');
var TaskListItem = require('../templates/task_list_item.html');
var NoListItem = require('../templates/no_search_results.html');
var Pagination = require('../../../../components/pagination.html');
var TaskFilters = require('../templates/task_filters.html');
var SearchPills = require('../templates/search_pills.html');

var TaskListView = Backbone.View.extend({
  events: {
    'click #search-button'                    : 'search',
    'change #stateFilters input'              : 'stateFilter',
    'change #timeFilters input'               : 'timeFilter',
    'change input[name=location]'             : 'locationFilter',
    'click .stateFilters-toggle'              : 'toggleStateFilters',
    'click .timefilters-toggle'               : 'toggleTimeFilters',
    'click .locationfilters-toggle'           : 'toggleLocationFilters',
    'change #js-restrict-task-filter'         : 'agencyFilter',
    'click a.page'                            : 'clickPage',
    'click #search-tab-bar-filter'            : 'toggleFilter',
    'click .usajobs-search-filter-nav__back'  : 'toggleFilter',
    'click .usajobs-search-pills__item'       : 'removeFilter',
    'click #search-pills-remove-all'          : 'removeAllFilters',
  },

  initialize: function (options) {
    this.el = options.el;
    this.tagFactory = new TagFactory();
    this.collection = options.collection;
    this.queryParams = options.queryParams;
    this.term = this.queryParams.search;
    this.filters = { state: 'open' };
    _.each(_.omit(this.queryParams, 'search'), function (value, key) {
      var parts = value.split(',');
      this.filters[key] = _.map(parts, function (part) {
        return { type: key, name: part};
      });
    }.bind(this));
    this.userAgency = window.cache.currentUser ? window.cache.currentUser.agency : {};
    this.initAgencyFilter();
    this.taskFilteredCount = 0;
    this.appliedFilterCount = getAppliedFiltersCount(this.filters);
  },

  render: function () {
    var template = _.template(TaskListTemplate)({
      placeholder: '',
      user: window.cache.currentUser,
      ui: UIConfig,
      agencyName: this.userAgency.name,
      term: this.term,
      filters: this.filters,
      taskFilteredCount: this.taskFilteredCount,
      appliedFilterCount: this.appliedFilterCount,
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
        self.filter(self.term, self.filters, self.agency);
      },
    });
  },

  initializeSelect2: function () {
    ['series', 'skill', 'location'].forEach(function (tag) {
      var data = this.filters[tag] ? [].concat(this.filters[tag]) : [];
      if(tag == 'location') {
        data = _.filter(data, _.isObject);
      }
      this.tagFactory.createTagDropDown({
        type: tag,
        selector: '#' + tag,
        width: '100%',
        tokenSeparators: [','],
        allowCreate: false,
        maximumSelectionSize: (tag == 'skill' ? 5 : undefined),
        data: data,
      });
      $('#' + tag).on('change', function (e) {
        this.filters[tag] = _.map($(e.target).select2('data'), function (item) {
          return _.pick(item, 'type', 'name', 'id');
        });
        if(tag == 'location') {
          if($('#virtual').is(':checked')) {
            this.filters.location.push('virtual');
          }
          if($('#in-person').is(':checked')) {
            this.filters.location.push('in-person');
          }
        }
        this.filter(this.term, this.filters, { data: {} });
      }.bind(this));
    }.bind(this));
    if(!_.contains(this.filters.location, 'in-person')) {
      $('#location').siblings('.select2-container').hide();
    }
    $('#career').select2({
      placeholder: 'Select a career field',
      width: '100%',
      allowClear: true,
    });
    $('#career').on('change', function (e) {
      if($('#career').select2('data')) {
        this.filters.career = _.pick(JSON.parse($('#career').select2('data').id), 'type', 'name', 'id');
      } else {
        this.filters.career = [];
      }
      this.filter(this.term, this.filters, { data: {} });
    }.bind(this));
  },

  removeFilter: function (event) {
    event.preventDefault();
    var element = $(event.target).closest('.usajobs-search-pills__item');
    var type = element.data('type');
    var value = element.data('value');
    if(_.isArray(this.filters[type])) {
      if(type == 'location' && value == 'in-person') {
        this.filters[type] = _.filter(this.filters[type], function (filter) {
          return _.isEqual(filter, 'virtual'); // only return virtual if it exist
        });
      } else {
        this.filters[type] = _.filter(this.filters[type], function (filter) {
          return !_.isEqual(filter, value);
        });
      }
    } else if (_.isEqual(this.filters[type], value)) {
      this.filters[type] = [];
    }
    this.filter(this.term, this.filters, { data: {} });
  },

  removeAllFilters: function (event) {
    event.preventDefault();
    if(this.filters.career && this.filters.career.name == 'Acquisition') {
      this.filters = { state: [ 'open' ] };
    } else {
      this.filters = { state: [] };
    }
    this.filter(this.term, this.filters, { data: {} });
  },

  renderFilters: function () {
    var compiledTemplate = _.template(TaskFilters)({
      placeholder: '',
      user: window.cache.currentUser,
      ui: UIConfig,
      agencyName: this.userAgency.name,
      tagTypes: this.tagTypes,
      term: this.term,
      filters: this.filters,
      taskFilteredCount: this.taskFilteredCount,
      appliedFilterCount: this.appliedFilterCount,
    });
    $('#task-filters').html(compiledTemplate);
    compiledTemplate = _.template(SearchPills)({
      filters: this.filters,
      appliedFilterCount: this.appliedFilterCount,
    });
    $('#usajobs-search-pills').html(compiledTemplate);
    this.initializeSelect2();
    if((!_.isEmpty(this.filters.career) && this.filters.career.name.toLowerCase() == 'acquisition') || 
      _.find(this.filters.series, { name: '1102 (Contracting)' })) {
      $('.usajobs-open-opps-search__box').addClass('display-acquisition');
      $('#search-pills-remove-all').attr('title', 'Remove all filters to see all opportunities');
      $('#search-pills-remove-all').children('.text').text('Remove all filters to see all opportunities');
    } else {
      $('.usajobs-open-opps-search__box').removeClass('display-acquisition');
      $('#search-pills-remove-all').attr('title', 'Remove all filters');
      $('#search-pills-remove-all').children('.text').text('Remove all filters');
    }
    $('#search-tab-bar-filter-count').text(this.appliedFilterCount);
  },

  renderList: function (page) {
    $('#search-results-loading').hide();
    $('#task-list').html('');
    this.taskFilteredCount = this.tasks.length;
    this.appliedFilterCount = getAppliedFiltersCount(this.filters);
    $.ajax({
      url: '/api/ac/tag?type=career&list',
      type: 'GET',
      async: false,
      success: function (data) {
        this.tagTypes = { career: data };
        this.renderFilters();
      }.bind(this),
    });

    if (this.tasks.length === 0) {
      var settings = {
        ui: UIConfig,
      };
      compiledTemplate = _.template(NoListItem)(settings);
      $('#task-list').append(compiledTemplate);
      $('#task-page').hide();
    } else {
      $('#search-tab-bar-filter-count').text(this.appliedFilterCount);
      var pageSize = 20;
      var start = (page - 1) * pageSize;
      var stop = page * pageSize;
      $('#task-list').append(this.tasks.slice(start, stop).map(function (task) {
        task.owner.initials = getInitials(task.owner.name);
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

  toggleFilter: function (e) {
    var filterTab = this.$('#search-tab-bar-filter');
    if (filterTab.attr('aria-expanded') === 'true') {
      setTimeout(function () {
        $('#task-filters').css('display', 'none');

        $(filterTab).attr('aria-expanded', false);
        $('.usajobs-search-tab-bar__filters-default').attr('aria-hidden', 'false');
        $('.usajobs-search-tab-bar__filter-count-container').attr('aria-hidden', 'false');
        $('.usajobs-search-tab-bar__filters-expanded').attr('aria-expanded', false);
        $('.usajobs-search-filter-nav').attr('aria-hidden', 'true');

        $('#title').toggleClass('hide', false);
        $('.navigation').toggleClass('hide', false);
        $('#main-content').toggleClass('hide', false);
        $('.find-people').toggleClass('hide', false);
      }, 250);
    } else {
      setTimeout(function () {
        $(filterTab).attr('aria-expanded', true);
        $('.usajobs-search-tab-bar__filters-default').attr('aria-hidden', 'true');
        $('.usajobs-search-tab-bar__filter-count-container').attr('aria-hidden', 'true');
        $('.usajobs-search-tab-bar__filters-expanded').attr('aria-expanded', true);
        $('.usajobs-search-filter-nav').attr('aria-hidden', 'false');

        $('#title').toggleClass('hide', true);
        $('.navigation').toggleClass('hide', true);
        $('#main-content').toggleClass('hide', true);
        $('.find-people').toggleClass('hide', true);
        $('#task-filters').css('display', 'block');
      }, 250);
    }
  },

  search: function () {
    this.term = this.$('#search').val().trim();
    if (this.term.toLowerCase() == 'acquisition') {
      var item = _.find(this.tagTypes.career, function (t) { 
        return t.name.toLowerCase() == 'acquisition';
      });
      this.filters.career = _.pick(item, 'type', 'name', 'id');
      this.term = '';
      $('#search').val('');
    }
    this.filter(this.term, this.filters, { data: {} });
  },

  toggleStateFilters: function (event) {
    var behavior = $(event.currentTarget).data('behavior');
    var checkBoxes = $('#stateFilters input[type="checkbox"]');
    checkBoxes.prop('checked', behavior == 'select');
    this.stateFilter();
  },

  toggleTimeFilters: function (event) {
    var behavior = $(event.currentTarget).data('behavior');
    var checkBoxes = $('#timeFilters input[type="checkbox"]');
    checkBoxes.prop('checked', behavior == 'select');
    this.timeFilter();
  },

  toggleLocationFilters: function (event) {
    var behavior = $(event.currentTarget).data('behavior');
    var checkBoxes = $('#locationFilters input[type="checkbox"]');
    checkBoxes.prop('checked', behavior == 'select');
    this.locationFilter();
  },

  stateFilter: function (event) {
    this.filters.state = _($('#stateFilters input:checked')).pluck('value');
    if ( this.isAgencyChecked() ) {
      this.filter( this.term, this.filters, this.agency );
    } else {
      this.filter(this.term, this.filters, { data: {} });
    }
  },

  timeFilter: function (event) {
    this.filters.time = _($('#timeFilters input:checked')).pluck('value').map(function (value) {
      return { type: 'task-time-required', name: value };
    });
    this.filter(this.term, this.filters, { data: {} });
  },

  locationFilter: function (event) {
    if(!$('#in-person').is(':checked')) {
      $('#location').siblings('.select2-container').hide();
      $('#location').select2('data', null);
    } else {
      $('#location').siblings('.select2-container').show();
    }
    this.filters.location = _.map($('#location').select2('data'), function (item) {
      return _.pick(item, 'type', 'name', 'id');
    });
    if($('#virtual').is(':checked')) {
      this.filters.location.push('virtual');
    }
    if($('#in-person').is(':checked')) {
      this.filters.location.push('in-person');
    }
    this.filter(this.term, this.filters, { data: {} });
  },

  agencyFilter: function (event) {
    var isChecked = event.target.checked;
    this.filters.state = _( $( '#stateFilters input:checked' ) ).pluck( 'value' );
    this.initAgencyFilter();
    if ( isChecked ) {
      this.filter( this.term, this.filters, this.agency );
    } else {
      this.filter(this.term, this.filters, { data: {} });
    }
  },

  filter: function (term, filters, agency) {
    if (typeof term !== 'undefined') this.term = term;
    if (typeof filters !== 'undefined') this.filters = filters;
    if (typeof agency !== 'undefined') this.agency = agency;
    this.tasks = this.collection.chain()
      .pluck('attributes')
      .map( _.bind( parseTaskStatus, this ) )
      .filter( _.bind( filterTaskByAgency, this, this.agency ) )
      .filter( _.bind( filterTaskByTerm, this, this.term ) )
      .value();

    _.each(filters, function ( value, key ) {
      if(key == 'state') {
        this.tasks = this.tasks.filter(_.bind(filterTaskByState, this, value));
      } else if (key == 'location') {
        filter = _.filter(value, function (v) { return v != 'in-person'; });
        if(!_.isEmpty(filter)) {
          this.tasks = this.tasks.filter(_.bind(filterTaskByLocation, this, filter));
        }
      } else if (!_.isEmpty(value)) {
        this.tasks = this.tasks.filter(_.bind(filterTaskByTag, this, value));
      }
    }.bind(this));
    this.renderList(1);

    if ($('#search-tab-bar-filter').attr('aria-expanded') === 'true') {
      $('.usajobs-search-filter-nav').attr('aria-hidden', 'false');
    }
  },

  empty: function () {
    this.$el.html('');
  },

  cleanup: function () {
    removeView(this);
  },

});

function getAppliedFiltersCount (filters) {
  var count = 0;
  _.each(filters, function ( value, key ) {
    count += (_.isArray(value) ? value.length : 1);
  });
  return count;
}

function parseTaskStatus (task) {
  task.state = (task.state == 'in progress' && task.acceptingApplicants) ? 'open' : task.state;
  return task;
}

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

function filterTaskByState ( filters, task ) {
  var test = [];
  if (_.isArray(filters)) {
    test.push(_.some(filters, function (val) {
      return task.state === val || _.contains(task.state, val);
    }));
  } else {
    test.push(task.state === filters || _.contains(task.state, filters));
  }
  return test.length === _.compact(test).length;
}

function filterTaskByTag (filters, task) {
  var test = [];
  if (_.isArray(filters)) {
    test.push(_.some(filters,function (val) {
      return _.find(task.tags, val.id ? val : _.omit(val, 'id'));
    }));
  } else {
    test.push(_.find(task.tags, filters.id ? filters : _.omit(filters, 'id')));
  }
  return test.length === _.compact(test).length;
}

function filterTaskByLocation (filters, task) {
  var test = [];
  taskHasLocation = _.find(task.tags, { type: 'location'});
  if (_.isArray(filters)) {
    test.push(_.some(filters, function (val) {
      return ((val == 'virtual' && !taskHasLocation) || _.find(task.tags, val));
    }));
  } else {
    test.push((filters == 'virtual' && !taskHasLocation) || _.find(task.tags, filters));
  }
  return test.length === _.compact(test).length;
}

module.exports = TaskListView;
