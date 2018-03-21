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
    db.put('hello', 'world', function(err, node) {
      if (err) return done(err)
      db.put('hello', 'there', function(err, node) {
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

test('neither db authorized to write', function (t) {
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
  t.plan(9)

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
        db0.put('foo', 'bar', function (err) {
          t.notOk(err)
          db1.put('bax', 'quux', function (err) {
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
            { key: '', value: null },
            { key: 'foo', value: 'bar' },
            { key: 'bax', value: 'quux' }
          ])

          cleanup0()
          cleanup1()
        })
      }
    })
  })
})

test('existing local; fresh remote', function (t) {
  var db1

  emptyFixture(function (err, db0, dir0, cleanup0) {
    t.notOk(err)
    tmp({unsafeCleanup: true}, function (err, dir1, cleanup1) {
      t.notOk(err)
      dir1 = path.join(dir1, 'db')
      populate()

      function populate () {
        db0.put('foo', 'bar', function (err) {
          t.notOk(err)
          sneaker(db0, dir1, function (err) {
            t.notOk(err)
            db1 = hyperdb(dir1, db0.key, {valueEncoding: 'json'})
            db1.ready(check)
          })
        })
      }

      function check () {
        getContent(db1, function (err, res) {
          t.notOk(err)
          t.deepEquals(res, [
            { key: 'foo', value: 'bar' },
            { key: '', value: null }
          ])

          cleanup0()
          cleanup1()
          t.end()
        })
      }
    })
  })
})

// this case wouldn't really happen in practice
test('fresh local; existing remote', function (t) {
  t.plan(7)

  emptyFixture(function (err, db0, dir0, cleanup0) {
    t.notOk(err)
    emptyFixture(db0.key, function (err, db1, dir1, cleanup1) {
      t.notOk(err)

      populate()

      function populate () {
        db0.put('foo', 'bar', function (err) {
          t.notOk(err)
          db1.put('bax', 'quux', function (err) {
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
            { key: 'foo', value: 'bar' },
            { key: '', value: null },
            { key: 'bax', value: 'quux' }
          ])

          cleanup0()
          cleanup1()
        })
      }
    })
  })
})

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
