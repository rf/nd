var fs = require('fs');
var async = require('async');
var path = require('path');
var _ = require('underscore');

var readInstalled = require('npm/lib/utils/read-installed');

// ## `list`
// Lists packages installed in the current node_modules directory, similar to
// npm ls.
// ### `done` continuation to respond to when complete

exports.list = function list (done) {
  readInstalled(process.cwd(), function (err, data) {
    if (err) return done(err);

    var packages = {};

    if (data.realName === undefined && data.link === undefined && data.depth === 0)
      return done(new Error('no packages found!'));

    (function search (root) {
      var deps = root.dependencies;
      delete root.dependencies;
      root.dependencies = [];
      _.each(deps, function (node, name) {
        root.dependencies.push(name);
        node.name = name;
        search(node);
      });
      packages[root.name] = root;
    }(data));

    done(null, packages);
  });
};

// ## `root` find the root directory for a given module
// ### `module` the module whose root directory we're trying to find
// ### `done` continuation to respond to when complete

exports.root = function root (module, done) {
  // use npm's readInstalled function to examine everything available
  readInstalled(process.cwd(), function (err, data) {
    if (err) return done(err);

    // search the tree for the given input
    var found = (function search (root) {
      if (root.name == module && root.path) {
        done(null, root.path);
        return true;
      }
      else return _.find(root.dependencies, search);
    }(data));

    if (!found) done(new Error('module ' + module + ' not found'));
  });
};

// ## `docs` find the doc directory for the module root supplied
// ### `root` a package root to search
// ### `done` continuation to respond to when complete

exports.docDir = function docDir (root, done) {
  var tries = ['docs', 'doc', '.'];

  fs.readFile(path.join(root, 'package.json'), function (err, data) {
    if (err) throw err;
    data = JSON.parse(data);
    data = data.directories && data.directories.doc;
    if (data) tries.push(data);

    tries = tries.map(function (item) { 
      return path.join(root, item);
    });
    
    tries = _.uniq(tries);

    async.filter(tries, path.exists, function (result) { 
      done(null, result);
    });
  });
};

// ## `addMdExts` add various markdown extensions to the given arguments
// ### `arguments` arguments to add markdown extensions to

function addMdExts () {
  var args = Array.prototype.slice.call(arguments);
  return args.reduce(function (memo, item) {
    return memo.concat([
      item + '.md',
      item + '.mkdn',
      item + '.mdown',
      item + '.markdown'
    ]);
  }, []);
}

// ## `file` try to find a file matching the given query and give its contents
//    to `done`
// ### `dirs` array of directories to search in
// ### `args` arguments of query
// ### `module` name of the module
// ### `done` continuation to respond to when complete

exports.file = function file (dirs, args, module, done) {
  // reform dirs into an array of files to try
  var tries = dirs.reduce(function (memo, item) {
    var base = path.join(item, path.join.apply(null, args));

    // for supporting module/args*.md
    memo = memo.concat(addMdExts(path.join(base)));
    // for supporting module/args*/index.md
    memo = memo.concat(addMdExts(path.join(base, 'index')));

    if (args && args.length !== 0) {
      // for supporting module/args*/lastarg.md
      memo = memo.concat(addMdExts(path.join(base, args[args.length-1])));
    } else {
      // for supporting module/docs/modulename.md
      memo = memo.concat(addMdExts(path.join(base, module)));

      // for supporting README.md
      memo = memo.concat(addMdExts(
        path.join(base, 'Readme'),
        path.join(base, 'ReadMe'),
        path.join(base, 'readme'),
        path.join(base, 'README')
      ));
    }

    return memo;
  }, []);

  // find the first of the `tries` array which actually exists, and return it
  async.detectSeries(tries, path.exists, function (result) {
    if (result) fs.readFile(result, 'utf8', done);
    else done(new Error('no results for query :('));
  });
};

