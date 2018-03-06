# hyperdb-sneakernet

> Peer to peer replication for a [hyperdb][] using files you can send around on
> a USB stick

Default hyperdb replication uses a hierarchy of folders, and it reads/writes
many different files to the filesystem in order to function.

However, USB sticks have different write properties than what you'd find in a
laptop, and can be pulled from the system at any time.

`hyperdb-sneakernet` stores the entire hyperdb as a single `tar.gz`
file, using a temp directory on the local FS to perform the actual replication
with a hyperdb.

For further safety, `opts.safetyFile` can be set to `true` to only clobber the
previous gzipped tarball once the new one has been copied to the media alongside
it.

[hyperdb]: https://npmjs.com/package/hyperdb

## Example

``` js
var replicate = require('hyperdb-sneakernet')
var hyperdb = require('hyperdb')

var db = hyperdb('log.db', { valueEncoding: 'json' })

replicate(db, '/media/usb/log.tgz')
```

## API

```js
var replicate = require('hyperdb-sneakernet')
```

### replicate(log, [opts={}], outFile, cb)

Performs replication between the hyperdb `log` and the `tar.gz` file located at
`outFile`. If no file exists at `outFile` then a brand new hyperdb database
will be created there and replicated to.

`cb` is a callback function of the form `function (err) {}`, and is called upon
an error, or completion.

`opts` is optional. If `opts.safetyFile` is set, the final `tar.gz` output will
be written to the media as e.g. `log.tgz-123895141` in full before clobbering
the real `outFile`.

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install hyperdb-sneakernet
```

## License

ISC
