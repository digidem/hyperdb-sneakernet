# hyperlog-sneakernet-replicator

> Peer to peer replication for a [hyperlog][] using files you can send around on
> a USB stick

Default hyperlog replication uses a [Level][level] database.
[LevelDOWN][leveldown] is the default backend on the filesystem, and it
reads/writes many different files to the filesystem in order to function.

However, USB sticks have different write properties than what you'd find in a
laptop, and can be pulled from the system at any time.

`hyperlog-sneakernet-replicator` stores the entire Level DB as a single `tar.gz`
file, using a temp directory on the local FS to perform the actual replication
with a hyperlog.

For further safety, `opts.safetyFile` can be set to `true` to only clobber the
previous gzipped tarball once the new one has been copied to the media alongside
it.

[hyperlog]: https://npmjs.com/package/hyperlog
[level]: https://npmjs.com/package/level
[leveldown]: https://npmjs.com/package/leveldown

## example

``` js
var replicate = require('hyperlog-sneakernet-replicator')
var level = require('level')
var hyperlog = require('hyperlog')

var db = level('log.db')
var log = hyperlog(db, { valueEncoding: 'json' })

replicate(log, '/media/usb/log.tgz')
```
## api

```js
var replicator = require('hyperlog-sneakernet-replicator')
```

### replicator(log, [opts={}], outFile, cb)

Performs replication between the hyperlog `log` and the `tar.gz` file located at
`outFile`. If no file exists at `outFile` then a brand new hyperlog database
will be created there and replicated to.

`cb` is a callback function of the form `function (err) {}`, and is called upon
an error, or completion.

`opts` is optional. If `opts.safetyFile` is set, the final `tar.gz` output will
be written to the media as e.g. `log.tgz-123895141` in full before clobbering
the real `outFile`.

## install

With [npm](https://npmjs.org/) installed, run

```
$ npm install hyperlog-sneakernet-replicator
```

## license

BSD
