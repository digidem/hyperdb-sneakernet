var replicate = require('..')
var test = require('tape')
var level = require('level')
var hyperlog = require('hyperlog')
var tmp = require('tmp').dir
var path = require('path')
var fs = require('fs')

function emptyFixture (done) {
  var log = null
  tmp(function (err, dir) {
    log = hyperlog(level(dir))
    done(err, log)
  })
}

function fixture (done) {
  var log = null
  tmp(function (err, dir) {
    log = hyperlog(level(dir))
    log.add(null, 'hello', function(err, node) {
      if (err) return fin(err)
      log.add([node.key], 'world', function(err, node) {
        done(err, log)
      })
    })
  })
}

test('fresh tarball', function (t) {
  t.plan(6)

  fixture(function (err, log) {
    t.notOk(err)

    tmp(function (err, dir) {
      var tgz = path.join(dir, 'db.tar.gz')
      t.notOk(fs.existsSync(tgz))

      replicate(log, tgz, function (err) {
        t.notOk(err)
        t.ok(fs.existsSync(tgz))

        var idx = 0
        log.createReadStream()
          .on('data', function (node) {
            if (idx === 0) {
              t.equal(node.value.toString(), 'hello')
              idx++
            } else if (idx === 1) {
              t.equal(node.value.toString(), 'world')
              idx++
            }
          })
      })
    })
  })
})

test('existing tarball', function (t) {
  t.plan(7)

  // create a fixture /w test data and write it
  fixture(function (err, log) {
    t.notOk(err)

    tmp(function (err, dir) {
      var tgz = path.join(dir, 'db.tar.gz')
      t.notOk(fs.existsSync(tgz))

      replicate(log, tgz, function (err) {
        t.notOk(err)
        t.ok(fs.existsSync(tgz))

        run(tgz)
      })
    })
  })

  function run (tgz) {
    emptyFixture(function (err, log) {
      t.notOk(err)

      replicate(log, tgz, function (err) {
        var idx = 0
        log.createReadStream()
          .on('data', function (node) {
            if (idx === 0) {
              t.equal(node.value.toString(), 'hello')
              idx++
            } else if (idx === 1) {
              t.equal(node.value.toString(), 'world')
              idx++
            }
          })
      })
    })
  }
})

test('safe write', function (t) {
  t.plan(6)

  fixture(function (err, log) {
    t.notOk(err)

    tmp(function (err, dir) {
      var tgz = path.join(dir, 'db.tar.gz')
      // console.log('path', tgz)
      t.notOk(fs.existsSync(tgz))

      replicate(log, { safetyFile: true }, tgz, function (err) {
        t.notOk(err)
        t.ok(fs.existsSync(tgz))

        var idx = 0
        log.createReadStream()
          .on('data', function (node) {
            if (idx === 0) {
              t.equal(node.value.toString(), 'hello')
              idx++
            } else if (idx === 1) {
              t.equal(node.value.toString(), 'world')
              idx++
            }
          })
      })
    })
  })
})
