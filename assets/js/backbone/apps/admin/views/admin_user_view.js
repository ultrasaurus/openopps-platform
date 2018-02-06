// vendor libraries
var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var i18n = require('i18next');
var i18nextJquery = require('jquery-i18next');

// internal dependencies
var ModalComponent = require('../../../components/modal');
var AdminUserPasswordView = require('./admin_user_password_view');
var LoginConfig = require('../../../config/login.json');

// templates
var AdminUserTemplate = require('../templates/admin_user_template.html');
var AdminUserTable = require('../templates/admin_user_table.html');
var Paginate = require('../templates/admin_paginate.html');

var AdminUserView = Backbone.View.extend({

  events: {
    'click a.page'              : 'clickPage',
    'click .link-backbone'      : linkBackbone,
    'click #user-admin'         : 'toggleCheckbox',
    'click #user-agency-admin'  : 'toggleCheckbox',
    'click #user-enable'        : 'toggleCheckbox',
    'click .admin-user-unlock'  : 'adminUnlock',
    'click .user-reset'         : 'resetPassword',
    'keyup #user-filter'        : 'filter',
  },

  initialize: function (options) {
    this.options = options;
    this.data = {
      page: 1,
    };
  },

  render: function () {
    var self = this;
    var url = '/admin/users';
    if (this.options.agencyId) url = url + '/' + this.options.agencyId;
    Backbone.history.navigate(url);
    this.$el.show();
    if (this.rendered === true) {
      return this;
    }
    var data = {
      user: window.cache.currentUser,
      login: LoginConfig,
    };
    var template = _.template(AdminUserTemplate)(data);
    this.$el.html(template);
    this.rendered = true;
    // fetch user data
    this.fetchData(self, this.data);
    return this;
  },

  renderUsers: function (self, data) {
    data.urlbase = '/admin/users';
    data.q = data.q || '';
    // if the limit of results coming back hasn't been set yet
    // use the server's default
    if (!self.limit) {
      self.limit = data.limit;
    }
    data.trueLimit = self.limit;
    data.login = LoginConfig;
    data.user = window.cache.currentUser;
    // render the table
    var template = _.template(AdminUserTable)(data);
    // render the pagination
    self.renderPagination(data);
    self.$('#filter-count').html(data.users.length);
    self.$('.table-responsive').html(template);
    self.$('.btn').tooltip();
    // hide spinner and show results
    self.$('.spinner').hide();
    self.$('.table-responsive').show();
    window.scrollTo(0, 0);
    self.$el.localize();
  },

  renderPagination: function (data) {
    var self = this;
    data.pages = [];
    data.numberOfPages = Math.ceil(data.count/data.trueLimit);
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
    var paginate = _.template(Paginate)(data);
    self.$('#user-page').html(paginate);
  },

  clickPage: function (e) {
    var self = this;
    // if meta or control is held, or if the middle mouse button is pressed,
    // let the link process normally.
    // eg: open a new tab or window based on the browser prefs
    if ((e.metaKey === true) || (e.ctrlKey === true) || (e.which == 2)) {
      return;
    }
    if (e.preventDefault) e.preventDefault();
    // load this page of data
    this.fetchData(self, {
      page: $(e.currentTarget).data('page'),
      q: $($(e.currentTarget).parent('ul')[0]).data('filter'),
      limit: this.limit,
    });
  },

  filter: function (e) {
    // get the input box value
    var val = $(e.currentTarget).val().trim();
    // if the filter is the same, don't do anything
    if (val == this.q) {
      return;
    }
    this.q = val;
    // hide the table and show the spinner
    this.$('.table-responsive').hide();
    this.$('.spinner').show();
    // fetch this query, starting from the beginning page
    this.fetchData(this, {
      q: val,
    });
  },

  fetchData: function (self, data) {
    // perform the ajax request to fetch the user list
    var url = '/api/admin/users';
    if (self.options.agencyId) url = url + '/' + self.options.agencyId;

    $.ajax({
      url: url,
      dataType: 'json',
      data: data,
      success: function (data) {
        self.data = data;
        self.renderUsers(self, data);
        $('.tip').tooltip();
      },
    });
  },

  getUrlFor: function (id, elem) {
    switch (elem.data('action')) {
      case 'user':
        return '/api/user/' + (elem.prop('checked') ? 'enable' : 'disable') + '/' + id;
      case 'admin':
        return '/api/admin/admin/' + id + '?action=' + elem.prop('checked');
      case 'agencyAdmin':
        return '/api/admin/agencyAdmin/' + id + '?action=' + elem.prop('checked');
    }
  },

  toggleCheckbox: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    var id = $(t.parents('tr')[0]).data('id');
    this.updateUser(t, {
      id: id,
      checked: t.prop('checked'),
      url: this.getUrlFor(id, t),
    });
  },

  adminUnlock: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    var id = $(t.parents('tr')[0]).data('id');
    this.updateUser(t, {
      id: id,
      passwordAttempts: 0,
      url: '/api/admin/unlock/' + id,
    });

  },

  updateUser: function (t, data) {
    var self = this;
    var spinner = $($(t.parent()[0]).children('.icon-spin')[0]);
    // Show spinner and hide checkbox
    spinner.show();
    t.siblings('label').hide();
    if (data.url) {
      $.ajax({
        url: data.url,
        dataType: 'json',
        success: function (d) {
          // Hide spinner and show checkbox
          spinner.hide();
          t.siblings('label').show();
          t.prop('checked', data.checked);
        },
      });
    }
  },

  resetPassword: function (e) {
    if (e.preventDefault) e.preventDefault();
    if (this.passwordView) { this.passwordView.cleanup(); }
    if (this.modalComponent) this.modalComponent.cleanup();

    var tr = $($(e.currentTarget).parents('tr')[0]);
    var user = {
      id: tr.data('id'),
      name: $(tr.find('td.admin-table-name')[0]).text().trim(),
    };

    // set up the modal
    this.modalComponent = new ModalComponent({
      el: '#reset-password-container',
      id: 'reset-password-modal',
      modalTitle: 'Reset Password',
    }).render();

    // initialize the view inside the modal
    this.passwordView = new AdminUserPasswordView({
      el: '.modal-template',
      user: user,
    }).render();

    // render the modal
    this.$('#reset-password-modal').modal('show');
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminUserView;
