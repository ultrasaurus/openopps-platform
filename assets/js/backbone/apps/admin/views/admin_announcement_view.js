var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var MarkdownEditor = require('../../../components/markdown_editor');
var AdminAnnouncementTemplate = require('../templates/admin_announcement_template.html');

var AdminAnnouncementView = Backbone.View.extend({

  events: {
    'click .link'               : 'link',
    'submit #announcement-form' : 'announcementSubmit',
  },

  initialize: function (options) {
    this.options = options;
    this.adminMainView = options.adminMainView;
    this.announcement;
  },

  render: function (replace) {
    var self = this;
    this.$el.show();

    // get meta data for announcement
    $.ajax({
      url: '/api/admin/announcement',
      dataType: 'json',
      success: function (announcementInfo) {
        self.announcement = data.rows.content;
        // var template = _.template(AdminAnnouncementTemplate)(data);
        // self.$el.html(template);
        // self.$el.localize();

        // announcementInfo.slug = announcementInfo.data.abbr.toLowerCase();
        // announcementInfo.data.domain = announcementInfo.data.domain;
        var template = _.template(AdminAnnouncementTemplate, {
          variable: 'announcement',
        })(announcementInfo);
        self.$el.html(template);
      },
    });

    // var template = _.template(AdminAnnouncementTemplate)(data);
    // self.$el.html(template);
    // self.$el.localize();
    
    Backbone.history.navigate('/admin/announcement/' + this.data.announcement.slug, { replace: replace });
    
    // DOM now exists, begin select2 init
    this.initializeTextAreaAnnouncement();

    return this;
  },

  initializeTextAreaAnnouncement: function () {
    if (this.md) { this.md.cleanup(); }
    this.md = new MarkdownEditor({
      data: '',
      el: '.markdown-edit',
      id: 'announcement',
      placeholder: '',
      title: 'Announcement',
      rows: 6,
      validate: ['empty','html'],
    }).render();
  },

  announcementSubmit: function (e) {
    e.preventDefault();

    $('#submit').button('loading');

    //need save function

  },

  link: function (e) {
    if (e.preventDefault) e.preventDefault();
    var t = $(e.currentTarget);
    this.adminMainView.routeTarget(t.data('target'), this.data.announcement.slug);
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = AdminAnnouncementView;
