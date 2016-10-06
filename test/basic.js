var replicate = require('..')
var test = require('tape')
var level = require('level')
var hyperlog = require('hyperlog')
var tmp = require('tmp').dir
var path = require('path')
var fs = require('fs')

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
  t.plan(9)

  fixture(function (err, log) {
    t.notOk(err)

    tmp(function (err, dir) {
      var tgz = path.join(dir, 'db.tar.gz')
      t.notOk(fs.existsSync(tgz))

      replicate(log, tgz, function (err) {
        t.notOk(err)
        t.ok(fs.existsSync(tgz))

        // add a new entry to main log
        log.add(null, '!!!', function (err, node) {
          t.notOk(err)

          // replicate again
          replicate(log, tgz, function (err) {
            t.notOk(err)

            var idx = 0
            log.createReadStream()
              .on('data', function (node) {
                if (idx === 0) {
                  t.equal(node.value.toString(), 'hello')
                  idx++
                } else if (idx === 1) {
                  t.equal(node.value.toString(), 'world')
                  idx++
                } else if (idx === 2) {
                  t.equal(node.value.toString(), '!!!')
                  idx++
                }
              })
          })
        })
      })
    })
  })
})

test('safe write', function (t) {
  t.plan(6)

  fixture(function (err, log) {
    t.notOk(err)

    tmp(function (err, dir) {
      var tgz = path.join(dir, 'db.tar.gz')
      console.log('path', tgz)
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
