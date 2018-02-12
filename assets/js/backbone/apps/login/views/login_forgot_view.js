var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var TagFactory = require('../../../components/tag_factory');
var User = require('../../../../utils/user');
var LoginForgotTemplate = require('../templates/login_forgot_template.html');

var LoginForgotView = Backbone.View.extend({
  el: '#container',
  
  events: {
    'click .oauth-link'       : 'link',
    'keyup .validate'         : 'validateField',
    'change .validate'        : 'validateField',
    'blur .validate'          : 'validateField',
    // 'keyup #fusername'        : 'checkUsername',
    // 'change #fusername'       : 'checkUsername',
    'submit #forgot-form'     : 'submitForgot',
  },
  
  initialize: function (options) {
    this.options = options;
    this.tagFactory = new TagFactory();
  },
  
  render: function () {
    var self = this;
    var data = {
      login: this.options.login,
      message: this.options.message,
    };

    var template = _.template(LoginForgotTemplate)(data);
    this.$el.html(template);
    this.$el.localize();
  
    setTimeout(function () {
      self.$('#fusername').focus();
    }, 500);
    return this;
  },
  
  link: function (e) {
    if (e.preventDefault) e.preventDefault();
    var link = $(e.currentTarget).attr('href');
    window.location.href = link;
  },
  
  validateField: function (e) {
    return validate(e);
  },

  // checkUsername: function (e) {
  //   var username = $('#fusername').val();
  //   $.ajax({
  //     url: '/api/user/username/' + username,
  //   }).done(function (data) {
  //     if (data) {
  //       // username is taken
  //       $('#fusername').closest('.required-input').addClass('usa-input-error');
  //       $('#fusername').closest('.required-input').find('.field-validation-error').show();
  
  //     } else {
  //       // username is available
  //       $('#fusername').closest('.required-input').removeClass('usa-input-error');
  //       $('#fusername').closest('.required-input').find('.field-validation-error').hide();
  //     }
  //   });
  // },
  
  submitForgot: function (e) {
    var self = this;
    if (e.preventDefault) e.preventDefault();
    var data = {
      username: this.$('#fusername').val(),
    };
    // Post the registration request to the server
    $.ajax({
      url: '/api/auth/forgot',
      type: 'POST',
      data: data,
    }).done(function (success) {
    // Set the user object and trigger the user login event
      self.$('#forgot-done-view').show();
    }).fail(function (error) {
      var d = JSON.parse(error.responseText);
      self.$('#forgot-error').html(d.message);
      self.$('#forgot-error').show();
    });
  },   
});
   
module.exports = LoginForgotView;