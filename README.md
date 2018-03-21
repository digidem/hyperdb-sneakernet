# hyperdb-sneakernet

> Peer to peer field replication for a [hyperdb][] you can send around on a USB
> stick.

`hyperdb-sneakernet` stores a live hyperdb copy on a USB stick suitable for
replicating with existing hyperdbs and also for authorizing new writers.

If the target directory doesn't exist, a new hyperdb will be created there,
authorized by the source hyperdb, and replicated to.

If the target directory does exist, it will be authorized by the source hyperdb
(if needed) and replicated with the source hyperdb.

[hyperdb]: https://github.com/mafintosh/hyperdb

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

### replicate(db, dir[, opts={}], cb)

Performs replication between the hyperdb `db` and the directory located at
`dir`. If no diectory exists at `dir` then a brand new hyperdb database will be
created there and replicated to.

`cb` is a callback function of the form `function (err) {}`, and is called upon
an error, or successful completion.

## Install

With [npm](https://npmjs.org/) installed, run

```
$ npm install hyperdb-sneakernet
```

## License

ISC
