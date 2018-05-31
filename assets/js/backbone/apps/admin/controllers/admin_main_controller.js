
var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');

var BaseController = require('../../../base/base_controller');
var AdminMainView = require('../views/admin_main_view');
var ModalComponent = require('../../../components/modal');

var ChangeOwnerTemplate = require('../templates/change_owner_template.html').toString();
var AddParticipantTemplate = require('../templates/add_participant_template.html').toString();

var Admin = {};

Admin.ShowController = BaseController.extend({

  events: {
    'click .task-change-owner': 'changeOwner',
    'click .task-add-participant': 'addParticipant',
  },

  // Initialize the admin view
  initialize: function (options) {
    this.options    = options;
    this.data       = {};   

    this.adminMainView = new AdminMainView({
      action: options.action,
      agencyId: options.agencyId,
      el: this.el,
    }).render();
  },

  addParticipant: function (e) {
    if (event.preventDefault) event.preventDefault();
    var taskId = $(event.currentTarget).data('task-id');
    var title = $( event.currentTarget ).data('task-title');
    $.ajax({
      url: '/api/admin/changeOwner/' + taskId,
    }).done(function (data) {
      this.displayAddParticipantModal(event, { users: data, taskId: taskId, title: title });
    }.bind(this));
  },

  displayAddParticipantModal: function (e, data) {
    this.target = $(event.currentTarget).parent();
    if (this.modalComponent) { this.modalComponent.cleanup(); }

    var modalContent = _.template(AddParticipantTemplate)(data);
    
    $('body').addClass('modal-is-open');

    this.modalComponent = new ModalComponent({
      el: '#site-modal',
      id: 'add-participant',
      modalTitle: 'Add participant to this opportunity',
      modalBody: modalContent,
      validateBeforeSubmit: true,
      secondary: {
        text: 'Cancel',
        action: function () {
          this.modalComponent.cleanup();
        }.bind(this),
      },
      primary: {
        text: 'Add participant',
        action: function () {
          // this.modalComponent.cleanup();
          this.assignParticipant(e);
        }.bind(this),
      },  
    }).render();

    setTimeout(() => {
      this.initializeAddParticipantSearch();
    }, 100);
  },

  initializeAddParticipantSearch: function () {
    this.$('#task-add-participant').select2({
      placeholder: 'Search for a participant',
      minimumInputLength: 3,
      ajax: {
        url: '/api/ac/user',
        dataType: 'json',
        data: function (term) {
          return { q: term };
        },
        results: function (data) {
          return { results: data };
        },
      },
      // formatResult: repoFormatResult,
    });
    $('.select2-drop')[0].style['z-index'] = 1061;
  },

  assignParticipant: function (e) {
    if (e.preventDefault) e.preventDefault();
    // if (e.stopPropagation) e.stopPropagation();
    var assign = $(e.currentTarget).data('behavior') == 'assign';
    $.ajax({
      url: '/api/volunteer/assign',
      type: 'POST',
      data: {
        taskId: $('#task-add-participant').data('taskid'),
        volunteerId: $('#task-add-participant').select2('data').id,
        assign: assign,
      },
      success: function (data) {
        _.findWhere(this.data.model.volunteers, { id: data.id }).assigned = assign;
        this.initializeProgress();
      }.bind(this),
      error: function (err) {
        // display modal alert type error
      }.bind(this),
    });
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
