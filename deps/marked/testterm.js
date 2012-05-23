var moar = require('../../../moar');
var marked = require('./index.js');

marked.setOptions({
  gfm: true,
  terminal: true
});

var out = marked.parse(require('fs').readFileSync('README.md', 'utf8'));

moar.write('\n' + out);

moar.end();
