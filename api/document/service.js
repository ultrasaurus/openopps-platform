const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const config = openopps.fileStore || {};
const db = require('../../db');
const dao = require('./dao')(db);

function store (name, data, cb) {
  var service = config.service || 'local';
  this[service].store.apply(this, arguments);
}

function get (name, res) {
  var service = (config.service || 'local');
  this[service].get.apply(this, arguments);
}

const local = {
  store: function (name, data, cb) {
    var dir = config.local.dirname || '/assets/uploads';
    var path = p.join(sails.config.appPath, dir, name);
    fs.writeFile(path, data, cb);
  },
  get: function (file, res) {
    res.type(file.mimeType);
    var dir = config.local.dirname || '/assets/uploads';
    var path = p.join(sails.config.appPath, dir, file.fd);
    fs.createReadStream(path)
      .on('error', function () { res.send(404); }).pipe(res);
  },
};

// S3 operations
const s3 = {
  store: function (name, data, cb) {
    var s3 = new AWS.S3();
    var params = {
      Bucket: config.s3.bucket,
      Key: p.join(config.s3.prefix || '', name),
      Body: data,
    };
    s3.upload(params, cb);
  },
  get: function (file, res) {
    res.type(file.mimeType);
    var s3 = new AWS.S3();
    var params = {
      Bucket: config.s3.bucket,
      Key: p.join(config.s3.prefix || '', file.fd),
    };
    s3.getObject(params).createReadStream()
      .on('error', function (e) {
        sails.log.verbose('s3 get error:', e);
        res.send(404);
      }).pipe(res);
  },
};

async function findOne (id) {
  return await dao.File.findOne('"userId" = ?', id);
}

module.exports = {
  findOne: findOne,
};
