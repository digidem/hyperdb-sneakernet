var sneaker = require('..')
var test = require('tape')
var hyperdb = require('hyperdb')
var tmp = require('tmp').dir
var path = require('path')
var fs = require('fs')
var onend = require('end-of-stream')

function emptyFixture (key, done) {
  if (typeof key === 'function' && !done) {
    done = key
    key = null
  }
  var db = null
  tmp({unsafeCleanup: true}, function (err, dir, cleanup) {
    if (err) return done(err)
    db = key ? hyperdb(dir, key, {valueEncoding: 'json'}) : hyperdb(dir, {valueEncoding: 'json'})
    db.ready(function () {
      done(null, db, dir, cleanup)
    })
  })
}

function fixture (done) {
  emptyFixture(function (err, db, dir, cleanup) {
    db.put('/hello', 'world', function(err, node) {
      if (err) return done(err)
      db.put('/hello', 'there', function(err, node) {
        if (err) return done(err)
        done(err, db, dir, cleanup)
      })
    })
  })
}

test('different shared keys', function (t) {
  emptyFixture(function (err, db0, dir0, cleanup0) {
    t.notOk(err)
    emptyFixture(function (err, db1, dir1, cleanup1) {
      t.notOk(err)
      sneaker(db0, dir1, function (err) {
        t.ok(err)
        t.equals(err.message, 'shared hyperdb keys do not match')
        cleanup0()
        cleanup1()
        t.end()
      })
    })
  })
})

// TODO: stop skipping this once https://github.com/mafintosh/hyperdb/issues/77 is fixed
test.skip('neither db authorized to write', function (t) {
  emptyFixture(function (err, db0, dir0, cleanup0) {
    t.notOk(err)
    emptyFixture(db0.key, function (err, db1, dir1, cleanup0) {
      t.notOk(err)
      emptyFixture(db0.key, function (err, db2, dir2, cleanup1) {
        t.notOk(err)
        sneaker(db1, dir2, function (err) {
          t.ok(err)
          t.equals(err.message, 'neither feed is authorized to write')
          cleanup0()
          cleanup1()
          t.end()
        })
      })
    })
  })
})

test('existing local; existing remote', function (t) {
  var cb0, cb1

  emptyFixture(function (err, db0, dir0, cleanup0) {
    t.notOk(err)
    emptyFixture(db0.key, function (err, db1, dir1, cleanup1) {
      t.notOk(err)

      db0.authorize(db1.local.key, function (err) {
        t.notOk(err)
        replicate(db0, db1, function (err) {
          t.notOk(err)
          populate()
        })
      })

      function populate () {
        db0.put('/foo', 'bar', function (err) {
          t.notOk(err)
          db1.put('/bax', 'quux', function (err) {
            t.notOk(err)
            sneaker(db0, dir1, function (err) {
              t.notOk(err)
              check()
            })
          })
        })
      }

      function check () {
        getContent(db0, function (err, res) {
          t.notOk(err)
          t.deepEquals(res, [
            { key: '', value: '' },
            { key: '/foo', value: 'bar' },
            { key: '/bax', value: 'quux' }
          ])

          cleanup0()
          cleanup1()
          t.end()
        })
      }
    })
  })
})

/*

test('existing local; fresh remote', function (t) {
  t.plan(6)

  fixture(function (err, db0, cleanup0) {
    t.notOk(err)

    tmp(function (err, dir, cleanup1) {
      t.notOk(fs.existsSync(dir))

      sneaker(db0, dir, function (err) {
        t.notOk(err)
        t.ok(fs.existsSync(dir))

        var db1 = hyperdb(dir, db0.key)

        // move below into a reusable function
        // also have it check that the new hyperdb is authorized by doing a
        // write + replicate + 'db.get()'

        var idx = 0
        db.createHistoryStream()
          .on('data', function (node) {
            if (idx === 0) {
              t.equal(node.value.toString(), 'world')
              idx++
            } else if (idx === 1) {
              t.equal(node.value.toString(), 'warld')
              idx++
            }
          })

        cleanup0()
        cleanup1()
      })
    })
  })
})

test('fresh local; existing remote', function (t) {
  t.plan(7)

  // create a fixture /w test data and write it
  fixture(function (err, db) {
    t.notOk(err)

    tmp(function (err, dir) {
      var tgz = path.join(dir, 'db.tar.gz')
      t.notOk(fs.existsSync(tgz))

      sneaker(db, tgz, function (err) {
        t.notOk(err)
        t.ok(fs.existsSync(tgz))

        run(db, tgz)
      })
    })
  })

  function run (origDb, tgz) {
    emptyFixture(origDb.key, function (err, db) {
      t.notOk(err)

      sneaker(db, tgz, function (err) {
        var idx = 0
        db.createHistoryStream()
          .on('data', function (node) {
            if (idx === 0) {
              t.equal(node.value.toString(), 'world')
              idx++
            } else if (idx === 1) {
              t.equal(node.value.toString(), 'warld')
              idx++
            }
          })
      })
    })
  }
})

// TODO: existing local; existing remote
// ...

*/

// HyperDB, HyperDB => Error
function replicate (local, remote, cb) {
  var rr = remote.replicate()
  var lr = local.replicate()
  onend(rr, doneReplication)
  onend(lr, doneReplication)
  rr.pipe(lr).pipe(rr)

  var pending = 2
  var error
  function doneReplication (err) {
    if (err) error = err
    if (--pending) return
    cb(error)
  }
}

function getContent (db, cb) {
  var res = []
  db.createHistoryStream()
    .on('data', function (node) {
      res.push({key: node.key, value: node.value})
    })
    .once('end', cb.bind(null, null, res))
    .once('error', cb)
}
