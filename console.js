'use strict';

var repl = require('repl'),
    co   = require('co'),
    vm   = require('vm'),
    fs   = require('fs'),
    tty  = require('tty');
    //_    = require('lodash');

global.Promise = require('when/es6-shim/Promise');

// TODO: add handy dandy coloring...
var color = tty.isatty();
var brightColors = function(c) { if (color) return '\u001b[3' + c + 'm'; else return ''; };
var colors = function(c) { if (color) return '\u001b[1m\u001b[3' + c + 'm'; else return ''; };
var reset = function() { if (color) return '\u001b[0m'; else return ''; };
var ansi = function(code) { if (color) return '\u001b[' + code + 'm'; else return ''; };

// TODO: prompt and prompttty? or color?
var prompt = brightColors(6) + 'OpenOpps' + reset() + colors(1) + '> ' + reset();
var file = './.node_history';
var max = 1000;

// TODO: turn this into a configurable module

// If the error is that we've unexpectedly ended the input,
// then let the user try to recover by adding more input.
function isRecoverableError(e) {
  return e &&
      e.name === 'SyntaxError' &&
      /^(Unexpected end of input|Unexpected token :)/.test(e.message);
}
function Recoverable(err) {
  this.err = err;
  this.recoverable = true;
}
require('util').inherits(Recoverable, SyntaxError);

var buffer = '';
function coeval(code, context, file, cb) {
  var err, result;
  // first, create the Script object to check the syntax

  var toCo = code.indexOf('yield') > -1;
  buffer += code + '\n';
  code = buffer;

  if (toCo) {
    context.__co = co;
    context.__cb = function(err, result) {
      if (!!!err || !isRecoverableError(err)) {
        r.setPrompt(prompt);
        buffer = '';
      }
      cb(err, result);
    };

    // if we're just yielding, it should be returned so that the result is handed back to the repl
    if (/^[\s\(]*yield\s/.test(code)) code = 'return ' + code;

    // vars won't come out of the generator, so global it is!
    code = '__co(function*() { ' + code.replace(/\bvar\s+/g, '') + ' })(__cb);';
  }

  var script;
  try {
    script = vm.createScript(code, {
      filename: file,
      displayErrors: false
    });
  } catch (e) {
    //console.debug('parse error %j', code, e);
    if (isRecoverableError(e)) {
      err = new Recoverable(e);
    } else {
      buffer = '';
      err = e;
    }
  }

  if (!err) {
    try {
      result = script.runInThisContext({ displayErrors: false });
    } catch (e) {
      err = e;
      buffer = '';
      if (err && process.domain) {
        //console.debug('not recoverable, send to domain');
        process.domain.emit('error', err);
        process.domain.exit();
        return;
      }
    }
  }
  if (!toCo) {
    if (!!!err || !!!err.recoverable) {
      buffer = '';
      r.setPrompt(prompt);
      cb(err, result);
    } else {
      r.setPrompt(ansi(90) + '... ' + reset());
      r.displayPrompt();
    }
  }
}

var r = repl.start({
  prompt: prompt,
  useGlobal: true,
  ignoreUndefined: true,
  eval: coeval
});

r.on('exit', function() {
  console.log('\n\nClosing console...');
  process.exit();
});

var history;
try {
  fs.statSync(file);
  history = fs.readFileSync(file, 'utf-8').split('\n');
  r.rli.history = history;
  r.rli.historyIndex = -1;
} catch (e) {
  history = [];
  r.rli.history = history;
}

r.rli.addListener('line', function(code) {
  if (!!code && code !== '.history' && code !== history[history.length - 1]) {
    if (history.length > max) history = history.slice(max - history.length);
    r.rli.historyIndex = -1;
  } else {
    r.rli.historyIndex = -1;
    history.shift();
  }
});

process.on('exit', function() {
  var fd = fs.openSync(file, 'w');
  fs.writeSync(fd, history.join('\n'));
  fs.closeSync(fd);
});

r.commands.history = {
  help : 'Show the history',
  action : function() {
    r.outputStream.write(history.slice(1).reverse().join('\n') + '\n');
    r.displayPrompt();
  }
};

r.commands.break = r.commands.clear = {
  help: 'Sometimes you get stuck in your own nest of nested nests. This gets you out.',
  action: function() {
    buffer = '';
    r.setPrompt(prompt);
    r.outputStream.write('\n-- You have been bailed out.\n\n');
    r.displayPrompt();
  }
};
