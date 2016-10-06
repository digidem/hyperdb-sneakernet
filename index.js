var hyperlog = require('hyperlog')
var level = require('level')
var tar = require('tar-fs')
var fs = require('fs')
var path = require('path')
var tmpdir = require('os').tmpdir()
var onend = require('end-of-stream')
var once = require('once')
var gzip = require('zlib').createGzip
var gunzip = require('zlib').createGunzip
var pump = require('pump')
var ncp = require('ncp')

module.exports = function (log, opts, outFile, cb_) {
  if (typeof opts === 'string') {
    cb_ = outFile
    outFile = opts
    opts = {}
  }
  if (!outFile) outFile = opts.file
  var xcb = cb_ || noop
  cb = once(function () {
    if (dstdb) dstdb.close()
    xcb.apply(this, arguments)
  })

  var tmpFile = path.join(tmpdir, 'sneakernet-' + Math.random())
  var tgzFile = tmpFile + '.tgz'
  var dstdb = level(tmpFile)

  var pending = 2

  fs.stat(outFile, function (err, stat) {
    if (err && err.code !== 'ENOENT') {
      return cb(err)
    }
    if (stat) {
      pump(
        fs.createReadStream(outFile),
        gunzip(),
        tar.extract(tmpFile),
        function (err) {
          if (err) return cb(err)
          replicate()
        })
    } else replicate()
  })

  function replicate () {
    var dstlog = hyperlog(dstdb, { valueEncoding: log.valueEncoding })
    var dr = dstlog.replicate()
    var lr = log.replicate()
    onend(dr, doneReplication)
    onend(lr, doneReplication)
    dr.pipe(lr).pipe(dr)
  }

  function doneReplication (err) {
    if (err) {
      return cb(err)
    }
    if (--pending !== 0) return

    pump(
      tar.pack(tmpFile),
      gzip(),
      fs.createWriteStream(tgzFile),
      function (err) {
        if (err) return cb(err)
        rename()
      })
  }

  function rename () {
    if (opts.safetyFile) {
      var tmpRemoteFile = outFile + (''+Math.random()).substring(2, 7)
      // Copy the final file from local to the media
      ncp(tgzFile, tmpRemoteFile, function (err) {
        if (err) return cb(err)
        // Copy the temp media file onto the proper media file
        ncp(tmpRemoteFile, outFile, function (err) {
          if (err) return cb(err)
          // Delete the old media temp file
          fs.unlink(tmpRemoteFile, cb)
        })
      })
    } else {
      fs.rename(tgzFile, outFile, cb)
    }
  }
}

function noop () {}
