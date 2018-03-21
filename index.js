var hyperdb = require('hyperdb')
var fs = require('fs')
var onend = require('end-of-stream')

module.exports = function (local, dir, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  cb = cb || (function () {})

  var freshRemote = !fs.existsSync(dir)
  var remote = freshRemote ? hyperdb(dir, local.key, local.valueEncoding) : hyperdb(dir, local.valueEncoding)

  local.ready(function () {
    remote.ready(function () {
      // Bail if both local and remote shared keys don't match
      if (!local.key.equals(remote.key)) {
        return cb(new Error('shared hyperdb keys do not match'))
      }

      var localAuthorized = isSelfAuthorized(local)
      var remoteAuthorized = isSelfAuthorized(remote)

      if (localAuthorized && remoteAuthorized) {
        // Existing local; existing remote
        replicate(local, remote, cb)
      } else if (!localAuthorized && remoteAuthorized) {
        // Fresh local; existing remote
        remote.authorize(local.local.key, function (err) {
          if (err) return cb(err)
          replicate(local, remote, cb)
        })
      } else if (localAuthorized && !remoteAuthorized) {
        // Existing local; fresh remote
        local.authorize(remote.local.key, function (err) {
          if (err) return cb(err)
          replicate(local, remote, cb)
        })
      } else {
        // Neither feed is authorized
        return cb(new Error('neither feed is authorized to write'))
      }
    })
  })
}

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

// HyperDB, Buffer -> Boolean
function isSelfAuthorized (db) {
  // soon
  // return db.authorized(db.key)

  return db._writers.reduce(function (accum, writer) {
    return accum || writer.key.equals(db.key)
  }, false)
}
