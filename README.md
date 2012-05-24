# nd

_a documentation viewer for node.js_

<img src="https://github.com/russfrank/nd/raw/master/shot.png" />

`nd` is a documentation viewer for node.  Similar to 
[mad(1)](http://tjholowaychuk.com/post/21100445420/going-mad-1),
it displays markdown documents in your terminal.  Dissimilarly to *mad*, nd
is written in javascript.  

By writing this software in javascript, we benefit
from the existing `require()` circuitry.  This means that there is a large
volume of useful documentation available, despite the fact that very few packages
have a `doc` or `docs` folder.  Nearly every package at least has a
`README.md`; `nd` will read this.

If a `doc` or `docs` directory is present, or if there is a docs directory
specified in the `package.json` of some module, documentation will be loaded
out of these directories.  

For example, if we type

```
$ nd npm cli
```

We will get `npm/doc/cli/index.md`. So, if additional arguments (besides the
module name) are provided, we try to find a file which is more specific:
we'll look for `module/arg1/arg2/index.md`, `module/arg1/arg2/arg2.md`, and
`module/arg1/arg2.md`.  This allows us to be flexible about the organization
of documentation within modules.

## Usage

To install:

```
$ sudo npm install -g nd
```

Note that you may not need `sudo` if you installed `node` via a virtual
environment manager such as [nvm](https://github.com/creationix/nvm).

To use:

```
$ nd modulename
```

Note that `nd` searches for modules from within the current directory.
You can also type simply

```
$ nd
```

to get a list of modules within reach. You can run `nd` with the relative
path to a markdown file as an argument and `nd` will read it, or pipe it some stuff:

```
$ nd README.md
$ curl https://github.com/russfrank/nd/raw/master/README.md | nd
```

You can also just straight up give it urls, it'll figure that shit out.

```
$ nd https://raw.github.com/joyent/node/master/doc/api/child_process.markdown
```

## Future

More ideas:

1. Pydoc like web server
2. Docco view of source files (markdown comments on left, source on right) in terminal

## License

MIT.
