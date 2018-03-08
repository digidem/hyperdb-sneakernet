# hyperdb-sneakernet

> Peer to peer replication for a [hyperdb][] you can send around on a USB stick.

`hyperdb-sneakernet` stores a live hyperdb copy on a USB stick suitable for
replicating with existing hyperdb writers and also for authorizing new writers.

[hyperdb]: https://github.com/mafintosh/hyperdb

## Status

wip mad science; don't use for anything meaningful yet.

## Example

``` js
var replicate = require('hyperdb-sneakernet')
var hyperdb = require('hyperdb')

var db = hyperdb('log.db', { valueEncoding: 'json' })

replicate(db, '/media/usb/log.db')
```

## API

```js
var replicate = require('hyperdb-sneakernet')
```

### replicate(db, [opts={}], dir, cb)

Performs replication between the hyperdb `db` and the directory located at
`dir`. If no diectory exists at `dir` then a brand new hyperdb database will be
created there and replicated to.

`cb` is a callback function of the form `function (err) {}`, and is called upon
an error, or completion.

`opts` is optional. If `opts.autoAuthorize` is set and the local hyperdb is not
yet authorized, this will have the remote hyperdb (the one on the usb drive)
authorize the local hyperdb before replicating.

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install hyperdb-sneakernet
```

## License

ISC
