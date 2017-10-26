var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var LoginPasswordTemplate = require('../templates/login_password_template.html');

var LoginPasswordView = Backbone.View.extend({
  initialize: function (options) {
    this.options = options;
  },

  render: function () {
    var template = _.template(LoginPasswordTemplate);
    this.$el.html(template);
    return this;
  },

  cleanup: function () {
    removeView(this);
  },
});

module.exports = LoginPasswordView;
