var flatiron = require('flatiron');
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var app = flatiron.app;
var find = require('./lib/find');
var async = require('async');
var npm = require('npm');
var moar;

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
    function (root, callback) { find.docDir(root, callback); }
  ], function (err, data) {
    if (err) {
      app.log.error(err);
      return;
    }

    var dir = path.join(data[0], path.join.apply(null, args));

    fs.readdir(dir, function (err, files) {
      if (err) return app.log.error(err.message);

      if (_.size(files) === 0) {
        return app.log.error('No packages found!');
      }

      _.each(files, function (file) {
        console.log(file);
      });
    });
  });
}

function markdisp (data) {
  var marked = require('./deps/marked').setOptions({gfm: true, terminal: true});
  if (!moar) {
    moar = require('moar')({nowrap: true});
  }

  moar.write('\n' + marked.parse(data));
  moar.end();
  moar.on('done', function () { process.exit(0); });
}

function listModules () {
  console.log("Available modules:".bold);
  npm.load({quiet: true, loglevel: 'silent'}, function (err, npm) {
    npm.commands.ls([], false, function (err, data) {
      if (err) return app.log.error(err);
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
    
    markdisp(data);
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
      listModules();
    }
  } else {
    // view

    if (!process.stdin.isTTY && process.platform !== "win32") {
      // we're getting piped some stuff, gather it up and send it over to
      // markdisp to be displayed

      // we have spawn less before resuming stdin, or it gets confused
      moar = require('moar')({nowrap: true});

      process.stdin.resume();
      process.stdin.setEncoding('utf8');
      var data = '';

      process.stdin.on('data', function (chunk) {
        data += chunk;
      });

      process.stdin.on('end', function () {
        markdisp(data);
      });
    }

    else if (!module) {
      // no module name provided, just give a list of modules
      listModules();
    }

    else {
      // we have some arguments.. check to see if they're a filename
      var file = path.join(process.cwd(), module);
      path.exists(file, function (exists) {

        if (exists) {
          // if so, read and display the file
          fs.readFile(file, 'utf8', function (err, data) {
            if (err) return app.log.error(err);
            markdisp(data);
          });
        }

        else {
          // otherwise send the arguments over to view() to do an actual
          // module lookup
          view(module, args);
        }
      });
    }
  }
});
