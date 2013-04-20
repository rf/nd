var fs = require('fs');
var async = require('async');
var path = require('path');
var _ = require('underscore');
var npm = require('npm');

if (fs.existsSync) path.existsSync = fs.existsSync;
if (fs.exists) path.exists = fs.exists;

// ## `root` find the root directory for a given module
// ### `module` the module whose root directory we're trying to find
// ### `done` continuation to respond to when complete
// ### `global` *internal* search global packages

exports.root = function root (module, done, global) {
  if (global) npm.dir = npm.globalDir;
  else npm.dir = process.cwd();
  npm.config.set('global', !!global);

  npm.commands.ls([], true, function (err, data) {
    if (err) return done(err);

    var queue = [data], found, node;

    // breadth first search the tree for the node we're looking for
    while (queue.length > 0) {
      node = queue.shift();
//        console.log(node.name);
      if (node.name == module && node.path) {
        done(null, node.path);
        found = true;
        break;
      }
      _.each(node.dependencies, function (item) { queue.push(item); });
    }

    if (!found) {
      // if we found nothing, call this function again, this time searching
      // global packages
      if (!global) root(module, done, true);
      else done(new Error('module ' + module + ' not found'));
    }
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
    else done(new Error('no markdown files found matching query'));
  });
};

