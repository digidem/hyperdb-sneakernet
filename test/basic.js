var replicate = require('..')
var test = require('tape')
var hyperdb = require('hyperdb')
var tmp = require('tmp').dir
var path = require('path')
var fs = require('fs')

function emptyFixture (key, done) {
  if (typeof key === 'function' && !done) {
    done = key
    key = null
  }
  var db = null
  tmp(function (err, dir, cleanup) {
    if (err) return done(err)
    db = key ? hyperdb(dir, key) : hyperdb(dir)
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
      replicate(db0, dir1, function (err) {
        t.ok(err)
        t.equals(err.message, 'shared hyperdb keys do not match')
        t.end()
      })
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

      replicate(db0, dir, function (err) {
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

      replicate(db, tgz, function (err) {
        t.notOk(err)
        t.ok(fs.existsSync(tgz))

        run(db, tgz)
      })
    })
  })

  function run (origDb, tgz) {
    emptyFixture(origDb.key, function (err, db) {
      t.notOk(err)

      replicate(db, tgz, function (err) {
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
