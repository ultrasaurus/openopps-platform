
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

  changeOwner: function (e) {
    if (e.preventDefault) e.preventDefault();
    var self = this;

    if (this.modalComponent) { this.modalComponent.cleanup(); }

    var modalContent = _.template(ChangeOwnerTemplate)({});

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
          this.modalComponent.cleanup();
        }.bind(this),
      },
      primary: {
        text: 'Change owner',
        action: function () {
          $.ajax({
            url: '/api/task/copy',
            method: 'POST',
            data: {
              taskId: self.model.attributes.id,
              title: $('#task-change-owner').val(),
            },
          }).done(function (data) {
            self.modalComponent.cleanup();
            self.options.router.navigate('/tasks/' + data.taskId + '/edit',
              { trigger: true });
          });
        },
      },
    }).render();
  },

  // Cleanup controller and views
  cleanup: function () {
    this.adminMainView.cleanup();
    removeView(this);
  },

});

module.exports = Admin.ShowController;
