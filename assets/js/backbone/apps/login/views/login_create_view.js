var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var LoginPasswordView = require('./login_password_view');
var TagFactory = require('../../../components/tag_factory');
var User = require('../../../../utils/user');

var LoginCreateTemplate = require('../templates/login_create_template.html');


var LoginCreateView = Backbone.View.extend({
  el: '#container',

  events: {
    'click .oauth-link' : 'link',
    'keyup .validate'   : 'validateField',
    'change .validate'  : 'validateField',
    'blur .validate'    : 'validateField',
    'keyup #rusername'  : 'checkUsername',
    'change #rusername' : 'checkUsername',
    'click #rusername-button'     : 'clickUsername',
    'keyup #rpassword'            : 'checkPassword',
    'blur #rpassword'             : 'checkPassword',
    'keyup #rpassword-confirm'    : 'checkPasswordConfirm',
    'blur #rpassword-confirm'     : 'checkPasswordConfirm',
    'submit #registration-form'   : 'submitRegister',
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
    var template = _.template(LoginCreateTemplate)(data);
    this.$el.html(template);
    this.$el.localize();
    this.loginPasswordView = new LoginPasswordView({
      el: this.$('.password-view'),
    }).render();

    if (data.login.agency.enabled === true || data.login.agency.enabled === true) {

      if (data.login.agency.enabled === true) {
        var agencyTags = this.tagFactory.createTagDropDown({
          type: 'agency',
          selector: '#ragency',
          width: '100%',
          multiple: false,
          allowCreate: false,
          blurOnChange: true,
        });
      }

      if (data.login.location.enabled === true) {
        var locationTags = this.tagFactory.createTagDropDown({
          type: 'location',
          selector: '#rlocation',
          width: '100%',
          multiple: false,
          blurOnChange: true,
        });
      }
    }

    setTimeout(function () {
      self.$('#rname').focus();
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

  submitRegister: function (e) {
    var self = this,
        $submitButton = self.$('#registration-form [type="submit"]');
    if (e.preventDefault) e.preventDefault();

    // validate input fields
    var validateIds = ['#rname', '#rusername', '#rpassword', '#rterms'];

    if (this.options.login.agency.enabled === true) {
      validateIds.push('#ragency');
    }
    if (this.options.login.location.enabled === true) {
      validateIds.push('#rlocation');
    }

    var abort = false;
    for (var i in validateIds) {
      var iAbort = validate({ currentTarget: validateIds[i] });
      abort = abort || iAbort;
    }
    var passwordSuccess = this.checkPassword();
    var parent = $(this.$('#rpassword').parents('.required-input')[0]);
    if (passwordSuccess !== true) {
      parent.addClass('usa-input-error');
      $(parent.find('.error-password')[0]).show();
    } else {
      $(parent.find('.error-password')[0]).hide();
    }
    var passwordConfirmSuccess = this.checkPasswordConfirm();
    var passwordConfirmParent = $(this.$('#rpassword-confirm').parents('.required-input')[0]);
    if (passwordConfirmSuccess !== true) {
      passwordConfirmParent.addClass('usa-input-error');
      $(passwordConfirmParent.find('.error-password')[0]).show();
    } else {
      $(passwordConfirmParent.find('.error-password')[0]).hide();
    }

    // Create a data object with the required fields
    var data = {
      name: this.$('#rname').val(),
      username: this.$('#rusername').val(),
      password: this.$('#rpassword').val(),
      terms: (this.$('#rterms').val() === 'on'),
      tags: [],
      json: true,
    };

    if (this.options.login.agency.enabled === true) {
      data.tags.push(this.$('#ragency').select2('data'));
    }

    if (this.options.login.location.enabled === true) {
      data.tags.push(this.$('#rlocation').select2('data'));
    }

    // Process tags
    data.tags = _(data.tags).chain()
      .filter(function (tag) {
        return _(tag).isObject() && !tag.context;
      })
      .map(function (tag) {
        return (tag.id && tag.id !== tag.name) ? +tag.id : {
          name: tag.name,
          type: tag.tagType,
          data: tag.data,
        };
      }).unique().value();

    // Post the registration request to the server
    $.ajax({
      url: '/api/auth/local/register',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data),
    }).done(function (success) {
      $.ajax({
        url: '/api/user',
        dataType: 'json',
      }).done(function (data) {
        // Set the user object and trigger the user login event
        var user = new User(data);
        console.log('registered', user);
        window.cache.currentUser = user;
        window.cache.userEvents.trigger('user:login:success', user);
      });
    }).fail(function (error) {
      var d = JSON.parse(error.responseText);
      self.$('#registration-error-text').html(d.message);
      self.$('#registration-error').show();
    });
  },

  checkUsername: function (e) {
    var username = $('#rusername').val();
    $.ajax({
      url: '/api/user/username/' + username,
    }).done(function (data) {
      if (data) {
        // username is taken
        $('#rusername').closest('.required-input').addClass('usa-input-error');
        $('#rusername').closest('.required-input').find('.field-validation-error.error-email').show();
  
      } else {
        // username is available
        $('#rusername').closest('.required-input').removeClass('usa-input-error');
        $('#rusername').closest('.required-input').find('.field-validation-error.error-email').hide();
      }
    });
  },

  checkPassword: function (e) {
    var rules = validatePassword($('#rusername').val(), $('#rpassword').val());
    var valuesArray = _.values(rules);
    var validRules = _.every(valuesArray);
    var success = true;
    if (validRules === true) {
      $('#rpassword').closest('.required-input').removeClass('usa-input-error');
      $('#rpassword').closest('.required-input').find('.field-validation-error').hide();
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

  clickUsername: function (e) {
    e.preventDefault();
  },

  cleanup: function () {
    if (this.loginPasswordView) { this.loginPasswordView.cleanup(); }
    if (this.loginCreateView) { this.loginCreateView.cleanup(); }
    removeView(this);
  },
});

module.exports = LoginCreateView;
