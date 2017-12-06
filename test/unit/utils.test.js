const assert = require('chai').assert;
const utils = require('../../utils');

describe('Testing utils.js', function () {
  var tests = [
    {
      message: 'Validating a password that matches the username should return false.',
      method: 'validatePassword',
      args: ['TestUser', 'testuser@example.com'],
      expected: false,
    },
    {
      message: 'Validating a password that does not have at least 1 number should return false.',
      method: 'validatePassword',
      args: ['@badPassword', 'testuser@example.com'],
      expected: false,
    },
    {
      message: 'Validating a password that does not have at least 1 symbol should return false.',
      method: 'validatePassword',
      args: ['BadPa55w0rd', 'testuser@example.com'],
      expected: false,
    },
    {
      message: 'Validating a password that does not have at least 1 uppercase letter should return false.',
      method: 'validatePassword',
      args: ['b@dpassw0rd', 'testuser@example.com'],
      expected: false,
    },
    {
      message: 'Validating a password that does not have at least 1 lowercase letter should return false.',
      method: 'validatePassword',
      args: ['B@DPASSW0RD', 'testuser@example.com'],
      expected: false,
    },
    {
      message: 'Validating a password that meets all requirements should return true.',
      method: 'validatePassword',
      args: ['123qwe!@#QWE', 'testuser@example.com'],
      expected: true,
    },
  ];

  tests.forEach(function (test) {
    it(test.message, function () {
      var res = utils[test.method].apply(null, test.args);
      assert.equal(res, test.expected);
    });
  });
});
