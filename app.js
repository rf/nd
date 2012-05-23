var flatiron = require('flatiron');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var app = flatiron.app;
var find = require('./lib/find');
var async = require('async');

app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

app.use(flatiron.plugins.cli, {
  source: path.join(__dirname, 'lib', 'commands'),
  usage: 'Empty Flatiron Application, please fill out commands',
  argv: {
    l: {
      description: 'list',
      boolean: true
    }
  }
});

function list (module, args) {
  async.waterfall([
    function (callback)       { find.root(module, callback); },
    function (root, callback) { find.docDir(root, callback); },
  ], function (err, data) {
    if (err) {
      app.log.error(err);
      return;
    }

    var dir = path.join(data[0], path.join.apply(null, args));

    fs.readdir(dir, function (err, files) {
      if (err) return app.log.error(err);

      _.each(files, function (file) {
        console.log(file);
      });
    });
  });
}

function listModules () {
  console.log("Available modules:".bold);
  find.list(function (err, data) {
    if (err) return app.log.error(err);

    if (!data || !data[0]) return console.log("no packages found");

    _.each(data, function (info, name) {
      console.log(name);
    });
  });
}

function view (module, args) {
  async.waterfall([
    function (callback)       { find.root(module, callback); },
    function (root, callback) { find.docDir(root, callback); },
    function (dirs, callback) { find.file(dirs, args, module, callback); }
  ], function (err, data) {
    if (err) {
      app.log.error(err);
      return;
    }

    var marked = require('./deps/marked').setOptions({gfm: true, terminal: true});
    var moar = require('moar');

    moar.write('\n' + marked.parse(data));
    moar.end();
  });
}

app.init(function (err) {
  if (err) return app.log.error(err);

  var args = app.argv._;
  var module = args.shift();

  if (app.argv.l) {
    // list mode
    if (args.length > 0 || module) {
      list(module, args);
    } else {
      listModules()
    }
  } else {
    // view
    if (!module) {
      listModules()
    } else {
      view(module, args);
    }
  }
});
