# hyperlog-sneakernet-replicator

peer to peer replication for [hyperlog][]
using files you can send around on a USB stick

[hyperlog]: https://npmjs.com/package/hyperlog

# example

``` js
var replicate = require('hyperlog-sneakernet-replicator')
var level = require('level')
var hyperlog = require('hyperlog')

var db = level('log.db')
var log = hyperlog(db, { valueEncoding: 'json' })
replicate(log, '/media/usb/log.tgz')
```

