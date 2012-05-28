try {
  var colors = require('colors');
  var wordwrap = require('wordwrap');
} catch (e) {
  console.error([
    "terminal support in marked requires npm packages `colors` and `wordwrap`.",
    "it isn't in the package.json as a dependency because nobody really cares",
    "about markdown in the terminal apparently. Install them with",
    "`npm install colors wordwrap`."
  ].join('\n'));
}

var width = process.stdout.getWindowSize && process.stdout.getWindowSize()[0];
if (!width) width = 90;
width = Math.floor(0.85 * width);
var wrap = wordwrap(3, width);
var indent = wordwrap(9, width);
var paragraph = wordwrap(6, width);

var _s = require('underscore.string');

exports.inlineFmt = {
  escape: function (text) {
    return text;
  },

  autolink: function (href, text) {
    if (href.indexOf && href.indexOf('mailto') !== -1) {
      href = href.slice(7);
    }
    if (href == text || href[0] == '#') {
      return text.underline;
    } else {
      return text.underline + ' (' + href + ')';
    }
  },

  tag: function (text) {
    //return text;
    return '';
  },

  link: function (isImage, href, title, text) {
    return exports.inlineFmt.autolink(href, text || title);
  },

  url: function (href, text) {
    return exports.inlineFmt.autolink(href, text);
  },

  strong: function (text) {
    return text.bold;
  },

  em: function (text) {
    return text.bold.underline;
  },

  code: function (text) {
    return text.grey;
  },

  br: function () {
    return '\n';
  },

  text: function (text) {
    return text;
  }
};

function fixWhitespace (body) {
  body = body
    .replace(/\n/g, ' ')
    .replace(/[\s]+/g, ' ');
  body = _s.trim(body);
  return body;
}

function colorizeLines (body, c) {
  return body.split('\n').map(function (item) { return item[c]; }).join('\n');
}

exports.fmt = {
  hr: function () { 
    var line = (function () { 
      return '   ' + new Array(width - 2).join(process.platform == "win32" ? "-":"⎽");
    }());
    return line + '\n\n';
  },

  heading: function (depth, text) {
    text = fixWhitespace(text);
    switch (depth) {
      case 1: return wrap(text.bold.blue.underline) + '\n\n';
      case 2: return wrap(text.bold.underline) + '\n\n';
      default: return wrap(text.bold) + '\n\n';
    }
  },

  code: function (lang, text) {
    // we do have to colorize twice here because after indenting some new lines
    // may have been made so we'll have to colorize those lines as well
    text = indent(colorizeLines(text, 'grey')); 
    return colorizeLines(text, 'grey') + '\n\n';
  },

  blockquote: function (body) {
    body = fixWhitespace(body);
    return indent(body).grey + '\n\n';
  },

  list: function (type, body) {
    return body + '\n\n';
  }, 

  listItem: function (body) {
    body = fixWhitespace(body);
    return indent(body.replace(/\n/g, ' ')).replace('         ', '       * ') + '\n';
  },

  paragraph: function (body) {
    body = body
      .replace(/\n/g, ' ')
      .replace(/[\s]+/g, ' ');

    body = _s.trim(body);
    return paragraph(body.replace(/\n/g, ' ').replace(/[\s]+/g, ' ')) + '\n\n';
  }
};
