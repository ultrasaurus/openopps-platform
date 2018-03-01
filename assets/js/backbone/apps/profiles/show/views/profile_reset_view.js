// vendor libraries
var $ = require('jquery');
var _ = require('underscore');
var async = require('async');
var Backbone = require('backbone');

// internal dependencies
var LoginPasswordView = require('../../../login/views/login_password_view');

// templates
var ProfileResetTemplate = require('../templates/profile_reset_template.html');

var ProfileResetView = Backbone.View.extend({

  events: {
    'keyup #rpassword'            : 'checkPassword',
    'blur #rpassword'             : 'checkPassword',
    'keyup #rpassword-confirm'    : 'checkPasswordConfirm',
    'blur #rpassword-confirm'     : 'checkPasswordConfirm',
    'submit #form-password-reset' : 'submitReset',
  },

  initialize: function (options) {
    this.options = options;
    this.data = options.data;
  },

  render: function () {
    var data = {
      user: window.cache.currentUser || {},
    };
    var template = _.template(ProfileResetTemplate)(data);
    this.$el.html(template);
    this.loginPasswordView = new LoginPasswordView({
      el: this.$('.password-view'),
    }).render();
    this.checkValidCode(this.options.action);
    return this;
  },

  checkPassword: function (e) {
    var rules = validatePassword(this.token.email, this.$('#rpassword').val());
    var valuesArray = _.values(rules);
    var validRules = _.every(valuesArray);
    var success = true;
    if (validRules === true) {
      $('#rpassword').closest('.required-input').removeClass('usa-input-error');
      $('#rpassword').closest('.required-input').find('.field-validation-error').hide();
    } else {
      $('#rpassword').closest('.required-input').addClass('usa-input-error');
      $('#rpassword').closest('.required-input').find('.field-validation-error.error-password').show();
    }
    _.each(rules, function (value, key) {
      if (value === true) {
        $('.password-rules .success.rule-' + key).show();
        $('.password-rules .error.rule-' + key).hide();
      } else {
        $('.password-rules .success.rule-' + key).hide();
        $('.password-rules .error.rule-' + key).show();
      }
      success = success && value;
    });
    return success;
  },

  checkPasswordConfirm: function (e) {
    var success = true;
    var password = this.$('#rpassword').val();
    var confirm = this.$('#rpassword-confirm').val();
    if (password === confirm) {
      $('#rpassword-confirm').closest('.required-input').removeClass('usa-input-error');
      $('#rpassword-confirm').closest('.required-input').find('.field-validation-error').hide();
    } else {
      $('#rpassword-confirm').closest('.required-input').addClass('usa-input-error');
      $('#rpassword-confirm').closest('.required-input').find('.field-validation-error').show();
      success = false;
    }
    return success;
  },

  checkValidCode: function (code) {
    var self = this;
    // check if the code is valid and update the DOM accordingly
    $.ajax({
      url: '/api/auth/checkToken/' + code,
      success: function (data) {
        self.$('#profile-reset-check').hide();
        // true means the token is a valid reset token
        if (data === false) {
          self.$('#profile-reset-check-error').show();
        }
        else {
          self.token = data;
          self.$('#profile-reset-dialog').show();
        }
      },
      error: function (data) {
        self.$('#profile-reset-check').hide();
        self.$('#profile-reset-check-error').show();
      },
    });
  },

  submitReset: function (e) {
    var self = this;
    if (e.preventDefault) e.preventDefault();

    var passwordSuccess = this.checkPassword();
    var parent = $(this.$('#rpassword').parents('.form-group')[0]);
    if (passwordSuccess !== true) {
      parent.addClass('usa-input-error');
      $(parent.find('.error-password')[0]).show();
      return;
    } else {
      $(parent.find('.error-password')[0]).hide();
    }
    var passwordConfirmSuccess = this.checkPasswordConfirm();
    var passwordConfirmParent = $(this.$('#rpassword-confirm').parents('.required-input')[0]);
    if (passwordConfirmSuccess !== true) {
      passwordConfirmParent.addClass('usa-input-error');
      $(passwordConfirmParent.find('.error-password')[0]).show();
      return;
    } else {
      $(passwordConfirmParent.find('.error-password')[0]).hide();
    }

    var data = {
      token: this.options.action,
      password: this.$('#rpassword').val(),
      json: true,
    };
    self.$('#profile-reset-submit').show();
    self.$('#profile-reset-submit-error').hide();
    $.ajax({
      url: '/api/auth/reset/',
      type: 'POST',
      data: data,
      success: function (data) {
        self.$('#profile-reset-submit').hide();
        if (data === false) {
          self.$('#profile-reset-submit-error').show();
        }
        else {
          Backbone.history.navigate('/', { trigger: true });
          // show log in screen with notice to log in.
          window.cache.userEvents.trigger('user:request:login', {
            message: 'Your password has been reset.  Please log in to continue.',
          });
        }
      },
      error: function (data) {
        self.$('#profile-reset-submit').hide();
        self.$('#profile-reset-submit-error').show();
      },
    });
  },

  cleanup: function () {
    removeView(this);
  },

});

module.exports = ProfileResetView;
