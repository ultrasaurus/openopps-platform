
var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');

var BaseController = require('../../../base/base_controller');
var AdminMainView = require('../views/admin_main_view');
var ModalComponent = require('../../../components/modal');
var ChangeOwnerTemplate = require('../templates/change_owner_template.html').toString();

var Admin = {};

Admin.ShowController = BaseController.extend({

  events: {
    'click .task-change-owner': 'changeOwner',
  },

  // Initialize the admin view
  initialize: function (options) {
    this.options = options;
    this.adminMainView = new AdminMainView({
      action: options.action,
      agencyId: options.agencyId,
      el: this.el,
    }).render();
  },

  changeOwner: function (event) {
    if (event.preventDefault) event.preventDefault();
    var taskId = $(event.currentTarget).data('task-id');
    var title = $( event.currentTarget ).data('task-title');
    $.ajax({
      url: '/api/admin/changeOwner/' + taskId,
    }).done(function (data) {
      this.displayChangeOwnerModal(event, { users: data, taskId: taskId, title: title });
    }.bind(this));
  },

  displayChangeOwnerModal: function (event, data) {
    this.target = $(event.currentTarget).parent();
    if (this.modalComponent) { this.modalComponent.cleanup(); }
    var modalContent = _.template(ChangeOwnerTemplate)(data);
    $('body').addClass('modal-is-open');

    this.modalComponent = new ModalComponent({
      el: '#site-modal',
      id: 'change-owner',
      modalTitle: 'Change owner of this opportunity',
      modalBody: modalContent,
      validateBeforeSubmit: true,
      secondary: {
        text: 'Cancel',
        action: function () {
          $('#task-change-owner').select2('destroy');
          this.modalComponent.cleanup();
        }.bind(this),
      },
      primary: {
        text: 'Change owner',
        action: function () {
          $('#task-change-owner').select2('close');
          if(!validate( { currentTarget: $('#task-change-owner') } )) { // validate returns true if has validation errors
            $.ajax({
              url: '/api/admin/changeOwner',
              method: 'POST',
              data: {
                taskId: $('#task-change-owner').data('taskid'),
                userId: $('#task-change-owner').select2('data').id,
              },
            }).done(function (data) {
              var newAuthor = '<a href="/profile/' + data.id + '">' + data.name + '</a>';
              this.target.siblings('.metrics-table__author').html(newAuthor);
              this.target = undefined;
              $('#task-change-owner').select2('destroy');
              this.modalComponent.cleanup();
            }.bind(this));
          }
        }.bind(this),
      },
    }).render();
    setTimeout(() => {
      this.initializeChangeOwnerOptions();
    }, 100);
  },

  initializeChangeOwnerOptions: function () {
    $('#task-change-owner').select2({
      placeholder: 'Select a new owner',
      width: '100%',
      allowClear: true,
      dropdownCssClass: 'select2-drop-modal',
    });
    $('#task-change-owner').on('change', function (e) {
      validate({ currentTarget: $('#task-change-owner') });
    }.bind(this));
  },

  // Cleanup controller and views
  cleanup: function () {
    this.adminMainView.cleanup();
    removeView(this);
  },

});

module.exports = Admin.ShowController;
