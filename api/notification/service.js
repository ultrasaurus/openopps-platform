const fs = require('fs');
const log = require('log')('app:notification:service');
const nodemailer = require('nodemailer');
const db = require('../../db');
const dao = require('./dao')(db);
const _ = require('lodash');
const protocol = openopps.emailProtocol || '';
var transportConfig = openopps[protocol.toLowerCase()] || {};

if (protocol == '') {
  transportConfig = {
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  };
}

function createNotification (notification) {
  var path = __dirname + '/' + notification.action + '/template';
  var template = require(path);

  template.data(notification.model, function (err, data) {
    if (err) {
      log.info(err);
      return done(err);
    }
    data._action = notification.action;
    data.globals = {
      httpProtocol: openopps.httpProtocol,
      hostName: openopps.hostName,
      urlPrefix: openopps.httpProtocol + '://' + openopps.hostName,
      systemName: openopps.systemName,
      systemEmail: openopps.systemEmail,
    };

    renderTemplate(template, data, function (err, options) {
      if (err) {
        log.info(err);
        return;
      }
      sendEmail(options, function (err, info) {
        log.info(err ? err : info);
        if (!err) {
          insertNotification(action, data);
        }
      });
    });
  });
}

function renderTemplate (template, data, done) {
  var html = __dirname + '/../notification/' + data._action + '/template.html';
  var layout = __dirname + '/../notification/layout.html';
  var mailOptions = {
    to: _.template(template.to)(data),
    cc: _.template(template.cc)(data),
    bcc: _.template(template.bcc)(data),
    subject: _.template(template.subject)(data),
  };
  fs.readFile(html, function (err, template) {
    if (err) {
      log.info(err);
      return done(err);
    }
    data._content = _.template(template)(data);
    data._logo = '/img/logo/png/open-opportunities-email.png';
    fs.readFile(layout, function (err, layout) {
      if (err) {
        log.info(err);
        return done(err);
      }
      mailOptions.html = _.template(layout)(data);
      return done(err, mailOptions);
    });
  });
}

function sendEmail (mailOptions, done) {
  mailOptions.from = openopps.systemName + ' <' + openopps.systemEmail + '>';
  if (openopps.notificationsCC) mailOptions.cc = _.compact([
    mailOptions.cc,
    openopps.notificationsCC,
  ]);
  if (openopps.notificationsBCC) mailOptions.bcc = _.compact([
    mailOptions.bcc,
    openopps.notificationsBCC,
  ]);

  log.info('Sending SMTP message', mailOptions);
  nodemailer.createTransport(transportConfig).sendMail(mailOptions, function (err, info) {
    if (err) {
      log.info('Failed to send mail. If this is unexpected, please check your email configuration in config/email.js.', err);
      log.info('TransportConfig', transportConfig);
    }
    if (done) {
      return done(err, info);
    }
  });
}

function insertNotification (action, data) {
  var newNotification = {
    action: action,
    model: data,
    isActive: 't',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  dao.Notification.insert(newNotification);
}

module.exports = {
  createNotification: createNotification,
};
